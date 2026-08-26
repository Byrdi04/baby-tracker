// lib/sleep-logic.ts

// ================= HELPER FUNCTIONS =================
export const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false
  });
};

export const decimalToTime = (decimal: number) => {
  if (!decimal && decimal !== 0) return '--:--';
  if (decimal >= 24) decimal -= 24; 
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const getDurationMinutes = (start: string, end: string | null): number => {
  if (!end) return 0;
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  return Math.floor(diffMs / 60000);
};

export const getDuration = (start: string, end: string | null) => {
  if (!end) return 'Ongoing...';
  const totalMins = getDurationMinutes(start, end);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

export const getMedian = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

export const getDateKey = (dateStr: string, dayStartHour: number = 6): string => {
  const date = new Date(dateStr);
  // Standard cutoff (Used for Night Sleep logic and generic grouping)
  if (date.getHours() < dayStartHour) {
    date.setDate(date.getDate() - 1);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function calculateNightWakeups(
  nightEventIds: Set<number>,
  completedSleeps: any[]
) {
  // 1. Filter only night sleep events
  const nightSleeps = completedSleeps.filter((e: any) =>
    nightEventIds.has(e.id)
  );

  if (nightSleeps.length === 0) {
    return {
      wakeupsData: [] as { date: number; wakeups: number }[],
      medianWakeupsLast14: 0,
      longestStretchMinutesLast14: 0,
    };
  }

  // 2. Group segments by "night date" (7am cutoff via getDateKey)
  const segmentsByNight: Record<string, { start: Date; end: Date }[]> = {};

  for (const e of nightSleeps) {
    const key = getDateKey(e.startTime); // e.g. '2024-06-01'
    if (!segmentsByNight[key]) {
      segmentsByNight[key] = [];
    }
    segmentsByNight[key].push({
      start: new Date(e.startTime),
      end: new Date(e.endTime),
    });
  }

  // 3. For each night, sort segments, count wake-ups and longest stretch
  type NightInfo = {
    dateStr: string;
    timestamp: number;
    wakeups: number;
    longestStretchMinutes: number;
  };

  const perNight: NightInfo[] = Object.entries(segmentsByNight).map(
    ([dateStr, segments]) => {
      segments.sort(
        (a, b) => a.start.getTime() - b.start.getTime()
      );

      // Wake-ups = extra segments beyond the first
      const wakeups = Math.max(0, segments.length - 1);

      // Longest continuous night sleep stretch (in minutes)
      let longestStretchMs = 0;
      for (const seg of segments) {
        const durMs = seg.end.getTime() - seg.start.getTime();
        if (durMs > longestStretchMs) longestStretchMs = durMs;
      }
      const longestStretchMinutes = Math.round(longestStretchMs / 60000);

      return {
        dateStr,
        timestamp: new Date(dateStr).getTime(), // for chart X axis
        wakeups,
        longestStretchMinutes,
      };
    }
  );

  // Sort by date
  perNight.sort((a, b) => a.timestamp - b.timestamp);

  // 4. Build chart data
  const wakeupsData = perNight.map((n) => ({
    date: n.timestamp,
    wakeups: n.wakeups,
  }));

  // 5. Stats for last 14 nights
  const last14 = perNight.slice(-14); // if fewer than 14, it just uses what's available

  const medianWakeupsLast14 = getMedian(last14.map((n) => n.wakeups));

  const longestStretchMinutesLast14 = last14.reduce(
    (max, n) => Math.max(max, n.longestStretchMinutes),
    0
  );

  return {
    wakeupsData,
    medianWakeupsLast14,
    longestStretchMinutesLast14,
  };
}

// ================= MAIN PROCESSING LOGIC =================

export function processSleepStats(sleepEvents: any[], rollingPeriodDays: number = 14) {
  const completedSleeps = sleepEvents.filter((e: any) => e.endTime);
  
  const sortedSleeps = [...completedSleeps].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const nightEventIds = new Set<number>(); 

  // =========================================================
  // 1. ROBUST NIGHT DETECTION (Anchor & Stitch)
  // =========================================================
  sortedSleeps.forEach(event => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    
    const startDec = start.getHours() + (start.getMinutes() / 60);
    const endDec = end.getHours() + (end.getMinutes() / 60);

    let isAnchor = false;

    if (startDec >= 22.0 || startDec < 4.5) isAnchor = true;
    if (endDec > 22.0 || endDec < 4.5) isAnchor = true;

    const duration = getDurationMinutes(event.startTime, event.endTime);
    if (startDec >= 18.0 && duration > 180) isAnchor = true;

    if (isAnchor) nightEventIds.add(event.id);
  });

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < sortedSleeps.length; i++) {
      const current = sortedSleeps[i];
      if (!nightEventIds.has(current.id)) continue;

      const currStart = new Date(current.startTime).getTime();
      const currEnd = new Date(current.endTime).getTime();

      // Stitch backwards
      if (i > 0) {
        const prev = sortedSleeps[i - 1];
        if (!nightEventIds.has(prev.id)) {
          const prevEnd = new Date(prev.endTime).getTime();
          const gapMins = (currStart - prevEnd) / 60000;
          const prevStartH = new Date(prev.startTime).getHours();
          if (gapMins < 60 && (prevStartH >= 17 || prevStartH < 4)) {
            nightEventIds.add(prev.id);
          }
        }
      }

      // Stitch forwards
      if (i < sortedSleeps.length - 1) {
        const next = sortedSleeps[i + 1];
        if (!nightEventIds.has(next.id)) {
          const nextStart = new Date(next.startTime).getTime();
          const gapMins = (nextStart - currEnd) / 60000;
          const nextStartH = new Date(next.startTime).getHours();
          if (gapMins < 70) { 
            const isEarlyMorning = nextStartH < 6;
            const isFalseWakeup = gapMins < 20 && nextStartH < 7;
            if (isEarlyMorning || isFalseWakeup) nightEventIds.add(next.id);
          }
        }
      }
    }
  }

  // =========================================================
  // 1b. NOTE-BASED OVERRIDE (NAP / NIGHT tags)
  // =========================================================
  // Allow the user to manually tag a sleep as nap or night in its note.
  // Tags take precedence over automatic detection.
  // Tags are stored as standalone lines: \n\nNAP or \n\nNIGHT
  sortedSleeps.forEach(event => {
    const note = (event.note || '').toUpperCase();
    const isNightTagged = new RegExp('(?:^|\\n\\n)NIGHT$', 'm').test(note);
    const isNapTagged = new RegExp('(?:^|\\n\\n)NAP$', 'm').test(note);

    if (isNightTagged && !isNapTagged) {
      // Explicitly tagged as night sleep
      nightEventIds.add(event.id);
    } else if (isNapTagged && !isNightTagged) {
      // Explicitly tagged as nap
      nightEventIds.delete(event.id);
    }
    // If both tags present or neither, keep automatic detection
  });

  // 👇 NEW: Define the 14-day cutoff point for the Stat Cards
  const nowMs = Date.now();
  const fourteenDaysAgoMs = nowMs - 14 * 24 * 60 * 60 * 1000;

  // =========================================================
  // 2. CALCULATE STATISTICS (Bedtime / Wake Up)
  // =========================================================
  const nightGroups: { [key: string]: { start: Date, end: Date, duration: number } } = {};

  sortedSleeps.forEach(event => {
    if (nightEventIds.has(event.id)) {
      const key = getDateKey(event.startTime);
      const s = new Date(event.startTime);
      const e = new Date(event.endTime);
      const dur = getDurationMinutes(event.startTime, event.endTime);

      if (!nightGroups[key]) {
        nightGroups[key] = { start: s, end: e, duration: dur };
      } else {
        if (s < nightGroups[key].start) nightGroups[key].start = s;
        if (e > nightGroups[key].end) nightGroups[key].end = e;
        nightGroups[key].duration += dur;
      }
    }
  });

  const nightSessions: number[] = [];
  const bedTimes: number[] = []; 
  const wakeUpTimes: number[] = [];

  Object.values(nightGroups).forEach(group => {
    // 👇 NEW: Only calculate medians using the last 14 days
    if (group.start.getTime() >= fourteenDaysAgoMs) {
      nightSessions.push(group.duration); 

      let bedTimeDec = group.start.getHours() + (group.start.getMinutes() / 60);
      if (bedTimeDec < 12) bedTimeDec += 24; 
      bedTimes.push(bedTimeDec);

      const wakeTimeDec = group.end.getHours() + (group.end.getMinutes() / 60);
      wakeUpTimes.push(wakeTimeDec);
    }
  });

  const medianNight = getMedian(nightSessions);
  const medianNightHours = Math.floor(medianNight / 60);
  const medianNightMins = Math.round(medianNight % 60);
  
  const medianBedTime = decimalToTime(getMedian(bedTimes));
  const medianWakeTime = decimalToTime(getMedian(wakeUpTimes));

  // =========================================================
  // 3. NAP STATS & WAKE WINDOWS (Last 14 Days)
  // =========================================================
  const naps = completedSleeps.filter((e: any) => !nightEventIds.has(e.id));
  
  // 👇 NEW: Filter naps down to last 14 days
  const recentNaps = naps.filter((n: any) => new Date(n.startTime).getTime() >= fourteenDaysAgoMs);
  
  const napsByDayCount: { [key: string]: number } = {};
  recentNaps.forEach((nap: any) => {
    const key = getDateKey(nap.startTime);
    napsByDayCount[key] = (napsByDayCount[key] || 0) + 1;
  });
  
  const dailyNapCounts = Object.values(napsByDayCount);
  const avgNapsPerDay = dailyNapCounts.length > 0
    ? (dailyNapCounts.reduce((a, b) => a + b, 0) / dailyNapCounts.length).toFixed(1)
    : "0.0";

  // Wake Windows (Already set to 14 days in previous step!)
  const recentSleeps = sortedSleeps.filter(s => new Date(s.startTime).getTime() > fourteenDaysAgoMs);
  const wakeWindows: number[] = [];
  
  for (let i = 0; i < recentSleeps.length - 1; i++) {
    const currentSleep = recentSleeps[i];
    const nextSleep = recentSleeps[i + 1];
    
    const aIsNight = nightEventIds.has(currentSleep.id);
    const bIsNight = nightEventIds.has(nextSleep.id);
    
    const gapMins = (new Date(nextSleep.startTime).getTime() - new Date(currentSleep.endTime).getTime()) / 60000;
    
    if (gapMins > 0) {
      const isNightWakeup = aIsNight && bIsNight && gapMins < 240;
      if (!isNightWakeup && gapMins < 720) {
        wakeWindows.push(gapMins);
      }
    }
  }

  const medianWakeWindow = getMedian(wakeWindows);
  const avgWakeWindowHours = Math.floor(medianWakeWindow / 60);
  const avgWakeWindowMins = Math.round(medianWakeWindow % 60);

  // =========================================================
  // 4. CHART DATA
  // =========================================================
  const sleepByDay: { [key: string]: { night: number; nap: number } } = {};
  
  completedSleeps.forEach((event: any) => {
    const duration = getDurationMinutes(event.startTime, event.endTime);
    const isNight = nightEventIds.has(event.id);
    const dateKey = getDateKey(event.startTime);

    if (!sleepByDay[dateKey]) sleepByDay[dateKey] = { night: 0, nap: 0 };
    if (isNight) sleepByDay[dateKey].night += duration;
    else sleepByDay[dateKey].nap += duration;
  });

  // 👇 NEW: Find the most recent day that actually had a night sleep recorded
  const sortedDateKeys = Object.keys(sleepByDay).sort();
  const lastNightKey = [...sortedDateKeys].reverse().find(key => sleepByDay[key].night > 0);

  let lastNightHours = 0, lastNightMins = 0;
  let lastTotalHours = 0, lastTotalMins = 0;

  if (lastNightKey) {
    const lastNightDuration = sleepByDay[lastNightKey].night;
    const lastTotalDuration = sleepByDay[lastNightKey].night + sleepByDay[lastNightKey].nap;

    lastNightHours = Math.floor(lastNightDuration / 60);
    lastNightMins = Math.round(lastNightDuration % 60);

    lastTotalHours = Math.floor(lastTotalDuration / 60);
    lastTotalMins = Math.round(lastTotalDuration % 60);
  }
  // 👆 END NEW BLOCK

  const chartData = Object.entries(sleepByDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      nightHours: Math.round((data.night / 60) * 10) / 10,
      napHours: Math.round((data.nap / 60) * 10) / 10
    }));

  // 👇 NEW: Calculate Median Daily Sleep using ONLY the last 14 days
  const recentDailyTotals: number[] = [];
  Object.entries(sleepByDay).forEach(([dateKey, data]) => {
    // Convert YYYY-MM-DD back to timestamp for comparison
    const dateMs = new Date(dateKey).getTime();
    if (dateMs >= fourteenDaysAgoMs - (24 * 60 * 60 * 1000)) { // 1 day buffer for timezones
      recentDailyTotals.push(data.night + data.nap);
    }
  });

  const medianDailySleep = getMedian(recentDailyTotals);
  const medianDailyHours = Math.floor(medianDailySleep / 60);
  const medianDailyMins = Math.round(medianDailySleep % 60);

  const todayKey = getDateKey(new Date().toISOString());

  const trendData = Object.entries(sleepByDay)
    .filter(([key]) => key !== todayKey)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      night: Math.round((data.night / 60) * 10) / 10,
      nap: Math.round((data.nap / 60) * 10) / 10,
      total: Math.round(((data.night + data.nap) / 60) * 10) / 10
    }));

  const durationBuckets: { [key: string]: number } = {};
  const maxBuckets = 6;
  for(let i=0; i<maxBuckets; i++) durationBuckets[`${i*30}-${(i+1)*30-1}m`] = 0;
  durationBuckets['3h+'] = 0;
  naps.forEach((nap: any) => {
    const mins = getDurationMinutes(nap.startTime, nap.endTime);
    const bucketIndex = Math.floor(mins / 30);
    if (bucketIndex >= maxBuckets) durationBuckets['3h+']++;
    else durationBuckets[`${bucketIndex*30}-${(bucketIndex+1)*30-1}m`]++;
  });
  const napDurationData = Object.entries(durationBuckets).map(([label, value]) => ({ label, value }));

  const startTimeBuckets: { [key: string]: number } = {};
  for(let h=6; h<18; h++) {
    startTimeBuckets[`${h}:00`] = 0;
    startTimeBuckets[`${h}:30`] = 0;
  }
  naps.forEach((nap: any) => {
    const start = new Date(nap.startTime);
    const h = start.getHours();
    const m = start.getMinutes();
    if (h >= 6 && h < 18) {
      const suffix = m < 30 ? '00' : '30';
      startTimeBuckets[`${h}:${suffix}`]++;
    }
  });
  const napStartTimeData = Object.entries(startTimeBuckets).map(([label, value]) => ({ label, value }));

  // =========================================================
  // 5. ROLLING MEAN DATA (Bedtime / Wakeup / Night Length)
  // =========================================================
  // Build per-night bedtimes and wake-up times (in decimal hours)
  const nightTimingByDay: { dateKey: string; date: Date; bedtime: number; wakeup: number; nightMins: number }[] = [];

  Object.entries(nightGroups).forEach(([key, group]) => {
    let bedTimeDec = group.start.getHours() + (group.start.getMinutes() / 60);
    if (bedTimeDec < 12) bedTimeDec += 24; // normalize to 0-36 range (so 22:00=22, 01:00=25)
    const wakeTimeDec = group.end.getHours() + (group.end.getMinutes() / 60);
    
    nightTimingByDay.push({
      dateKey: key,
      date: new Date(key),
      bedtime: bedTimeDec,
      wakeup: wakeTimeDec,
      nightMins: group.duration,
    });
  });

  nightTimingByDay.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Compute rolling means over the configured period
  const bedtimeMeanTrend: { date: string; meanBedtime: number }[] = [];
  const wakeupMeanTrend: { date: string; meanWakeup: number }[] = [];
  const nightLengthMeanTrend: { date: string; meanNightHours: number }[] = [];

  for (let i = 0; i < nightTimingByDay.length; i++) {
    // Window start: i - rollingPeriodDays + 1, clamped to 0
    const windowStart = Math.max(0, i - rollingPeriodDays + 1);
    const windowCount = i - windowStart + 1;

    let bedSum = 0, wakeSum = 0, nightSum = 0;
    for (let j = windowStart; j <= i; j++) {
      bedSum += nightTimingByDay[j].bedtime;
      wakeSum += nightTimingByDay[j].wakeup;
      nightSum += nightTimingByDay[j].nightMins;
    }

    const entry = nightTimingByDay[i];
    const dateLabel = entry.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

    bedtimeMeanTrend.push({
      date: dateLabel,
      meanBedtime: bedSum / windowCount,
    });

    wakeupMeanTrend.push({
      date: dateLabel,
      meanWakeup: wakeSum / windowCount,
    });

    nightLengthMeanTrend.push({
      date: dateLabel,
      meanNightHours: Math.round((nightSum / windowCount / 60) * 10) / 10,
    });
  }

  const {
    wakeupsData,
    medianWakeupsLast14,
    longestStretchMinutesLast14,
  } = calculateNightWakeups(nightEventIds, completedSleeps);

  return {
    nightEventIds,
    completedSleeps,
    stats: {
      medianDailyHours, medianDailyMins,
      medianNightHours, medianNightMins,
      avgNapsPerDay,
      medianWakeTime,
      medianBedTime,
      medianWakeupsLast14,
      longestStretchMinutesLast14,
      avgWakeWindowHours,
      avgWakeWindowMins,
      lastNightHours,
      lastNightMins,
      lastTotalHours,
      lastTotalMins,
    },
    chartData,
    trendData,
    napDurationData,
    napStartTimeData,
    wakeupsData,
    bedtimeMeanTrend,
    wakeupMeanTrend,
    nightLengthMeanTrend,
  };
}

// UPDATED: Accepts referenceDate and daysToGenerate
export function generateTimelineData(
  sleepEvents: any[], 
  nightEventIds: Set<number>,
  referenceDate: Date = new Date(), // Default to Today
  daysToGenerate: number = 7,        // Default to 7 days
  dayStartHour: number = 6           // Day start hour (e.g. 6 for 6 AM)
) {
  const timelineData = [];
  
  // Clone date to avoid mutating the original
  const current = new Date(referenceDate);
  
  if (new Date().toDateString() === current.toDateString() && current.getHours() < dayStartHour) {
    current.setDate(current.getDate() - 1);
  }
  
  for (let i = 0; i < daysToGenerate; i++) {
    const d = new Date(current);
    d.setDate(d.getDate() - i);
    
    // Window: day start D to day start D+1
    const rowStart = new Date(d);
    rowStart.setHours(dayStartHour, 0, 0, 0);
    
    const rowEnd = new Date(rowStart);
    rowEnd.setDate(rowEnd.getDate() + 1); 
    
    const rowStartMs = rowStart.getTime();
    const rowEndMs = rowEnd.getTime();
    const dayDurationMs = 24 * 60 * 60 * 1000;

    // Use sorted copy
    const allSleepsSorted = [...sleepEvents].sort((a: any, b: any) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const rowBlocks = allSleepsSorted.filter((e: any) => {
      const eStart = new Date(e.startTime).getTime();
      const eEnd = e.endTime ? new Date(e.endTime).getTime() : Date.now();
      return eStart < rowEndMs && eEnd > rowStartMs;
    });

    const blocks = rowBlocks.map((e: any) => {
      const eStartMs = new Date(e.startTime).getTime();
      const eEndMs = e.endTime ? new Date(e.endTime).getTime() : Date.now();
      const visStartMs = Math.max(eStartMs, rowStartMs);
      const visEndMs = Math.min(eEndMs, rowEndMs);
      const left = ((visStartMs - rowStartMs) / dayDurationMs) * 100;
      const width = ((visEndMs - visStartMs) / dayDurationMs) * 100;

      return {
        left,
        width,
        isNight: nightEventIds.has(e.id),
        isOngoing: !e.endTime,
        info: { 
            time: `${formatTime(e.startTime)} - ${e.endTime ? formatTime(e.endTime) : 'Now'}`, 
            duration: getDuration(e.startTime, e.endTime) 
        }
      };
    });

    timelineData.push({
      // ✅ New line (Removes month):
      date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      rawDate: d.toISOString(),
      blocks
    });
  }
  return timelineData;
}

export function calculateSleepProbability(completedSleeps: any[], dayStartHour: number = 6) {
  // 144 slots = 24 hours * 6 (10‑minute intervals)
  const timeSlots = new Array(144).fill(0);

  // Offset in minutes based on configurable day start
  const offsetMins = dayStartHour * 60;

  // 1️⃣ Get today's logical key (based on DAY_START_HOUR)
  const todayKey = getDateKey(new Date().toISOString(), dayStartHour);

  // 2️⃣ Remove sleeps that belong to the current unfinished logical day
  const historicalSleeps = completedSleeps.filter(
    (e: any) => getDateKey(e.startTime) !== todayKey
  );

  // 3️⃣ Count how many unique logical days we have
  const uniqueDays =
    new Set(
      historicalSleeps.map((e: any) => getDateKey(e.startTime))
    ).size || 1;

  // 4️⃣ Fill the time slots
  historicalSleeps.forEach((event: any) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    let startMins =
      start.getHours() * 60 + start.getMinutes() - offsetMins;
    if (startMins < 0) startMins += 1440;

    let endMins =
      end.getHours() * 60 + end.getMinutes() - offsetMins;
    if (endMins < 0) endMins += 1440;

    // Handle sleep crossing logical midnight
    if (endMins < startMins) {
      endMins += 1440;
    }

    const startIndex = Math.floor(startMins / 10);
    const endIndex = Math.floor(endMins / 10);

    for (let i = startIndex; i <= endIndex; i++) {
      const wrappedIndex = i % 144;
      timeSlots[wrappedIndex]++;
    }
  });

  // 5️⃣ Convert counts into percentages
  const rawData = timeSlots.map((count, index) => {
    const totalMinutes = index * 10 + offsetMins;

    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours >= 24) hours -= 24;

    return {
      time: `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`,
      percent: (count / uniqueDays) * 100,
    };
  });

  // 6️⃣ Smooth the curve (5-point rolling average)
  return rawData.map((point, i, arr) => {
    const len = arr.length;

    const sum =
      arr[(i - 2 + len) % len].percent +
      arr[(i - 1 + len) % len].percent +
      point.percent +
      arr[(i + 1) % len].percent +
      arr[(i + 2) % len].percent;

    return {
      time: point.time,
      percent: sum / 5,
    };
  });
}


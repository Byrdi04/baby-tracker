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

export const getDateKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  // Standard 7am cutoff (Used for Night Sleep logic and generic grouping)
  if (date.getHours() < 7) {
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

export function processSleepStats(sleepEvents: any[]) {
  const completedSleeps = sleepEvents.filter((e: any) => e.endTime);
  
  // Sort chronologically for analysis
  const sortedSleeps = [...completedSleeps].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const nightEventIds = new Set<number>(); 

  // =========================================================
  // 1. ROBUST NIGHT DETECTION (Anchor & Stitch)
  // =========================================================

  // 📍 PHASE A: IDENTIFY "ANCHORS" 
  // Any sleep that touches the Core Night is definitely Night Sleep.
  
  sortedSleeps.forEach(event => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    
    // Convert times to decimal hours (e.g., 4:30 AM = 4.5)
    const startDec = start.getHours() + (start.getMinutes() / 60);
    const endDec = end.getHours() + (end.getMinutes() / 60);

    let isAnchor = false;

    // ⚙️ CONFIG: CORE NIGHT HOURS (22:00 to 04:30)
    // We check if the sleep overlaps with this strict window.
    
    // Check 1: Does it START during Core Night?
    // Logic: Time is greater than 22.0 (10PM) OR less than 4.5 (4:30AM)
    if (startDec >= 22.0 || startDec < 4.5) {
      isAnchor = true;
    }

    // Check 2: Does it END during Core Night?
    // Logic: Time is greater than 22.0 OR less than 4.5
    // Note: We use > 22 to avoid counting a nap ending at 21:59
    if (endDec > 22.0 || endDec < 4.5) {
      isAnchor = true;
    }

    // Check 3: Is it a Long Evening Sleep?
    // Logic: Starts after 18:00 and lasts > 3 hours.
    // This catches nights where baby sleeps 19:00 - 23:00 (which touches core).
    const duration = getDurationMinutes(event.startTime, event.endTime);
    if (startDec >= 18.0 && duration > 180) {
      isAnchor = true;
    }

    if (isAnchor) {
      nightEventIds.add(event.id);
    }
  });

  // 📍 PHASE B: STITCH NEIGHBORS
  // Look at sleeps next to the Anchors and see if they belong to the night.
  // We run this twice to ensure chains propagate.
  
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < sortedSleeps.length; i++) {
      const current = sortedSleeps[i];
      
      // Only stitch if we are currently looking at a confirmed Night Event
      if (!nightEventIds.has(current.id)) continue;

      const currStart = new Date(current.startTime).getTime();
      const currEnd = new Date(current.endTime).getTime();

      // --- STITCH BACKWARDS (Bedtime connections) ---
      if (i > 0) {
        const prev = sortedSleeps[i - 1];
        if (!nightEventIds.has(prev.id)) {
          const prevEnd = new Date(prev.endTime).getTime();
          const gapMins = (currStart - prevEnd) / 60000;
          const prevStartH = new Date(prev.startTime).getHours();

          // Rule: Gap < 90 mins AND Prev started in the evening (after 17:00 or very early morning)
          if (gapMins < 90 && (prevStartH >= 17 || prevStartH < 4)) {
            nightEventIds.add(prev.id);
          }
        }
      }

      // --- STITCH FORWARDS (Wakeup connections) ---
      if (i < sortedSleeps.length - 1) {
        const next = sortedSleeps[i + 1];
        if (!nightEventIds.has(next.id)) {
          const nextStart = new Date(next.startTime).getTime();
          const gapMins = (nextStart - currEnd) / 60000;
          const nextStartH = new Date(next.startTime).getHours();

          // ⚙️ CONFIG: FORWARD GAP (Requested: 70 mins)
          // We only check sleeps that happened within 70 mins of waking up.
          if (gapMins < 70) { 

            // Strict Morning Rules to avoid counting 06:55 naps as night sleep:
            
            // Rule A: It starts REALLY early (before 06:00 AM)
            // Logic: If baby wakes at 05:00 and sleeps at 05:30, it is still night.
            const isEarlyMorning = nextStartH < 6;

            // Rule B: It's a "False Wake Up" (Gap < 20 mins)
            // Logic: If baby wakes at 06:30 but falls back asleep at 06:40, count it.
            // But NOT if it starts after 07:00 (that is the day).
            const isFalseWakeup = gapMins < 20 && nextStartH < 7;

            // Apply Rules:
            if (isEarlyMorning || isFalseWakeup) {
              nightEventIds.add(next.id);
            }
          }
        }
      }
    }
  }

  // =========================================================
  // 2. CALCULATE STATISTICS (Bedtime / Wake Up)
  // =========================================================
  
  // Group Night Events by "Night Date" to find start/end of the night
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
        // Update Min Start
        if (s < nightGroups[key].start) nightGroups[key].start = s;
        // Update Max End
        if (e > nightGroups[key].end) nightGroups[key].end = e;
        // Add duration
        nightGroups[key].duration += dur;
      }
    }
  });

  const nightSessions: number[] = [];
  const bedTimes: number[] = []; 
  const wakeUpTimes: number[] = [];

  Object.values(nightGroups).forEach(group => {
    // Duration
    nightSessions.push(group.duration); 

    // Bedtime
    let bedTimeDec = group.start.getHours() + (group.start.getMinutes() / 60);
    if (bedTimeDec < 12) bedTimeDec += 24; 
    bedTimes.push(bedTimeDec);

    // Wake Up Time
    const wakeTimeDec = group.end.getHours() + (group.end.getMinutes() / 60);
    wakeUpTimes.push(wakeTimeDec);
  });

  // Calculate Averages
  const medianNight = getMedian(nightSessions);
  const medianNightHours = Math.floor(medianNight / 60);
  const medianNightMins = Math.round(medianNight % 60);
  
  const recentBedTimes = bedTimes.slice(-7);
  const recentWakeUpTimes = wakeUpTimes.slice(-7);
  const medianBedTime = decimalToTime(getMedian(recentBedTimes));
  const medianWakeTime = decimalToTime(getMedian(recentWakeUpTimes));

  // =========================================================
  // 3. NAP STATS
  // =========================================================
  
  const naps = completedSleeps.filter((e: any) => !nightEventIds.has(e.id));
  const napDurations = naps.map((e: any) => getDurationMinutes(e.startTime, e.endTime));
  const medianNap = getMedian(napDurations);
  const medianNapHours = Math.floor(medianNap / 60);
  const medianNapMins = Math.round(medianNap % 60);

  const napsByDayCount: { [key: string]: number } = {};
  naps.forEach((nap: any) => {
    const d = new Date(nap.startTime);
    if (d.getHours() < 4) d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    napsByDayCount[key] = (napsByDayCount[key] || 0) + 1;
  });
  const dailyNapCounts = Object.values(napsByDayCount);
  const avgNapsPerDay = dailyNapCounts.length > 0
    ? (dailyNapCounts.reduce((a, b) => a + b, 0) / dailyNapCounts.length).toFixed(1)
    : "0.0";

  // =========================================================
  // 4. CHART DATA
  // =========================================================
  
  const sleepByDay: { [key: string]: { night: number; nap: number } } = {};
  
  completedSleeps.forEach((event: any) => {
    const duration = getDurationMinutes(event.startTime, event.endTime);
    const isNight = nightEventIds.has(event.id);
    let dateKey: string;

    if (isNight) {
      dateKey = getDateKey(event.startTime);
    } else {
      // Nap Logic: 4am cutoff
      const d = new Date(event.startTime);
      if (d.getHours() < 4) d.setDate(d.getDate() - 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateKey = `${year}-${month}-${day}`;
    }

    if (!sleepByDay[dateKey]) sleepByDay[dateKey] = { night: 0, nap: 0 };
    if (isNight) sleepByDay[dateKey].night += duration;
    else sleepByDay[dateKey].nap += duration;
  });

  const chartData = Object.entries(sleepByDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      nightHours: Math.round((data.night / 60) * 10) / 10,
      napHours: Math.round((data.nap / 60) * 10) / 10
    }));

  const dailyTotalMinutes = Object.values(sleepByDay).map(d => d.night + d.nap);
  const medianDailySleep = getMedian(dailyTotalMinutes);
  const medianDailyHours = Math.floor(medianDailySleep / 60);
  const medianDailyMins = Math.round(medianDailySleep % 60);

  // 1. Get the Key for "Today" based on your 7am rule
  const todayKey = getDateKey(new Date().toISOString());

  // Trend Data (Last 30 Days)
  const trendData = Object.entries(sleepByDay)
    .filter(([key]) => key !== todayKey)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      night: Math.round((data.night / 60) * 10) / 10,
      nap: Math.round((data.nap / 60) * 10) / 10,
      total: Math.round(((data.night + data.nap) / 60) * 10) / 10
    }));

  // Histograms
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
      medianNapHours, medianNapMins,
      avgNapsPerDay,
      medianWakeTime,
      medianBedTime,
      // NEW:
      medianWakeupsLast14,
      longestStretchMinutesLast14,
    },
    chartData,
    trendData,
    napDurationData,
    napStartTimeData,
    wakeupsData,
  };
}

// UPDATED: Accepts referenceDate and daysToGenerate
export function generateTimelineData(
  sleepEvents: any[], 
  nightEventIds: Set<number>,
  referenceDate: Date = new Date(), // Default to Today
  daysToGenerate: number = 7        // Default to 7 days
) {
  const timelineData = [];
  
  // Clone date to avoid mutating the original
  const current = new Date(referenceDate);
  
  // Adjust for 7am cycle if it's "Today"
  // (If specific historical date is passed, we assume it is set correctly to noon or similar)
  if (new Date().toDateString() === current.toDateString() && current.getHours() < 7) {
    current.setDate(current.getDate() - 1);
  }
  
  // Loop backwards from the reference date
  for (let i = 0; i < daysToGenerate; i++) {
    const d = new Date(current);
    d.setDate(d.getDate() - i);
    
    // Window: 07:00 D to 07:00 D+1
    const rowStart = new Date(d);
    rowStart.setHours(7, 0, 0, 0);
    
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

export function calculateSleepProbability(completedSleeps: any[]) {
  const timeSlots = new Array(144).fill(0);
  
  // 1. Get Today's Key
  const todayKey = getDateKey(new Date().toISOString());

  // 2. Filter out any sleep that belongs to the current unfinished day
  const historicalSleeps = completedSleeps.filter((e: any) => 
    getDateKey(e.startTime) !== todayKey
  );

  // 3. Calculate unique days based on HISTORICAL data only
  const uniqueDays = new Set(historicalSleeps.map((e: any) => getDateKey(e.startTime))).size || 1;

  // 4. Iterate over HISTORICAL sleeps
  historicalSleeps.forEach((event: any) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    let startMins = (start.getHours() * 60 + start.getMinutes()) - 420;
    if (startMins < 0) startMins += 1440;
    let endMins = (end.getHours() * 60 + end.getMinutes()) - 420;
    if (endMins < 0) endMins += 1440;
    if (endMins < startMins) endMins = 1440; 
    const startIndex = Math.floor(startMins / 10);
    const endIndex = Math.floor(endMins / 10);

    for (let i = startIndex; i <= endIndex; i++) {
      if (i >= 0 && i < 144) timeSlots[i]++;
    }
  });

  const rawData = timeSlots.map((count, index) => {
    const totalMinutes = index * 10 + 420; 
    let h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h >= 24) h -= 24;
    return {
      time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
      percent: (count / uniqueDays) * 100
    };
  });

  return rawData.map((point, i, arr) => {
    const len = arr.length;
    const sum = 
      arr[(i - 2 + len) % len].percent + 
      arr[(i - 1 + len) % len].percent + 
      point.percent + 
      arr[(i + 1) % len].percent + 
      arr[(i + 2) % len].percent;
    return { time: point.time, percent: sum / 5 };
  });
}


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

// ================= MAIN PROCESSING LOGIC =================

export function processSleepStats(sleepEvents: any[]) {
  const completedSleeps = sleepEvents.filter((e: any) => e.endTime);
  
  // Sort chronologically for analysis
  const sortedSleeps = [...completedSleeps].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const nightSessions: number[] = [];
  const bedTimes: number[] = []; 
  const wakeUpTimes: number[] = [];
  const nightEventIds = new Set<number>(); 

  let chainStartEvent: any = null;
  let chainEndEvent: any = null;
  let isChainActive = false;
  let currentChainIds: number[] = []; 

  // --- 1. NIGHT CHAIN ALGORITHM ---
  for (let k = 0; k < sortedSleeps.length; k++) {
    const event = sortedSleeps[k];
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const startH = start.getHours();
    
    if (!isChainActive) {
      if (startH >= 18 && startH <= 22) {
        let isFalseStart = false;
        const nextEvent = sortedSleeps[k + 1];
        const currentDuration = (end.getTime() - start.getTime()) / 60000;

        // Check if it's a false start (Gap > 40min AND Duration < 90min)
        if (nextEvent) {
          const gapMins = (new Date(nextEvent.startTime).getTime() - end.getTime()) / 60000;
          if (gapMins > 40 && currentDuration < 90) isFalseStart = true;
        }

        if (!isFalseStart) {
          isChainActive = true;
          chainStartEvent = event;
          chainEndEvent = event;
          currentChainIds = [event.id]; 
        }
      }
    } else {
      const lastEnd = new Date(chainEndEvent.endTime).getTime();
      const currentStart = start.getTime();
      const gapMins = (currentStart - lastEnd) / 60000;

      const isCurrentAfter430 = (startH > 4) || (startH === 4 && start.getMinutes() >= 30);
      const prevEndObj = new Date(lastEnd);
      const prevEndH = prevEndObj.getHours();
      const isPrevAfter430 = (prevEndH > 4) || (prevEndH === 4 && prevEndObj.getMinutes() >= 30);
      
      // Break Chain if: Gap > 40 AND Both events are in the "morning"
      if (gapMins > 40 && isCurrentAfter430 && isPrevAfter430) {
        if (chainStartEvent && chainEndEvent) {
          const nightStart = new Date(chainStartEvent.startTime);
          const nightEnd = new Date(chainEndEvent.endTime);
          
          nightSessions.push((nightEnd.getTime() - nightStart.getTime()) / 60000);
          
          let bedTimeDec = nightStart.getHours() + (nightStart.getMinutes() / 60);
          if (bedTimeDec < 12) bedTimeDec += 24; 
          bedTimes.push(bedTimeDec);

          const wakeTimeDec = nightEnd.getHours() + (nightEnd.getMinutes() / 60);
          wakeUpTimes.push(wakeTimeDec);

          currentChainIds.forEach(id => nightEventIds.add(id));
        }
        isChainActive = false;
        chainStartEvent = null;
        chainEndEvent = null;
        currentChainIds = [];
      } else {
        chainEndEvent = event;
        currentChainIds.push(event.id);
      }
    }
  }

  // Handle final chain
  if (isChainActive && chainStartEvent && chainEndEvent) {
    const nightStart = new Date(chainStartEvent.startTime);
    const nightEnd = new Date(chainEndEvent.endTime);
    nightSessions.push((nightEnd.getTime() - nightStart.getTime()) / 60000);
    let bedTimeDec = nightStart.getHours() + (nightStart.getMinutes() / 60);
    if (bedTimeDec < 12) bedTimeDec += 24; 
    bedTimes.push(bedTimeDec);
    const wakeTimeDec = nightEnd.getHours() + (nightEnd.getMinutes() / 60);
    wakeUpTimes.push(wakeTimeDec);
    currentChainIds.forEach(id => nightEventIds.add(id));
  }

  // --- 2. CALCULATE AVERAGES ---
  const medianNight = getMedian(nightSessions);
  const medianNightHours = Math.floor(medianNight / 60);
  const medianNightMins = Math.round(medianNight % 60);
  
  const recentBedTimes = bedTimes.slice(-7);
  const recentWakeUpTimes = wakeUpTimes.slice(-7);
  const medianBedTime = decimalToTime(getMedian(recentBedTimes));
  const medianWakeTime = decimalToTime(getMedian(recentWakeUpTimes));

  // Nap Stats
  const naps = completedSleeps.filter((e: any) => !nightEventIds.has(e.id));
  const napDurations = naps.map((e: any) => getDurationMinutes(e.startTime, e.endTime));
  const medianNap = getMedian(napDurations);
  const medianNapHours = Math.floor(medianNap / 60);
  const medianNapMins = Math.round(medianNap % 60);

  // Nap Count
  const napsByDayCount: { [key: string]: number } = {};
  naps.forEach((nap: any) => {
    // We use the same date key logic for the "Count" stat as we do for the chart
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

  // --- 3. PREPARE DATA FOR CHARTS ---
  const sleepByDay: { [key: string]: { night: number; nap: number } } = {};
  
  completedSleeps.forEach((event: any) => {
    const duration = getDurationMinutes(event.startTime, event.endTime);
    const isNight = nightEventIds.has(event.id);
    
    let dateKey: string;

    if (isNight) {
      // Night Sleep: Keep standard 7am logic.
      dateKey = getDateKey(event.startTime);
    } else {
      // Nap Logic: Use 4am cutoff.
      // This allows naps between 04:00 and 07:00 to be counted for the current day
      const d = new Date(event.startTime);
      if (d.getHours() < 4) {
        d.setDate(d.getDate() - 1);
      }
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

  // NEW: Trend Data (Last 30 Days)
  const trendData = Object.entries(sleepByDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      // Format: "15 Jun"
      date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      night: Math.round((data.night / 60) * 10) / 10,
      nap: Math.round((data.nap / 60) * 10) / 10,
      total: Math.round(((data.night + data.nap) / 60) * 10) / 10
    }));

  // Nap Histogram
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

  // Nap Start Times
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

  return {
    nightEventIds,
    completedSleeps,
    stats: {
      medianDailyHours, medianDailyMins,
      medianNightHours, medianNightMins,
      medianNapHours, medianNapMins,
      avgNapsPerDay,
      medianWakeTime,
      medianBedTime
    },
    chartData,
    trendData,
    napDurationData,
    napStartTimeData
  };
}

export function generateTimelineData(sleepEvents: any[], nightEventIds: Set<number>) {
  const timelineData = [];
  const today = new Date();
  if (today.getHours() < 7) today.setDate(today.getDate() - 1);
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const rowStart = new Date(d);
    rowStart.setHours(7, 0, 0, 0);
    const rowEnd = new Date(rowStart);
    rowEnd.setDate(rowEnd.getDate() + 1); 
    const rowStartMs = rowStart.getTime();
    const rowEndMs = rowEnd.getTime();
    const dayDurationMs = 24 * 60 * 60 * 1000;

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
      date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      blocks
    });
  }
  return timelineData;
}

export function calculateSleepProbability(completedSleeps: any[]) {
  const timeSlots = new Array(144).fill(0);
  const uniqueDays = new Set(completedSleeps.map((e: any) => getDateKey(e.startTime))).size || 1;

  completedSleeps.forEach((event: any) => {
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
export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import SleepCharts from './SleepCharts';
import SleepTimeline from '@/components/SleepTimeline'; 
import StatCard from '@/components/ui/StatCard';
import EventList from '@/components/events/EventList';

// Helper: Format time (14:30)
const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Helper: Convert decimal hour to HH:MM (e.g. 6.5 -> 06:30)
const decimalToTime = (decimal: number) => {
  if (!decimal && decimal !== 0) return '--:--';
  if (decimal >= 24) decimal -= 24; 
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Helper: Calculate duration in minutes
const getDurationMinutes = (start: string, end: string | null): number => {
  if (!end) return 0;
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  return Math.floor(diffMs / 60000);
};

// Helper: Format duration string
const getDuration = (start: string, end: string | null) => {
  if (!end) return 'Ongoing...';
  const totalMins = getDurationMinutes(start, end);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

// Helper: Calculate median
const getMedian = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

// Helper: Get date string (YYYY-MM-DD), adjusted for 7AM to 7AM cycle
const getDateKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  
  // If the time is before 07:00, subtract one day
  if (date.getHours() < 7) {
    date.setDate(date.getDate() - 1);
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export default function SleepPage() {
  // Fetch all sleep events
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = 'SLEEP' 
    ORDER BY startTime DESC 
    LIMIT 500
  `);
  const sleepEvents = stmt.all() as any[];
  const completedSleeps = sleepEvents.filter(e => e.endTime);

  // ============================================================
  // 1. NIGHT SLEEP LOGIC (Moved to Top)
  // ============================================================
  // We calculate this first so we can use the IDs to separate chart data
  
  const sortedSleeps = [...completedSleeps].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const nightSessions: number[] = [];
  const bedTimes: number[] = []; 
  const wakeUpTimes: number[] = [];
  const nightEventIds = new Set<number>(); // 👈 We will use this for the chart

  let chainStartEvent = null;
  let chainEndEvent = null;
  let isChainActive = false;
  let currentChainIds: number[] = []; 

  for (let k = 0; k < sortedSleeps.length; k++) {
    const event = sortedSleeps[k];
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const startH = start.getHours();
    
    if (!isChainActive) {
      if (startH >= 18 && startH <= 22) {
        let isFalseStart = false;
        const nextEvent = sortedSleeps[k + 1];

        // 👇 Calculate the duration of the CURRENT sleep
        const currentDuration = (end.getTime() - start.getTime()) / 60000;

        if (nextEvent) {
          const gapMins = (new Date(nextEvent.startTime).getTime() - end.getTime()) / 60000;
      
          // 👇 CHANGE THIS LINE
          // Only consider it a false start if the gap is > 40 AND the sleep was short (< 90 mins)
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
      const isAfter430 = (startH > 4) || (startH === 4 && start.getMinutes() >= 30);
      
      if (gapMins > 40 && isAfter430) {
        // --- CHAIN BROKEN ---
        if (chainStartEvent && chainEndEvent) {
          const nightStart = new Date(chainStartEvent.startTime);
          const nightEnd = new Date(chainEndEvent.endTime);
          
          nightSessions.push((nightEnd.getTime() - nightStart.getTime()) / 60000);

          let bedTimeDec = nightStart.getHours() + (nightStart.getMinutes() / 60);
          if (bedTimeDec < 12) bedTimeDec += 24; 
          bedTimes.push(bedTimeDec);

          const wakeTimeDec = nightEnd.getHours() + (nightEnd.getMinutes() / 60);
          wakeUpTimes.push(wakeTimeDec);

          // Add IDs to set
          currentChainIds.forEach(id => nightEventIds.add(id));
        }

        isChainActive = false;
        chainStartEvent = null;
        chainEndEvent = null;
        currentChainIds = [];
      } else {
        // --- CHAIN CONTINUES ---
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

  const medianNight = getMedian(nightSessions);
  const medianNightHours = Math.floor(medianNight / 60);
  const medianNightMins = Math.round(medianNight % 60);
  
  // Get the last 7 entries (Last 7 Nights)
  const recentBedTimes = bedTimes.slice(-7);
  const recentWakeUpTimes = wakeUpTimes.slice(-7);

  const medianBedTime = decimalToTime(getMedian(recentBedTimes));
  const medianWakeTime = decimalToTime(getMedian(recentWakeUpTimes));


  // ============================================================
  // 2. NAP STATS & LIST
  // ============================================================
  
  // Filter Naps: Completed sleeps that are NOT in the night set
  const naps = completedSleeps.filter(e => !nightEventIds.has(e.id));
  
  const napDurations = naps.map(event => getDurationMinutes(event.startTime, event.endTime));
  
  const medianNap = getMedian(napDurations);
  const medianNapHours = Math.floor(medianNap / 60);
  const medianNapMins = Math.round(medianNap % 60);

  // Avg Naps per Day
  const napsByDayCount: { [key: string]: number } = {};
  naps.forEach(nap => {
    const dateKey = getDateKey(nap.startTime);
    napsByDayCount[dateKey] = (napsByDayCount[dateKey] || 0) + 1;
  });

  const dailyNapCounts = Object.values(napsByDayCount);
  const avgNapsPerDay = dailyNapCounts.length > 0
    ? (dailyNapCounts.reduce((a, b) => a + b, 0) / dailyNapCounts.length).toFixed(1)
    : "0.0";

  // ============================================================
  // 3. CHART DATA (Total Sleep per Day - Stacked)
  // ============================================================
  
  const sleepByDay: { [key: string]: { night: number; nap: number } } = {};
  
  completedSleeps.forEach(event => {
    const dateKey = getDateKey(event.startTime);
    const duration = getDurationMinutes(event.startTime, event.endTime);
    
    if (!sleepByDay[dateKey]) {
      sleepByDay[dateKey] = { night: 0, nap: 0 };
    }

    if (nightEventIds.has(event.id)) {
      sleepByDay[dateKey].night += duration;
    } else {
      sleepByDay[dateKey].nap += duration;
    }
  });

  // Calculate Average Total Sleep (for Stat Card)
  const dailyTotalMinutes = Object.values(sleepByDay).map(d => d.night + d.nap);
  const medianDailySleep = getMedian(dailyTotalMinutes);
  const medianDailyHours = Math.floor(medianDailySleep / 60);
  const medianDailyMins = Math.round(medianDailySleep % 60);
  
  // Prepare chart data (last 7 days)
  const chartData = Object.entries(sleepByDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      nightHours: Math.round((data.night / 60) * 10) / 10,
      napHours: Math.round((data.nap / 60) * 10) / 10
    }));

  // ============================================================
  // 4. NAP HISTOGRAMS
  // ============================================================

  // Duration Histogram
  const durationBuckets: { [key: string]: number } = {};
  const maxBuckets = 6; // 6 * 30 = 180 mins

  for(let i=0; i<maxBuckets; i++) {
    durationBuckets[`${i*30}-${(i+1)*30-1}m`] = 0;
  }
  durationBuckets['3h+'] = 0;

  naps.forEach(nap => {
    const mins = getDurationMinutes(nap.startTime, nap.endTime);
    const bucketIndex = Math.floor(mins / 30);
    
    if (bucketIndex >= maxBuckets) {
      durationBuckets['3h+']++;
    } else {
      const label = `${bucketIndex*30}-${(bucketIndex+1)*30-1}m`;
      durationBuckets[label]++;
    }
  });

  const napDurationData = Object.entries(durationBuckets).map(([label, value]) => ({ label, value }));

  // Start Time Histogram
  const startTimeBuckets: { [key: string]: number } = {};
  for(let h=6; h<18; h++) {
    startTimeBuckets[`${h}:00`] = 0;
    startTimeBuckets[`${h}:30`] = 0;
  }

  naps.forEach(nap => {
    const start = new Date(nap.startTime);
    const h = start.getHours();
    const m = start.getMinutes();

    if (h >= 6 && h < 18) {
      const suffix = m < 30 ? '00' : '30';
      const label = `${h}:${suffix}`;
      startTimeBuckets[label]++;
    }
  });

  const napStartTimeData = Object.entries(startTimeBuckets).map(([label, value]) => ({ label, value }));


  // ============================================================
  // 5. TIMELINE CHART DATA
  // ============================================================
  
  // Note: We already calculated nightEventIds above, but the Timeline logic 
  // you had previously uses a slightly different "timeline specific" logic loop.
  // To ensure the Timeline looks exactly as you intended in the previous version,
  // we will reuse the `nightEventIds` we calculated in Step 1, as that is more accurate.

  const timelineData = [];
  const today = new Date();
  if (today.getHours() < 7) today.setDate(today.getDate() - 1);
  
  // Create 7 days of rows
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    
    // Window: 07:00 D to 07:00 D+1
    const rowStart = new Date(d);
    rowStart.setHours(7, 0, 0, 0);
    
    const rowEnd = new Date(rowStart);
    rowEnd.setDate(rowEnd.getDate() + 1); 
    
    const rowStartMs = rowStart.getTime();
    const rowEndMs = rowEnd.getTime();
    const dayDurationMs = 24 * 60 * 60 * 1000;

    // Find overlapping events
    const allSleepsSorted = [...sleepEvents].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const rowBlocks = allSleepsSorted.filter(e => {
      const eStart = new Date(e.startTime).getTime();
      const eEnd = e.endTime ? new Date(e.endTime).getTime() : Date.now();
      return eStart < rowEndMs && eEnd > rowStartMs;
    });

    // Map to Visual Blocks
    const blocks = rowBlocks.map(e => {
      const eStartMs = new Date(e.startTime).getTime();
      const eEndMs = e.endTime ? new Date(e.endTime).getTime() : Date.now();
      const isOngoing = !e.endTime;

      const visStartMs = Math.max(eStartMs, rowStartMs);
      const visEndMs = Math.min(eEndMs, rowEndMs);

      const relativeStartMs = visStartMs - rowStartMs;
      const durationMs = visEndMs - visStartMs;

      const left = (relativeStartMs / dayDurationMs) * 100;
      const width = (durationMs / dayDurationMs) * 100;

      const timeStr = `${formatTime(e.startTime)} - ${e.endTime ? formatTime(e.endTime) : 'Now'}`;
      const durationStr = getDuration(e.startTime, e.endTime);

      return {
        left,
        width,
        isNight: nightEventIds.has(e.id), // 👈 Reusing our robust Night Logic IDs
        isOngoing,
        info: { time: timeStr, duration: durationStr }
      };
    });

    timelineData.push({
      date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      blocks
    });
  }


  // ============================================================
  // 6. SLEEP PROBABILITY CHART
  // ============================================================
  
  const timeSlots = new Array(144).fill(0);
  const uniqueDays = new Set(completedSleeps.map(e => getDateKey(e.startTime))).size || 1;

  completedSleeps.forEach(event => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    // Convert Start/End to "Minutes from 7:00 AM"
    let startMins = (start.getHours() * 60 + start.getMinutes()) - 420;
    if (startMins < 0) startMins += 1440;

    let endMins = (end.getHours() * 60 + end.getMinutes()) - 420;
    if (endMins < 0) endMins += 1440;
    
    if (endMins < startMins) endMins = 1440; 

    const startIndex = Math.floor(startMins / 10);
    const endIndex = Math.floor(endMins / 10);

    for (let i = startIndex; i <= endIndex; i++) {
      if (i >= 0 && i < 144) {
        timeSlots[i]++;
      }
    }
  });

  const rawData = timeSlots.map((count, index) => {
    const totalMinutes = index * 10 + 420; 
    let h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h >= 24) h -= 24;
    const timeLabel = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    
    return {
      time: timeLabel,
      percent: (count / uniqueDays) * 100
    };
  });

  // Smoothing
  const sleepProbabilityData = rawData.map((point, i, arr) => {
    const len = arr.length;
    const i_minus_2 = (i - 2 + len) % len;
    const i_minus_1 = (i - 1 + len) % len;
    const i_plus_1  = (i + 1) % len;
    const i_plus_2  = (i + 2) % len;

    const sum = 
      arr[i_minus_2].percent + 
      arr[i_minus_1].percent + 
      point.percent + 
      arr[i_plus_1].percent + 
      arr[i_plus_2].percent;

    return {
      time: point.time,
      percent: sum / 5
    };
  });

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-300">😴 Sleep Log</h1>
      </header>

      {/* Statistics Cards */}
      <section className="grid grid-cols-2 gap-2 mb-4">
        
        {/* Total sleep card */}
        <StatCard 
          label="Avg Total Sleep" 
          value={`${medianDailyHours}h ${medianDailyMins}m`} 
          color="blue" 
        />

        {/* Night sleep card */}
        <StatCard 
          label="Avg Night Sleep" 
          value={medianNightHours > 0 ? `${medianNightHours}h ${medianNightMins}m` : `${medianNightMins}m`}
          color="indigo" 
        />

        {/* Nap Length*/}
        <StatCard 
          label="Avg Nap Length" 
          value={medianNapHours > 0 ? `${medianNapHours}h ${medianNapMins}m` : `${medianNapMins}m`}
          color="fuchsia" 
        />

        {/* Naps pr. day */}
        <StatCard 
          label="Avg Naps pr. Day" 
          value={`${avgNapsPerDay}`}
          color="purple" 
        />

        {/* Wake up time */}
        <StatCard 
          label="Avg Wake Up Time" 
          value={`${medianWakeTime}`}
          icon='☀️'
          color="yellow" 
        />

        {/* Bedtime */}
        <StatCard 
          label="Avg Bedtime" 
          value={`${medianBedTime}`}
          icon='🛌'
          color="orange" 
        />

      </section>

      {/* Charts (Client Component) */}
      
      {/* 1. The Timeline */}
      <SleepTimeline data={timelineData} />

      {/* 2. The Graphs */}
      <SleepCharts 
        chartData={chartData} 
        napDurationData={napDurationData} 
        napStartTimeData={napStartTimeData} 
        sleepProbabilityData={sleepProbabilityData}
      />

      {/* Sleep List */}
      <section>
        <h2>All Entries</h2>
        <EventList events={sleepEvents} /> 
      </section>

    </main>
  );
}
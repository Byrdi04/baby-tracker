export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import SleepCharts from './SleepCharts';
import SleepTimeline from '@/components/SleepTimeline'; 
import StatCard from '@/components/ui/StatCard';
import ChartCard from '@/components/ui/ChartCard'; 
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
  if (decimal >= 24) decimal -= 24; // 👈 Handles the midnight wrap
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Helper: Format date (Mon 15 Jan)
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
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

// Helper: Check if time is during day (6am - 9pm)
const isDaytime = (dateStr: string): boolean => {
  const hour = new Date(dateStr).getHours();
  return hour >= 6 && hour < 21;
};

// Helper: Get date string (YYYY-MM-DD), adjusted for 7AM to 7AM cycle
const getDateKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  
  // If the time is before 07:00, subtract one day
  if (date.getHours() < 7) {
    date.setDate(date.getDate() - 1);
  }
  
  // FIX: Use LOCAL values, not ISO (UTC), to prevent timezone shifts
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

  // ========== STATISTICS CALCULATIONS ==========
  
  // 1. Calculate total sleep per day
  const sleepByDay: { [key: string]: number } = {};
  const completedSleeps = sleepEvents.filter(e => e.endTime);
  
  completedSleeps.forEach(event => {
    const dateKey = getDateKey(event.startTime);
    const duration = getDurationMinutes(event.startTime, event.endTime);
    sleepByDay[dateKey] = (sleepByDay[dateKey] || 0) + duration;
  });
  
  const dailySleepMinutes = Object.values(sleepByDay);
  const medianDailySleep = getMedian(dailySleepMinutes);
  const medianDailyHours = Math.floor(medianDailySleep / 60);
  const medianDailyMins = Math.round(medianDailySleep % 60);

  // 2. Calculate median nap time (daytime sleeps only)
  const napDurations = completedSleeps
    .filter(event => isDaytime(event.startTime))
    .map(event => getDurationMinutes(event.startTime, event.endTime));
  
  const medianNap = getMedian(napDurations);
  const medianNapHours = Math.floor(medianNap / 60);
  const medianNapMins = Math.round(medianNap % 60);

  // ========== 3. NIGHT SLEEP LOGIC ==========
  
  const sortedSleeps = [...completedSleeps].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const nightSessions: number[] = [];
  const bedTimes: number[] = []; 
  const wakeUpTimes: number[] = [];
  
  // 👈 NEW: Track IDs so we can exclude them from Naps later
  const nightEventIds = new Set<number>();

  let chainStartEvent = null;
  let chainEndEvent = null;
  let isChainActive = false;
  // 👈 NEW: Temporary list to hold IDs of the current active chain
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
        if (nextEvent) {
          const gapMins = (new Date(nextEvent.startTime).getTime() - end.getTime()) / 60000;
          if (gapMins > 40) isFalseStart = true;
        }

        if (!isFalseStart) {
          isChainActive = true;
          chainStartEvent = event;
          chainEndEvent = event;
          currentChainIds = [event.id]; // Start tracking IDs
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

          // 👈 NEW: Commit these IDs to the Night Set
          currentChainIds.forEach(id => nightEventIds.add(id));
        }

        isChainActive = false;
        chainStartEvent = null;
        chainEndEvent = null;
        currentChainIds = [];
      } else {
        // --- CHAIN CONTINUES ---
        chainEndEvent = event;
        currentChainIds.push(event.id); // Track ID
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
    
    // 👈 NEW: Commit final IDs
    currentChainIds.forEach(id => nightEventIds.add(id));
  }

  const medianNight = getMedian(nightSessions);
  const medianNightHours = Math.floor(medianNight / 60);
  const medianNightMins = Math.round(medianNight % 60);
  const medianBedTime = decimalToTime(getMedian(bedTimes));
  const medianWakeTime = decimalToTime(getMedian(wakeUpTimes));


  // ========== 5. NAP HISTOGRAMS (New) ==========

  // A. Filter Naps: Completed sleeps that are NOT in the night set
  const naps = completedSleeps.filter(e => !nightEventIds.has(e.id));

  // B. Nap Duration Histogram (30 min increments)
  // We'll create buckets up to 3 hours (180 mins). Anything > 180 goes in "3h+"
  const durationBuckets: { [key: string]: number } = {};
  const maxBuckets = 6; // 6 * 30 = 180 mins

  // Initialize buckets
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

  // C. Nap Start Time Histogram (30 min increments)
  // We only care about day hours (e.g. 06:00 to 18:00)
  const startTimeBuckets: { [key: string]: number } = {};
  
  // Initialize buckets from 06:00 to 18:00
  for(let h=6; h<18; h++) {
    startTimeBuckets[`${h}:00`] = 0;
    startTimeBuckets[`${h}:30`] = 0;
  }

  naps.forEach(nap => {
    const start = new Date(nap.startTime);
    const h = start.getHours();
    const m = start.getMinutes();

    // Only count if within our chart range (06:00 - 18:00)
    if (h >= 6 && h < 18) {
      const suffix = m < 30 ? '00' : '30';
      const label = `${h}:${suffix}`;
      startTimeBuckets[label]++;
    }
  });

  const napStartTimeData = Object.entries(startTimeBuckets).map(([label, value]) => ({ label, value }));
  // 3. Prepare chart data (last 7 days)
  const chartData = Object.entries(sleepByDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, minutes]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      hours: Math.round((minutes / 60) * 10) / 10
    }));

  // 4. Prepare sleep pattern data (hour of day)
  const sleepByHour: { [key: number]: number } = {};
  for (let i = 0; i < 24; i++) sleepByHour[i] = 0;
  
  completedSleeps.forEach(event => {
    const startHour = new Date(event.startTime).getHours();
    sleepByHour[startHour]++;
  });
  
  const hourlyData = Object.entries(sleepByHour).map(([hour, count]) => ({
    hour: `${hour}:00`,
    count
  }));

  // ========== Avg Naps per Day ==========
  const napsByDay: { [key: string]: number } = {};
  
  // Reuse the 'naps' array we created for the histogram (Step 5.A)
  // If you don't have that array accessible, filter completedSleeps again:
  // const naps = completedSleeps.filter(e => !nightEventIds.has(e.id));
  
  naps.forEach(nap => {
    const dateKey = getDateKey(nap.startTime);
    napsByDay[dateKey] = (napsByDay[dateKey] || 0) + 1;
  });

  const dailyNapCounts = Object.values(napsByDay);
  const avgNapsPerDay = dailyNapCounts.length > 0
    ? (dailyNapCounts.reduce((a, b) => a + b, 0) / dailyNapCounts.length).toFixed(1)
    : "0.0";
  
  // ============================================================
  // 4. TIMELINE CHART DATA (Overlapping Logic)
  // ============================================================
  
  // A. PRE-CALCULATE NIGHT SLEEPS GLOBALLY
  // We do this once for all events so categorization is consistent
  const nightSleepIds = new Set<number>();
  
  // Sort all sleeps chronologically for analysis
  const allSleepsSorted = [...sleepEvents].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  let isNightChainActive = false;
  let lastEventEnd = 0; 
  let lastEventEndHour = 0;

  for (let k = 0; k < allSleepsSorted.length; k++) {
    const event = allSleepsSorted[k];
    const start = new Date(event.startTime);
    const startH = start.getHours();
    const startM = start.getMinutes();
    
    const effectiveEndTime = event.endTime ? new Date(event.endTime).getTime() : Date.now();

    if (!isNightChainActive) {
      // Attempt Start
      if (startH >= 18 && startH <= 22) {
        let isFalseStart = false;
        const currentDurationMins = (effectiveEndTime - start.getTime()) / 60000;
        const nextEvent = allSleepsSorted[k + 1];

        // Check False Start Logic
        if (nextEvent && event.endTime) {
          const nextStart = new Date(nextEvent.startTime).getTime();
          const gapMins = (nextStart - effectiveEndTime) / 60000;
          if (gapMins > 45 && currentDurationMins < 90) isFalseStart = true;
        } 
        else if (event.endTime && currentDurationMins < 60) isFalseStart = true;

        if (!isFalseStart) {
          isNightChainActive = true;
          nightSleepIds.add(event.id);
          lastEventEnd = effectiveEndTime;
          const ed = new Date(effectiveEndTime);
          lastEventEndHour = ed.getHours() + (ed.getMinutes()/60);
        }
      }
    } else {
      // Chain Active
      const currentStart = start.getTime();
      const gapMins = (currentStart - lastEventEnd) / 60000;
      
      const previousEndedBeforeMorning = lastEventEndHour < 4.5;
      const currentStartsAfter430 = (startH > 4) || (startH === 4 && startM >= 30);

      // Break Condition
      if (gapMins > 40 && currentStartsAfter430 && !previousEndedBeforeMorning) {
        isNightChainActive = false;
      } else {
        nightSleepIds.add(event.id);
        lastEventEnd = effectiveEndTime;
        const ed = new Date(effectiveEndTime);
        lastEventEndHour = ed.getHours() + (ed.getMinutes()/60);
      }
    }
  }

  // B. GENERATE TIMELINE ROWS (With Splitting Logic)
  const timelineData = [];
  const today = new Date();
  // Adjust "today" to respect the 7am-7am cycle
  if (today.getHours() < 7) today.setDate(today.getDate() - 1);
  
  // Create 7 days of rows
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    
    // 1. Define the Window for this Row: 07:00 D to 07:00 D+1
    const rowStart = new Date(d);
    rowStart.setHours(7, 0, 0, 0);
    
    const rowEnd = new Date(rowStart);
    rowEnd.setDate(rowEnd.getDate() + 1); // Add 24h
    
    const rowStartMs = rowStart.getTime();
    const rowEndMs = rowEnd.getTime();
    const dayDurationMs = 24 * 60 * 60 * 1000;

    // 2. Find events that OVERLAP this window
    // Condition: EventStart < RowEnd AND EventEnd > RowStart
    const rowBlocks = allSleepsSorted.filter(e => {
      const eStart = new Date(e.startTime).getTime();
      const eEnd = e.endTime ? new Date(e.endTime).getTime() : Date.now();
      return eStart < rowEndMs && eEnd > rowStartMs;
    });

    // 3. Map to Visual Blocks
    const blocks = rowBlocks.map(e => {
      const eStartMs = new Date(e.startTime).getTime();
      const eEndMs = e.endTime ? new Date(e.endTime).getTime() : Date.now();
      const isOngoing = !e.endTime;

      // CLAMPING: 
      // If starts before row, cut it to row start.
      // If ends after row, cut it to row end.
      const visStartMs = Math.max(eStartMs, rowStartMs);
      const visEndMs = Math.min(eEndMs, rowEndMs);

      // Calculate Position %
      // (VisualStart - RowStart) / 24h
      const relativeStartMs = visStartMs - rowStartMs;
      const durationMs = visEndMs - visStartMs;

      const left = (relativeStartMs / dayDurationMs) * 100;
      const width = (durationMs / dayDurationMs) * 100;

      // Info text (Show real full time, not clipped time)
      const timeStr = `${formatTime(e.startTime)} - ${e.endTime ? formatTime(e.endTime) : 'Now'}`;
      const durationStr = getDuration(e.startTime, e.endTime);

      return {
        left,
        width,
        isNight: nightSleepIds.has(e.id),
        isOngoing,
        info: { time: timeStr, duration: durationStr }
      };
    });

    timelineData.push({
      date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      blocks
    });
  }

    // ========== 6. SLEEP PROBABILITY CHART (10-min increments) ==========
  
  // A. Initialize 144 buckets (24 hours * 6 slots per hour) starting at 07:00
  const timeSlots = new Array(144).fill(0);
  
  // B. Count total unique days in dataset to calculate percentage
  const uniqueDays = new Set(completedSleeps.map(e => getDateKey(e.startTime))).size || 1;

  completedSleeps.forEach(event => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    // Convert Start/End to "Minutes from 7:00 AM"
    // Formula: (Hours * 60 + Minutes) - (7 * 60)
    // If result < 0, add 24h (1440 mins) to handle 00:00-07:00 times
    let startMins = (start.getHours() * 60 + start.getMinutes()) - 420;
    if (startMins < 0) startMins += 1440;

    let endMins = (end.getHours() * 60 + end.getMinutes()) - 420;
    if (endMins < 0) endMins += 1440;
    
    // Handle wrap around midnight/7am
    // If end is smaller than start, it means it wrapped past 7am the next day
    // For this visual pattern, we cap it at 1440 (end of chart)
    if (endMins < startMins) endMins = 1440; 

    // Convert minutes to Bucket Indices (0 to 143)
    const startIndex = Math.floor(startMins / 10);
    const endIndex = Math.floor(endMins / 10);

    // Increment buckets
    for (let i = startIndex; i <= endIndex; i++) {
      if (i >= 0 && i < 144) {
        timeSlots[i]++;
      }
    }
  });

    // ... (Previous calculation of timeSlots remains the same) ...

  // C. Format Data
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

  // D. APPLY SMOOTHING (Moving Average)
  // We average each point with its 2 neighbors on left and 2 on right (5-point window)
  const sleepProbabilityData = rawData.map((point, i, arr) => {
    const len = arr.length;
    
    // Get indices for neighbors (handling wrap-around for 24h cycle)
    const i_minus_2 = (i - 2 + len) % len;
    const i_minus_1 = (i - 1 + len) % len;
    const i_plus_1  = (i + 1) % len;
    const i_plus_2  = (i + 2) % len;

    // Average the percentages
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

      {/* 1. The Timeline (New) */}
      <SleepTimeline data={timelineData} />

      {/* 2. The Graphs (Modified) */}
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
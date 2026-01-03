export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import SleepCharts from './SleepCharts';
import SleepTimeline from '@/components/SleepTimeline'; 

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

  // ========== 3. NIGHT SLEEP LOGIC (Updated) ==========
  
  const sortedSleeps = [...completedSleeps].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const nightSessions: number[] = [];
  const bedTimes: number[] = [];   // 👈 NEW: Store bedtimes (e.g. 19.5 for 19:30)
  const wakeUpTimes: number[] = []; // 👈 NEW: Store wake times (e.g. 6.25 for 06:15)
  
  if (sortedSleeps.length > 0) {
    let currentSession = { 
      start: new Date(sortedSleeps[0].startTime), 
      end: new Date(sortedSleeps[0].endTime) 
    };

    const processSession = (session: { start: Date, end: Date }) => {
      const startHour = session.start.getHours();
      const endHour = session.end.getHours();
      
      // Logic: Starts 18-22 AND Ends 05-08
      const validStart = startHour >= 18 && startHour <= 22;
      const validEnd = endHour >= 5 && endHour <= 8;

      if (validStart && validEnd) {
        // 1. Duration
        const durationMins = (session.end.getTime() - session.start.getTime()) / 60000;
        nightSessions.push(durationMins);

        // 2. Bedtime (Decimal)
        bedTimes.push(session.start.getHours() + (session.start.getMinutes() / 60));

        // 3. Wake Up Time (Decimal)
        wakeUpTimes.push(session.end.getHours() + (session.end.getMinutes() / 60));
      }
    };

    for (let i = 1; i < sortedSleeps.length; i++) {
      const event = sortedSleeps[i];
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const gapMinutes = (eventStart.getTime() - currentSession.end.getTime()) / 60000;

      if (gapMinutes <= 30) {
        currentSession.end = eventEnd; // Merge
      } else {
        processSession(currentSession); // Process completed session
        currentSession = { start: eventStart, end: eventEnd }; // Reset
      }
    }
    processSession(currentSession); // Process final session
  }

  // Calculate Medians
  const medianNight = getMedian(nightSessions);
  const medianNightHours = Math.floor(medianNight / 60);
  const medianNightMins = Math.round(medianNight % 60);

  // 👈 NEW: Calculate Median Times
  const medianBedTime = decimalToTime(getMedian(bedTimes));
  const medianWakeTime = decimalToTime(getMedian(wakeUpTimes));

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

  // ========== 4. TIMELINE CHART DATA ==========
  
  const timelineData = [];
  const today = new Date();
  if (today.getHours() < 7) today.setDate(today.getDate() - 1);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    
    // FIX: Generate the comparison string using LOCAL time
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Find events for this specific date
    const daysEvents = completedSleeps.filter(e => getDateKey(e.startTime) === dateStr);
    
    // ... (The rest of the calculation stays exactly the same) ...
    const blocks = daysEvents.map(e => {
      const start = new Date(e.startTime);
      const end = new Date(e.endTime);

      let startHours = start.getHours() + (start.getMinutes() / 60);
      let endHours = end.getHours() + (end.getMinutes() / 60);

      if (startHours < 7) startHours += 24;
      if (endHours < 7) endHours += 24;
      
      const relativeStart = startHours - 7;
      const durationVal = endHours - startHours;

      const left = (relativeStart / 24) * 100;
      const width = (durationVal / 24) * 100;
      const isNight = startHours >= 18; 

      const timeStr = `${formatTime(e.startTime)} - ${formatTime(e.endTime)}`;
      const durationStr = getDuration(e.startTime, e.endTime);

      return { 
        left, 
        width, 
        isNight,
        info: { time: timeStr, duration: durationStr } 
      };
    });

    timelineData.push({
      date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      blocks
    });
  }

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold">😴 Sleep Log</h1>
      </header>

      {/* Statistics Cards */}
      <section className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-900 p-4 rounded-xl">
          <p className="text-indigo-600 dark:text-indigo-300 text-sm font-medium">Total Sleep</p>
          <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            {medianDailyHours}h {medianDailyMins}m
          </p>
        </div>

        {/* 👇 NEW CARD: NIGHT SLEEP */}
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-xl">
          <p className="text-blue-600 dark:text-blue-300 text-sm font-medium">Night Sleep</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {medianNightHours > 0 ? `${medianNightHours}h ` : ''}{medianNightMins}m
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-xl">
          <p className="text-purple-600 dark:text-purple-300 text-sm font-medium">Nap Length</p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {medianNapHours > 0 ? `${medianNapHours}h ` : ''}{medianNapMins}m
          </p>
        </div>
      </section>

            {/* Existing Top Stats (Daily, Night Duration, Nap) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
         {/* ... (Your existing 3 cards are here) ... */}
      </section>

      {/* 👇 NEW SECTION: Bedtime & Wake Up */}
      <section className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-xl">
          <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">Wake Up Time</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl">☀️</span>
            <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-100">
              {medianWakeTime}
            </p>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-xl">
          <p className="text-orange-800 dark:text-orange-300 text-sm font-medium">Bedtime</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl">🛌</span>
            <p className="text-2xl font-bold text-orange-800 dark:text-orange-100">
              {medianBedTime}
            </p>
          </div>
        </div>
      </section>

      {/* Charts (Client Component) */}

      {/* 1. The Timeline (New) */}
      <SleepTimeline data={timelineData} />
      {/* 2. The Graphs (Modified) */}
      <SleepCharts chartData={chartData} />

      {/* Sleep List */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          All Entries
        </h2>
        {sleepEvents.length === 0 ? (
          <p className="text-gray-400 text-center italic mt-10">
            No sleep entries yet.
          </p>
        ) : (
          sleepEvents.map((event) => {
            const duration = getDuration(event.startTime, event.endTime);
            const isOngoing = !event.endTime;

            return (
              <div
                key={event.id}
                className={`p-4 rounded-lg shadow-sm border flex justify-between items-center ${
                  isOngoing 
                    ? 'bg-indigo-50 dark:bg-indigo-900 border-indigo-200 dark:border-indigo-700' 
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(event.startTime)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isOngoing
                    ? 'bg-indigo-200 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {duration}
                </div>
              </div>
            );
          })
        )}
      </section>

    </main>
  );
}
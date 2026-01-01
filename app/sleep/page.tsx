import db from '@/lib/db';
import SleepCharts from './SleepCharts';

// Helper: Format time (14:30)
const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
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

// Helper: Get date string (YYYY-MM-DD)
const getDateKey = (dateStr: string): string => {
  return new Date(dateStr).toISOString().split('T')[0];
};

export default function SleepPage() {
  // Fetch all sleep events
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = 'SLEEP' 
    ORDER BY startTime DESC 
    LIMIT 100
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

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">😴 Sleep Log</h1>
        <p className="text-gray-500 text-sm">Sleep tracking and statistics</p>
      </header>

      {/* Statistics Cards */}
      <section className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-indigo-50 dark:bg-indigo-900 p-4 rounded-xl">
          <p className="text-indigo-600 dark:text-indigo-300 text-sm font-medium">Daily Sleep (Median)</p>
          <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            {medianDailyHours}h {medianDailyMins}m
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-xl">
          <p className="text-purple-600 dark:text-purple-300 text-sm font-medium">Nap Length (Median)</p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {medianNapHours > 0 ? `${medianNapHours}h ` : ''}{medianNapMins}m
          </p>
        </div>
      </section>

      {/* Charts (Client Component) */}
      <SleepCharts chartData={chartData} hourlyData={hourlyData} />

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
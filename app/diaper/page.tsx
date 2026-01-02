export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import DiaperCharts from './DiaperCharts';

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

// Helper: Get date string (YYYY-MM-DD)
const getDateKey = (dateStr: string): string => {
  return new Date(dateStr).toISOString().split('T')[0];
};

// Helper: Get week string (YYYY-WW)
const getWeekKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

export default function DiaperPage() {
  // Fetch all diaper events
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = 'DIAPER' 
    ORDER BY startTime DESC 
    LIMIT 100
  `);
  const diaperEvents = stmt.all() as any[];

  // ========== STATISTICS CALCULATIONS ==========

  // 1. Changes per day
  const diapersByDay: { [key: string]: number } = {};
  diaperEvents.forEach(event => {
    const dateKey = getDateKey(event.startTime);
    diapersByDay[dateKey] = (diapersByDay[dateKey] || 0) + 1;
  });
  
  const dailyCounts = Object.values(diapersByDay);
  const avgPerDay = dailyCounts.length > 0 
    ? Math.round(dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length * 10) / 10
    : 0;

  // 2. Changes per week
  const diapersByWeek: { [key: string]: number } = {};
  diaperEvents.forEach(event => {
    const weekKey = getWeekKey(event.startTime);
    diapersByWeek[weekKey] = (diapersByWeek[weekKey] || 0) + 1;
  });
  
  const weeklyCounts = Object.values(diapersByWeek);
  const avgPerWeek = weeklyCounts.length > 0 
    ? Math.round(weeklyCounts.reduce((a, b) => a + b, 0) / weeklyCounts.length * 10) / 10
    : 0;

  // 3. Prepare daily chart data (last 7 days)
  const dailyChartData = Object.entries(diapersByDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      changes: count
    }));

  // 4. Prepare weekly chart data (last 4 weeks)
  const weeklyChartData = Object.entries(diapersByWeek)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-4)
    .map(([week, count]) => ({
      week: week.split('-')[1], // Just "W01", "W02", etc.
      changes: count
    }));

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold">💩 Diaper Log</h1>
      </header>

      {/* Statistics Cards */}
      <section className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-xl">
          <p className="text-orange-600 dark:text-orange-300 text-sm font-medium">Per Day (Avg)</p>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {avgPerDay}
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900 p-4 rounded-xl">
          <p className="text-amber-600 dark:text-amber-300 text-sm font-medium">Per Week (Avg)</p>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
            {avgPerWeek}
          </p>
        </div>
      </section>

      {/* Charts (Client Component) */}
      <DiaperCharts dailyChartData={dailyChartData} weeklyChartData={weeklyChartData} />

      {/* Diaper List */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          All Entries
        </h2>
        {diaperEvents.length === 0 ? (
          <p className="text-gray-400 text-center italic mt-10">
            No diaper entries yet.
          </p>
        ) : (
          diaperEvents.map((event) => {
            return (
              <div
                key={event.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-orange-100 dark:bg-orange-900 p-2 rounded-full text-xl">
                    💩
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(event.startTime)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(event.startTime)}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100">
                  {formatTime(event.startTime)}
                </div>
              </div>
            );
          })
        )}
      </section>

    </main>
  );
}
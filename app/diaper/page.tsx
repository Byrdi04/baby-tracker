export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import DiaperCharts from './DiaperCharts';
import StatCard from '@/components/ui/StatCard';
import ChartCard from '@/components/ui/ChartCard'; 

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

  // ============================================================
  // STATISTICS CALCULATIONS
  // ============================================================

  // 1. Changes per day (Count AND Notes)
  // Structure: { "2024-01-01": { count: 5, notes: ["Rash", " Huge"] } }
  const dailyData: { [key: string]: { count: number, notes: string[] } } = {};

  diaperEvents.forEach(event => {
    const dateKey = getDateKey(event.startTime);
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { count: 0, notes: [] };
    }
    
    dailyData[dateKey].count++;
    if (event.note) {
      dailyData[dateKey].notes.push(event.note);
    }
  });
  
  // Calculate Avg (Logic slightly changed to access .count)
  const daysWithData = Object.values(dailyData);
  const avgPerDay = daysWithData.length > 0 
    ? Math.round(daysWithData.reduce((a, b) => a + b.count, 0) / daysWithData.length * 10) / 10
    : 0;

  // 2. Changes per week (Keep simple count logic)
  const diapersByWeek: { [key: string]: number } = {};
  diaperEvents.forEach(event => {
    const weekKey = getWeekKey(event.startTime);
    diapersByWeek[weekKey] = (diapersByWeek[weekKey] || 0) + 1;
  });
  
  const weeklyCounts = Object.values(diapersByWeek);
  const avgPerWeek = weeklyCounts.length > 0 
    ? Math.round(weeklyCounts.reduce((a, b) => a + b, 0) / weeklyCounts.length * 10) / 10
    : 0;

  // 3. Prepare daily chart data (Fill empty days)
  const dailyChartData = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });

    const dayEntry = dailyData[key];

    dailyChartData.push({
      date: label,
      changes: dayEntry ? dayEntry.count : 0,
      notes: dayEntry ? dayEntry.notes : [] // 👈 Pass the array of notes
    });
  }

  // 4. Prepare weekly chart data
  const weeklyChartData = Object.entries(diapersByWeek)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-4)
    .map(([week, count]) => ({
      week: week.split('-')[1], 
      changes: count
    }));

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-300">💩 Diaper Log</h1>
      </header>

      {/* Statistics Cards */}
      <section className="grid grid-cols-2 gap-4 mb-4">

        {/* Per Day (Avg) */}
        <StatCard 
          label="Avg pr. day" 
          value={`${avgPerDay}`} 
          color="orange" 
        />

        {/* Time Between Feeds */}
        <StatCard 
          label="Avg pr. week" 
          value={`${avgPerWeek}`} 
          color="amber" 
        />
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
                className="bg-sky-50 dark:bg-sky-950 p-4 rounded-lg flex justify-between items-center"
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
export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import DiaperCharts from './DiaperCharts';
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
  // 1. Fetch more history (Increased to 1000 for better long-term averages)
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = 'DIAPER' 
    ORDER BY startTime DESC 
    LIMIT 1000
  `);
  const diaperEvents = stmt.all() as any[];

  // ============================================================
  // STATISTICS CALCULATIONS
  // ============================================================

  // --- A. DATA AGGREGATION (For Charts) ---
  // We still need to group data for the charts and notes
  const dailyData: { [key: string]: { count: number, notes: string[] } } = {};
  const diapersByWeek: { [key: string]: number } = {};

  diaperEvents.forEach(event => {
    // Daily Grouping
    const dateKey = getDateKey(event.startTime);
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { count: 0, notes: [] };
    }
    dailyData[dateKey].count++;
    if (event.note) {
      dailyData[dateKey].notes.push(event.note);
    }

    // Weekly Grouping
    const weekKey = getWeekKey(event.startTime);
    diapersByWeek[weekKey] = (diapersByWeek[weekKey] || 0) + 1;
  });

  // --- B. AVERAGES CALCULATION (Corrected Time Span) ---
  
  let avgPerDay = 0;
  let avgPerWeek = 0;
  const totalDiapers = diaperEvents.length;

  if (totalDiapers > 0) {
    // 1. Find the Oldest Entry (Start of tracking)
    const oldestTime = new Date(diaperEvents[totalDiapers - 1].startTime).getTime();
    
    // 2. End of tracking is NOW (Current moment)
    // This ensures that empty days at the end of the period count towards the average.
    const now = Date.now();
    
    // 3. Calculate difference
    const diffMs = now - oldestTime;
    
    // Convert to Days. 
    // We use Math.max(1, ...) so if you just started 1 hour ago, 
    // we divide by 1 day instead of 0.04 days (which would give a huge fake average).
    const diffDays = Math.max(1, diffMs / (1000 * 60 * 60 * 24));
    
    const diffWeeks = diffDays / 7;

    // 4. Calculate Rates
    avgPerDay = Math.round((totalDiapers / diffDays) * 10) / 10;
    avgPerWeek = Math.round((totalDiapers / diffWeeks) * 10) / 10;
  }

  // --- C. CHART DATA PREPARATION ---

  // 1. Prepare daily chart data (Fill empty days for last 7 days)
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
      notes: dayEntry ? dayEntry.notes : [] // Pass the notes for the bubbles
    });
  }

  // 2. Prepare weekly chart data (Last 4 weeks)
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

        {/* Per Week (Avg) */}
        <StatCard 
          label="Avg pr. week" 
          value={`${avgPerWeek}`} 
          color="amber" 
        />
      </section>

      {/* Charts (Client Component) */}
      <DiaperCharts dailyChartData={dailyChartData} weeklyChartData={weeklyChartData} />

      {/* Diaper List */}
      <section>
        <h2>All Entries</h2>
        <EventList events={diaperEvents} /> 
      </section>

    </main>
  );
}
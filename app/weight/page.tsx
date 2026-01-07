export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import WeightCharts from './WeightCharts';
import StatCard from '@/components/ui/StatCard';
import { STATIC_GROWTH_DATA } from '@/data/growth_curve'; // 👈 Import the data you generated

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

export default function WeightPage() {
  // 1. Fetch User Data
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = 'WEIGHT' 
    ORDER BY startTime ASC 
  `);
  const weightEventsAsc = stmt.all() as any[];
  const weightEventsDesc = [...weightEventsAsc].reverse();

  // Statistics Calculations (Unchanged)
  const firstWeight = weightEventsAsc.length > 0 
    ? parseFloat(JSON.parse(weightEventsAsc[0].data || '{}').amount || 0)
    : 0;
  
  const latestWeight = weightEventsAsc.length > 0 
    ? parseFloat(JSON.parse(weightEventsAsc[weightEventsAsc.length - 1].data || '{}').amount || 0)
    : 0;

  const totalGain = latestWeight - firstWeight;

  // 2. Prepare USER Data Points
  const userPoints = weightEventsAsc.map(event => ({
    timestamp: new Date(event.startTime).getTime(),
    weight: parseFloat(JSON.parse(event.data).amount) || 0,
    p15: undefined, p25: undefined, p50: undefined, p75: undefined, p85: undefined,
    isUser: true
  }));

  // ========================================================
  // 3. Prepare & FILTER Reference Data Points
  // ========================================================
  
  // Define the cutoff: Use "Today" as the limit. 
  // This ensures the chart grows with your baby but doesn't show 2 empty years.
  const cutoffTime = Date.now(); 

  const referencePoints = STATIC_GROWTH_DATA
    .map(row => ({
      timestamp: new Date(row.date).getTime(),
      weight: undefined, 
      p15: row.p15,
      p25: row.p25,
      p50: row.p50,
      p75: row.p75,
      p85: row.p85,
      isUser: false
    }))
    // 👇 THIS IS THE NEW PART: Remove any points in the future
    .filter(pt => pt.timestamp <= cutoffTime);

  // 4. Merge and Sort
  const combinedChartData = [...userPoints, ...referencePoints].sort((a, b) => a.timestamp - b.timestamp);

  // Helper for list view changes (Unchanged)
  const getWeightChange = (currentIndex: number) => {
    if (currentIndex >= weightEventsDesc.length - 1) return null;
    const current = parseFloat(JSON.parse(weightEventsDesc[currentIndex].data).amount);
    const prev = parseFloat(JSON.parse(weightEventsDesc[currentIndex + 1].data).amount);
    return current - prev;
  };

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      <header className="mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-300">⚖️ Weight Log</h1>
      </header>

      {/* Statistics Cards */}
      <section className="grid grid-cols-2 gap-4 mb-4">
        <StatCard 
          label="Current Weight" 
          value={latestWeight > 0 ? `${latestWeight} kg` : '—'} 
          color="cyan" 
        />
        <StatCard 
          label="Total Change" 
          value={`${totalGain > 0 ? '+' : ''}${totalGain.toFixed(2)} kg`} 
          color={totalGain >= 0 ? 'green' : 'red'} 
        />
      </section>

      {/* Growth Chart */}
      <WeightCharts chartData={combinedChartData} />

      {/* Weight List */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          All Entries
        </h2>
        {weightEventsDesc.length === 0 ? (
          <p className="text-gray-400 text-center italic mt-10">No entries yet.</p>
        ) : (
          weightEventsDesc.map((event, index) => {
            const weight = JSON.parse(event.data).amount;
            const change = getWeightChange(index);

            return (
              <div key={event.id} className="bg-sky-50 dark:bg-sky-950 p-4 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="bg-cyan-100 dark:bg-cyan-900 p-2 rounded-full text-xl">⚖️</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(event.startTime)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatTime(event.startTime)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900 dark:text-white">{weight} kg</p>
                  {change !== null && (
                    <p className={`text-xs font-medium ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {change > 0 ? '+' : ''}{change.toFixed(2)} kg
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

    </main>
  );
}


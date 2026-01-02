export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import WeightCharts from './WeightCharts';

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
  // Fetch all weight events (oldest first for chart)
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = 'WEIGHT' 
    ORDER BY startTime ASC 
    LIMIT 100
  `);
  const weightEventsAsc = stmt.all() as any[];

  // Reverse for display (newest first)
  const weightEvents = [...weightEventsAsc].reverse();

  // ========== STATISTICS CALCULATIONS ==========

  // 1. First and latest weight
  const firstWeight = weightEventsAsc.length > 0 
    ? parseFloat(JSON.parse(weightEventsAsc[0].data || '{}').amount || 0)
    : 0;
  
  const latestWeight = weightEventsAsc.length > 0 
    ? parseFloat(JSON.parse(weightEventsAsc[weightEventsAsc.length - 1].data || '{}').amount || 0)
    : 0;

  const totalGain = latestWeight - firstWeight;

  // 2. Prepare chart data
  const chartData = weightEventsAsc.map(event => {
    const data = JSON.parse(event.data || '{}');
    return {
      date: new Date(event.startTime).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short' 
      }),
      weight: parseFloat(data.amount) || 0
    };
  });

  // 3. Calculate weight change from previous entry
  const getWeightChange = (currentIndex: number) => {
    if (currentIndex >= weightEvents.length - 1) return null;
    
    const currentData = JSON.parse(weightEvents[currentIndex].data || '{}');
    const previousData = JSON.parse(weightEvents[currentIndex + 1].data || '{}');
    
    const currentWeight = parseFloat(currentData.amount);
    const previousWeight = parseFloat(previousData.amount);
    
    if (isNaN(currentWeight) || isNaN(previousWeight)) return null;
    
    return currentWeight - previousWeight;
  };

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">⚖️ Weight Log</h1>
        <p className="text-gray-500 text-sm">Weight tracking and growth</p>
      </header>

      {/* Statistics Cards */}
      <section className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-cyan-50 dark:bg-cyan-900 p-4 rounded-xl">
          <p className="text-cyan-600 dark:text-cyan-300 text-sm font-medium">Current Weight</p>
          <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
            {latestWeight > 0 ? `${latestWeight} kg` : '—'}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${totalGain >= 0 ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'}`}>
          <p className={`text-sm font-medium ${totalGain >= 0 ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
            Total Change
          </p>
          <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
            {totalGain > 0 ? '+' : ''}{totalGain.toFixed(2)} kg
          </p>
        </div>
      </section>

      {/* Growth Chart (Client Component) */}
      <WeightCharts chartData={chartData} />

      {/* Weight List */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          All Entries
        </h2>
        {weightEvents.length === 0 ? (
          <p className="text-gray-400 text-center italic mt-10">
            No weight entries yet.
          </p>
        ) : (
          weightEvents.map((event, index) => {
            const eventData = JSON.parse(event.data || '{}');
            const weight = eventData.amount || '?';
            const change = getWeightChange(index);

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-cyan-100 dark:bg-cyan-900 p-2 rounded-full text-xl">
                    ⚖️
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
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900 dark:text-white">
                    {weight} kg
                  </p>
                  {change !== null && (
                    <p className={`text-xs font-medium ${
                      change > 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : change < 0 
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500'
                    }`}>
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
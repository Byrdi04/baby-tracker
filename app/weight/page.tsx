import db from '@/lib/db';

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
  // Fetch all weight events
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = 'WEIGHT' 
    ORDER BY startTime DESC 
    LIMIT 100
  `);
  const weightEvents = stmt.all() as any[];

  // Calculate weight change (compare to previous entry)
  const getWeightChange = (currentIndex: number) => {
    if (currentIndex >= weightEvents.length - 1) return null; // No previous entry
    
    const currentData = JSON.parse(weightEvents[currentIndex].data || '{}');
    const previousData = JSON.parse(weightEvents[currentIndex + 1].data || '{}');
    
    const currentWeight = parseFloat(currentData.amount);
    const previousWeight = parseFloat(previousData.amount);
    
    if (isNaN(currentWeight) || isNaN(previousWeight)) return null;
    
    const change = currentWeight - previousWeight;
    return change;
  };

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">⚖️ Weight Log</h1>
        <p className="text-gray-500 text-sm">Weight tracking over time</p>
      </header>

      {/* Weight List */}
      <section className="space-y-3">
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
                {/* Left side: Date and time */}
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

                {/* Right side: Weight and change */}
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

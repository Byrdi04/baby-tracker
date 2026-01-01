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

// Helper: Calculate duration
const getDuration = (start: string, end: string | null) => {
  if (!end) return 'Ongoing...';
  
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
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

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">😴 Sleep Log</h1>
        <p className="text-gray-500 text-sm">All sleep entries</p>
      </header>

      {/* Sleep List */}
      <section className="space-y-3">
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
                {/* Left side: Date and times */}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(event.startTime)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </p>
                </div>

                {/* Right side: Duration */}
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
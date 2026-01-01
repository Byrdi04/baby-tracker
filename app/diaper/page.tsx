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

export default function DiaperPage() {
  // Fetch all diaper events
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = 'DIAPER' 
    ORDER BY startTime DESC 
    LIMIT 100
  `);
  const diaperEvents = stmt.all() as any[];

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">💩 Diaper Log</h1>
        <p className="text-gray-500 text-sm">All diaper changes</p>
      </header>

      {/* Diaper List */}
      <section className="space-y-3">
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
                {/* Left side: Date and time */}
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

                {/* Right side: Time badge */}
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
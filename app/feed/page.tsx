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

// Helper: Get feed type styling
const getFeedStyle = (feedType: string) => {
  switch (feedType) {
    case 'Breastfeeding':
      return { icon: '🤱', bg: 'bg-pink-100 dark:bg-pink-900', text: 'text-pink-800 dark:text-pink-100' };
    case 'Bottle':
      return { icon: '🍼', bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-100' };
    case 'Solid food':
      return { icon: '🥣', bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-100' };
    default:
      return { icon: '🍼', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-100' };
  }
};

export default function FeedPage() {
  // Fetch all feed events
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = 'FEED' 
    ORDER BY startTime DESC 
    LIMIT 100
  `);
  const feedEvents = stmt.all() as any[];

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">🍼 Feed Log</h1>
        <p className="text-gray-500 text-sm">All feeding entries</p>
      </header>

      {/* Feed List */}
      <section className="space-y-3">
        {feedEvents.length === 0 ? (
          <p className="text-gray-400 text-center italic mt-10">
            No feed entries yet.
          </p>
        ) : (
          feedEvents.map((event) => {
            const eventData = JSON.parse(event.data || '{}');
            const feedType = eventData.feedType || 'Unknown';
            const style = getFeedStyle(feedType);

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center"
              >
                {/* Left side: Date and time */}
                <div className="flex items-center gap-3">
                  <span className={`${style.bg} p-2 rounded-full text-xl`}>
                    {style.icon}
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

                {/* Right side: Feed type */}
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${style.bg} ${style.text}`}>
                  {feedType}
                </div>
              </div>
            );
          })
        )}
      </section>

    </main>
  );
}
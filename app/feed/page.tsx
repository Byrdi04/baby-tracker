import db from '@/lib/db';
import FeedCharts from './FeedCharts';

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

  // ========== STATISTICS CALCULATIONS ==========

  // 1. Feeds per day
  const feedsByDay: { [key: string]: number } = {};
  feedEvents.forEach(event => {
    const dateKey = getDateKey(event.startTime);
    feedsByDay[dateKey] = (feedsByDay[dateKey] || 0) + 1;
  });
  
  const dailyFeeds = Object.values(feedsByDay);
  const avgFeedsPerDay = dailyFeeds.length > 0 
    ? Math.round(dailyFeeds.reduce((a, b) => a + b, 0) / dailyFeeds.length * 10) / 10
    : 0;

  // 2. Average time between feeds
  let totalGapMinutes = 0;
  let gapCount = 0;
  
  for (let i = 0; i < feedEvents.length - 1; i++) {
    const current = new Date(feedEvents[i].startTime).getTime();
    const next = new Date(feedEvents[i + 1].startTime).getTime();
    const gapMinutes = (current - next) / 60000;
    
    // Only count gaps less than 12 hours (720 min) to avoid overnight skewing
    if (gapMinutes < 720) {
      totalGapMinutes += gapMinutes;
      gapCount++;
    }
  }
  
  const avgGapMinutes = gapCount > 0 ? Math.round(totalGapMinutes / gapCount) : 0;
  const avgGapHours = Math.floor(avgGapMinutes / 60);
  const avgGapMins = avgGapMinutes % 60;

  // 3. Feed type breakdown
  const feedTypeCounts: { [key: string]: number } = {};
  feedEvents.forEach(event => {
    const data = JSON.parse(event.data || '{}');
    const type = data.feedType || 'Unknown';
    feedTypeCounts[type] = (feedTypeCounts[type] || 0) + 1;
  });

  const feedTypeData = Object.entries(feedTypeCounts).map(([name, value]) => ({
    name,
    value
  }));

  // 4. Prepare chart data (last 7 days)
  const chartData = Object.entries(feedsByDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
      feeds: count
    }));

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">🍼 Feed Log</h1>
        <p className="text-gray-500 text-sm">Feeding tracking and statistics</p>
      </header>

      {/* Statistics Cards */}
      <section className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-xl">
          <p className="text-green-600 dark:text-green-300 text-sm font-medium">Feeds per Day</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {avgFeedsPerDay}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-xl">
          <p className="text-blue-600 dark:text-blue-300 text-sm font-medium">Time Between Feeds</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {avgGapHours}h {avgGapMins}m
          </p>
        </div>
      </section>

      {/* Feed Type Breakdown */}
      <section className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Feed Type Breakdown
        </h3>
        <div className="flex gap-2 flex-wrap">
          {feedTypeData.map(({ name, value }) => {
            const style = getFeedStyle(name);
            return (
              <div 
                key={name}
                className={`${style.bg} ${style.text} px-3 py-2 rounded-lg flex items-center gap-2`}
              >
                <span>{style.icon}</span>
                <span className="font-semibold">{value}</span>
                <span className="text-sm opacity-75">{name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Charts (Client Component) */}
      <FeedCharts chartData={chartData} />

      {/* Feed List */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          All Entries
        </h2>
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
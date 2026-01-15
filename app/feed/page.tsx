export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import EventList from '@/components/events/EventList';
import FeedTimeline from '@/components/FeedTimeline';

// 1. Import new Components
import FeedStats from '@/components/feed/FeedStats';
import FeedCharts from '@/components/feed/FeedCharts';

// 2. Import Logic
import { processFeedStats, generateFeedTimeline } from '@/lib/feed-logic';

export default function FeedPage() {
  // 1. Fetch Data
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = 'FEED' 
    ORDER BY startTime DESC 
    LIMIT 100
  `);
  const feedEvents = stmt.all() as any[];

  // 2. Process Logic (in Lib)
  const { stats, chartData } = processFeedStats(feedEvents);
  const timelineData = generateFeedTimeline(feedEvents);

  // 3. Render UI
  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      <header className="mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-300">🍼 Feed Log</h1>
      </header>

      {/* Stats & Breakdown */}
      <FeedStats stats={stats} />

      {/* Timeline */}
      <FeedTimeline data={timelineData} />

      {/* Charts */}
      <FeedCharts chartData={chartData} />

      {/* List */}
      <section>
        <h2>All Entries</h2>
        <EventList events={feedEvents} /> 
      </section>

    </main>
  );
}
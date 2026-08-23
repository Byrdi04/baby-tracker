export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import EventList from '@/components/events/EventList';
import FeedTimeline from '@/components/FeedTimeline';

// 1. Import new Components
import FeedStats from '@/components/feed/FeedStats';
import FeedCharts from '@/components/feed/FeedCharts';

// 2. Import Logic
import { processFeedStats, generateFeedTimeline } from '@/lib/feed-logic';
import { getDayStartHour, getFeedDisplayLimit, getBabyBirthday, getBabyGender } from '@/lib/settings';

export default function FeedPage() {
  const dayStartHour = getDayStartHour();
  const displayLimit = getFeedDisplayLimit();
  const birthDate = getBabyBirthday();
  const gender = getBabyGender();

  // 1. Fetch Data
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = 'FEED' 
    ORDER BY startTime DESC 
    LIMIT ?
  `);
  const feedEvents = stmt.all(displayLimit) as any[];

  // 2. Process Logic (in Lib)
  const { stats, chartData } = processFeedStats(feedEvents);
  const timelineData = generateFeedTimeline(feedEvents, new Date(), 7, dayStartHour);

  // 3. Render UI
  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      <header className="mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-300">🍼 Feed Log</h1>
      </header>

      {/* Stats & Breakdown */}
      <FeedStats stats={stats} />

      {/* Timeline */}
      <FeedTimeline data={timelineData} showHistoryLink={true} dayStartHour={dayStartHour} />

      {/* Charts */}
      <FeedCharts chartData={chartData} dayStartHour={dayStartHour} />

      {/* List */}
      <section>
        <h2>All Entries</h2>
        <EventList events={feedEvents} birthDate={birthDate} gender={gender} correctedOffsetMs={0} /> 
      </section>

    </main>
  );
}
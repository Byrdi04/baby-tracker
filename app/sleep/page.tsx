export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import SleepCharts from '@/components/sleep/SleepCharts';
import SleepTimeline from '@/components/SleepTimeline'; 
import EventList from '@/components/events/EventList';
import SleepStats from '@/components/sleep/SleepStats';

// Import the logic functions
import { 
  processSleepStats, 
  generateTimelineData, 
  calculateSleepProbability 
} from '@/lib/sleep-logic';

export default function SleepPage() {
  // 1. Fetch Data
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = 'SLEEP' 
    ORDER BY startTime DESC 
    LIMIT 500
  `);
  const sleepEvents = stmt.all() as any[];

  // 2. Process Data (The logic is now in lib!)
  const { 
    nightEventIds, 
    completedSleeps, 
    stats, 
    chartData, 
    napDurationData, 
    napStartTimeData 
  } = processSleepStats(sleepEvents);

  const timelineData = generateTimelineData(sleepEvents, nightEventIds);
  const sleepProbabilityData = calculateSleepProbability(completedSleeps);

  // 3. Render UI
  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      <header className="mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-300">😴 Sleep Log</h1>
      </header>

      {/* New Stats Component */}
      <SleepStats stats={stats} />

      <SleepTimeline data={timelineData} />

      <SleepCharts 
        chartData={chartData} 
        napDurationData={napDurationData} 
        napStartTimeData={napStartTimeData} 
        sleepProbabilityData={sleepProbabilityData}
      />

      <section>
        <h2>All Entries</h2>
        <EventList events={sleepEvents} /> 
      </section>

    </main>
  );
}
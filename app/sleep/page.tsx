export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import SleepCharts from '@/components/sleep/SleepCharts';
import SleepTimeline from '@/components/SleepTimeline'; 
import EventList from '@/components/events/EventList';
import SleepStats from '@/components/sleep/SleepStats';
import { getDayStartHour, getBabyBirthday, getBabyGender } from '@/lib/settings';

// Import the logic functions
import { 
  processSleepStats, 
  generateTimelineData, 
  calculateSleepProbability 
} from '@/lib/sleep-logic';

export default function SleepPage() {
  const dayStartHour = getDayStartHour();
  const birthDate = getBabyBirthday();
  const gender = getBabyGender();

  // 1. Fetch Data
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = 'SLEEP' 
    ORDER BY startTime DESC 
  `);
  const sleepEvents = stmt.all() as any[];

  // 2. Process Data (The logic is now in lib!)
  const { 
    nightEventIds, 
    completedSleeps, 
    stats, 
    chartData, 
    trendData,
    napDurationData, 
    napStartTimeData,
    wakeupsData
  } = processSleepStats(sleepEvents);

  const timelineData = generateTimelineData(sleepEvents, nightEventIds, new Date(), 7, dayStartHour);
  const sleepProbabilityData = calculateSleepProbability(completedSleeps, dayStartHour);

  // 3. Render UI
  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      
      <header className="mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-300">😴 Sleep Log</h1>
      </header>

      {/* New Stats Component */}
      <SleepStats stats={stats} />

      {/* Timeline Section */}
      <SleepTimeline data={timelineData} showHistoryLink={true} dayStartHour={dayStartHour} />

      <SleepCharts 
        chartData={chartData} 
        trendData={trendData}
        napDurationData={napDurationData} 
        napStartTimeData={napStartTimeData} 
        sleepProbabilityData={sleepProbabilityData}
        wakeupsData={wakeupsData}
        medianWakeupsLast14={stats.medianWakeupsLast14}
        longestStretchMinutesLast14={stats.longestStretchMinutesLast14}
        dayStartHour={dayStartHour}
      />

      <section>
        <h2>All Entries</h2>
        <EventList events={sleepEvents} birthDate={birthDate} gender={gender} correctedOffsetMs={0} /> 
      </section>

    </main>
  );
}
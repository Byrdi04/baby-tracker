import db from '@/lib/db';
import QuickButtons from '@/components/QuickButtons';
import EventList from '@/components/events/EventList';
import { getEventsDisplayLimit, getBabyBirthday, getBabyGender } from '@/lib/settings';
export const dynamic = "force-dynamic";

export default function Home() {
  const displayLimit = getEventsDisplayLimit();
  const birthDate = getBabyBirthday();
  const gender = getBabyGender();
  // 1. FETCH DATA (Server Side)
  // We disable caching for this specific request so the list is always fresh
  const stmt = db.prepare('SELECT * FROM events ORDER BY startTime DESC LIMIT ?');
  const events = stmt.all(displayLimit) as any[]; // pass as any to avoid strict type issues between server/client files

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">

      {/* Page header */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-300">👶🍼 Baby tracker</h1>
      </header>

      {/* Buttons */}
      <QuickButtons />

      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Recent Activity
        </h2>
        
        {/* Pass the data to the Client Component */}
        <EventList events={events} birthDate={birthDate} gender={gender} correctedOffsetMs={0} />
        
      </section>
    </main>
  );
}
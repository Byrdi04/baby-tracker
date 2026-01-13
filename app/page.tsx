import db from '@/lib/db';
import QuickButtons from '@/components/QuickButtons';
import EventList from '@/components/events/EventList';
export const dynamic = "force-dynamic";

export default function Home() {
  // 1. FETCH DATA (Server Side)
  // We disable caching for this specific request so the list is always fresh
  const stmt = db.prepare('SELECT * FROM events ORDER BY startTime DESC LIMIT 1000');
  const events = stmt.all() as any[]; // pass as any to avoid strict type issues between server/client files

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">

      {/* Buttons */}
      <QuickButtons />

      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Recent Activity
        </h2>
        
        {/* Pass the data to the Client Component */}
        <EventList events={events} />
        
      </section>
    </main>
  );
}
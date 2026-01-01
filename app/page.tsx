import db from '@/lib/db'; // Shared DB connection
import QuickButtons from '@/components/QuickButtons';

// Types for TypeScript
type EventRow = {
  id: number;
  type: string;
  startTime: string;
  data: string;
};

// Helper to show nice time (10:30 AM)
function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

// Helper for colors
// app/page.tsx

// ... imports

const getEventStyle = (type: string) => {
  switch (type) {
    case 'SLEEP': return { icon: '😴', bg: 'bg-blue-100 dark:bg-blue-900' };
    case 'FEED': return { icon: '🍼', bg: 'bg-pink-100 dark:bg-pink-900' };
    case 'DIAPER': return { icon: '💩', bg: 'bg-yellow-100 dark:bg-yellow-900' };
    // NEW STYLES HERE:
    case 'MEDICINE': return { icon: '💊', bg: 'bg-green-100 dark:bg-green-900' };
    case 'WEIGHT': return { icon: '⚖️', bg: 'bg-cyan-100 dark:bg-cyan-900' };
    
    default: return { icon: '📝', bg: 'bg-gray-100 dark:bg-gray-700' };
  }
};


export default function Home() {
  // 1. FETCH DATA: Direct SQL query
  // We use .all() to get an array of rows
  const stmt = db.prepare('SELECT * FROM events ORDER BY startTime DESC LIMIT 10');
  const events = stmt.all() as EventRow[];

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Baby Tracker 👶🏻</h1>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString()}
        </span>
      </header>

      {/* Interactive Buttons Component */}
      <QuickButtons />

      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Recent Activity
        </h2>
        
        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-gray-400 text-center italic mt-10">No events logged yet.</p>
          ) : (
            // Find the part where you map events:
            events.map((event) => {
              const style = getEventStyle(event.type);
              
              // Custom logic for Sleep duration
              let timeDisplay = formatTime(event.startTime);
              if (event.type === 'SLEEP') {
                if (!event.endTime) {
                  timeDisplay = "💤 Sleeping now...";
                } else {
                  // Optional: Calculate duration here if you want
                  // For now, let's just show start time
                  timeDisplay = `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;
                }
              }

              return (
                <div key={event.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`${style.bg} p-2 rounded-full text-lg`}>
                      {style.icon}
                    </span>
                    <div>
                      <p className="font-medium capitalize">{event.type.toLowerCase()}</p>
                      <p className="text-xs text-gray-500">Logged</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {timeDisplay}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
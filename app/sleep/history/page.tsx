import HistoryList from '@/components/HistoryList';
import Link from 'next/link';
import { fetchHistoryChunk } from '@/app/actions'; // 👈 Import the action
import { getDayStartHour, getHistoryChunkDays } from '@/lib/settings';
export const dynamic = "force-dynamic";

export default async function SleepHistoryPage() {
  // 👈 Fetch Page 0 on the server
  const initialData = await fetchHistoryChunk('SLEEP', 0);
  const dayStartHour = getDayStartHour();
  const chunkDays = getHistoryChunkDays();

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-gray-300">🕙 Sleep History</h1>
        <Link 
          href="/sleep" 
          className="text-sm text-gray-600 dark:text-gray-200 hover:underline"
        >
          Back to Dashboard
        </Link>
      </header>

      {/* 👈 Pass the data */}
      <HistoryList type="SLEEP" initialData={initialData} dayStartHour={dayStartHour} chunkDays={chunkDays} />
    </main>
  );
}
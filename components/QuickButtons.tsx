'use client';

import { useRouter } from 'next/navigation';

export default function QuickButtons() {
  const router = useRouter();

  const handleLog = async (type: string) => {
    try {
      // 1. Send data to our new API route
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        console.log("Saved successfully");
        // 2. Refresh the page so the new item appears in the list below
        router.refresh();
      } else {
        console.error("Server returned error");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return (
    <section className="grid grid-cols-2 gap-4 mb-8">
      <button 
        onClick={() => handleLog('SLEEP')} 
        className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all"
      >
        <span className="text-2xl">😴</span>
        <span className="font-semibold">Sleep</span>
      </button>
      
      <button 
        onClick={() => handleLog('FEED')}
        className="bg-pink-600 hover:bg-pink-700 active:scale-95 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all"
      >
        <span className="text-2xl">🍼</span>
        <span className="font-semibold">Feed</span>
      </button>

      <button 
        onClick={() => handleLog('DIAPER')}
        className="bg-yellow-600 hover:bg-yellow-700 active:scale-95 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all"
      >
        <span className="text-2xl">💩</span>
        <span className="font-semibold">Diaper</span>
      </button>

      <button 
        onClick={() => handleLog('NOTE')}
        className="bg-gray-600 hover:bg-gray-700 active:scale-95 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all"
      >
        <span className="text-xl">📝</span>
        <span className="font-semibold">Note</span>
      </button>
    </section>
  );
}
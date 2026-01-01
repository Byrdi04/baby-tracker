'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function QuickButtons() {
  const router = useRouter();
  
  // State to track if baby is currently sleeping
  const [isSleeping, setIsSleeping] = useState(false);
  // State to disable button while loading (prevent double clicks)
  const [loading, setLoading] = useState(false);

  // 1. Check status on page load
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        if (data.isSleeping) setIsSleeping(true);
      });
  }, []);

  const handleLog = async (type: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // If we clicked SLEEP, toggle the local state based on what the server did
        if (type === 'SLEEP') {
          if (data.status === 'started') setIsSleeping(true);
          if (data.status === 'stopped') setIsSleeping(false);
        }

        router.refresh();
      }
    } catch (error) {
      console.error("Error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid grid-cols-2 gap-4 mb-8">
      
      {/* --- TOGGLE SLEEP BUTTON --- */}
      <button 
        onClick={() => handleLog('SLEEP')} 
        disabled={loading}
        className={`
          p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all active:scale-95
          ${isSleeping 
            ? 'bg-indigo-800 text-blue-100 ring-4 ring-indigo-300' // Style when sleeping (Active)
            : 'bg-blue-600 hover:bg-blue-700 text-white'          // Style when awake (Default)
          }
        `}
      >
        {/* Change Icon based on state */}
        <span className="text-2xl">
          {isSleeping ? '😴' : '👶'} 
        </span>
        <span className="font-semibold">
          {isSleeping ? 'Wake Baby' : 'Start Sleep'}
        </span>
      </button>
      
      {/* Standard Buttons */}
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
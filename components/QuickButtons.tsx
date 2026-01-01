'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function QuickButtons() {
  const router = useRouter();
  
  // States
  const [isSleeping, setIsSleeping] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Weight Modal States
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightValue, setWeightValue] = useState('');

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => { if (data.isSleeping) setIsSleeping(true); });
  }, []);

  // Updated handleLog to accept optional 'payload'
  const handleLog = async (type: string, payload: object = {}) => {
    setLoading(true);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          data: payload // Send the extra data (e.g., weight amount)
        }),
      });

      if (response.ok) {
        const data = await response.json();
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

  const submitWeight = () => {
    if (!weightValue) return; // Don't save empty
    // Save to DB
    handleLog('WEIGHT', { amount: weightValue, unit: 'kg' });
    // Cleanup
    setWeightValue('');
    setShowWeightModal(false);
  };

  return (
    <>
      <section className="grid grid-cols-2 gap-4 mb-8">
        {/* Sleep, Feed, Diaper, Medicine... (Keep your existing buttons) */}
        
        {/* Sleep */}
        <button onClick={() => handleLog('SLEEP')} disabled={loading} className={`p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${isSleeping ? 'bg-indigo-800 text-blue-100 ring-4 ring-indigo-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
          <span className="text-2xl">{isSleeping ? '😴' : '👶'}</span>
          <span className="font-semibold">{isSleeping ? 'Wake Baby' : 'Start Sleep'}</span>
        </button>
        
        {/* Feed */}
        <button onClick={() => handleLog('FEED')} className="bg-pink-600 hover:bg-pink-700 active:scale-95 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all">
          <span className="text-2xl">🍼</span><span className="font-semibold">Feed</span>
        </button>

        {/* Diaper */}
        <button onClick={() => handleLog('DIAPER')} className="bg-yellow-600 hover:bg-yellow-700 active:scale-95 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all">
          <span className="text-2xl">💩</span><span className="font-semibold">Diaper</span>
        </button>

        {/* Medicine */}
        <button onClick={() => handleLog('MEDICINE')} className="bg-green-600 hover:bg-green-700 active:scale-95 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all">
          <span className="text-2xl">💊</span><span className="font-semibold">Medicine</span>
        </button>

        {/* WEIGHT BUTTON - Now opens Modal instead of logging immediately */}
        <button 
          onClick={() => setShowWeightModal(true)}
          className="bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all"
        >
          <span className="text-2xl">⚖️</span>
          <span className="font-semibold">Weight</span>
        </button>

        {/* Note */}
        <button onClick={() => handleLog('NOTE')} className="bg-gray-600 hover:bg-gray-700 active:scale-95 text-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all">
          <span className="text-xl">📝</span><span className="font-semibold">Note</span>
        </button>
      </section>

      {/* --- WEIGHT POPUP MODAL --- */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Record Weight</h3>
            
            <div className="flex gap-2 mb-6">
              <input 
                type="number" 
                step="0.01"
                placeholder="0.0" 
                value={weightValue}
                onChange={(e) => setWeightValue(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg text-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                autoFocus
              />
              <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 px-4 rounded-lg font-semibold dark:text-gray-300">
                kg
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowWeightModal(false)}
                className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={submitWeight}
                className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
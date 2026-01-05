'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// HELPER FUNCTION: Calculate "Awake for X" text
const getAwakeDuration = (lastSleepEnd: string | null): string => {
  if (!lastSleepEnd) return 'Start Sleep';
  
  const endTime = new Date(lastSleepEnd).getTime();
  const now = Date.now();
  const diffMs = now - endTime;
  
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours > 0) {
    return `Awake for ${hours}h ${mins}m`;
  }
  return `Awake for ${mins}m`;
};

// HELPER FUNCTION: Calculate "Sleeping for X" text
const getSleepDuration = (sleepStartTime: string | null): string => {
  if (!sleepStartTime) return 'Wake Baby';
  
  const startTime = new Date(sleepStartTime).getTime();
  const now = Date.now();
  const diffMs = now - startTime;
  
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours > 0) {
    return `Sleeping for ${hours}h ${mins}m`;
  }
  return `Sleeping for ${mins}m`;
};

export default function QuickButtons() {
  const router = useRouter();
  
  // States
  const [isSleeping, setIsSleeping] = useState(false);
  const [medicineGiven, setMedicineGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State for tracking when baby last woke up
  const [lastSleepEnd, setLastSleepEnd] = useState<string | null>(null);
  const [awakeText, setAwakeText] = useState('Start Sleep');

  // State for tracking when current sleep started
  const [sleepStartTime, setSleepStartTime] = useState<string | null>(null);
  const [sleepText, setSleepText] = useState('Wake Baby');

  // Weight Modal States
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightValue, setWeightValue] = useState('');

  // Note Modal States
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');

  // NEW: Feed Modal State
  const [showFeedModal, setShowFeedModal] = useState(false);

  // Fetch Status on Load
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => { 
        if (data.isSleeping) setIsSleeping(true);
        if (data.medicineGiven) setMedicineGiven(true);
        if (data.lastSleepEnd) setLastSleepEnd(data.lastSleepEnd);
        if (data.sleepStartTime) setSleepStartTime(data.sleepStartTime);
      });
  }, []);

  // Update the "Awake for X" text every minute
  useEffect(() => {
    setAwakeText(getAwakeDuration(lastSleepEnd));

    const interval = setInterval(() => {
      setAwakeText(getAwakeDuration(lastSleepEnd));
    }, 60000);

    return () => clearInterval(interval);
  }, [lastSleepEnd]);

  // Update the "Sleeping for X" text every minute
  useEffect(() => {
    setSleepText(getSleepDuration(sleepStartTime));

    const interval = setInterval(() => {
      setSleepText(getSleepDuration(sleepStartTime));
    }, 60000);

    return () => clearInterval(interval);
  }, [sleepStartTime]);

  const handleLog = async (type: string, payload: object = {}, noteContent: string | null = null) => {
    setLoading(true);
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          data: payload,
          note: noteContent
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (type === 'SLEEP') {
          if (data.status === 'started') {
            setIsSleeping(true);
            setSleepStartTime(new Date().toISOString());
          }
          if (data.status === 'stopped') {
            setIsSleeping(false);
            setSleepStartTime(null);
            setLastSleepEnd(new Date().toISOString());
          }
        }
        if (type === 'MEDICINE') {
            setMedicineGiven(true);
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
    if (!weightValue) return; 
    handleLog('WEIGHT', { amount: weightValue, unit: 'kg' });
    setWeightValue('');
    setShowWeightModal(false);
  };

  const submitNote = () => {
    if (!noteText.trim()) return;
    handleLog('NOTE', {}, noteText);
    setNoteText('');
    setShowNoteModal(false);
  };

  // NEW: Submit Feed Function
  const submitFeed = (feedType: string) => {
    handleLog('FEED', { feedType: feedType });
    setShowFeedModal(false);
  };

  return (
    <>
      <section className="grid grid-cols-2 gap-4 mb-8">
        
        {/* Layout of the Sleep button*/}
        <button 
          onClick={() => handleLog('SLEEP')} 
          disabled={loading} 
          className={`
            /* --- 1. BASE STYLES (Always applied) --- */
            p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all active:scale-95
            
            ${isSleeping 
              ? /* --- 2. ACTIVE STATE (Sleeping) --- */
                `bg-indigo-800 text-indigo-100 ring-4 ring-indigo-200 hover:bg-indigo-900 
                dark:bg-indigo-800 dark:text-indigo-100 dark:ring-indigo-500 dark:hover:bg-indigo-900`
              
              : /* --- 3. INACTIVE STATE (Awake) --- */
                `bg-indigo-100 text-indigo-900 hover:bg-indigo-200 
                dark:bg-indigo-900 dark:text-indigo-100 dark:hover:bg-indigo-950`
            }
          `}
        >
          <span className="text-2xl">{isSleeping ? '😴' : '👶'}</span>
          <span className={`font-semibold whitespace-nowrap ${(isSleeping ? sleepText : awakeText).length > 19 ? 'text-sm' : 'text-base'}`}>
            {isSleeping ? sleepText : awakeText}
          </span>
        </button>
        
        {/* layout of the Feed button - NOW OPENS MODAL */}
        <button 
          onClick={() => setShowFeedModal(true)} 
          className={`
            /* --- 1. BASE STYLES --- */
            p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all active:scale-95
            
            /* --- 2. LIGHT MODE STYLES --- */
            bg-cyan-100 text-cyan-900 hover:bg-cyan-200
            
            /* --- 3. DARK MODE STYLES --- */
            dark:bg-cyan-900 dark:text-cyan-100 dark:hover:bg-cyan-950
          `}
        >
          <span className="text-2xl">🍼</span>
          <span className="font-semibold">Feed</span>
        </button>

        {/* Layout of the Diaper button */}
        <button 
          onClick={() => handleLog('DIAPER')} 
          className={`
            /* --- BASE --- */
            p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all active:scale-95
            
            /* --- LIGHT MODE --- */
            bg-orange-200 text-orange-900 hover:bg-orange-300
            
            /* --- DARK MODE --- */
            dark:bg-orange-800 dark:text-orange-100 dark:hover:bg-orange-900
          `}
        >
          <span className="text-2xl">💩</span>
          <span className="font-semibold">Diaper</span>
        </button>

        {/* Layout of the Medicine button */}
        <button 
          onClick={() => handleLog('MEDICINE')} 
          className={`
            /* --- BASE --- */
            p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all active:scale-95
            
            ${medicineGiven 
              ? /* --- STATE: MEDICINE GIVEN (Done/Passive) --- */
                `bg-rose-100 text-rose-900 hover:bg-rose-200 
                dark:bg-rose-900 dark:text-rose-100 dark:hover:bg-rose-950`
              
              : /* --- STATE: GIVE MEDS (Action/Urgent) --- */
                `bg-rose-500 text-white hover:bg-rose-600 ring-4 ring-rose-300`
            }
          `}
        >
          <span className="text-2xl">{medicineGiven ? '👏' : '💊'}</span>
          <span className="font-semibold">{medicineGiven ? 'Meds Given' : 'Give Meds'}</span>
        </button>

        {/* Layout of the Weight button */}
        <button 
          onClick={() => setShowWeightModal(true)}
          className={`
            /* --- BASE --- */
            p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all active:scale-95
            
            /* --- LIGHT MODE --- */
            bg-green-200 text-green-900 hover:bg-green-300
            
            /* --- DARK MODE --- */
            dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-950
          `}
        >
          <span className="text-2xl">⚖️</span>
          <span className="font-semibold">Weight</span>
        </button>

        {/* Layout of the Note button */}
        <button 
          onClick={() => setShowNoteModal(true)} 
          className={`
            /* --- BASE --- */
            p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 transition-all active:scale-95
            
            /* --- LIGHT MODE --- */
            bg-slate-300 text-slate-900 hover:bg-slate-400
            
            /* --- DARK MODE --- */
            dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-800
          `}
        >
          <span className="text-xl">📝</span>
          <span className="font-semibold">Note</span>
        </button>
      </section>

      {/* --- FEED MODAL (NEW) --- */}
      {showFeedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4 dark:text-white">What type of feeding?</h3>
            
            <div className="flex flex-col gap-3 mb-4">
              <button 
                onClick={() => submitFeed('Breastfeeding')}
                className="p-4 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-100 rounded-xl font-semibold hover:bg-pink-200 dark:hover:bg-pink-800 transition-colors flex items-center gap-3"
              >
                <span className="text-2xl">🤱</span>
                Breastfeeding
              </button>
              
              <button 
                onClick={() => submitFeed('Bottle')}
                className="p-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-xl font-semibold hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center gap-3"
              >
                <span className="text-2xl">🍼</span>
                Bottle
              </button>
              
              <button 
                onClick={() => submitFeed('Solid food')}
                className="p-4 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100 rounded-xl font-semibold hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors flex items-center gap-3"
              >
                <span className="text-2xl">🥣</span>
                Solid food
              </button>
            </div>

            <button 
              onClick={() => setShowFeedModal(false)}
              className="w-full py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* --- WEIGHT MODAL --- */}
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
              <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 px-4 rounded-lg font-semibold dark:text-gray-300">kg</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowWeightModal(false)} className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={submitWeight} className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* --- NOTE MODAL --- */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Add Note</h3>
            
            <textarea 
              rows={4}
              placeholder="Type details here..." 
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full p-3 mb-6 border border-gray-300 rounded-lg text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-gray-500 outline-none resize-none"
              autoFocus
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setShowNoteModal(false)}
                className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={submitNote}
                className="flex-1 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700"
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
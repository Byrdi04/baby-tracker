'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type EventRow = {
  id: number;
  type: string;
  startTime: string;
  endTime: string | null;
  data: string;
  note: string | null;
};

// 1. HELPER: Format for Input
const toInputFormat = (dateStr: string) => {
  const date = new Date(dateStr);
  const offset = date.getTimezoneOffset() * 60000;
  return (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
};

// 2. HELPER: Display Time
const formatDisplayTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// 3. HELPER: Duration String
const getDurationString = (start: string, end: string) => {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const getEventStyle = (type: string) => {
  switch (type) {
    case 'SLEEP': 
      return { 
        icon: '😴', 
        bg: 'bg-blue-100 dark:bg-blue-900', 
        text: 'text-slate-900 dark:text-slate-100'
      };
    case 'FEED': 
      return { 
        icon: '🍼', 
        bg: 'bg-cyan-100 dark:bg-cyan-900', 
        text: 'text-slate-900 dark:text-slate-100'
      };
    case 'DIAPER': 
      return { 
        icon: '💩', 
        bg: 'bg-orange-200 dark:bg-orange-800', 
        text: 'text-slate-900 dark:text-slate-100'
      };
    case 'MEDICINE': 
      return { 
        icon: '💊', 
        bg: 'bg-red-100 dark:bg-pink-900', 
        text: 'text-slate-900 dark:text-slate-100'
      };
    case 'WEIGHT': 
      return { 
        icon: '⚖️', 
        bg: 'bg-green-100 dark:bg-green-900', 
        text: 'text-slate-900 dark:text-slate-100'
      };
    default: 
      return { 
        icon: '📝', 
        bg: 'bg-gray-100 dark:bg-gray-700', 
        text: 'text-slate-900 dark:text-slate-100'
      };
  }
};

const getEventTitle = (type: string) => {
  switch (type) {
    case 'MEDICINE': return 'Vitamins given'; // 👈 The change you want
    case 'SLEEP': return 'Sleep';
    case 'FEED': return 'Feeding';
    case 'DIAPER': return 'Diaper Change';
    case 'WEIGHT': return 'Weight Log';
    default: return type.toLowerCase();
  }
};

export default function ActivityList({ initialEvents }: { initialEvents: EventRow[] }) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  
  const [editTime, setEditTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editValue, setEditValue] = useState(''); 
  const [editNote, setEditNote] = useState('');

  // HELPER: Calculate Weight Stats (Updated Return Type)
  const getWeightStats = (currentEvent: EventRow, index: number) => {
    const prevEvent = initialEvents.slice(index + 1).find(e => e.type === 'WEIGHT');
    if (!prevEvent) return null;

    const currentData = JSON.parse(currentEvent.data || '{}');
    const prevData = JSON.parse(prevEvent.data || '{}');
    
    const currentVal = parseFloat(currentData.amount);
    const prevVal = parseFloat(prevData.amount);

    if (isNaN(currentVal) || isNaN(prevVal)) return null;

    // Diff Logic
    const diffKg = currentVal - prevVal;
    
    // Time Logic
    const currTime = new Date(currentEvent.startTime).getTime();
    const prevTime = new Date(prevEvent.startTime).getTime();
    const daysDiff = (currTime - prevTime) / (1000 * 3600 * 24); 

    if (daysDiff < 0.001) return null;

    // Rate Logic
    const diffGrams = diffKg * 1000;
    const gPerDay = Math.round(diffGrams / daysDiff);
    const sign = gPerDay > 0 ? '+' : ''; 

    // Return Object instead of String
    return {
      text: `(${sign}${gPerDay} g/day)`,
      isGain: diffKg >= 0
    };
  };

  const handleRowClick = (event: EventRow) => {
    setSelectedEvent(event);
    setEditTime(toInputFormat(event.startTime));
    setEditEndTime(event.endTime ? toInputFormat(event.endTime) : '');
    const dataObj = JSON.parse(event.data || '{}');
    setEditValue(dataObj.amount || '');
    setEditNote(event.note || ''); // 👈 NEW: Load existing note
  };

  const handleDelete = async () => {
    if (!selectedEvent || !confirm("Delete this?")) return;
    await fetch('/api/events', {
      method: 'DELETE',
      body: JSON.stringify({ id: selectedEvent.id }),
    });
    setSelectedEvent(null);
    router.refresh(); 
  };

  const handleSave = async () => {
    if (!selectedEvent) return;
    const currentData = JSON.parse(selectedEvent.data || '{}');
    if (editValue) currentData.amount = editValue; 

    await fetch('/api/events', {
      method: 'PATCH',
      body: JSON.stringify({
        id: selectedEvent.id,
        startTime: editTime, 
        endTime: editEndTime || null, 
        data: currentData,
        note: editNote || null // 👈 NEW: Send the note
      }),
    });
    setSelectedEvent(null);
    router.refresh();
  };

  return (
    <>
      <div className="space-y-3">
        {initialEvents.length === 0 ? (
          <p className="text-gray-400 text-center italic mt-10">No events logged yet.</p>
        ) : (
                    initialEvents.map((event, index) => {
            const style = getEventStyle(event.type);
            const eventData = JSON.parse(event.data || '{}');
            
            let subText = ""; 
            let weightStat: { text: string; isGain: boolean } | null = null;
            
            // 👇 NEW: Variable to hold the note preview
            let notePreview = null;

            // 1. WEIGHT LOGIC
            if (event.type === 'WEIGHT' && eventData.amount) {
               subText = `${eventData.amount} kg`;
               weightStat = getWeightStats(event, index);
            }

            // 2. FEED LOGIC
            if (event.type === 'FEED' && eventData.feedType) {
               subText = eventData.feedType;
            }
            
            // 3. SLEEP LOGIC
            let timeDisplay = formatDisplayTime(event.startTime);
            if (event.type === 'SLEEP') {
                if (event.endTime) {
                    timeDisplay = `${formatDisplayTime(event.startTime)} - ${formatDisplayTime(event.endTime)}`;
                    subText = getDurationString(event.startTime, event.endTime); 
                } else {
                    timeDisplay = `💤 Sleeping since ${formatDisplayTime(event.startTime)}`;
                }
            }

            // 4. NOTE DISPLAY LOGIC (The new part)
            // Show note only for: DIAPER, MEDICINE, or custom NOTE entries
            if (event.note && (event.type === 'DIAPER' || event.type === 'MEDICINE' || event.type === 'NOTE')) {
              notePreview = event.note;
            }

            return (
                <div 
                  key={event.id} 
                  onClick={() => handleRowClick(event)} 
                  className="
                    bg-sky-50 dark:bg-sky-950 
                    p-4 rounded-lg 
                    flex justify-between items-center 
                    cursor-pointer 
                    hover:bg-gray-50 dark:hover:bg-gray-900 
                    transition-colors
                  "
                >
                <div className="flex items-center gap-3 overflow-hidden"> {/* Added overflow-hidden for truncation */}
                  <span className={`${style.bg} p-2 rounded-full text-lg flex-shrink-0`}>{style.icon}</span>
                  
                  <div className="min-w-0"> {/* min-w-0 needed for flex child truncation */}
                    <p className={`capitalize ${style.text} font-medium`}>
                      {getEventTitle(event.type)}
                    </p>
                    
                    {/* Standard Subtext (Weight/Sleep Duration) */}
                    {(subText || weightStat) && (
                      <p className="text-xs text-gray-500 truncate">
                        {subText}
                        {weightStat && (
                          <span className={`ml-1 ${
                            weightStat.isGain 
                              ? 'text-green-700 dark:text-green-400' 
                              : 'text-red-700 dark:text-red-400'
                          }`}>
                            {weightStat.text}
                          </span>
                        )}
                      </p>
                    )}

                    {/* 👇 NEW: Note Preview */}
                    {notePreview && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate pr-2">
                        {notePreview}
                      </p>
                    )}

                  </div>
                </div>
                
                {/* Time Display (Right Side) */}
                <span className="text-sm text-gray-400 whitespace-nowrap flex-shrink-0 ml-2">
                  {timeDisplay}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL (Unchanged) */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Edit {selectedEvent.type.toLowerCase()}</h3>
            
            <label className="block text-sm text-gray-500 mb-1">Time</label>
            <input type="datetime-local" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-full p-3 mb-4 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />

            {selectedEvent.type === 'SLEEP' && (
              <>
                <label className="block text-sm text-gray-500 mb-1">End Time</label>
                <input type="datetime-local" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="w-full p-3 mb-4 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </>
            )}

            {(selectedEvent.type === 'WEIGHT' || editValue !== '') && (
              <>
                <label className="block text-sm text-gray-500 mb-1">Value (kg/ml)</label>
                <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full p-3 mb-6 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </>
            )}

            {/* 👇 NEW: Note Field (Always visible) */}
            <label className="block text-sm text-gray-500 mb-1">Note (Optional)</label>
            <textarea 
              value={editNote} 
              onChange={(e) => setEditNote(e.target.value)} 
              placeholder="Add a note..."
              rows={3}
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
            />

            <div className="flex gap-3 mt-4">
              <button onClick={handleDelete} className="px-4 py-3 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200">Delete</button>
              <div className="flex-1 flex gap-2">
                <button onClick={() => setSelectedEvent(null)} className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
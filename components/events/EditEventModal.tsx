'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  event: any;
  isOpen: boolean;
  onClose: () => void;
};

// Helper: Get local YYYY-MM-DD from an ISO string
const getLocalDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const offset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offset);
  return local.toISOString().split('T')[0];
};

// Helper: Get local HH:MM from an ISO string
const getLocalTime = (dateStr: string) => {
  const date = new Date(dateStr);
  // We use string manipulation for time to ensure 24h format padding
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export default function EditEventModal({ event, isOpen, onClose }: Props) {
  const router = useRouter();
  
  // Split Start Time State
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');

  // Split End Time State
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const [editValue, setEditValue] = useState(''); 
  const [editNote, setEditNote] = useState('');

  // 1. Initialize State Logic
  useEffect(() => {
    if (event && isOpen) {
      // Set Start
      setStartDate(getLocalDate(event.startTime));
      setStartTime(getLocalTime(event.startTime));

      // Set End (if exists)
      if (event.endTime) {
        setEndDate(getLocalDate(event.endTime));
        setEndTime(getLocalTime(event.endTime));
      } else {
        setEndDate('');
        setEndTime('');
      }

      setEditNote(event.note || '');

      const dataObj = JSON.parse(event.data || '{}');
      if (event.type === 'WEIGHT' && dataObj.amount) {
        setEditValue((parseFloat(dataObj.amount) * 1000).toString());
      } else {
        setEditValue(dataObj.amount || '');
      }
    }
  }, [event, isOpen]);

  // 2. Action Handlers
  const handleDelete = async () => {
    if (!confirm("Delete this?")) return;
    await fetch('/api/events', { method: 'DELETE', body: JSON.stringify({ id: event.id }) });
    router.refresh(); 
    onClose();
  };

  const handleSave = async () => {
    const currentData = JSON.parse(event.data || '{}');
    
    if (editValue) {
      if (event.type === 'WEIGHT') {
        currentData.amount = (parseFloat(editValue) / 1000).toString(); 
      } else {
        currentData.amount = editValue;
      }
    }

    // Recombine Date and Time strings into ISO-like string
    // Format: YYYY-MM-DD + T + HH:MM
    const finalStart = `${startDate}T${startTime}`;
    let finalEnd = null;
    
    if (event.type === 'SLEEP' && endDate && endTime) {
      finalEnd = `${endDate}T${endTime}`;
    }

    await fetch('/api/events', {
      method: 'PATCH',
      body: JSON.stringify({
        id: event.id,
        startTime: finalStart, 
        endTime: finalEnd, 
        data: currentData,
        note: editNote || null 
      }),
    });
    router.refresh();
    onClose();
  };

  // 3. Early Return
  if (!isOpen || !event) {
    return null;
  }

  // 4. Render
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4 dark:text-white">Edit {event.type.toLowerCase()}</h3>
        
        {/* START TIME - Split Inputs */}
        <label className="block text-sm text-gray-500 mb-1">Start Time</label>
        <div className="flex gap-2 mb-4">
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="flex-1 p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          />
          <input 
            type="time" 
            value={startTime} 
            onChange={(e) => setStartTime(e.target.value)} 
            className="w-32 p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          />
        </div>

        {/* SLEEP END TIME - Split Inputs */}
        {event.type === 'SLEEP' && (
          <>
            <label className="block text-sm text-gray-500 mb-1">End Time</label>
            <div className="flex gap-2 mb-4">
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                className="flex-1 p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              />
              <input 
                type="time" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
                className="w-32 p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              />
            </div>
          </>
        )}

        {/* VALUE (Weight/Feed) */}
        {(event.type === 'WEIGHT' || editValue !== '') && (
          <>
            <label className="block text-sm text-gray-500 mb-1">
               {event.type === 'WEIGHT' ? 'Weight (grams)' : 'Amount (ml)'}
            </label>
            <input type="number" step="1" inputMode="numeric" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full p-3 mb-4 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </>
        )}

        {/* NOTE */}
        <label className="block text-sm text-gray-500 mb-1">Note</label>
        <textarea rows={3} value={editNote} onChange={(e) => setEditNote(e.target.value)} className="w-full p-3 mb-4 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none" />

        {/* BUTTONS */}
        <div className="flex gap-3 mt-4">
          <button onClick={handleDelete} className="px-4 py-3 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200">Delete</button>
          <div className="flex-1 flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
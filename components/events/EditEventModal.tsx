'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  event: any;
  isOpen: boolean;
  onClose: () => void;
};

const toInputFormat = (dateStr: string) => {
  const date = new Date(dateStr);
  const offset = date.getTimezoneOffset() * 60000;
  return (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
};

export default function EditEventModal({ event, isOpen, onClose }: Props) {
  const router = useRouter();
  
  const [editTime, setEditTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editValue, setEditValue] = useState(''); 
  const [editNote, setEditNote] = useState('');

  // 1. Initialize State Logic
  useEffect(() => {
    if (event && isOpen) {
      console.log("MODAL OPENING FOR:", event.type); // 👈 Debug Log

      setEditTime(toInputFormat(event.startTime));
      setEditEndTime(event.endTime ? toInputFormat(event.endTime) : '');
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

    await fetch('/api/events', {
      method: 'PATCH',
      body: JSON.stringify({
        id: event.id,
        startTime: editTime, 
        endTime: editEndTime || null, 
        data: currentData,
        note: editNote || null 
      }),
    });
    router.refresh();
    onClose();
  };

  // 3. Early Return (Must be OUTSIDE useEffect)
  if (!isOpen || !event) {
    return null;
  }

  // 4. Render (Must be OUTSIDE useEffect)
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-sm">
        <h3 className="text-lg font-bold mb-4 dark:text-white">Edit {event.type.toLowerCase()}</h3>
        
        {/* TIME */}
        <label className="block text-sm text-gray-500 mb-1">Time</label>
        <input type="datetime-local" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-full p-3 mb-4 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />

        {/* SLEEP END TIME */}
        {event.type === 'SLEEP' && (
          <>
            <label className="block text-sm text-gray-500 mb-1">End Time</label>
            <input type="datetime-local" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="w-full p-3 mb-4 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </>
        )}

        {/* VALUE (Weight/Feed) */}
        {(event.type === 'WEIGHT' || editValue !== '') && (
          <>
            <label className="block text-sm text-gray-500 mb-1">
               {event.type === 'WEIGHT' ? 'Weight (grams)' : 'Amount (ml)'}
            </label>
            <input type="number" step="1" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full p-3 mb-4 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
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
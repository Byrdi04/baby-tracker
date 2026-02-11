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
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/** ---- PORTION TAG HELPERS (for FEED events) ---- **/

const PORTION_SMALL_LABEL = 'Small portion/Snack';
const PORTION_BIG_LABEL = 'Big portion';

// Remove our canonical portion tags from a note
const stripPortionTags = (text: string) => {
  return text
    .replace(new RegExp(PORTION_SMALL_LABEL, 'gi'), '')
    .replace(new RegExp(PORTION_BIG_LABEL, 'gi'), '')
    .replace(/\s+-\s+/g, ' ') // clean " - "
    .trim();
};

// Decide if the initial note already contains one of our tags
const detectInitialPortion = (noteText: string): 'SMALL' | 'BIG' | null => {
  const n = noteText.toLowerCase();
  if (n.includes(PORTION_SMALL_LABEL.toLowerCase())) return 'SMALL';
  if (n.includes(PORTION_BIG_LABEL.toLowerCase())) return 'BIG';
  return null;
};

// Given a base note and a desired portion, return a new note string
const applyPortionToNote = (
  baseNote: string,
  portion: 'SMALL' | 'BIG' | null
): string => {
  // Remove any existing portion tags from the note
  let clean = stripPortionTags(baseNote).trimEnd();

  if (!portion) {
    return clean; // no tag
  }

  const tag = portion === 'SMALL' ? PORTION_SMALL_LABEL : PORTION_BIG_LABEL;

  // If there is no other text, just return the tag
  if (!clean) return `\n\n${tag}`;

  // Otherwise: <existing text>\n\n<tag>
  return `${clean}\n\n${tag}`;
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

  // NEW: portion state for FEED events
  const [portion, setPortion] = useState<'SMALL' | 'BIG' | null>(null);

  const isFeed = event?.type === 'FEED';

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

      const note = event.note || '';
      setEditNote(note);

      // Detect if note already contains one of our portion tags
      if (event.type === 'FEED') {
        setPortion(detectInitialPortion(note));
      } else {
        setPortion(null);
      }

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
    if (!confirm('Delete this?')) return;
    await fetch('/api/events', {
      method: 'DELETE',
      body: JSON.stringify({ id: event.id }),
    });
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

    // If it's a FEED event, ensure the note has the correct portion tag applied
    const finalNote =
      event.type === 'FEED'
        ? applyPortionToNote(editNote, portion)
        : editNote;

    // Recombine Date and Time strings into ISO-like string
    const finalStart = `${startDate}T${startTime}`;
    let finalEnd: string | null = null;

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
        note: finalNote || null,
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
        <h3 className="text-lg font-bold mb-4 dark:text-white">
          Edit {event.type.toLowerCase()}
        </h3>

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
            <input
              type="number"
              step="1"
              inputMode="numeric"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </>
        )}

        {/* NOTE + PORTION TAGS FOR FEED */}
        <label className="block text-sm text-gray-500 mb-1">Note</label>

        {isFeed && (
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => {
                setPortion((prev) => {
                  const next = prev === 'SMALL' ? null : 'SMALL';
                  setEditNote((current) => applyPortionToNote(current, next));
                  return next;
                });
              }}
              className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors
                ${
                  portion === 'SMALL'
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-100'
                    : 'bg-transparent border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'
                }
              `}
            >
              Small portion/Snack
            </button>

            <button
              type="button"
              onClick={() => {
                setPortion((prev) => {
                  const next = prev === 'BIG' ? null : 'BIG';
                  setEditNote((current) => applyPortionToNote(current, next));
                  return next;
                });
              }}
              className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors
                ${
                  portion === 'BIG'
                    ? 'bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-800 dark:text-amber-100'
                    : 'bg-transparent border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'
                }
              `}
            >
              Big portion
            </button>
          </div>
        )}

        <textarea
          rows={3}
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
          className="w-full p-3 mb-4 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
        />

        {/* BUTTONS */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDelete}
            className="px-4 py-3 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200"
          >
            Delete
          </button>
          <div className="flex-1 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
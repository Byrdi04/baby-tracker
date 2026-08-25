'use client';

import EventItemShell from './EventItemShell';

// Helper to format time (e.g., 14:30)
const formatTime = (dateStr: string) => 
  new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

// 👇 NEW: Helper to format date (e.g. "15 Jan") for older entries
const formatDate = (dateStr: string) => 
  new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// Helper for duration
const getDuration = (start: string, end: string | null) => {
  const endTime = end ? new Date(end).getTime() : Date.now();
  const diff = endTime - new Date(start).getTime();
  const totalMins = Math.floor(diff / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export default function SleepItem({ event, onClick }: { event: any, onClick: () => void }) {
  const isOngoing = !event.endTime;
  const startTime = formatTime(event.startTime);
  const duration = getDuration(event.startTime, event.endTime);

  // 👇 Detect manually overridden sleep type from the note (NAP / NIGHT tags)
  const note = event.note || '';
  const upperNote = note.toUpperCase();
  const hasNight = new RegExp('(?:^|\\n\\n)NIGHT$', 'm').test(upperNote);
  const hasNap = new RegExp('(?:^|\\n\\n)NAP$', 'm').test(upperNote);
  let sleepTypeLabel: string | null = null;
  if (hasNight && !hasNap) sleepTypeLabel = 'Night';
  else if (hasNap && !hasNight) sleepTypeLabel = 'Nap';

  const titleWithBadge = sleepTypeLabel ? (
    <span className="flex items-center gap-1.5">
      <span>Sleep</span>
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border
        ${sleepTypeLabel === 'Night'
          ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-100'
          : 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-800 dark:text-amber-100'}`}
      >
        {sleepTypeLabel}
      </span>
    </span>
  ) : 'Sleep';

  // 👇 NEW: "Days Ago" Logic
  const daysAgo = Math.floor((Date.now() - new Date(event.startTime).getTime()) / (1000 * 60 * 60 * 24));
  
  let dateLabel = '';
  if (daysAgo === 0) {
    dateLabel = 'Today';
  } else if (daysAgo === 1) {
    dateLabel = 'Yesterday';
  } else if (daysAgo <= 7) {
    dateLabel = `${daysAgo} days ago`;
  } else {
    dateLabel = formatDate(event.startTime);
  }

  if (isOngoing) {
    return (
      <EventItemShell
        onClick={onClick}
        colorTheme="blue"
        icon="😴"
        title={titleWithBadge}
        subText={dateLabel} // 👈 Added here
        rightTop={`💤 Sleeping since ${startTime}`}
        rightBottom={null}
      />
    );
  }

  // Ended Sleep
  const endTime = formatTime(event.endTime);
  return (
    <EventItemShell
      onClick={onClick}
      colorTheme="blue"
      icon="😴"
      title={titleWithBadge}
      subText={dateLabel} // 👈 Added here
      rightTop={duration}
      rightBottom={`${startTime} - ${endTime}`}
    />
  );
}
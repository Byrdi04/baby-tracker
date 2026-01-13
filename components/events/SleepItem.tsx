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
        title="Sleep"
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
      title="Sleep"
      subText={dateLabel} // 👈 Added here
      rightTop={duration}
      rightBottom={`${startTime} - ${endTime}`}
    />
  );
}
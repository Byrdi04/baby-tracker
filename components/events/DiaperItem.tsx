'use client';

import EventItemShell from './EventItemShell';

const formatDate = (dateStr: string) => 
  new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const formatTime = (dateStr: string) => 
  new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });



export default function DiaperItem({ event, onClick }: { event: any, onClick: () => void }) {
  const notePreview = event.note ? event.note : null;
  const dateTime = `${formatDate(event.startTime)} ${formatTime(event.startTime)}`;

  const daysAgo = Math.floor((Date.now() - new Date(event.startTime).getTime()) / (1000 * 60 * 60 * 24));
  const duration = daysAgo === 0 ? 'Today' : `${daysAgo} days ago`;

  return (
    <EventItemShell
      onClick={onClick}
      colorTheme="orange"
      icon="💩"
      title="Diaper"
      subText={notePreview}
      rightTop={duration}
      rightBottom={null}
    />
  );
}
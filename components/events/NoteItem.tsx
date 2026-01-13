'use client';

import EventItemShell from './EventItemShell';

const formatTime = (dateStr: string) => 
  new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export default function NoteItem({ event, onClick }: { event: any, onClick: () => void }) {
  // The main content of a Note event IS the note itself
  const content = event.note || 'No content';
  const time = formatTime(event.startTime);

  return (
    <EventItemShell
      onClick={onClick}
      colorTheme="slate" // 👈 Matches the button color
      icon="📝"
      title="Note"
      subText={content} // Show the note content
      rightTop={time}
      rightBottom={null}
    />
  );
}
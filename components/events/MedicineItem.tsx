'use client';

import EventItemShell from './EventItemShell';

const formatTime = (dateStr: string) => 
  new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export default function MedicineItem({ event, onClick }: { event: any, onClick: () => void }) {
  // Use the note as subtext if available
  const subText = event.note || null;
  const time = formatTime(event.startTime);

  return (
    <EventItemShell
      onClick={onClick}
      colorTheme="rose" // 👈 Matches the button color
      icon="💊"
      title="Vitamins given"  // 👈 Custom Heading
      subText={subText}
      rightTop={time}
      rightBottom={null}
    />
  );
}
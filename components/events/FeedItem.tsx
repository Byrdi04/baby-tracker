'use client';

import EventItemShell from './EventItemShell';

const formatTime = (dateStr: string) => 
  new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

// 1. Helper to pick the emoji
const getFeedEmoji = (type: string) => {
  switch (type) {
    case 'Breastfeeding': return '🤱';
    case 'Bottle': return '🍼';
    case 'Solid food': return '🥣';
    default: return ''; 
  }
};

// 👇 NEW: Helper to format date (e.g. "15 Jan") for older entries
const formatDate = (dateStr: string) => 
  new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export default function FeedItem({ event, onClick }: { event: any, onClick: () => void }) {
  const data = JSON.parse(event.data || '{}');
  const type = data.feedType || 'Feed';

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
  
  // 2. Combine the emoji and the text
  const typeWithEmoji = `${getFeedEmoji(type)} ${type}`;
  
  return (
    <EventItemShell
      onClick={onClick}
      colorTheme="cyan"
      icon={getFeedEmoji(type)}
      title={type}
      subText={dateLabel}
      rightTop={formatTime(event.startTime)}
      rightBottom={null}
    />
  );
}
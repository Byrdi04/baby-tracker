'use client';

import { useState } from 'react';
import SleepItem from './SleepItem';
import FeedItem from './FeedItem';
import DiaperItem from './DiaperItem';
import WeightItem from './WeightItem';
import MedicineItem from './MedicineItem';
import NoteItem from './NoteItem';
import EditEventModal from './EditEventModal';

// Define a basic fallback item for unknown types
import EventItemShell from './EventItemShell';
const DefaultItem = ({ event, onClick }: any) => (
  <EventItemShell 
    icon="📝" colorTheme="blue" title={event.type} 
    subText={event.note} rightTop={null} rightBottom={null} onClick={onClick} 
  />
);

export default function EventList({ events }: { events: any[] }) {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  if (events.length === 0) {
    return <p className="text-gray-400 text-center italic mt-10">No entries found.</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((event, index) => {
        // 1. DEFINE THE CLICK HANDLER
        const commonProps = { 
          event, 
          onClick: () => {
            console.log("Item clicked:", event.id); // 👈 Debugging log
            setSelectedEvent(event); 
          } 
        };

        switch (event.type) {
          case 'SLEEP':
            return <SleepItem key={event.id} {...commonProps} />;
          case 'FEED':
            return <FeedItem key={event.id} {...commonProps} />;
          case 'DIAPER':
            return <DiaperItem key={event.id} {...commonProps} />;
          case 'WEIGHT':
            const prevWeight = events.slice(index + 1).find(e => e.type === 'WEIGHT');
            return <WeightItem key={event.id} {...commonProps} prevEvent={prevWeight} />;
          case 'MEDICINE':
            return <MedicineItem key={event.id} {...commonProps} />;
          case 'NOTE':
            return <NoteItem key={event.id} {...commonProps} />;
            
          default:
            return <DefaultItem key={event.id} {...commonProps} />;
        }
      })}
      {selectedEvent && (
        <EditEventModal 
          event={selectedEvent} 
          isOpen={!!selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
}
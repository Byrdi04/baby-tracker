// types/events.ts

export type EventType = 'FEED' | 'SLEEP' | 'DIAPER' | 'NOTE';

// Define the shape of the JSON data for each event type
export interface DiaperData {
  status: 'wet' | 'dirty' | 'mixed';
}

export interface FeedData {
  method: 'bottle' | 'breast';
  amount?: number; // in ml or oz
  side?: 'left' | 'right' | 'both'; // if breast
}

export interface SleepData {
  initiator?: 'rocking' | 'feed' | 'independent';
}

// A Union type for strong typing in components
export type EventData = DiaperData | FeedData | SleepData | {};
// app/actions.ts
'use server'

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { processSleepStats, generateTimelineData } from '@/lib/sleep-logic';
import { generateFeedTimeline } from '@/lib/feed-logic';

const DAYS_PER_PAGE = 14;

export async function logEvent(type: string) {
  const stmt = db.prepare(`
    INSERT INTO events (type, startTime, data)
    VALUES (?, ?, ?)
  `);

  // Run the SQL
  stmt.run(
    type, 
    new Date().toISOString(), 
    JSON.stringify({}) // We manually stringify the JSON
  );

  revalidatePath('/');
}

export async function fetchHistoryChunk(type: 'SLEEP' | 'FEED', page: number) {
  // 1. Calculate the time window
  // Page 0 = Today. Page 1 = 14 days ago.
  const today = new Date();
  
  // Calculate the "End Date" for this chunk (moving backwards)
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - (page * DAYS_PER_PAGE));
  
  // Calculate the "Start Date" for this chunk
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - DAYS_PER_PAGE);

  // 2. Fetch Events from DB with a small buffer (to handle night stitching correctly)
  // We fetch 1 extra day on each side to ensure overlap logic works
  const queryStart = new Date(startDate);
  queryStart.setDate(queryStart.getDate() - 1);
  const queryEnd = new Date(endDate);
  queryEnd.setDate(queryEnd.getDate() + 1);

  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE type = ? AND startTime >= ? AND startTime <= ?
    ORDER BY startTime DESC
  `);

  const events = stmt.all(type, queryStart.toISOString(), queryEnd.toISOString()) as any[];

  // 3. Process Data
  if (type === 'SLEEP') {
    // Run the robust sleep logic to find nights
    const { nightEventIds } = processSleepStats(events);
    // Generate just the timeline rows for this specific chunk
    return generateTimelineData(events, nightEventIds, endDate, DAYS_PER_PAGE);
  } else {
    return generateFeedTimeline(events, endDate, DAYS_PER_PAGE);
  }
}
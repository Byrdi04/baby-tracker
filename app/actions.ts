// app/actions.ts
'use server'

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

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
  const today = new Date();
  
  // Calculate window
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - (page * DAYS_PER_PAGE));
  
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - DAYS_PER_PAGE);

  // Fetch with buffer
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

  // 👇 RETURN RAW DATA (plus metadata to help client processing)
  return {
    events,
    startDate: startDate.toISOString(), // Client needs to know where to start generating
    days: DAYS_PER_PAGE
  };
}
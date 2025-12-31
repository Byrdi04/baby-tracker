// app/actions.ts
'use server'

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

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
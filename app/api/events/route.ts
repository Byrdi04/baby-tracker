// app/api/events/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

// 1. POST: Handles the Click
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, note } = body;

    if (!type) return new NextResponse("Missing type", { status: 400 });

    // --- SLEEP TOGGLE LOGIC ---
    if (type === 'SLEEP') {
      // Check if there is an unfinished sleep session (endTime is NULL)
      const activeSleep = db.prepare(`
        SELECT id FROM events 
        WHERE type = 'SLEEP' AND endTime IS NULL 
        LIMIT 1
      `).get() as { id: number } | undefined;

      if (activeSleep) {
        // A. STOP SLEEPING (Update the existing row)
        db.prepare(`
          UPDATE events 
          SET endTime = ? 
          WHERE id = ?
        `).run(new Date().toISOString(), activeSleep.id);
        
        console.log(`Stopped sleep session ID: ${activeSleep.id}`);
        return NextResponse.json({ status: 'stopped', id: activeSleep.id });
      } else {
        // B. START SLEEPING (Insert a new row)
        const info = db.prepare(`
          INSERT INTO events (type, startTime, data)
          VALUES (?, ?, ?)
        `).run('SLEEP', new Date().toISOString(), JSON.stringify({}));

        console.log(`Started sleep session ID: ${info.lastInsertRowid}`);
        return NextResponse.json({ status: 'started', id: info.lastInsertRowid });
      }
    }

    // --- STANDARD LOGIC (Feed, Diaper, Note) ---
    const insertStmt = db.prepare(`
      INSERT INTO events (type, startTime, note, data)
      VALUES (?, ?, ?, ?)
    `);

    const info = insertStmt.run(
      type,
      new Date().toISOString(),
      note || null,
      JSON.stringify({})
    );

    return NextResponse.json({ message: "Logged", id: info.lastInsertRowid });

  } catch (error) {
    console.error("API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// 2. GET: Tells the button the current status on Page Load
export async function GET() {
  // Look for any open sleep session
  const activeSleep = db.prepare(`
    SELECT id FROM events 
    WHERE type = 'SLEEP' AND endTime IS NULL 
    LIMIT 1
  `).get();

  // Return true if found, false if not
  return NextResponse.json({ isSleeping: !!activeSleep });
}
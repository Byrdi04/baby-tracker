import { NextResponse } from 'next/server';
import db from '@/lib/db'; // Import the shared connection

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("API received body:", body);

    // 1. Extract data
    const { type, note } = body;

    // 2. Validation
    if (!type) {
      return new NextResponse("Missing event type", { status: 400 });
    }

    // 3. Prepare SQL
    const insertStmt = db.prepare(`
      INSERT INTO events (type, startTime, note, data)
      VALUES (?, ?, ?, ?)
    `);

    // 4. Execute
    const info = insertStmt.run(
      type,
      new Date().toISOString(),
      note || null,
      JSON.stringify({}) // Default empty JSON for now
    );

    console.log(`Event saved. ID: ${info.lastInsertRowid}`);

    return NextResponse.json({ 
      message: "Event logged!", 
      id: info.lastInsertRowid 
    });

  } catch (error) {
    console.error("API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
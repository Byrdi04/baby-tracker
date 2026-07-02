// app/api/export/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // 1. Fetch all events from the database
    const stmt = db.prepare(`
      SELECT type, startTime, endTime, note, data, createdAt 
      FROM events 
      ORDER BY startTime ASC
    `);
    const rows = stmt.all() as any[];

    // 2. Define headers (We include 'value' as an empty column to perfectly match your import template structure)
    const headers = ['type', 'startTime', 'endTime', 'value', 'note', 'data', 'createdAt'];

    // 3. Helper function to properly escape CSV fields
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      // If the string contains a comma, quote, or newline, wrap it in quotes and double-escape internal quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // 4. Build the CSV content
    let csvContent = headers.join(',') + '\r\n';

    rows.forEach(row => {
      const csvRow = [
        row.type,
        row.startTime,
        row.endTime,
        '', // We leave 'value' empty because the precise data is stored in the 'data' JSON column!
        row.note,
        row.data,
        row.createdAt
      ].map(escapeCsv).join(',');

      csvContent += csvRow + '\r\n';
    });

    // 5. Return as a downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="baby_tracker_backup.csv"',
      },
    });

  } catch (error) {
    console.error("Export API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
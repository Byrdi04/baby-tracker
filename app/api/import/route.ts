// In app/api/import/route.ts

import { NextResponse } from 'next/server';
import { parse } from 'csv-parse';
import db from '@/lib/db';
import { Readable } from 'stream';
import { revalidatePath } from 'next/cache';

// --- Date Parsing Helper (No changes needed) ---
function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Try YYYY-MM-DD or YYYY/MM/DD
  let match = dateStr.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));
  }
  // Try DD-MM-YY or DD/MM/YY (assuming 20xx)
  match = dateStr.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2})$/);
  if (match) {
    const [, day, month, year] = match;
    return new Date(Date.UTC(Number(`20${year}`), Number(month) - 1, Number(day), 12, 0, 0));
  }
  // Fallback to JS parser for full ISO strings etc.
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) ? date : null;
}

// --- Data Transformation Function (CORRECTED LOGIC) ---
function transformRow(row: any): object | null {
  const type = row.type?.toUpperCase();
  if (!type) return null;

  // Initialize data as an empty object
  let dataObject: { [key: string]: any } = {};

  // 1. If a 'data' column with valid JSON exists, use it first.
  if (row.data) {
    try {
      dataObject = JSON.parse(row.data);
    } catch {
      console.warn("⚠️ Invalid JSON in 'data' column, ignoring. Row:", row);
    }
  }

  // 2. Apply type-specific transformations from the 'value' column.
  //    This will intelligently add to or create the 'dataObject'.
  const value = parseFloat(row.value);
  if (!isNaN(value)) {
    switch (type) {
      case 'WEIGHT':
        dataObject.amount = (value / 1000).toFixed(2); // grams to kg
        dataObject.unit = 'kg';
        break;
      case 'FEED':
        dataObject.amount = String(value); // e.g., 150
        dataObject.unit = 'ml';
        break;
      // Add other types here if they use the 'value' column
    }
  }

  // 3. Construct the final record for the database
  const record = {
    type,
    startTime: row.startTime ? parseFlexibleDate(row.startTime)?.toISOString() : null,
    endTime: row.endTime ? parseFlexibleDate(row.endTime)?.toISOString() : null,
    note: row.note || null,
    data: JSON.stringify(dataObject), // Stringify the final, transformed object
    createdAt: row.createdAt ? parseFlexibleDate(row.createdAt)?.toISOString() : new Date().toISOString(),
  };

  // Final validation
  if (!record.startTime) {
    console.warn('⚠️ Skipping row (missing startTime):', row);
    return null;
  }

  return record;
}

// --- MAIN API ENDPOINT (No changes needed from here down) ---
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return new NextResponse("No file uploaded", { status: 400 });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const readableStream = Readable.from(fileBuffer);

    const parser = readableStream.pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }));

    const insertStmt = db.prepare(`
      INSERT INTO events (type, startTime, endTime, note, data, createdAt) 
      VALUES (@type, @startTime, @endTime, @note, @data, @createdAt)
    `);

    const runTransaction = db.transaction((rows: any[]) => {
      let importedCount = 0;
      for (const row of rows) {
        const transformedRecord = transformRow(row);
        
        if (transformedRecord) {
          insertStmt.run(transformedRecord);
          importedCount++;
        } else {
          console.warn('⚠️ Skipping row after transformation:', row);
        }
      }
      return importedCount;
    });

    const allRows: any[] = [];
    for await (const row of parser) {
      allRows.push(row);
    }
    
    const finalCount = runTransaction(allRows);

    return NextResponse.json({ 
      message: `Successfully imported ${finalCount} of ${allRows.length} records.`,
      importedCount: finalCount,
    });

  } catch (error) {
    console.error("API Import Error:", error);
    return new NextResponse("Internal Server Error during import", { status: 500 });
  }
}
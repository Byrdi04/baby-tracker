// importer.ts

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
// --- THIS IS THE FIX ---
import db from './lib/db'; 
// ----------------------

// --- CONFIGURATION ---
const CSV_FILE_PATH = path.join(process.cwd(), 'import.csv');

// --- MAIN SCRIPT LOGIC ---
async function importWeightData() {
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ Error: Import file not found at ${CSV_FILE_PATH}`);
    // Close the DB connection on error to allow the script to exit cleanly
    db.close(); 
    return;
  }

  console.log(`📖 Reading ${CSV_FILE_PATH}...`);

  const insertStmt = db.prepare(`
    INSERT INTO events (type, startTime, data) 
    VALUES ('WEIGHT', @startTime, @data)
  `);

  const parser = fs
    .createReadStream(CSV_FILE_PATH)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }));

  const runTransaction = db.transaction((rows: any[]) => {
    let importedCount = 0;
    for (const row of rows) {
      try {
        const dateStr = row.Date;
        const weightGrams = parseFloat(row.Weight_grams);

        if (!dateStr || isNaN(weightGrams)) {
          console.warn('⚠️ Skipping invalid row (missing date or weight):', row);
          continue;
        }

        const [day, month, year] = dateStr.split('/');
        const dateObj = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));
        const isoDate = dateObj.toISOString();
        
        const weightKg = (weightGrams / 1000).toFixed(2);
        const dataJson = JSON.stringify({ amount: weightKg, unit: 'kg' });
        
        insertStmt.run({
          startTime: isoDate,
          data: dataJson,
        });

        console.log(`   ✓ ${dateStr} → ${weightKg} kg`);
        importedCount++;

      } catch (e: any) {
        console.error(`   ✗ Row failed: ${e.message}`, row);
      }
    }
    return importedCount;
  });

  const allRows: any[] = [];
  try {
    for await (const row of parser) {
      allRows.push(row);
    }
    
    console.log(`   Found ${allRows.length} rows`);
    const finalCount = runTransaction(allRows);
    
    console.log(`\n✅ Done! Imported ${finalCount} weight entries.`);

  } catch (error) {
    console.error('❌ An error occurred during the CSV parsing process:', error);
  } finally {
    db.close();
    console.log('🚪 Database connection closed.');
  }
}

importWeightData();
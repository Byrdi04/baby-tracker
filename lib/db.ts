import DatabaseConstructor from 'better-sqlite3';
import path from 'path';
import fs from 'fs'; // 👈 NEW: Need to import 'fs'

// 1. Define path to the data directory and database file
const dataDir = path.join(process.cwd(), 'data'); // Path will be /app/data
const dbPath = path.join(dataDir, 'baby-tracker.db'); // Full path to DB file

// 2. Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true }); // Creates 'data/' if missing
}

// 3. Initialize Database
const db = new DatabaseConstructor(dbPath, { 
  verbose: console.log 
});

db.pragma('journal_mode = WAL');

console.log(`📂 Database active at: ${dbPath}`);

// 4. Ensure Table Exists (NO CHANGES NEEDED HERE)
db.prepare(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT,
    note TEXT,
    data TEXT DEFAULT '{}',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

export default db;
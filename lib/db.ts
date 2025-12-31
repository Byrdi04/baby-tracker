import DatabaseConstructor from 'better-sqlite3';
import path from 'path';

// 1. Define path (Using path.resolve as requested)
const dbPath = path.resolve('baby-tracker.db');

// 2. Initialize Database
const db = new DatabaseConstructor(dbPath, { 
  verbose: console.log 
});

db.pragma('journal_mode = WAL');

console.log(`📂 Database active at: ${dbPath}`);

// 3. Ensure Table Exists
// We run this immediately so the file is created on startup
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
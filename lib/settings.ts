// lib/settings.ts
// Centralized settings management with in-memory cache.
// All settings are persisted in the `settings` SQLite table.

// Re-export pure-JS constants (safe for client components)
export { DEFAULTS, type SettingsKey } from './settings-consts';

import { DEFAULTS } from './settings-consts';
import type { SettingsKey as SK } from './settings-consts';
import db from './db';

// ── In-memory cache ───────────────────────────────────────────────

const cache = new Map<SK, string>();

// Seed cache with defaults so we never miss on first read
for (const [key, val] of Object.entries(DEFAULTS)) {
  cache.set(key as SK, val);
}

// ── Helpers ───────────────────────────────────────────────────────

function getFromDb(key: SK): string {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: string } | undefined;
  return row?.value ?? DEFAULTS[key];
}

export function get<T extends SK>(key: T): string {
  // Always refresh from DB for accuracy (cache is mainly for repeated reads within a request)
  const value = getFromDb(key);
  cache.set(key, value);
  return value;
}

export function set(key: SK, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    .run(key, value);
  cache.set(key, value);
}

/** Invalidates a single key from the cache (called after API update). */
export function invalidate(key: SK): void {
  cache.delete(key);
}

/** Returns all settings as a plain object. */
export function getAll(): Record<SK, string> {
  const result = {} as Record<SK, string>;
  for (const key of Object.keys(DEFAULTS) as SK[]) {
    result[key] = get(key);
  }
  return result;
}

/** Returns the raw defaults (useful for a "reset" action). */
export function getDefaults(): Record<SK, string> {
  return { ...DEFAULTS };
}

// ── Typed helpers ─────────────────────────────────────────────────

/** Parse dayStartHour as a number (0–23). */
export function getDayStartHour(): number {
  return Math.max(0, Math.min(23, parseInt(get('dayStartHour'), 10) || 6));
}

/** Parse vitaminResetHour as a number (0–23). */
export function getVitaminResetHour(): number {
  return Math.max(0, Math.min(23, parseInt(get('vitaminResetHour'), 10) || 6));
}

/** Get baby birthday as a Date string (YYYY-MM-DD). */
export function getBabyBirthday(): string {
  const val = get('babyBirthday');
  return val || DEFAULTS.babyBirthday;
}

/** Get baby gender: 'male' | 'female'. */
export function getBabyGender(): 'male' | 'female' {
  const val = get('babyGender');
  return val === 'female' ? 'female' : 'male';
}

/** Parse events display limit. */
export function getEventsDisplayLimit(): number {
  return Math.max(10, Math.min(5000, parseInt(get('eventsDisplayLimit'), 10) || 1000));
}

/** Parse feed display limit. */
export function getFeedDisplayLimit(): number {
  return Math.max(10, Math.min(500, parseInt(get('feedDisplayLimit'), 10) || 100));
}

/** Parse history chunk days. */
export function getHistoryChunkDays(): number {
  return Math.max(7, Math.min(30, parseInt(get('historyChunkDays'), 10) || 14));
}

/** Get timezone string. */
export function getTimezone(): string {
  return get('timezone') || DEFAULTS.timezone;
}

/** Get vitamin reminder time (HH:MM) or empty string. */
export function getVitaminReminderTime(): string {
  return get('vitaminReminderTime');
}

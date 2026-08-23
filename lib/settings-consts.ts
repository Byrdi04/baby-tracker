// lib/settings-consts.ts
// Pure-JS constants for settings — safe to import from client components.
// This file does NOT import lib/db.ts or any native modules.

export type SettingsKey =
  | 'dayStartHour'
  | 'vitaminResetHour'
  | 'babyName'
  | 'babyBirthday'
  | 'babyGender'
  | 'eventsDisplayLimit'
  | 'feedDisplayLimit'
  | 'historyChunkDays'
  | 'timezone'
  | 'vitaminReminderTime';

export const DEFAULTS: Record<SettingsKey, string> = {
  dayStartHour: '6',
  vitaminResetHour: '6',
  babyName: '',
  babyBirthday: '2025-08-07',
  babyGender: 'male',
  eventsDisplayLimit: '1000',
  feedDisplayLimit: '100',
  historyChunkDays: '14',
  timezone: 'Europe/Copenhagen',
  vitaminReminderTime: '',
};

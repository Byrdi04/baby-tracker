// app/api/settings/route.ts

import { NextResponse } from 'next/server';
import { get, set, getAll, getDefaults } from '@/lib/settings';
import type { SettingsKey } from '@/lib/settings-consts';

export async function GET() {
  return NextResponse.json(getAll());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof value !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: need { key, value }' },
        { status: 400 }
      );
    }

    // Whitelist of allowed keys
    const allowedKeys = new Set([
      'dayStartHour',
      'vitaminResetHour',
      'babyName',
      'babyBirthday',
      'babyGender',
      'eventsDisplayLimit',
      'feedDisplayLimit',
      'historyChunkDays',
      'timezone',
      'vitaminReminderTime',
      'prematurityActive',
      'gestationalWeeks',
    ]);

    if (!allowedKeys.has(key)) {
      return NextResponse.json(
        { error: `Unknown setting key: ${key}` },
        { status: 400 }
      );
    }

    set(key as SettingsKey, value);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Reset all settings to defaults
export async function DELETE() {
  try {
    const defaults = getDefaults();
    for (const [key, value] of Object.entries(defaults) as [SettingsKey, string][]) {
      set(key, value);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Settings DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

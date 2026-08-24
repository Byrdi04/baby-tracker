// app/settings/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";

type SettingsKey =
  | "dayStartHour"
  | "vitaminResetHour"
  | "babyName"
  | "babyBirthday"
  | "babyGender"
  | "eventsDisplayLimit"
  | "feedDisplayLimit"
  | "historyChunkDays"
  | "timezone"
  | "vitaminReminderTime"
  | "prematurityActive"
  | "gestationalWeeks";

const ALL_KEYS: SettingsKey[] = [
  "dayStartHour",
  "vitaminResetHour",
  "babyName",
  "babyBirthday",
  "babyGender",
  "eventsDisplayLimit",
  "feedDisplayLimit",
  "historyChunkDays",
  "timezone",
  "vitaminReminderTime",
  "prematurityActive",
  "gestationalWeeks",
];

const DEFAULTS: Record<SettingsKey, string> = {
  dayStartHour: "6",
  vitaminResetHour: "6",
  babyName: "",
  babyBirthday: "2025-08-07",
  babyGender: "male",
  eventsDisplayLimit: "1000",
  feedDisplayLimit: "100",
  historyChunkDays: "14",
  timezone: "Europe/Copenhagen",
  vitaminReminderTime: "",
  prematurityActive: "false",
  gestationalWeeks: "",
};

const SECTION_ORDER: { title: string; keys: SettingsKey[] }[] = [
  {
    title: "Baby Profile",
    keys: ["babyName", "babyBirthday", "babyGender", "prematurityActive", "gestationalWeeks"],
  },
  {
    title: "Daily Schedule",
    keys: ["dayStartHour", "vitaminResetHour", "vitaminReminderTime"],
  },
  {
    title: "Display",
    keys: ["eventsDisplayLimit", "feedDisplayLimit", "historyChunkDays"],
  },
  {
    title: "System",
    keys: ["timezone"],
  },
];

const LABELS: Record<SettingsKey, string> = {
  dayStartHour: "Day start hour (0–23)",
  vitaminResetHour: "Vitamin reset hour (0–23)",
  babyName: "Baby name (optional)",
  babyBirthday: "Baby birthday",
  babyGender: "Baby gender",
  eventsDisplayLimit: "Home/Diaper events limit",
  feedDisplayLimit: "Feed page events limit",
  historyChunkDays: "History pagination (days)",
  timezone: "Timezone",
  vitaminReminderTime: "Vitamin reminder (HH:MM)",
  prematurityActive: "Prematurity",
  gestationalWeeks: "Gestational age at birth",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<SettingsKey, string>>(
    DEFAULTS as Record<SettingsKey, string>
  );
  // Drafts for text/number inputs (local state until blur/enter)
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<SettingsKey | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ── Load settings on mount ──────────────────────────────────────
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({ ...DEFAULTS, ...data });
      })
      .catch(() => {});
  }, []);

  // ── Save a single setting ───────────────────────────────────────
  const save = useCallback(async (key: SettingsKey, value: string) => {
    setSaving(key);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error();
      setSettings((prev) => ({ ...prev, [key]: value }));
      showToast("Saved");
    } catch {
      showToast("Save failed");
    } finally {
      setSaving(null);
    }
  }, []);

  // ── Reset all settings ──────────────────────────────────────────
  const resetAll = async () => {
    if (!confirm("Reset all settings to defaults?")) return;
    try {
      await fetch("/api/settings", { method: "DELETE" });
      setSettings(DEFAULTS as Record<SettingsKey, string>);
      setDrafts({});
      showToast("All settings reset");
    } catch {
      showToast("Reset failed");
    }
  };

  // ── Toast helper ────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  };

  // ── Input helper: save on blur, update draft onChange ───────────
  const inputChange = (key: SettingsKey, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const inputBlur = (key: SettingsKey) => {
    const draft = drafts[key];
    if (draft !== undefined && draft !== settings[key]) {
      save(key, draft);
    } else {
      // Clear draft if unchanged
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const inputKeyDown = (key: SettingsKey, e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  // ── Render a row ────────────────────────────────────────────────
  const renderRow = (key: SettingsKey) => {
    const label = LABELS[key];
    // Use draft if available, otherwise committed value
    const val = key in drafts ? drafts[key] : settings[key];
    const isSaving = saving === key;

    // ── babyGender: select (save immediately) ─────────────────────
    if (key === "babyGender") {
      return (
        <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <select
            value={val}
            onChange={(e) => save(key, e.target.value)}
            disabled={isSaving}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white text-sm"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      );
    }

    // ── babyBirthday: date input ──────────────────────────────────
    if (key === "babyBirthday") {
      return (
        <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <input
            type="date"
            value={val}
            onChange={(e) => inputChange(key, e.target.value)}
            onBlur={() => inputBlur(key)}
            onKeyDown={(e) => inputKeyDown(key, e)}
            disabled={isSaving}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white text-sm"
          />
        </div>
      );
    }

    // ── vitaminReminderTime: time input ───────────────────────────
    if (key === "vitaminReminderTime") {
      return (
        <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <input
            type="time"
            value={val}
            onChange={(e) => inputChange(key, e.target.value)}
            onBlur={() => inputBlur(key)}
            onKeyDown={(e) => inputKeyDown(key, e)}
            disabled={isSaving}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white text-sm"
          />
        </div>
      );
    }

    // ── babyName, timezone: text input ────────────────────────────
    if (key === "babyName" || key === "timezone") {
      return (
        <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <input
            type="text"
            value={val}
            onChange={(e) => inputChange(key, e.target.value)}
            onBlur={() => inputBlur(key)}
            onKeyDown={(e) => inputKeyDown(key, e)}
            disabled={isSaving}
            placeholder={
              key === "timezone" ? "e.g. Europe/Copenhagen" : ""
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white text-sm"
          />
        </div>
      );
    }

    // ── prematurityActive: toggle ─────────────────────────────────
    if (key === "prematurityActive") {
      return (
        <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              The child was born before week 37 of pregnancy.
            </p>
          </div>
          <button
            onClick={() => save(key, val === "true" ? "false" : "true")}
            disabled={isSaving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              val === "true"
                ? "bg-indigo-600"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                val === "true" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      );
    }

    // ── gestationalWeeks: "W+D" inputs (save on blur) ─────────────
    if (key === "gestationalWeeks") {
      const isActive = settings.prematurityActive === "true";
      if (!isActive) return null;
      const [ws, ds] = (val || "").split('+');
      const weeks = parseInt(ws || '0', 10) || 0;
      const days = parseInt(ds || '0', 10) || 0;

      const handleWeeksChange = (v: string) => {
        const w = Math.min(36, Math.max(22, parseInt(v, 10) || 0));
        const newVal = `${w}+${days}`;
        setDrafts((prev) => ({ ...prev, [key]: newVal }));
      };
      const handleDaysChange = (v: string) => {
        const d = Math.min(6, Math.max(0, parseInt(v, 10) || 0));
        const newVal = `${weeks}+${d}`;
        setDrafts((prev) => ({ ...prev, [key]: newVal }));
      };
      const handleBlur = () => {
        const draft = drafts[key];
        if (draft !== undefined && draft !== settings[key]) {
          save(key, draft);
        } else {
          setDrafts((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }
      };

      return (
        <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ml-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={22}
                max={36}
                value={weeks}
                onChange={(e) => handleWeeksChange(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === "Enter" && handleBlur()}
                disabled={isSaving}
                className="w-14 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white text-sm text-center"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">w</span>
            </div>
            <span className="text-gray-400">+</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={6}
                value={days}
                onChange={(e) => handleDaysChange(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === "Enter" && handleBlur()}
                disabled={isSaving}
                className="w-12 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white text-sm text-center"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">d</span>
            </div>
          </div>
        </div>
      );
    }

    // ── Number inputs: save on blur ───────────────────────────────
    return (
      <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <input
          type="number"
          value={val}
          onChange={(e) => inputChange(key, e.target.value)}
          onBlur={() => inputBlur(key)}
          onKeyDown={(e) => inputKeyDown(key, e)}
          disabled={isSaving}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white text-sm w-24"
        />
      </div>
    );
  };

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold dark:text-white">⚙️ Settings</h1>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm z-50">
          {toast}
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-6">
        {SECTION_ORDER.map((section) => (
          <section
            key={section.title}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"
          >
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {section.title}
            </h2>
            {section.keys.map((key) => renderRow(key))}
          </section>
        ))}

        {/* Danger Zone */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900 p-4">
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-2">
            Danger Zone
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Reset every setting to its default value. This won't delete any
            tracked events.
          </p>
          <button
            onClick={resetAll}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Reset All Settings
          </button>
        </section>
      </div>
    </main>
  );
}
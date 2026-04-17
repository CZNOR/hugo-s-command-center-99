/**
 * Daily ritual — forces a morning-prep and evening-recap ritual.
 * - Morning gate: user must type 3 priorities + intent + energy → unlocks the day.
 * - Evening gate: user must tick tasks done + type win + energy → closes the day.
 * - Between the two: app is normal.
 * - Outside the window (before morning / after evening gate is done): only /tasks reachable.
 * State is persisted in localStorage under `czn_ritual_v1`.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type WeekendMode = "off" | "saturday" | "full";
export type GateStrictness = "strict" | "medium" | "soft";

export interface MorningEntry {
  completedAt: string;                              // ISO timestamp
  selectedTaskIds: [string, string, string];        // 3 task IDs chosen as today's priorities
  energy: 1 | 2 | 3 | 4 | 5;
}

export interface EveningEntry {
  completedAt: string;
  win: string;
  energy: 1 | 2 | 3 | 4 | 5;
  tasksDoneIds?: string[];
  tomorrowTaskIds?: [string, string, string];       // 3 task IDs planned for tomorrow
}

export interface DailyLog {
  date: string;            // YYYY-MM-DD
  morning?: MorningEntry;
  evening?: EveningEntry;
  skipped?: boolean;       // user explicitly opted out (counts as a skip, not a break)
}

export interface RitualSettings {
  morningHour: number;     // 0-23 (default 9)
  eveningHour: number;     // 0-23 (default 19)
  strictness: GateStrictness;
  weekendMode: WeekendMode;
}

const DEFAULT_SETTINGS: RitualSettings = {
  morningHour: 9,
  eveningHour: 19,
  strictness: "strict",
  weekendMode: "saturday", // Saturday ON, Sunday OFF
};

const STORAGE_KEY = "czn_ritual_v1";

// ─── Supabase sync ──────────────────────────────────────────
const SB_URL = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) as string | undefined;
const SB_KEY = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) as string | undefined;

function sbEnabled() { return !!SB_URL && !!SB_KEY; }

async function sbFetchLogs(): Promise<Record<string, DailyLog> | null> {
  if (!sbEnabled()) return null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/daily_rituals?select=*&order=date.desc&limit=120`, {
      headers: { apikey: SB_KEY!, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!r.ok) return null;
    const rows = (await r.json()) as any[];
    const logs: Record<string, DailyLog> = {};
    rows.forEach(row => {
      const log: DailyLog = { date: row.date };
      if (row.morning_at) {
        // Column `top3` is reused to store the 3 picked task IDs (v2). Legacy v1 rows
        // contained freetext titles — those will appear as invalid IDs and simply won't
        // match any task, which is fine: the day still counts as completed for streak.
        log.morning = {
          completedAt: row.morning_at,
          selectedTaskIds: (row.top3 ?? ["", "", ""]) as [string, string, string],
          energy: (row.morning_energy ?? 3) as 1 | 2 | 3 | 4 | 5,
        };
      }
      if (row.evening_at) {
        // `tasks_deferred_ids` column is reused to store the 3 tomorrow-priority IDs (v2).
        // Legacy v1 stored an unbounded list of "deferred" IDs there; we only read the
        // first 3 if we find one — extras are harmless.
        const td = row.tasks_deferred_ids as string[] | null;
        const tomorrow3 = td && td.length >= 3
          ? [td[0], td[1], td[2]] as [string, string, string]
          : undefined;
        log.evening = {
          completedAt: row.evening_at,
          win: row.win ?? "",
          energy: (row.evening_energy ?? 3) as 1 | 2 | 3 | 4 | 5,
          tasksDoneIds: row.tasks_done_ids ?? [],
          tomorrowTaskIds: tomorrow3,
        };
      }
      if (row.skipped) log.skipped = true;
      logs[row.date] = log;
    });
    return logs;
  } catch { return null; }
}

async function sbUpsertLog(log: DailyLog): Promise<void> {
  if (!sbEnabled()) return;
  try {
    await fetch(`${SB_URL}/rest/v1/daily_rituals`, {
      method: "POST",
      headers: {
        apikey: SB_KEY!,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        date: log.date,
        morning_at:         log.morning?.completedAt ?? null,
        top3:               log.morning?.selectedTaskIds ?? null,  // reused col: 3 task IDs
        intent:             null,                                   // legacy col, unused
        morning_energy:     log.morning?.energy ?? null,
        evening_at:         log.evening?.completedAt ?? null,
        win:                log.evening?.win ?? null,
        evening_energy:     log.evening?.energy ?? null,
        tasks_done_ids:     log.evening?.tasksDoneIds ?? null,
        tasks_deferred_ids: log.evening?.tomorrowTaskIds ?? null,  // reused col: 3 tomorrow IDs
        skipped:            log.skipped ?? false,
        updated_at:         new Date().toISOString(),
      }),
    });
  } catch { /* offline is fine — localStorage still has it */ }
}

interface StoredState {
  settings: RitualSettings;
  logs: Record<string, DailyLog>;
}

/**
 * Returns today's date in the user's LOCAL timezone as YYYY-MM-DD.
 * We deliberately avoid `toISOString()` because it returns UTC, which would
 * flip the ritual day at 17:00 Bangkok (= 00:00 UTC). Local date is what
 * a human means when they say "today".
 */
function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function isSunday(d = new Date()) { return d.getDay() === 0; }
function isSaturday(d = new Date()) { return d.getDay() === 6; }
function isWeekend(d = new Date()) { return isSunday(d) || isSaturday(d); }

function isDayOff(settings: RitualSettings, d = new Date()): boolean {
  if (settings.weekendMode === "full") return false;
  if (settings.weekendMode === "off") return isWeekend(d);
  if (settings.weekendMode === "saturday") return isSunday(d); // Saturday active, Sunday off
  return false;
}

function loadState(): StoredState {
  if (typeof window === "undefined") return { settings: DEFAULT_SETTINGS, logs: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { settings: DEFAULT_SETTINGS, logs: {} };
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      logs: parsed.logs ?? {},
    };
  } catch {
    return { settings: DEFAULT_SETTINGS, logs: {} };
  }
}

function saveState(state: StoredState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* noop */ }
}

/** Returns true if the morning ritual gate must be shown RIGHT NOW. */
function needMorning(log: DailyLog | undefined, settings: RitualSettings, now = new Date()): boolean {
  if (isDayOff(settings, now)) return false;
  if (log?.skipped) return false;
  if (log?.morning?.completedAt) return false;
  return now.getHours() >= settings.morningHour;
}

/** Returns true if the evening ritual gate must be shown RIGHT NOW. */
function needEvening(log: DailyLog | undefined, settings: RitualSettings, now = new Date()): boolean {
  if (isDayOff(settings, now)) return false;
  if (log?.skipped) return false;
  if (log?.evening?.completedAt) return false;
  return now.getHours() >= settings.eveningHour;
}

/**
 * Consecutive active days with BOTH morning and evening logged (or explicitly skipped on off-days).
 * Counts backward from yesterday (today doesn't count until the evening ritual is done).
 */
function computeStreak(logs: Record<string, DailyLog>, settings: RitualSettings): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 1); // start at yesterday
  for (let i = 0; i < 365; i++) {
    if (isDayOff(settings, cursor)) {
      // off day: does not break streak but does not add either
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    const ky = cursor.getFullYear();
    const km = String(cursor.getMonth() + 1).padStart(2, "0");
    const kd = String(cursor.getDate()).padStart(2, "0");
    const key = `${ky}-${km}-${kd}`;
    const log = logs[key];
    const complete = !!(log?.morning?.completedAt && log?.evening?.completedAt);
    if (!complete) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ─── Context ────────────────────────────────────────────────
interface RitualContext {
  settings: RitualSettings;
  todayLog: DailyLog;
  streak: number;
  // Gate checks
  morningRequired: boolean;
  eveningRequired: boolean;
  /** Routes that remain reachable while a gate is active. */
  allowedPathWhileGated: string[];
  // Actions
  submitMorning: (entry: Omit<MorningEntry, "completedAt">) => void;
  submitEvening: (entry: Omit<EveningEntry, "completedAt">) => void;
  skipToday: () => void;
  updateSettings: (patch: Partial<RitualSettings>) => void;
  /** Dev helper — reset today's log */
  resetToday: () => void;
}

const Ctx = createContext<RitualContext | null>(null);

export function RitualProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(() => loadState());
  const [now, setNow] = useState<Date>(() => new Date());

  // Tick once per minute so gates activate at the configured hour even while the tab is open
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Hydrate from Supabase on mount. Remote wins on conflict so the iPhone and laptop stay
  // in sync — localStorage is just a cache for instant render and offline use.
  useEffect(() => {
    let cancelled = false;
    sbFetchLogs().then(remote => {
      if (cancelled || !remote) return;
      setState(prev => ({ ...prev, logs: { ...prev.logs, ...remote } }));
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { saveState(state); }, [state]);

  const today = todayISO();
  const todayLog: DailyLog = state.logs[today] ?? { date: today };

  const morningRequired = useMemo(
    () => needMorning(todayLog, state.settings, now),
    [todayLog, state.settings, now]
  );
  const eveningRequired = useMemo(
    () => needEvening(todayLog, state.settings, now),
    [todayLog, state.settings, now]
  );

  const streak = useMemo(() => {
    let s = computeStreak(state.logs, state.settings);
    // If today is fully complete and not off, bump live count
    if (
      todayLog.morning?.completedAt &&
      todayLog.evening?.completedAt &&
      !isDayOff(state.settings, now)
    ) s += 1;
    return s;
  }, [state.logs, state.settings, todayLog, now]);

  const updateTodayLog = useCallback((patch: Partial<DailyLog>) => {
    setState(prev => {
      const key = todayISO();
      const existing = prev.logs[key] ?? { date: key };
      const merged: DailyLog = { ...existing, ...patch };
      // fire-and-forget sync — offline still works via localStorage
      sbUpsertLog(merged);
      return { ...prev, logs: { ...prev.logs, [key]: merged } };
    });
  }, []);

  const submitMorning: RitualContext["submitMorning"] = useCallback((entry) => {
    updateTodayLog({ morning: { ...entry, completedAt: new Date().toISOString() } });
  }, [updateTodayLog]);

  const submitEvening: RitualContext["submitEvening"] = useCallback((entry) => {
    updateTodayLog({ evening: { ...entry, completedAt: new Date().toISOString() } });
  }, [updateTodayLog]);

  const skipToday: RitualContext["skipToday"] = useCallback(() => {
    updateTodayLog({ skipped: true });
  }, [updateTodayLog]);

  const updateSettings: RitualContext["updateSettings"] = useCallback((patch) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const resetToday: RitualContext["resetToday"] = useCallback(() => {
    setState(prev => {
      const key = todayISO();
      const { [key]: _, ...rest } = prev.logs;
      return { ...prev, logs: rest };
    });
  }, []);

  const value: RitualContext = {
    settings: state.settings,
    todayLog,
    streak,
    morningRequired,
    eveningRequired,
    allowedPathWhileGated: ["/tasks"],
    submitMorning,
    submitEvening,
    skipToday,
    updateSettings,
    resetToday,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRitual(): RitualContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRitual must be used within RitualProvider");
  return ctx;
}

// Exposed helpers for tests / debugging
export const __ritualInternals = { needMorning, needEvening, computeStreak, isDayOff };

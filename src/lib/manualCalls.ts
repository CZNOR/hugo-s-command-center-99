/**
 * Manual calls — agency clients that Hugo types in himself (Cal.com only covers the
 * coaching-formation funnel). Stored as a single JSON blob in Supabase `task_meta`
 * under the `__manual_calls__` key to avoid needing a new table.
 *
 * Dates are stored in the USER'S LOCAL tz as (date, time) pairs rather than a UTC
 * timestamp. This keeps "call scheduled for Saturday 14h Bangkok" intact even if
 * the app is opened from a different machine. The push cron at api/push/notify.ts
 * rebuilds the absolute timestamp assuming Bangkok (UTC+7).
 */

export interface ManualCall {
  id: string;                 // "mc_17294881234"
  clientName: string;
  date: string;               // "YYYY-MM-DD" (local)
  time: string;               // "HH:MM"     (local, 24h)
  durationMin: number;        // default 30
  business: "coaching" | "casino" | "agence";
  notes?: string;
  createdAt: string;          // ISO
}

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const SNAPSHOT_KEY = "__manual_calls__";
const STORAGE_KEY  = "czn_manual_calls_v1";

function sbEnabled() { return !!SB_URL && !!SB_KEY; }

async function sbFetch<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SB_KEY!, Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      ...(opts?.headers ?? {}),
    },
  });
  const txt = await res.text();
  return txt ? JSON.parse(txt) : ([] as unknown as T);
}

function readCache(): ManualCall[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as ManualCall[] : [];
  } catch { return []; }
}

function writeCache(calls: ManualCall[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(calls)); } catch { /* noop */ }
}

/** Returns calls, sourced from Supabase (falls back to localStorage cache on error). */
export async function loadManualCalls(): Promise<ManualCall[]> {
  if (!sbEnabled()) return readCache();
  try {
    const rows = await sbFetch<any[]>(`task_meta?notion_id=eq.${SNAPSHOT_KEY}&limit=1`);
    if (rows?.[0]?.completed_at) {
      const calls = JSON.parse(rows[0].completed_at) as ManualCall[];
      writeCache(calls);
      return calls;
    }
  } catch { /* fall through to cache */ }
  return readCache();
}

/** Persists the whole array back to Supabase + localStorage. */
export async function saveManualCalls(calls: ManualCall[]): Promise<void> {
  writeCache(calls);
  if (!sbEnabled()) return;
  try {
    await sbFetch("task_meta", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        notion_id:    SNAPSHOT_KEY,
        business:     "__snapshot__",
        priority:     "normale",
        time:         null,
        completed_at: JSON.stringify(calls),
        updated_at:   new Date().toISOString(),
      }),
    });
  } catch { /* offline is fine */ }
}

export async function addManualCall(input: Omit<ManualCall, "id" | "createdAt">): Promise<ManualCall> {
  const current = await loadManualCalls();
  const call: ManualCall = {
    ...input,
    id:        `mc_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const next = [...current, call].sort((a, b) => {
    const ka = `${a.date}T${a.time}`;
    const kb = `${b.date}T${b.time}`;
    return ka.localeCompare(kb);
  });
  await saveManualCalls(next);
  return call;
}

export async function deleteManualCall(id: string): Promise<void> {
  const current = await loadManualCalls();
  await saveManualCalls(current.filter(c => c.id !== id));
}

/** Returns a Date object for this call assuming the local browser tz. */
export function callToLocalDate(call: ManualCall): Date {
  const [y, m, d] = call.date.split("-").map(Number);
  const [h, mi]   = call.time.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d, h, mi, 0);
}

/** True if the call starts in the future (not past yet). */
export function isUpcoming(call: ManualCall): boolean {
  return callToLocalDate(call).getTime() > Date.now();
}

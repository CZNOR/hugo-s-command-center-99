import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────
export type TaskBusiness = "coaching" | "casino" | "content" | "equipe";
export type TaskPriority = "haute" | "normale" | "basse";
export type TaskStatus   = "todo" | "progress" | "done";

export interface Task {
  id:          string;
  title:       string;
  business:    TaskBusiness;
  priority:    TaskPriority;
  status:      TaskStatus;
  deadline?:   string;   // yyyy-mm-dd
  time?:       string;   // HH:MM
  completedAt?: string;
  createdAt:   string;   // yyyy-mm-dd
}

// ─── Supabase ─────────────────────────────────────────────────
const SB_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SNAPSHOT_ID = "__tasks_v2__";

async function sbFetch<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      ...(opts?.headers ?? {}),
    },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : ([] as unknown as T);
}

/**
 * Returns:
 * - Task[] — remote snapshot exists (may be empty, which is a valid state)
 * - null   — no snapshot row at all (first-ever run on this Supabase project)
 *
 * The empty-array case is meaningful: it means the user explicitly cleared
 * their tasks and we must NOT re-seed.
 */
async function loadTasks(): Promise<Task[] | null> {
  try {
    const rows = await sbFetch<any[]>(
      `task_meta?notion_id=eq.${SNAPSHOT_ID}&limit=1`
    );
    if (!rows?.[0]) return null;                              // no row at all
    const raw = rows[0].completed_at;
    if (raw === null || raw === undefined) return [];         // row exists, snapshot empty
    try { return JSON.parse(raw) as Task[]; } catch { return null; }
  } catch {}
  return null;
}

async function saveTasks(tasks: Task[]): Promise<void> {
  // Write-through to localStorage first so that a cold reload paints the last-known
  // state instantly, even before Supabase responds.
  try { localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(tasks)); } catch { /* noop */ }
  await sbFetch("task_meta", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      notion_id:    SNAPSHOT_ID,
      business:     "__snapshot__",
      priority:     "normale",
      time:         null,
      completed_at: JSON.stringify(tasks),
      updated_at:   new Date().toISOString(),
    }),
  }).catch(() => {});
}

const TASKS_CACHE_KEY = "czn_tasks_cache_v1";
function readTasksCache(): Task[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TASKS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

// ─── Seed : tes 22 tâches actuelles ──────────────────────────
// `createdAt` uses today so default tasks keep today's date in any session
const TODAY = new Date().toISOString().slice(0, 10);
const SEED_TASKS: Task[] = [
  { id: "t1",  title: "HELIGHT",                          business: "coaching", priority: "normale", status: "todo", createdAt: TODAY },
  { id: "t2",  title: "PACKAGING INES",                   business: "equipe",   priority: "haute",   status: "todo", deadline: "2026-03-30", createdAt: TODAY },
  { id: "t3",  title: "BRANDING DLIVE",                   business: "coaching", priority: "normale", status: "todo", deadline: "2026-03-26", createdAt: TODAY },
  { id: "t4",  title: "AFFI VPN",                         business: "casino",   priority: "normale", status: "todo", deadline: "2026-03-29", createdAt: TODAY },
  { id: "t5",  title: "LANDING PAGE CASINO",              business: "coaching", priority: "normale", status: "todo", deadline: "2026-03-29", createdAt: TODAY },
  { id: "t6",  title: "REPONDRE MANAGER",                 business: "equipe",   priority: "haute",   status: "todo", deadline: "2026-03-30", createdAt: TODAY },
  { id: "t7",  title: "TELEGRAM CASINO",                  business: "equipe",   priority: "haute",   status: "todo", deadline: "2026-03-31", createdAt: TODAY },
  { id: "t8",  title: "LIVE",                             business: "equipe",   priority: "haute",   status: "todo", createdAt: TODAY },
  { id: "t9",  title: "REELS DESSAI",                     business: "equipe",   priority: "haute",   status: "todo", createdAt: TODAY },
  { id: "t10", title: "FINR APP",                         business: "equipe",   priority: "haute",   status: "todo", createdAt: TODAY },
  { id: "t11", title: "REPONDRE YOPSY",                   business: "equipe",   priority: "haute",   status: "todo", createdAt: TODAY },
  { id: "t12", title: "THYLO EN ATT REPONSE",             business: "equipe",   priority: "haute",   status: "todo", createdAt: TODAY },
  { id: "t13", title: "QUESTIONNAIRE SAV",                business: "equipe",   priority: "haute",   status: "todo", deadline: "2026-03-28", createdAt: TODAY },
  { id: "t14", title: "REC 5 VALUE + 2 STORYTELLING",     business: "coaching", priority: "haute",   status: "todo", deadline: "2026-03-31", time: "11:00", createdAt: TODAY },
  { id: "t15", title: "DRIVE + GUIB",                     business: "coaching", priority: "haute",   status: "todo", deadline: "2026-03-30", createdAt: TODAY },
  { id: "t16", title: "STORY",                            business: "coaching", priority: "haute",   status: "todo", deadline: "2026-03-31", createdAt: TODAY },
  { id: "t17", title: "PLANNING LIVE ECOM",               business: "coaching", priority: "haute",   status: "todo", deadline: "2026-03-31", createdAt: TODAY },
  { id: "t18", title: "PLANNING LIVE CASINO",             business: "casino",   priority: "haute",   status: "todo", deadline: "2026-03-31", createdAt: TODAY },
  { id: "t19", title: "OVERLAY CASINO",                   business: "casino",   priority: "haute",   status: "todo", deadline: "2026-03-31", createdAt: TODAY },
  { id: "t20", title: "SOCIETE MAXIME",                   business: "coaching", priority: "haute",   status: "todo", deadline: "2026-03-31", createdAt: TODAY },
  { id: "t21", title: "Delphine call dimanche 10h FR",    business: "coaching", priority: "normale", status: "todo", deadline: "2026-03-30", time: "10:00", createdAt: TODAY },
  { id: "t22", title: "SENEK CHANGER PHOTO + 3 MINIA",    business: "equipe",   priority: "haute",   status: "todo", deadline: "2026-03-30", createdAt: TODAY },
];

// ─── Context ──────────────────────────────────────────────────
interface TaskContextType {
  tasks:      Task[];
  loading:    boolean;
  setStatus:  (id: string, status: TaskStatus) => void;
  toggle:     (id: string) => void;
  addTask:    (title: string, business: TaskBusiness, priority: TaskPriority, deadline?: string, time?: string, status?: TaskStatus) => void;
  editTask:   (id: string, updates: Partial<Pick<Task, "title" | "business" | "priority" | "deadline" | "time">>) => void;
  deleteTask: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  // Paint instantly with whatever's cached in localStorage (or seed data as a last
  // resort). Supabase refresh happens in the background below — no blank screen while
  // the network call is in flight.
  const [tasks, setTasks] = useState<Task[]>(() => {
    const cached = readTasksCache();
    // null cache → first launch; otherwise respect what's there (including []).
    return cached ?? SEED_TASKS;
  });
  const [loading, setLoading] = useState(true);

  // ── Refresh from Supabase in background; remote wins on conflict ─────
  useEffect(() => {
    loadTasks().then(remote => {
      if (remote !== null) {
        // Remote snapshot exists (possibly empty) — this is the source of truth.
        setTasks(remote);
        try { localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(remote)); } catch {}
      } else if (!readTasksCache()) {
        // First-ever run AND no remote data: seed Supabase + cache.
        saveTasks(SEED_TASKS);
      }
    }).finally(() => setLoading(false));
  }, []);

  // ── Helpers ──────────────────────────────────────────────
  const persist = useCallback((updated: Task[]) => {
    setTasks(updated);
    saveTasks(updated);
  }, []);

  const setStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks(prev => {
      const next = prev.map(t =>
        t.id === id
          ? { ...t, status, completedAt: status === "done" ? new Date().toISOString() : undefined }
          : t
      );
      saveTasks(next);
      return next;
    });
  }, []);

  const toggle = useCallback((id: string) => {
    setTasks(prev => {
      const next = prev.map(t => {
        if (t.id !== id) return t;
        const s: TaskStatus = t.status === "done" ? "todo" : "done";
        return { ...t, status: s, completedAt: s === "done" ? new Date().toISOString() : undefined };
      });
      saveTasks(next);
      return next;
    });
  }, []);

  const addTask = useCallback((
    title: string, business: TaskBusiness, priority: TaskPriority,
    deadline?: string, time?: string, status: TaskStatus = "todo",
  ) => {
    if (!title.trim()) return;
    const newTask: Task = {
      id:        `t_${Date.now()}`,
      title:     title.trim(),
      business, priority, status, deadline, time,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setTasks(prev => {
      const next = [newTask, ...prev];
      saveTasks(next);
      return next;
    });
  }, []);

  const editTask = useCallback((
    id: string,
    updates: Partial<Pick<Task, "title" | "business" | "priority" | "deadline" | "time">>,
  ) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      saveTasks(next);
      return next;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      saveTasks(next);
      return next;
    });
  }, []);

  return (
    <TaskContext.Provider value={{ tasks, loading, setStatus, toggle, addTask, editTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks(): TaskContextType {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within <TaskProvider>");
  return ctx;
}

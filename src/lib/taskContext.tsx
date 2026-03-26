import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────
export type TaskBusiness = "coaching" | "casino" | "content" | "equipe";
export type TaskPriority = "haute" | "normale" | "basse";
export type TaskStatus = "todo" | "progress" | "done";

export interface Task {
  id: string;
  title: string;
  business: TaskBusiness;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string;
  time?: string;
  completedAt?: string;
  createdAt: string;
}

type TaskMeta = {
  business: TaskBusiness;
  priority: TaskPriority;
  time?: string;
  completedAt?: string;
};

// ─── Supabase direct (même pattern que useSocialStats) ────────
const SB_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function sbFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : ([] as unknown as T);
}

async function loadMeta(): Promise<Record<string, TaskMeta>> {
  const rows = await sbFetch<any[]>("task_meta?select=*").catch(() => []);
  const meta: Record<string, TaskMeta> = {};
  for (const row of rows ?? []) {
    meta[row.notion_id] = {
      business:    row.business,
      priority:    row.priority,
      time:        row.time        ?? undefined,
      completedAt: row.completed_at ?? undefined,
    };
  }
  return meta;
}

function saveMeta(task: Task) {
  if (task.id.startsWith("temp_")) return;
  sbFetch("task_meta", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      notion_id:    task.id,
      business:     task.business,
      priority:     task.priority,
      time:         task.time        ?? null,
      completed_at: task.completedAt ?? null,
      updated_at:   new Date().toISOString(),
    }),
  }).catch(() => {});
}

function deleteMeta(id: string) {
  if (id.startsWith("temp_")) return;
  sbFetch(`task_meta?notion_id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
}

// ─── Merge Notion + Supabase meta ─────────────────────────────
function mergeTask(
  n: { id: string; title: string; status: TaskStatus; deadline?: string; createdAt: string },
  meta: Record<string, TaskMeta>
): Task {
  const m = meta[n.id];
  return {
    ...n,
    business:    m?.business    ?? "coaching",
    priority:    m?.priority    ?? "normale",
    time:        m?.time,
    completedAt: m?.completedAt,
  };
}

// ─── Context ──────────────────────────────────────────────────
interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  setStatus: (id: string, status: TaskStatus) => void;
  toggle: (id: string) => void;
  addTask: (title: string, business: TaskBusiness, priority: TaskPriority, deadline?: string, time?: string, status?: TaskStatus) => void;
  editTask: (id: string, updates: Partial<Pick<Task, "title" | "business" | "priority" | "deadline" | "time">>) => void;
  deleteTask: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/notion-tasks").then(r => r.json()).catch(() => ({ tasks: [] })),
      loadMeta(),
    ]).then(([notionData, meta]) => {
      const notionTasks = (notionData.tasks ?? []) as Array<{
        id: string; title: string; status: TaskStatus; deadline?: string; createdAt: string;
      }>;
      setTasks(notionTasks.map(t => mergeTask(t, meta)));
    }).finally(() => setLoading(false));
  }, []);

  const setStatus = useCallback((id: string, status: TaskStatus) => {
    const completedAt = status === "done" ? new Date().toISOString() : undefined;
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, status, completedAt } : t);
      const task = updated.find(t => t.id === id);
      if (task) saveMeta(task);
      return updated;
    });
    fetch("/api/notion-tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => {});
  }, []);

  const toggle = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const newStatus: TaskStatus = t.status === "done" ? "todo" : "done";
      const completedAt = newStatus === "done" ? new Date().toISOString() : undefined;
      const updated = { ...t, status: newStatus, completedAt };
      saveMeta(updated);
      fetch("/api/notion-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      }).catch(() => {});
      return updated;
    }));
  }, []);

  const addTask = useCallback((
    title: string,
    business: TaskBusiness,
    priority: TaskPriority,
    deadline?: string,
    time?: string,
    status: TaskStatus = "todo",
  ) => {
    if (!title.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    const tempId = `temp_${Date.now()}`;
    const newTask: Task = { id: tempId, title: title.trim(), business, priority, status, deadline, time, createdAt: today };
    setTasks(prev => [newTask, ...prev]);

    fetch("/api/notion-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), status, deadline }),
    })
      .then(r => r.json())
      .then(created => {
        const realId = created.id;
        if (!realId) return;
        setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: realId } : t));
        saveMeta({ ...newTask, id: realId });
      })
      .catch(() => {});
  }, []);

  const editTask = useCallback((
    id: string,
    updates: Partial<Pick<Task, "title" | "business" | "priority" | "deadline" | "time">>,
  ) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      const task = updated.find(t => t.id === id);
      if (task) saveMeta(task);
      return updated;
    });
    const notionUpdates: Record<string, unknown> = {};
    if (updates.title    !== undefined) notionUpdates.title    = updates.title;
    if (updates.deadline !== undefined) notionUpdates.deadline = updates.deadline;
    if (Object.keys(notionUpdates).length > 0) {
      fetch("/api/notion-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...notionUpdates }),
      }).catch(() => {});
    }
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (!id.startsWith("temp_")) {
      fetch("/api/notion-tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => {});
      deleteMeta(id);
    }
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

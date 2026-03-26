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

// ─── Supabase meta sync (replaces localStorage) ───────────────
function syncMeta(task: Task) {
  if (task.id.startsWith("temp_")) return; // wait for real Notion ID
  fetch("/api/task-meta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      notion_id:   task.id,
      business:    task.business,
      priority:    task.priority,
      time:        task.time        ?? null,
      completedAt: task.completedAt ?? null,
    }),
  }).catch(() => {});
}

function deleteMeta(id: string) {
  if (id.startsWith("temp_")) return;
  fetch("/api/task-meta", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notion_id: id }),
  }).catch(() => {});
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

  // Fetch Notion tasks + Supabase meta concurrently on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/notion-tasks").then(r => r.json()).catch(() => ({ tasks: [] })),
      fetch("/api/task-meta").then(r => r.json()).catch(() => ({ meta: {} })),
    ]).then(([notionData, metaData]) => {
      const notionTasks = (notionData.tasks ?? []) as Array<{
        id: string; title: string; status: TaskStatus; deadline?: string; createdAt: string;
      }>;
      const meta = (metaData.meta ?? {}) as Record<string, TaskMeta>;
      setTasks(notionTasks.map(t => mergeTask(t, meta)));
    }).finally(() => setLoading(false));
  }, []);

  const setStatus = useCallback((id: string, status: TaskStatus) => {
    const completedAt = status === "done" ? new Date().toISOString() : undefined;
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, status, completedAt } : t);
      const task = updated.find(t => t.id === id);
      if (task) syncMeta(task);
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
      syncMeta(updated);
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
        // Update local state with real ID then sync meta to Supabase
        setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: realId } : t));
        syncMeta({ ...newTask, id: realId });
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
      if (task) syncMeta(task);
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

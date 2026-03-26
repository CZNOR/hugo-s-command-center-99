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

// ─── Local metadata (business/priority/time not in Notion) ────
type TaskMeta = {
  business: TaskBusiness;
  priority: TaskPriority;
  time?: string;
  completedAt?: string;
};

const META_KEY = "hugo_tasks_meta_v2";

function loadMeta(): Record<string, TaskMeta> {
  try { return JSON.parse(localStorage.getItem(META_KEY) ?? "{}"); } catch { return {}; }
}

function saveMeta(meta: Record<string, TaskMeta>) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

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

  // Fetch from Notion on mount
  useEffect(() => {
    const meta = loadMeta();
    fetch("/api/notion-tasks")
      .then(r => r.json())
      .then(data => {
        const notionTasks = (data.tasks ?? []) as Array<{
          id: string; title: string; status: TaskStatus; deadline?: string; createdAt: string;
        }>;
        setTasks(notionTasks.map(t => mergeTask(t, meta)));
      })
      .catch(() => { /* API unavailable — start with empty list */ })
      .finally(() => setLoading(false));
  }, []);

  const updateMeta = useCallback((id: string, updates: Partial<TaskMeta>) => {
    const meta = loadMeta();
    meta[id] = { business: "coaching", priority: "normale", ...meta[id], ...updates };
    saveMeta(meta);
  }, []);

  const setStatus = useCallback((id: string, status: TaskStatus) => {
    const completedAt = status === "done" ? new Date().toISOString() : undefined;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, completedAt } : t));
    updateMeta(id, { completedAt });
    fetch("/api/notion-tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => {});
  }, [updateMeta]);

  const toggle = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const newStatus: TaskStatus = t.status === "done" ? "todo" : "done";
      const completedAt = newStatus === "done" ? new Date().toISOString() : undefined;
      updateMeta(id, { completedAt });
      fetch("/api/notion-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      }).catch(() => {});
      return { ...t, status: newStatus, completedAt };
    }));
  }, [updateMeta]);

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
    updateMeta(tempId, { business, priority, time });

    fetch("/api/notion-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), status, deadline }),
    })
      .then(r => r.json())
      .then(created => {
        const realId = created.id;
        if (!realId) return;
        updateMeta(realId, { business, priority, time });
        const meta = loadMeta();
        delete meta[tempId];
        saveMeta(meta);
        setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: realId } : t));
      })
      .catch(() => {});
  }, [updateMeta]);

  const editTask = useCallback((
    id: string,
    updates: Partial<Pick<Task, "title" | "business" | "priority" | "deadline" | "time">>,
  ) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (task) {
        updateMeta(id, {
          business: updates.business ?? task.business,
          priority: updates.priority ?? task.priority,
          time:     updates.time !== undefined ? updates.time : task.time,
        });
      }
      return prev.map(t => t.id === id ? { ...t, ...updates } : t);
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
  }, [updateMeta]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (!id.startsWith("temp_")) {
      fetch("/api/notion-tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => {});
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

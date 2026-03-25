import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────
export type TaskBusiness = "coaching" | "casino" | "content" | "equipe";
export type TaskPriority = "haute" | "normale" | "basse";
export type TaskStatus = "todo" | "progress" | "done";

export interface Task {
  id: string;
  title: string;
  business: TaskBusiness;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string;    // yyyy-mm-dd
  time?: string;        // HH:MM
  completedAt?: string; // ISO string when done
  createdAt: string;    // yyyy-mm-dd
}

// ─── Persistence ─────────────────────────────────────────────
const STORAGE_KEY = "hugo_tasks_v2";

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as any[];
      // Migrate old format (done: boolean → status)
      return parsed.map(t => ({
        ...t,
        status: t.status ?? (t.done ? "done" : "todo"),
      })) as Task[];
    }
  } catch {}
  return [];
}

// ─── Context ─────────────────────────────────────────────────
interface TaskContextType {
  tasks: Task[];
  setStatus: (id: string, status: TaskStatus) => void;
  toggle: (id: string) => void; // shortcut: todo/progress → done, done → todo
  addTask: (title: string, business: TaskBusiness, priority: TaskPriority, deadline?: string, time?: string) => void;
  deleteTask: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const setStatus = (id: string, status: TaskStatus) =>
    setTasks(prev => prev.map(t =>
      t.id === id
        ? { ...t, status, completedAt: status === "done" ? new Date().toISOString() : undefined }
        : t
    ));

  const toggle = (id: string) =>
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const newStatus: TaskStatus = t.status === "done" ? "todo" : "done";
      return { ...t, status: newStatus, completedAt: newStatus === "done" ? new Date().toISOString() : undefined };
    }));

  const addTask = (title: string, business: TaskBusiness, priority: TaskPriority, deadline?: string, time?: string) => {
    if (!title.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    setTasks(prev => [
      { id: Date.now().toString(), title: title.trim(), business, priority, status: "todo", deadline, time, createdAt: today },
      ...prev,
    ]);
  };

  const deleteTask = (id: string) =>
    setTasks(prev => prev.filter(t => t.id !== id));

  return (
    <TaskContext.Provider value={{ tasks, setStatus, toggle, addTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks(): TaskContextType {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within <TaskProvider>");
  return ctx;
}

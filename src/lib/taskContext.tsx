import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────
export type TaskBusiness = "coaching" | "casino" | "content" | "equipe";
export type TaskPriority = "haute" | "normale" | "basse";

export interface Task {
  id: string;
  title: string;
  business: TaskBusiness;
  priority: TaskPriority;
  deadline?: string;   // yyyy-mm-dd
  time?: string;       // HH:MM
  done: boolean;
  completedAt?: string; // ISO string, set when marked done
  createdAt: string;   // yyyy-mm-dd
}

// ─── Persistence ─────────────────────────────────────────────
const STORAGE_KEY = "hugo_tasks_v1";

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Task[];
  } catch {}
  return [];
}

// ─── Context ─────────────────────────────────────────────────
interface TaskContextType {
  tasks: Task[];
  toggle: (id: string) => void;
  addTask: (title: string, business: TaskBusiness, priority: TaskPriority, deadline?: string, time?: string) => void;
  deleteTask: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  // Persist on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const toggle = (id: string) =>
    setTasks(prev => prev.map(t =>
      t.id === id
        ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toISOString() : undefined }
        : t
    ));

  const addTask = (title: string, business: TaskBusiness, priority: TaskPriority, deadline?: string, time?: string) => {
    if (!title.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    setTasks(prev => [
      { id: Date.now().toString(), title: title.trim(), business, priority, deadline, time, done: false, createdAt: today },
      ...prev,
    ]);
  };

  const deleteTask = (id: string) =>
    setTasks(prev => prev.filter(t => t.id !== id));

  return (
    <TaskContext.Provider value={{ tasks, toggle, addTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks(): TaskContextType {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within <TaskProvider>");
  return ctx;
}

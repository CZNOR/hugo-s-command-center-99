import { createContext, useContext, useState, type ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────
export type TaskBusiness = "coaching" | "casino" | "content" | "equipe";
export type TaskPriority = "haute" | "normale" | "basse";

export interface Task {
  id: string;
  title: string;
  business: TaskBusiness;
  priority: TaskPriority;
  deadline?: string;   // yyyy-mm-dd
  done: boolean;
  createdAt: string;   // yyyy-mm-dd
}

// ─── Seed data (dates relative to today) ─────────────────────
function buildSeed(): Task[] {
  const now = new Date();
  const fmt = (d: Date): string => d.toISOString().split("T")[0];
  const off = (n: number): string => {
    const d = new Date(now);
    d.setDate(now.getDate() + n);
    return fmt(d);
  };
  const today = fmt(now);

  return [
    { id: "1", title: "Publier reel TikTok storytelling",      business: "content",  priority: "haute",   deadline: off(0), done: false, createdAt: today },
    { id: "2", title: "Contacter support Coolaff",              business: "casino",   priority: "haute",   deadline: off(0), done: false, createdAt: today },
    { id: "3", title: "Relancer les leads chauds de la semaine", business: "coaching", priority: "haute",   deadline: off(0), done: false, createdAt: today },
    { id: "4", title: "Saisir clics Beacons semaine",           business: "coaching", priority: "normale", deadline: off(0), done: true,  createdAt: today },
    { id: "5", title: "Préparer script appel de vente",         business: "coaching", priority: "normale", deadline: off(1), done: false, createdAt: today },
    { id: "6", title: "Vérifier dépôts Coolaff validés",        business: "casino",   priority: "normale", deadline: off(2), done: false, createdAt: today },
    { id: "7", title: "Tourner vidéo YouTube produit phare",    business: "content",  priority: "normale", deadline: off(3), done: false, createdAt: today },
    { id: "8", title: "Réunion équipe — point hebdo",           business: "equipe",   priority: "basse",   deadline: off(4), done: false, createdAt: today },
  ];
}

// ─── Context ─────────────────────────────────────────────────
interface TaskContextType {
  tasks: Task[];
  toggle: (id: string) => void;
  addTask: (title: string, business: TaskBusiness, priority: TaskPriority, deadline?: string) => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(buildSeed);

  const toggle = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const addTask = (title: string, business: TaskBusiness, priority: TaskPriority, deadline?: string) => {
    if (!title.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    setTasks(prev => [
      ...prev,
      { id: Date.now().toString(), title: title.trim(), business, priority, deadline, done: false, createdAt: today },
    ]);
  };

  return (
    <TaskContext.Provider value={{ tasks, toggle, addTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks(): TaskContextType {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within <TaskProvider>");
  return ctx;
}

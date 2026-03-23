import { createContext, useContext, useState, type ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────
export interface Task {
  id: string;
  label: string;
  done: boolean;
  tag: "casino" | "coaching" | "content" | "perso";
  priority: "high" | "normal";
}

// ─── Seed data ────────────────────────────────────────────────
const INITIAL_TASKS: Task[] = [
  { id: "1", label: "Publier reel TikTok — storytelling client",  done: false, tag: "coaching", priority: "high"   },
  { id: "2", label: "Contacter support Coolaff — rapport hebdo",  done: false, tag: "casino",   priority: "high"   },
  { id: "3", label: "Relancer leads chauds de la semaine",        done: false, tag: "coaching", priority: "normal" },
  { id: "4", label: "Enregistrer script vidéo YouTube",            done: false, tag: "content",  priority: "normal" },
  { id: "5", label: "Saisir les clics Beacons de la semaine",      done: true,  tag: "coaching", priority: "normal" },
  { id: "6", label: "Vérifier les dépôts Coolaff validés",        done: false, tag: "casino",   priority: "normal" },
];

// ─── Context ─────────────────────────────────────────────────
interface TaskContextType {
  tasks: Task[];
  toggle: (id: string) => void;
  addTask: (label: string) => void;
  adding: boolean;
  setAdding: (v: boolean) => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks]   = useState<Task[]>(INITIAL_TASKS);
  const [adding, setAdding] = useState(false);

  const toggle = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const addTask = (label: string) => {
    if (!label.trim()) return;
    setTasks(prev => [
      ...prev,
      { id: Date.now().toString(), label: label.trim(), done: false, tag: "perso", priority: "normal" },
    ]);
  };

  return (
    <TaskContext.Provider value={{ tasks, toggle, addTask, adding, setAdding }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks(): TaskContextType {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within <TaskProvider>");
  return ctx;
}

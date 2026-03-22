import { motion } from "framer-motion";
import { CheckSquare, Plus, Clock, AlertTriangle, Inbox, Circle, CheckCircle2 } from "lucide-react";
import { tasks as initialTasks, routines } from "@/lib/mock-data";
import { useXPFloat, XPFloats } from "@/components/ui/XPFloat";
import { useState } from "react";

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16, filter: "blur(4px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } };

const priorityConfig = {
  urgent: { label: "Urgent", color: "bg-hugoos-red/20 text-hugoos-red", icon: AlertTriangle },
  high: { label: "High", color: "bg-hugoos-orange/20 text-hugoos-orange", icon: Clock },
  medium: { label: "Medium", color: "bg-hugoos-indigo/20 text-hugoos-indigo", icon: Circle },
  low: { label: "Low", color: "bg-muted text-muted-foreground", icon: Circle },
};

const statusGroups = [
  { key: "in_progress", label: "En cours", icon: "🔄" },
  { key: "todo", label: "À faire", icon: "📋" },
  { key: "done", label: "Terminé", icon: "✅" },
];

export default function TasksPage() {
  const [taskList, setTaskList] = useState(initialTasks);
  const { floats, triggerXP } = useXPFloat();

  const handleComplete = (id: string) => {
    const task = taskList.find((t) => t.id === id);
    if (task && task.status !== "done") {
      setTaskList((prev) => prev.map((t) => t.id === id ? { ...t, status: "done" as const } : t));
      triggerXP(task.xp);
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5 max-w-5xl mx-auto relative">
      <XPFloats floats={floats} />

      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Tâches & Projets</h2>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors active:scale-[0.97]">
          <Plus className="w-4 h-4" />
          Nouvelle Tâche
        </button>
      </motion.div>

      {/* Routines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["morning", "evening"] as const).map((type) => {
          const items = routines[type];
          const done = items.filter((i) => i.done).length;
          return (
            <motion.div key={type} variants={fadeUp} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">{type === "morning" ? "🌅 Morning Routine" : "🌙 Evening Routine"}</h3>
                <span className="chip-green text-[10px]">{done}/{items.length}</span>
              </div>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-hugoos-green flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`text-sm flex-1 ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.label}</span>
                    <span className="chip-purple text-[10px]">+{item.xp}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Task Groups */}
      {statusGroups.map((group) => {
        const groupTasks = taskList.filter((t) => t.status === group.key);
        if (groupTasks.length === 0) return null;
        return (
          <motion.div key={group.key} variants={fadeUp} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span>{group.icon}</span>
              <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
              <span className="text-xs text-muted-foreground">({groupTasks.length})</span>
            </div>
            <div className="space-y-1">
              {groupTasks.map((task) => {
                const p = priorityConfig[task.priority];
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors group">
                    <button
                      onClick={() => handleComplete(task.id)}
                      disabled={task.status === "done"}
                      className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all active:scale-90 ${
                        task.status === "done"
                          ? "bg-hugoos-green/20 border-hugoos-green/50"
                          : "border-white/20 hover:border-hugoos-green hover:bg-hugoos-green/10"
                      }`}
                    >
                      {task.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-hugoos-green" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.color}`}>{p.label}</span>
                        <span className="text-[11px] text-muted-foreground">{task.due_date}</span>
                        <span className="text-[11px] text-muted-foreground">• {task.project}</span>
                      </div>
                    </div>
                    <span className="chip-purple text-[10px]">+{task.xp}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

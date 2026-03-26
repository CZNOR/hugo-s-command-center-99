import { useState } from "react";
import { Plus, X, Check, Clock, Trash2, Phone, Pencil } from "lucide-react";
import { useTasks, type Task, type TaskBusiness, type TaskPriority, type TaskStatus } from "@/lib/taskContext";
import { useBusiness } from "@/lib/businessContext";

// ─── Config ──────────────────────────────────────────────────
const BIZ_COLORS: Record<TaskBusiness, string> = {
  coaching: "#7c3aed",
  casino:   "#00cc44",
  content:  "#f97316",
  equipe:   "#3b82f6",
};
const BIZ_LABELS: Record<TaskBusiness, string> = {
  coaching: "Coaching",
  casino:   "Casino",
  content:  "Contenu",
  equipe:   "Équipe",
};

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "todo",     label: "À faire",  color: "#a855f7" },
  { status: "progress", label: "En cours", color: "#f59e0b" },
  { status: "done",     label: "Terminé",  color: "#22c55e" },
];

// ─── Add Task Modal ───────────────────────────────────────────
function AddModal({ onClose, defaultStatus }: { onClose: () => void; defaultStatus: TaskStatus }) {
  const { addTask } = useTasks();
  const [title,    setTitle]    = useState("");
  const [business, setBusiness] = useState<TaskBusiness>("coaching");
  const [priority, setPriority] = useState<TaskPriority>("normale");
  const [deadline, setDeadline] = useState("");
  const [time,     setTime]     = useState("");

  const handleAdd = () => {
    if (!title.trim()) return;
    addTask(title, business, priority, deadline || undefined, time || undefined, defaultStatus);
    onClose();
  };

  const inputCss: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "10px 14px",
    fontSize: 14, color: "rgba(255,255,255,0.9)", outline: "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md mx-4 rounded-2xl p-6 space-y-4"
        style={{ background: "#0d0d18", border: "1px solid rgba(168,85,247,0.25)", boxShadow: "0 0 40px rgba(168,85,247,0.1)" }}>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Nouvelle tâche</h2>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <input value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="Ce que tu dois faire…" style={inputCss} autoFocus />

        <div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Business</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(BIZ_LABELS) as TaskBusiness[]).map(b => (
              <button key={b} onClick={() => setBusiness(b)} style={{
                borderRadius: 20, fontSize: 12, fontWeight: 600, padding: "4px 12px", cursor: "pointer",
                background: business === b ? `${BIZ_COLORS[b]}22` : "rgba(255,255,255,0.04)",
                color: business === b ? BIZ_COLORS[b] : "rgba(255,255,255,0.35)",
                border: business === b ? `1px solid ${BIZ_COLORS[b]}55` : "1px solid rgba(255,255,255,0.08)",
              }}>{BIZ_LABELS[b]}</button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Priorité</p>
          <div className="flex gap-2">
            {(["haute", "normale", "basse"] as TaskPriority[]).map(p => {
              const pColors: Record<TaskPriority, string> = { haute: "#ef4444", normale: "rgba(255,255,255,0.6)", basse: "rgba(255,255,255,0.3)" };
              return (
                <button key={p} onClick={() => setPriority(p)} style={{
                  borderRadius: 20, fontSize: 12, fontWeight: 600, padding: "4px 12px",
                  cursor: "pointer", textTransform: "capitalize",
                  background: priority === p ? `${pColors[p]}18` : "rgba(255,255,255,0.04)",
                  color: priority === p ? pColors[p] : "rgba(255,255,255,0.3)",
                  border: priority === p ? `1px solid ${pColors[p]}50` : "1px solid rgba(255,255,255,0.08)",
                }}>{p}</button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Date</p>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              style={{ ...inputCss, colorScheme: "dark" }} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Heure</p>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              style={{ ...inputCss, colorScheme: "dark" }} />
          </div>
        </div>

        <button onClick={handleAdd} disabled={!title.trim()} style={{
          width: "100%", padding: "11px 0", borderRadius: 12, border: "none",
          background: title.trim() ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(255,255,255,0.06)",
          color: title.trim() ? "#fff" : "rgba(255,255,255,0.3)",
          fontSize: 14, fontWeight: 700, cursor: title.trim() ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <Plus className="w-4 h-4" /> Ajouter la tâche
        </button>
      </div>
    </div>
  );
}

// ─── Edit Task Modal ──────────────────────────────────────────
function EditModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const { editTask } = useTasks();
  const [title,    setTitle]    = useState(task.title);
  const [business, setBusiness] = useState<TaskBusiness>(task.business);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [deadline, setDeadline] = useState(task.deadline ?? "");
  const [time,     setTime]     = useState(task.time ?? "");

  const handleSave = () => {
    if (!title.trim()) return;
    editTask(task.id, {
      title: title.trim(),
      business,
      priority,
      deadline: deadline || undefined,
      time: time || undefined,
    });
    onClose();
  };

  const inputCss: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "10px 14px",
    fontSize: 14, color: "rgba(255,255,255,0.9)", outline: "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md mx-4 rounded-2xl p-6 space-y-4"
        style={{ background: "#0d0d18", border: "1px solid rgba(168,85,247,0.25)", boxShadow: "0 0 40px rgba(168,85,247,0.1)" }}>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Modifier la tâche</h2>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <input value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="Ce que tu dois faire…" style={inputCss} autoFocus />

        <div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Business</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(BIZ_LABELS) as TaskBusiness[]).map(b => (
              <button key={b} onClick={() => setBusiness(b)} style={{
                borderRadius: 20, fontSize: 12, fontWeight: 600, padding: "4px 12px", cursor: "pointer",
                background: business === b ? `${BIZ_COLORS[b]}22` : "rgba(255,255,255,0.04)",
                color: business === b ? BIZ_COLORS[b] : "rgba(255,255,255,0.35)",
                border: business === b ? `1px solid ${BIZ_COLORS[b]}55` : "1px solid rgba(255,255,255,0.08)",
              }}>{BIZ_LABELS[b]}</button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Priorité</p>
          <div className="flex gap-2">
            {(["haute", "normale", "basse"] as TaskPriority[]).map(p => {
              const pColors: Record<TaskPriority, string> = { haute: "#ef4444", normale: "rgba(255,255,255,0.6)", basse: "rgba(255,255,255,0.3)" };
              return (
                <button key={p} onClick={() => setPriority(p)} style={{
                  borderRadius: 20, fontSize: 12, fontWeight: 600, padding: "4px 12px",
                  cursor: "pointer", textTransform: "capitalize",
                  background: priority === p ? `${pColors[p]}18` : "rgba(255,255,255,0.04)",
                  color: priority === p ? pColors[p] : "rgba(255,255,255,0.3)",
                  border: priority === p ? `1px solid ${pColors[p]}50` : "1px solid rgba(255,255,255,0.08)",
                }}>{p}</button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Date</p>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              style={{ ...inputCss, colorScheme: "dark" }} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Heure</p>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              style={{ ...inputCss, colorScheme: "dark" }} />
          </div>
        </div>

        <button onClick={handleSave} disabled={!title.trim()} style={{
          width: "100%", padding: "11px 0", borderRadius: 12, border: "none",
          background: title.trim() ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(255,255,255,0.06)",
          color: title.trim() ? "#fff" : "rgba(255,255,255,0.3)",
          fontSize: 14, fontWeight: 700, cursor: title.trim() ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <Check className="w-4 h-4" /> Enregistrer
        </button>
      </div>
    </div>
  );
}

// ─── Task card ────────────────────────────────────────────────
function TaskCard({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const { setStatus, deleteTask } = useTasks();
  const isDone = task.status === "done";
  const color  = BIZ_COLORS[task.business];

  return (
    <div
      onClick={onEdit}
      style={{
        background: isDone ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeft: `3px solid ${isDone ? "rgba(255,255,255,0.08)" : color}`,
        borderRadius: 12, padding: "12px 14px",
        opacity: isDone ? 0.45 : 1, transition: "all 0.15s ease",
        cursor: "pointer",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
    >
      <div className="flex items-start gap-2 mb-2">
        <button onClick={e => { e.stopPropagation(); setStatus(task.id, isDone ? "todo" : "done"); }} style={{
          width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
          border: isDone ? "none" : "1.5px solid rgba(255,255,255,0.22)",
          background: isDone ? "#22c55e" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          {isDone && <Check style={{ width: 10, height: 10, color: "#fff", strokeWidth: 3 }} />}
        </button>
        <p style={{
          flex: 1, fontSize: 13, fontWeight: 500, lineHeight: 1.35,
          color: isDone ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)",
          textDecoration: isDone ? "line-through" : "none",
        }}>{task.title}</p>
        <Pencil style={{ width: 11, height: 11, color: "rgba(255,255,255,0.2)", flexShrink: 0, marginTop: 2 }} />
        <button onClick={e => { e.stopPropagation(); deleteTask(task.id); }} style={{
          background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0.3, flexShrink: 0,
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.3"}
        >
          <Trash2 style={{ width: 12, height: 12, color: "#ef4444" }} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span style={{
          background: `${color}18`, color, borderRadius: 20,
          fontSize: 10, fontWeight: 700, padding: "2px 8px",
        }}>{BIZ_LABELS[task.business]}</span>

        {task.priority === "haute" && (
          <span style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "2px 8px" }}>
            Haute
          </span>
        )}

        {task.deadline && (
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 3 }}>
            <Clock style={{ width: 9, height: 9 }} />
            {new Date(task.deadline + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            {task.time && ` · ${task.time}`}
          </span>
        )}

        {!task.deadline && task.time && (
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 3 }}>
            <Phone style={{ width: 9, height: 9 }} /> {task.time}
          </span>
        )}
      </div>

      {!isDone && (
        <div className="flex gap-1.5 mt-2.5 flex-wrap" onClick={e => e.stopPropagation()}>
          {task.status !== "todo" && (
            <button onClick={() => setStatus(task.id, "todo")} style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 6, cursor: "pointer",
              background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", color: "#a855f7",
            }}>← À faire</button>
          )}
          {task.status !== "progress" && (
            <button onClick={() => setStatus(task.id, "progress")} style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 6, cursor: "pointer",
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b",
            }}>En cours</button>
          )}
          {task.status !== "done" && (
            <button onClick={() => setStatus(task.id, "done")} style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 6, cursor: "pointer",
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e",
            }}>Terminé ✓</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function TasksPage() {
  const { tasks } = useTasks();
  const { activeBusiness } = useBusiness();
  const [showModal,   setShowModal]   = useState(false);
  const [modalStatus, setModalStatus] = useState<TaskStatus>("todo");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter,      setFilter]      = useState<"all" | "today" | "week" | "late">("all");

  const today   = new Date().toISOString().split("T")[0];
  const weekEnd = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0]; })();

  const filtered = tasks.filter(t => {
    if (filter === "today") return t.deadline === today;
    if (filter === "week")  return !!t.deadline && t.deadline >= today && t.deadline <= weekEnd;
    if (filter === "late")  return !!t.deadline && t.deadline < today && t.status !== "done";
    return true;
  });

  const openAdd = (status: TaskStatus = "todo") => {
    setModalStatus(status);
    setShowModal(true);
  };

  const active = tasks.filter(t => t.status !== "done").length;
  const done   = tasks.filter(t => t.status === "done").length;

  return (
    <div className="p-4 lg:p-6 min-h-screen max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Tâches</h1>
          <p className="text-sm text-white/40 mt-1">
            {active} active{active !== 1 ? "s" : ""} · {done} terminée{done !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => openAdd()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: activeBusiness.gradient, boxShadow: `0 4px 12px ${activeBusiness.glow}` }}>
          <Plus className="w-4 h-4" /> Nouvelle tâche
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {([["all", "Toutes"], ["today", "Aujourd'hui"], ["week", "Cette semaine"], ["late", "En retard"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
            background: filter === val ? `${activeBusiness.accent}22` : "rgba(255,255,255,0.04)",
            border: filter === val ? `1px solid ${activeBusiness.accent}` : "1px solid rgba(255,255,255,0.08)",
            color: filter === val ? activeBusiness.accent : "rgba(248,250,252,0.5)",
          }}>{label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const colTasks = filtered.filter(t => t.status === col.status);
          return (
            <div key={col.status} className="rounded-2xl p-4 flex flex-col gap-3" style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{col.label}</span>
                </div>
                <span style={{
                  background: `${col.color}18`, color: col.color,
                  borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "2px 9px",
                }}>{colTasks.length}</span>
              </div>

              <div className="flex flex-col gap-2" style={{ minHeight: 60 }}>
                {colTasks.length === 0
                  ? <p className="text-center text-xs py-6" style={{ color: "rgba(255,255,255,0.18)" }}>Aucune tâche</p>
                  : colTasks.map(t => <TaskCard key={t.id} task={t} onEdit={() => setEditingTask(t)} />)
                }
              </div>

              <button onClick={() => openAdd(col.status)} style={{
                width: "100%", padding: "8px 0", borderRadius: 8, cursor: "pointer",
                background: "transparent", border: `1px dashed ${col.color}30`,
                color: `${col.color}60`, fontSize: 12,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${col.color}08`; (e.currentTarget as HTMLElement).style.borderColor = `${col.color}60`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = `${col.color}30`; }}
              >
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            </div>
          );
        })}
      </div>

      {showModal    && <AddModal onClose={() => setShowModal(false)} defaultStatus={modalStatus} />}
      {editingTask  && <EditModal task={editingTask} onClose={() => setEditingTask(null)} />}
    </div>
  );
}

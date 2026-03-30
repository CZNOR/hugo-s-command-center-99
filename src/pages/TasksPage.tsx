import { useState, useMemo, useCallback } from "react";
import { Plus, X, Check, Clock, Trash2, Phone, Pencil, Flame, ArrowDownCircle, Minus } from "lucide-react";
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

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  haute:   { color: "#ef4444", bg: "rgba(239,68,68,0.12)",    icon: Flame,           label: "Haute" },
  normale: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",   icon: Minus,           label: "Normale" },
  basse:   { color: "#6b7280", bg: "rgba(107,114,128,0.08)", icon: ArrowDownCircle, label: "Basse" },
};

const COLUMNS: { status: TaskStatus; label: string; color: string; emoji: string }[] = [
  { status: "todo",     label: "À faire",  color: "#a855f7", emoji: "🎯" },
  { status: "progress", label: "En cours", color: "#f59e0b", emoji: "⚡" },
  { status: "done",     label: "Terminé",  color: "#22c55e", emoji: "✅" },
];

// ─── Shared input style ───────────────────────────────────────
const inputCss: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, padding: "10px 14px",
  fontSize: 14, color: "rgba(255,255,255,0.9)", outline: "none",
};

// ─── Modal base ───────────────────────────────────────────────
function ModalBase({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", animation: "fadeIn 0.15s ease" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`@keyframes fadeIn { from { opacity:0 } to { opacity:1 } } @keyframes slideUp { from { opacity:0;transform:translateY(16px) } to { opacity:1;transform:translateY(0) } }`}</style>
      <div
        className="w-full max-w-md mx-4 rounded-2xl p-6 space-y-4"
        style={{
          background: "#0d0d18", border: "1px solid rgba(168,85,247,0.25)",
          boxShadow: "0 0 40px rgba(168,85,247,0.1)",
          animation: "slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{title}</h2>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Task form fields (shared between Add/Edit) ───────────────
function TaskFormFields({
  title, setTitle, business, setBusiness, priority, setPriority, deadline, setDeadline, time, setTime,
  onSubmit, submitLabel,
}: {
  title: string; setTitle: (v: string) => void;
  business: TaskBusiness; setBusiness: (v: TaskBusiness) => void;
  priority: TaskPriority; setPriority: (v: TaskPriority) => void;
  deadline: string; setDeadline: (v: string) => void;
  time: string; setTime: (v: string) => void;
  onSubmit: () => void; submitLabel: string;
}) {
  return (
    <>
      <input value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onSubmit()}
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
              transition: "all 0.15s ease",
            }}>{BIZ_LABELS[b]}</button>
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Priorité</p>
        <div className="flex gap-2">
          {(["haute", "normale", "basse"] as TaskPriority[]).map(p => {
            const cfg = PRIORITY_CONFIG[p];
            return (
              <button key={p} onClick={() => setPriority(p)} style={{
                borderRadius: 20, fontSize: 12, fontWeight: 600, padding: "4px 12px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                background: priority === p ? cfg.bg : "rgba(255,255,255,0.04)",
                color: priority === p ? cfg.color : "rgba(255,255,255,0.3)",
                border: priority === p ? `1px solid ${cfg.color}50` : "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.15s ease",
              }}>
                <cfg.icon style={{ width: 11, height: 11 }} />
                {cfg.label}
              </button>
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

      <button onClick={onSubmit} disabled={!title.trim()} style={{
        width: "100%", padding: "11px 0", borderRadius: 12, border: "none",
        background: title.trim() ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "rgba(255,255,255,0.06)",
        color: title.trim() ? "#fff" : "rgba(255,255,255,0.3)",
        fontSize: 14, fontWeight: 700, cursor: title.trim() ? "pointer" : "not-allowed",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        transition: "all 0.15s ease",
      }}>
        <Plus className="w-4 h-4" /> {submitLabel}
      </button>
    </>
  );
}

// ─── Add Task Modal ───────────────────────────────────────────
function AddModal({ onClose, defaultStatus }: { onClose: () => void; defaultStatus: TaskStatus }) {
  const { addTask } = useTasks();
  const [title,    setTitle]    = useState("");
  const [business, setBusiness] = useState<TaskBusiness>("coaching");
  const [priority, setPriority] = useState<TaskPriority>("normale");
  const [deadline, setDeadline] = useState("");
  const [time,     setTime]     = useState("");

  const handleAdd = useCallback(() => {
    if (!title.trim()) return;
    addTask(title, business, priority, deadline || undefined, time || undefined, defaultStatus);
    onClose();
  }, [title, business, priority, deadline, time, defaultStatus, addTask, onClose]);

  return (
    <ModalBase onClose={onClose} title="Nouvelle tâche">
      <TaskFormFields
        title={title} setTitle={setTitle}
        business={business} setBusiness={setBusiness}
        priority={priority} setPriority={setPriority}
        deadline={deadline} setDeadline={setDeadline}
        time={time} setTime={setTime}
        onSubmit={handleAdd} submitLabel="Ajouter la tâche"
      />
    </ModalBase>
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

  const handleSave = useCallback(() => {
    if (!title.trim()) return;
    editTask(task.id, {
      title: title.trim(),
      business,
      priority,
      deadline: deadline || undefined,
      time: time || undefined,
    });
    onClose();
  }, [title, business, priority, deadline, time, task.id, editTask, onClose]);

  return (
    <ModalBase onClose={onClose} title="Modifier la tâche">
      <TaskFormFields
        title={title} setTitle={setTitle}
        business={business} setBusiness={setBusiness}
        priority={priority} setPriority={setPriority}
        deadline={deadline} setDeadline={setDeadline}
        time={time} setTime={setTime}
        onSubmit={handleSave} submitLabel="Enregistrer"
      />
    </ModalBase>
  );
}

// ─── Priority indicator ───────────────────────────────────────
function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  if (priority === "normale") return null; // Don't show badge for normal priority — declutters UI
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      background: cfg.bg, color: cfg.color,
      borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "2px 7px",
    }}>
      <cfg.icon style={{ width: 9, height: 9 }} />
      {cfg.label}
    </span>
  );
}

// ─── Task card with completion animation ──────────────────────
function TaskCard({ task, onEdit, animationDelay }: { task: Task; onEdit: () => void; animationDelay?: number }) {
  const { setStatus, deleteTask } = useTasks();
  const [completing, setCompleting] = useState(false);
  const isDone = task.status === "done";
  const color  = BIZ_COLORS[task.business];

  const handleComplete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDone) {
      setCompleting(true);
      setTimeout(() => {
        setStatus(task.id, "done");
        setCompleting(false);
      }, 350);
    } else {
      setStatus(task.id, "todo");
    }
  }, [isDone, task.id, setStatus]);

  return (
    <div
      onClick={onEdit}
      style={{
        background: isDone ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeft: `3px solid ${isDone ? "rgba(255,255,255,0.08)" : color}`,
        borderRadius: 12, padding: "12px 14px",
        opacity: isDone ? 0.45 : completing ? 0.7 : 1,
        transform: completing ? "scale(0.98)" : "scale(1)",
        transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        cursor: "pointer",
        animation: animationDelay !== undefined ? `task-slide-in 0.3s ease ${animationDelay}ms both` : undefined,
      }}
      onMouseEnter={e => { if (!completing) (e.currentTarget as HTMLElement).style.background = isDone ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDone ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.04)"; }}
    >
      <div className="flex items-start gap-2 mb-2">
        {/* Checkbox with animation */}
        <button
          onClick={handleComplete}
          style={{
            width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
            border: isDone ? "none" : completing ? `1.5px solid ${color}` : "1.5px solid rgba(255,255,255,0.22)",
            background: isDone ? "#22c55e" : completing ? `${color}30` : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            transition: "all 0.2s ease",
            transform: completing ? "scale(1.2)" : "scale(1)",
          }}
        >
          {isDone && <Check style={{ width: 10, height: 10, color: "#fff", strokeWidth: 3 }} />}
          {completing && !isDone && <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />}
        </button>

        <p style={{
          flex: 1, fontSize: 13, fontWeight: 500, lineHeight: 1.35,
          color: isDone ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)",
          textDecoration: isDone ? "line-through" : "none",
          transition: "all 0.2s ease",
        }}>{task.title}</p>

        <Pencil style={{ width: 11, height: 11, color: "rgba(255,255,255,0.2)", flexShrink: 0, marginTop: 2 }} />
        <button
          onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0.3, flexShrink: 0, transition: "opacity 0.15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.3"}
        >
          <Trash2 style={{ width: 12, height: 12, color: "#ef4444" }} />
        </button>
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span style={{
          background: `${color}18`, color, borderRadius: 20,
          fontSize: 10, fontWeight: 700, padding: "2px 8px",
        }}>{BIZ_LABELS[task.business]}</span>

        <PriorityBadge priority={task.priority} />

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

      {/* Status move buttons */}
      {!isDone && (
        <div className="flex gap-1.5 mt-2.5 flex-wrap" onClick={e => e.stopPropagation()}>
          {task.status !== "todo" && (
            <button onClick={() => setStatus(task.id, "todo")} style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 6, cursor: "pointer",
              background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", color: "#a855f7",
              transition: "all 0.15s",
            }}>← À faire</button>
          )}
          {task.status !== "progress" && (
            <button onClick={() => setStatus(task.id, "progress")} style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 6, cursor: "pointer",
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b",
              transition: "all 0.15s",
            }}>En cours</button>
          )}
          {task.status !== "done" && (
            <button onClick={handleComplete} style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 6, cursor: "pointer",
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e",
              transition: "all 0.15s",
            }}>Terminé ✓</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────
function EmptyState({ status, onAdd }: { status: TaskStatus; onAdd: () => void }) {
  const col = COLUMNS.find(c => c.status === status)!;
  const messages: Record<TaskStatus, { title: string; sub: string }> = {
    todo:     { title: "Rien à faire ici",  sub: "Ajoute ta prochaine tâche ↓" },
    progress: { title: "Rien en cours",     sub: "Déplace une tâche ici pour démarrer" },
    done:     { title: "Aucune tâche finie", sub: "Complète des tâches pour les voir ici" },
  };
  const msg = messages[status];
  return (
    <div
      className="flex flex-col items-center justify-center py-8 px-4 rounded-xl text-center"
      style={{ border: `1px dashed ${col.color}20`, background: `${col.color}04`, minHeight: 80 }}
    >
      <span style={{ fontSize: 24, marginBottom: 6 }}>{col.emoji}</span>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{msg.title}</p>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>{msg.sub}</p>
      {status === "todo" && (
        <button
          onClick={onAdd}
          style={{
            marginTop: 10, fontSize: 11, padding: "5px 14px", borderRadius: 8, cursor: "pointer",
            background: `${col.color}15`, border: `1px solid ${col.color}35`, color: col.color,
            transition: "all 0.15s",
          }}
        >+ Nouvelle tâche</button>
      )}
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────
function TaskSkeleton() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)",
      borderLeft: "3px solid rgba(255,255,255,0.06)",
      borderRadius: 12, padding: "12px 14px", animation: "pulse 1.5s ease-in-out infinite",
    }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} } @keyframes task-slide-in { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }`}</style>
      <div className="flex items-center gap-2 mb-2">
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />
        <div style={{ flex: 1, height: 13, borderRadius: 6, background: "rgba(255,255,255,0.06)" }} />
      </div>
      <div className="flex gap-2">
        <div style={{ width: 52, height: 16, borderRadius: 20, background: "rgba(255,255,255,0.05)" }} />
        <div style={{ width: 72, height: 16, borderRadius: 20, background: "rgba(255,255,255,0.04)" }} />
      </div>
    </div>
  );
}

// ─── Progress ring ─────────────────────────────────────────────
function ProgressRing({ done, total, color }: { done: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const r = 14, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width="36" height="36" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
      <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="2.5"
        strokeDasharray={c} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="700"
        fill="rgba(255,255,255,0.7)" style={{ transform: "rotate(90deg) translate(0,-36px)" }}>
        {pct}%
      </text>
    </svg>
  );
}

// ─── Category group header ────────────────────────────────────
function CategoryGroupHeader({ biz, tasks }: { biz: TaskBusiness; tasks: Task[] }) {
  const color = BIZ_COLORS[biz];
  const done = tasks.filter(t => t.status === "done").length;
  return (
    <div className="flex items-center gap-2 mb-1.5" style={{ opacity: 0.85 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {BIZ_LABELS[biz]}
      </span>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginLeft: "auto" }}>
        {done}/{tasks.length}
      </span>
    </div>
  );
}

// ─── Category section (used in category view) ─────────────────
function CategorySection({
  biz, tasks, onEdit, onAdd,
}: { biz: TaskBusiness; tasks: Task[]; onEdit: (t: Task) => void; onAdd: () => void }) {
  const color = BIZ_COLORS[biz];
  const todo     = tasks.filter(t => t.status === "todo");
  const progress = tasks.filter(t => t.status === "progress");
  const done     = tasks.filter(t => t.status === "done");
  const doneCount = done.length;
  const total     = tasks.length;

  const StatusBlock = ({ items, col }: { items: Task[]; col: typeof COLUMNS[0] }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span style={{ fontSize: 9, fontWeight: 700, color: col.color, letterSpacing: "0.08em", textTransform: "uppercase" as const, opacity: 0.8 }}>
            {col.emoji} {col.label}
          </span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{items.length}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {items.map((t, i) => (
            <TaskCard key={t.id} task={t} onEdit={() => onEdit(t)} animationDelay={i * 25} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl p-4 mb-3" style={{
      background: `${color}08`,
      border: `1px solid ${color}25`,
    }}>
      {/* Category header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}80` }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{BIZ_LABELS[biz]}</span>
          <span style={{
            background: `${color}20`, color, borderRadius: 20,
            fontSize: 10, fontWeight: 700, padding: "1px 8px",
          }}>{tasks.filter(t => t.status !== "done").length} actives</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{doneCount}/{total} ✓</span>
          {/* Mini progress bar */}
          <div style={{ width: 48, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${total === 0 ? 0 : Math.round((doneCount / total) * 100)}%`, background: color, borderRadius: 99, transition: "width 0.5s ease" }} />
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-4">
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Aucune tâche</p>
          <button onClick={onAdd} style={{
            marginTop: 8, fontSize: 11, padding: "4px 12px", borderRadius: 8,
            background: `${color}15`, border: `1px solid ${color}30`, color, cursor: "pointer",
          }}>+ Ajouter</button>
        </div>
      ) : (
        <>
          <StatusBlock items={todo}     col={COLUMNS[0]} />
          <StatusBlock items={progress} col={COLUMNS[1]} />
          <StatusBlock items={done}     col={COLUMNS[2]} />
          <button onClick={onAdd} style={{
            width: "100%", padding: "7px 0", borderRadius: 8, cursor: "pointer", marginTop: 4,
            background: "transparent", border: `1px dashed ${color}30`,
            color: `${color}80`, fontSize: 11,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}08`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          ><Plus className="w-3 h-3" /> Ajouter une tâche</button>
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function TasksPage() {
  const { tasks, loading } = useTasks();
  const { activeBusiness } = useBusiness();
  const [showModal,   setShowModal]   = useState(false);
  const [modalStatus, setModalStatus] = useState<TaskStatus>("todo");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode,    setViewMode]    = useState<"columns" | "categories">("categories");
  const [catFilter,   setCatFilter]   = useState<"all" | TaskBusiness>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");

  const today   = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => tasks.filter(t => {
    if (catFilter    !== "all" && t.business !== catFilter) return false;
    if (statusFilter !== "all" && t.status   !== statusFilter) return false;
    return true;
  }), [tasks, catFilter, statusFilter]);

  const openAdd = useCallback((status: TaskStatus = "todo") => {
    setModalStatus(status);
    setShowModal(true);
  }, []);

  const active = useMemo(() => tasks.filter(t => t.status !== "done").length, [tasks]);
  const done   = useMemo(() => tasks.filter(t => t.status === "done").length, [tasks]);

  // late count (deadline past and not done)
  const lateCount = useMemo(() => tasks.filter(t => !!t.deadline && t.deadline < today && t.status !== "done").length, [tasks, today]);

  // Group tasks by business category within each column
  const getGroupedTasks = useCallback((colTasks: Task[]) => {
    const groups: Record<TaskBusiness, Task[]> = { coaching: [], casino: [], content: [], equipe: [] };
    for (const t of colTasks) groups[t.business].push(t);
    return (Object.entries(groups) as [TaskBusiness, Task[]][]).filter(([, arr]) => arr.length > 0);
  }, []);

  // Tasks per business for category view
  const tasksByBiz = useMemo(() => {
    const r: Record<TaskBusiness, Task[]> = { coaching: [], casino: [], content: [], equipe: [] };
    for (const t of filtered) r[t.business].push(t);
    return r;
  }, [filtered]);

  // ─── Skeleton loading state ───────────────────────────────
  if (loading) {
    return (
      <div className="p-4 lg:p-6 min-h-screen max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div style={{ width: 120, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", marginBottom: 8 }} />
            <div style={{ width: 160, height: 14, borderRadius: 6, background: "rgba(255,255,255,0.04)" }} />
          </div>
          <div style={{ width: 140, height: 38, borderRadius: 12, background: "rgba(168,85,247,0.15)", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => (
            <div key={col.status} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ height: 20, width: "60%", borderRadius: 6, background: "rgba(255,255,255,0.06)" }} />
              {Array.from({ length: 3 }).map((_, i) => <TaskSkeleton key={i} />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Category view ────────────────────────────────────────
  const CAT_TABS: { val: "all" | TaskBusiness; label: string; color: string }[] = [
    { val: "all",      label: "Toutes",  color: "#a855f7" },
    { val: "coaching", label: "Coaching", color: BIZ_COLORS.coaching },
    { val: "casino",   label: "Casino",   color: BIZ_COLORS.casino },
    { val: "content",  label: "Contenu",  color: BIZ_COLORS.content },
    { val: "equipe",   label: "Équipe",   color: BIZ_COLORS.equipe },
  ];

  return (
    <div className="p-4 lg:p-6 min-h-screen max-w-6xl animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>Tâches</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
            {active} active{active !== 1 ? "s" : ""} · {done} terminée{done !== 1 ? "s" : ""}
            {lateCount > 0 && <span style={{ color: "#ef4444", fontWeight: 700 }}> · {lateCount} en retard</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
            <button onClick={() => setViewMode("categories")} style={{
              padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
              background: viewMode === "categories" ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.05)",
              color: viewMode === "categories" ? "#fff" : "rgba(255,255,255,0.55)",
              transition: "all 0.15s",
            }}>Catégories</button>
            <button onClick={() => setViewMode("columns")} style={{
              padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
              background: viewMode === "columns" ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.05)",
              color: viewMode === "columns" ? "#fff" : "rgba(255,255,255,0.55)",
              transition: "all 0.15s",
            }}>Kanban</button>
          </div>
          <button
            onClick={() => openAdd()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: activeBusiness.gradient, boxShadow: `0 4px 12px ${activeBusiness.glow}` }}
          >
            <Plus className="w-4 h-4" /> Nouvelle tâche
          </button>
        </div>
      </div>

      {/* Progress overview bar */}
      {tasks.length > 0 && (
        <div className="mb-4 p-3 rounded-xl flex items-center gap-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {COLUMNS.map(col => {
            const count = tasks.filter(t => t.status === col.status).length;
            const total = tasks.length;
            const pct = total === 0 ? 0 : Math.round((count / total) * 100);
            return (
              <div key={col.status} className="flex items-center gap-2 flex-1 min-w-0">
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, flexShrink: 0 }} />
                <div style={{ flex: 1, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: col.color, borderRadius: 99, transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)" }} />
                </div>
                <span style={{ fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CATEGORY VIEW ─────────────────────────────────── */}
      {viewMode === "categories" && (
        <>
          {/* Category tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {CAT_TABS.map(tab => {
              const count = tab.val === "all"
                ? tasks.filter(t => t.status !== "done").length
                : tasks.filter(t => t.business === tab.val && t.status !== "done").length;
              return (
                <button key={tab.val} onClick={() => setCatFilter(tab.val)} style={{
                  flexShrink: 0, padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s ease",
                  background: catFilter === tab.val ? `${tab.color}25` : "rgba(255,255,255,0.05)",
                  border: catFilter === tab.val ? `1.5px solid ${tab.color}` : "1.5px solid rgba(255,255,255,0.1)",
                  color: catFilter === tab.val ? "#fff" : "rgba(255,255,255,0.65)",
                }}>
                  {tab.val !== "all" && (
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: tab.color, display: "inline-block", flexShrink: 0 }} />
                  )}
                  {tab.label}
                  {count > 0 && (
                    <span style={{
                      background: catFilter === tab.val ? tab.color : "rgba(255,255,255,0.12)",
                      color: catFilter === tab.val ? "#fff" : "rgba(255,255,255,0.7)",
                      borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "0px 6px", minWidth: 18, textAlign: "center",
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Status sub-filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {([["all", "Toutes"], ["todo", "À faire"], ["progress", "En cours"], ["done", "Terminées"]] as const).map(([val, label]) => (
              <button key={val} onClick={() => setStatusFilter(val)} style={{
                padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: statusFilter === val ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                border: statusFilter === val ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
                color: statusFilter === val ? "#fff" : "rgba(255,255,255,0.6)",
                transition: "all 0.15s ease",
              }}>{label}</button>
            ))}
          </div>

          {/* Category sections */}
          {catFilter === "all"
            ? (["coaching", "casino", "content", "equipe"] as TaskBusiness[]).map(biz => (
                <CategorySection
                  key={biz}
                  biz={biz}
                  tasks={tasksByBiz[biz]}
                  onEdit={setEditingTask}
                  onAdd={() => openAdd("todo")}
                />
              ))
            : (
              <CategorySection
                biz={catFilter as TaskBusiness}
                tasks={tasksByBiz[catFilter as TaskBusiness]}
                onEdit={setEditingTask}
                onAdd={() => openAdd("todo")}
              />
            )
          }
        </>
      )}

      {/* ── KANBAN VIEW ───────────────────────────────────── */}
      {viewMode === "columns" && (
        <>
          {/* Status filter chips */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {([["all", "Toutes"], ["todo", "À faire"], ["progress", "En cours"], ["done", "Terminées"]] as const).map(([val, label]) => (
              <button key={val} onClick={() => setStatusFilter(val as any)} style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: statusFilter === val ? `${activeBusiness.accent}22` : "rgba(255,255,255,0.05)",
                border: statusFilter === val ? `1px solid ${activeBusiness.accent}` : "1px solid rgba(255,255,255,0.1)",
                color: statusFilter === val ? activeBusiness.accent : "rgba(255,255,255,0.7)",
                transition: "all 0.15s ease",
              }}>{label}</button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.status);
              const groups   = getGroupedTasks(colTasks);
              return (
                <div key={col.status} className="rounded-2xl p-4 flex flex-col gap-3" style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ProgressRing done={col.status === "done" ? colTasks.length : 0} total={Math.max(colTasks.length, 1)} color={col.color} />
                      <span className="text-sm font-bold" style={{ color: "#fff" }}>{col.emoji} {col.label}</span>
                    </div>
                    <span style={{ background: `${col.color}20`, color: col.color, borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "2px 9px" }}>{colTasks.length}</span>
                  </div>
                  <div className="flex flex-col gap-2" style={{ minHeight: 60 }}>
                    {colTasks.length === 0
                      ? <EmptyState status={col.status} onAdd={() => openAdd(col.status)} />
                      : groups.map(([biz, bizTasks]) => (
                          <div key={biz}>
                            <CategoryGroupHeader biz={biz} tasks={bizTasks} />
                            <div className="flex flex-col gap-1.5 pl-1">
                              {bizTasks.map((t, i) => <TaskCard key={t.id} task={t} onEdit={() => setEditingTask(t)} animationDelay={i * 30} />)}
                            </div>
                            <div style={{ height: 8 }} />
                          </div>
                        ))
                    }
                  </div>
                  <button onClick={() => openAdd(col.status)} style={{
                    width: "100%", padding: "8px 0", borderRadius: 8, cursor: "pointer",
                    background: "transparent", border: `1px dashed ${col.color}35`,
                    color: `${col.color}80`, fontSize: 12,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${col.color}08`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  ><Plus className="w-3 h-3" /> Ajouter</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showModal    && <AddModal onClose={() => setShowModal(false)} defaultStatus={modalStatus} />}
      {editingTask  && <EditModal task={editingTask} onClose={() => setEditingTask(null)} />}
    </div>
  );
}

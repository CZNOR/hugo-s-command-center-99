import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useTasks, type Task, type TaskBusiness, type TaskPriority } from "@/lib/taskContext";

// ─── Config ──────────────────────────────────────────────────
const BIZ: Record<TaskBusiness, { label: string; color: string }> = {
  coaching: { label: "Coaching", color: "#7c3aed" },
  casino:   { label: "Casino",   color: "#00cc44" },
  content:  { label: "Contenu",  color: "#f97316" },
  equipe:   { label: "Équipe",   color: "#3b82f6" },
};

const PRIO: Record<TaskPriority, { label: string; color: string; border: string }> = {
  haute:   { label: "Haute",   color: "#ef4444",              border: "#ef4444"                    },
  normale: { label: "Normale", color: "rgba(255,255,255,0.5)", border: "rgba(255,255,255,0.15)"     },
  basse:   { label: "Basse",   color: "rgba(255,255,255,0.3)", border: "rgba(255,255,255,0.06)"     },
};

// ─── Helpers ─────────────────────────────────────────────────
function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getWeekDays(): Date[] {
  const now  = new Date();
  const dow  = (now.getDay() + 6) % 7; // 0 = Mon
  const mon  = new Date(now);
  mon.setDate(now.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function fmtDay(d: Date): string {
  return d.toISOString().split("T")[0];
}

const FR_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// ─── Checkbox ────────────────────────────────────────────────
function RoundCheck({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
        border: checked ? "none" : "1.5px solid rgba(255,255,255,0.22)",
        background: checked ? "#7c3aed" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.15s ease",
      }}
    >
      {checked && <Check style={{ width: 10, height: 10, color: "#fff", strokeWidth: 3 }} />}
    </button>
  );
}

// ─── Biz pill ─────────────────────────────────────────────────
function BizPill({ business }: { business: TaskBusiness }) {
  const { color, label } = BIZ[business];
  return (
    <span style={{
      background: `${color}22`,
      color,
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 600,
      padding: "1px 7px",
      letterSpacing: "0.04em",
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ─── Task row (today column) ──────────────────────────────────
function TodayTaskRow({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const prioConfig = PRIO[task.priority];
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 10px",
        borderRadius: 10,
        borderLeft: `2px solid ${prioConfig.border}`,
        background: task.done ? "transparent" : "rgba(255,255,255,0.02)",
        transition: "all 0.15s ease",
        opacity: task.done ? 0.45 : 1,
      }}
    >
      <RoundCheck checked={task.done} onToggle={() => onToggle(task.id)} />
      <span style={{
        flex: 1, fontSize: 13,
        color: task.done ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.8)",
        textDecoration: task.done ? "line-through" : "none",
        transition: "all 0.15s ease",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {task.title}
      </span>
      <BizPill business={task.business} />
      {task.deadline && task.deadline !== todayStr() && (
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>
          {task.deadline.slice(5).replace("-", "/")}
        </span>
      )}
    </div>
  );
}

// ─── Week task pill ───────────────────────────────────────────
function WeekTaskPill({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const { color } = BIZ[task.business];
  return (
    <button
      onClick={() => onToggle(task.id)}
      title={task.title}
      style={{
        width: "100%", textAlign: "left",
        background: `${color}14`,
        borderLeft: `2px solid ${task.done ? "rgba(255,255,255,0.1)" : color}`,
        borderRadius: 6,
        padding: "3px 6px",
        fontSize: 11,
        color: task.done ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.75)",
        textDecoration: task.done ? "line-through" : "none",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {task.title}
    </button>
  );
}

// ─── Main TaskBoard ───────────────────────────────────────────
export default function TaskBoard() {
  const { tasks, toggle, addTask } = useTasks();

  // Form state
  const [title,    setTitle]    = useState("");
  const [business, setBusiness] = useState<TaskBusiness>("coaching");
  const [priority, setPriority] = useState<TaskPriority>("normale");
  const [deadline, setDeadline] = useState("");

  const handleAdd = () => {
    if (!title.trim()) return;
    addTask(title.trim(), business, priority, deadline || undefined);
    setTitle("");
    setDeadline("");
  };

  const prefillDate = (dateStr: string) => setDeadline(dateStr);

  // Derived
  const today = todayStr();
  const todayTasks = tasks
    .filter(t => !t.deadline || t.deadline === today)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const prioOrder: Record<TaskPriority, number> = { haute: 0, normale: 1, basse: 2 };
      return prioOrder[a.priority] - prioOrder[b.priority];
    });

  const weekDays = getWeekDays();

  // Card style
  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: 16,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    outline: "none",
    transition: "border-color 0.15s ease",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── SECTION 1 : Aujourd'hui ─────────────────────────── */}
      <div style={{ ...card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Left — Add form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
            Nouvelle tâche
          </p>

          {/* Title input */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="Ce que tu dois faire..."
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
            onBlur={e  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
          />

          {/* Business pills */}
          <div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>Business</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(Object.keys(BIZ) as TaskBusiness[]).map(b => {
                const active = business === b;
                return (
                  <button
                    key={b}
                    onClick={() => setBusiness(b)}
                    style={{
                      borderRadius: 20, fontSize: 11, fontWeight: 600,
                      padding: "4px 10px",
                      background: active ? `${BIZ[b].color}22` : "rgba(255,255,255,0.04)",
                      color: active ? BIZ[b].color : "rgba(255,255,255,0.35)",
                      border: active ? `1px solid ${BIZ[b].color}40` : "1px solid rgba(255,255,255,0.07)",
                      cursor: "pointer", transition: "all 0.15s ease",
                    }}
                  >
                    {BIZ[b].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority pills */}
          <div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>Priorité</p>
            <div style={{ display: "flex", gap: 6 }}>
              {(Object.keys(PRIO) as TaskPriority[]).map(p => {
                const active = priority === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    style={{
                      borderRadius: 20, fontSize: 11, fontWeight: 600,
                      padding: "4px 10px",
                      background: active ? `${PRIO[p].color}18` : "rgba(255,255,255,0.04)",
                      color: active ? PRIO[p].color : "rgba(255,255,255,0.3)",
                      border: active ? `1px solid ${PRIO[p].border}` : "1px solid rgba(255,255,255,0.07)",
                      cursor: "pointer", transition: "all 0.15s ease",
                    }}
                  >
                    {PRIO[p].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>Deadline (optionnel)</p>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              style={{ ...inputStyle, colorScheme: "dark" }}
              onFocus={e => (e.currentTarget.style.borderColor = "#7c3aed")}
              onBlur={e  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleAdd}
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "#fff", borderRadius: 10,
              padding: "9px 0", fontSize: 13, fontWeight: 600,
              width: "100%", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "opacity 0.15s ease",
              opacity: title.trim() ? 1 : 0.5,
              marginTop: "auto",
            }}
          >
            <Plus style={{ width: 14, height: 14 }} /> Ajouter
          </button>
        </div>

        {/* Right — Today tasks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
              Aujourd'hui
            </p>
            <span style={{
              background: "rgba(168,85,247,0.15)", color: "#c084fc",
              borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "2px 8px",
            }}>
              {todayTasks.filter(t => !t.done).length} à faire
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", maxHeight: 300, display: "flex", flexDirection: "column", gap: 4 }}>
            {todayTasks.length === 0 ? (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 40 }}>
                Aucune tâche pour aujourd'hui
              </p>
            ) : (
              todayTasks.map(t => <TodayTaskRow key={t.id} task={t} onToggle={toggle} />)
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 2 : Cette semaine ───────────────────────── */}
      <div style={card}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>
          Cette semaine
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {weekDays.map((day, i) => {
            const dayStr   = fmtDay(day);
            const isToday  = dayStr === today;
            const dayTasks = tasks.filter(t => t.deadline === dayStr);

            return (
              <div
                key={dayStr}
                style={{
                  borderRadius: 12,
                  padding: "10px 8px",
                  background: isToday ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.02)",
                  border: isToday ? "1px solid rgba(168,85,247,0.25)" : "1px solid rgba(255,255,255,0.05)",
                  display: "flex", flexDirection: "column", gap: 5,
                  minHeight: 120,
                }}
              >
                {/* Day header */}
                <div style={{ textAlign: "center", marginBottom: 4 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: isToday ? "#a855f7" : "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>
                    {FR_DAYS[i]}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: isToday ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)" }}>
                    {day.getDate()}
                  </p>
                </div>

                {/* Tasks */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                  {dayTasks.map(t => (
                    <WeekTaskPill key={t.id} task={t} onToggle={toggle} />
                  ))}
                </div>

                {/* + button */}
                <button
                  onClick={() => prefillDate(dayStr)}
                  style={{
                    width: "100%", borderRadius: 6, padding: "3px 0",
                    background: "transparent",
                    border: "1px dashed rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 14, lineHeight: 1, cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)"; }}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

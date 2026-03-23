import { useState } from "react";
import { Check, Plus, Phone } from "lucide-react";
import { useTasks, type Task, type TaskBusiness, type TaskPriority } from "@/lib/taskContext";

// ─── Config ──────────────────────────────────────────────────
const BIZ: Record<TaskBusiness, { label: string; color: string }> = {
  coaching: { label: "Coaching", color: "#7c3aed" },
  casino:   { label: "Casino",   color: "#00cc44" },
  content:  { label: "Contenu",  color: "#f97316" },
  equipe:   { label: "Équipe",   color: "#3b82f6" },
};

const PRIO: Record<TaskPriority, { label: string; color: string; border: string }> = {
  haute:   { label: "Haute",   color: "#ef4444",               border: "#ef4444"              },
  normale: { label: "Normale", color: "rgba(255,255,255,0.45)", border: "rgba(255,255,255,0.14)" },
  basse:   { label: "Basse",   color: "rgba(255,255,255,0.25)", border: "rgba(255,255,255,0.06)" },
};

// Hour slots shown in week view
const HOUR_SLOTS = ["9:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

const FR_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// ─── Helpers ─────────────────────────────────────────────────
function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getWeekDays(): Date[] {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const mon = new Date(now);
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

/** Opacity based on distance from today */
function dayOpacity(distance: number): number {
  if (distance === 0) return 1;
  if (distance === 1) return 0.58;
  if (distance === 2) return 0.38;
  return 0.22;
}

/** Match a task time to a slot (exact or nearest earlier slot) */
function slotForTime(time: string): string | null {
  if (!time) return null;
  const [h] = time.split(":").map(Number);
  // find latest slot <= task hour
  let best: string | null = null;
  for (const slot of HOUR_SLOTS) {
    const [sh] = slot.split(":").map(Number);
    if (sh <= h) best = slot;
  }
  return best;
}

// ─── Checkbox ────────────────────────────────────────────────
function RoundCheck({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 17, height: 17, borderRadius: "50%", flexShrink: 0,
        border: checked ? "none" : "1.5px solid rgba(255,255,255,0.2)",
        background: checked ? "#7c3aed" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.15s ease",
      }}
    >
      {checked && <Check style={{ width: 9, height: 9, color: "#fff", strokeWidth: 3 }} />}
    </button>
  );
}

// ─── BizPill ─────────────────────────────────────────────────
function BizPill({ business }: { business: TaskBusiness }) {
  const { color, label } = BIZ[business];
  return (
    <span style={{
      background: `${color}20`, color, borderRadius: 20,
      fontSize: 10, fontWeight: 600, padding: "1px 7px", flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ─── Today task row ───────────────────────────────────────────
function TodayRow({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const prio = PRIO[task.priority];
  const isCall = !!task.time;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "7px 10px", borderRadius: 10,
      borderLeft: `2px solid ${prio.border}`,
      background: task.done ? "transparent" : "rgba(255,255,255,0.025)",
      opacity: task.done ? 0.4 : 1,
      transition: "all 0.15s ease",
    }}>
      <RoundCheck checked={task.done} onToggle={() => onToggle(task.id)} />
      {isCall && !task.done && (
        <Phone style={{ width: 11, height: 11, color: "#a855f7", flexShrink: 0 }} />
      )}
      <span style={{
        flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        color: task.done ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.82)",
        textDecoration: task.done ? "line-through" : "none",
      }}>
        {task.title}
      </span>
      {task.time && (
        <span style={{ fontSize: 10, color: "#a855f7", fontWeight: 600, flexShrink: 0, fontFamily: "monospace" }}>
          {task.time}
        </span>
      )}
      <BizPill business={task.business} />
    </div>
  );
}

// ─── Week task pill ───────────────────────────────────────────
function WeekPill({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const { color } = BIZ[task.business];
  return (
    <button
      onClick={() => onToggle(task.id)}
      title={task.title}
      style={{
        width: "100%", textAlign: "left",
        background: task.done ? "rgba(255,255,255,0.03)" : `${color}18`,
        borderLeft: `2px solid ${task.done ? "rgba(255,255,255,0.08)" : color}`,
        borderRadius: 5,
        padding: "3px 6px",
        fontSize: 11,
        color: task.done ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.8)",
        textDecoration: task.done ? "line-through" : "none",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        cursor: "pointer",
        transition: "all 0.15s ease",
        display: "flex", alignItems: "center", gap: 4,
      }}
    >
      {task.time && <Phone style={{ width: 9, height: 9, flexShrink: 0, color }} />}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</span>
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
  const [time,     setTime]     = useState("");

  const handleAdd = () => {
    if (!title.trim()) return;
    addTask(title.trim(), business, priority, deadline || undefined, time || undefined);
    setTitle("");
    setTime("");
    setDeadline("");
  };

  const prefillDate = (dateStr: string) => setDeadline(dateStr);

  // Derived values
  const today    = todayStr();
  const weekDays = getWeekDays();
  const todayIdx = weekDays.findIndex(d => fmtDay(d) === today);

  const todayTasks = tasks
    .filter(t => !t.deadline || t.deadline === today)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const po: Record<TaskPriority, number> = { haute: 0, normale: 1, basse: 2 };
      if (po[a.priority] !== po[b.priority]) return po[a.priority] - po[b.priority];
      // calls first
      return (b.time ? 1 : 0) - (a.time ? 1 : 0);
    });

  // Shared card style
  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: 16,
  };

  const inputCss: React.CSSProperties = {
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

  const focusBorder = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#7c3aed"; },
    onBlur:  (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ══ BLOC 1 — Aujourd'hui ══════════════════════════════ */}
      <div style={{ ...card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Left — Formulaire */}
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
            Nouvelle tâche
          </p>

          <input value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="Ce que tu dois faire..." style={inputCss} {...focusBorder} />

          {/* Business pills */}
          <div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", marginBottom: 5 }}>Business</p>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {(Object.keys(BIZ) as TaskBusiness[]).map(b => {
                const active = business === b;
                return (
                  <button key={b} onClick={() => setBusiness(b)} style={{
                    borderRadius: 20, fontSize: 11, fontWeight: 600, padding: "4px 10px",
                    background: active ? `${BIZ[b].color}22` : "rgba(255,255,255,0.04)",
                    color: active ? BIZ[b].color : "rgba(255,255,255,0.3)",
                    border: active ? `1px solid ${BIZ[b].color}50` : "1px solid rgba(255,255,255,0.07)",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}>
                    {BIZ[b].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority pills */}
          <div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", marginBottom: 5 }}>Priorité</p>
            <div style={{ display: "flex", gap: 5 }}>
              {(Object.keys(PRIO) as TaskPriority[]).map(p => {
                const active = priority === p;
                return (
                  <button key={p} onClick={() => setPriority(p)} style={{
                    borderRadius: 20, fontSize: 11, fontWeight: 600, padding: "4px 10px",
                    background: active ? `${PRIO[p].color}18` : "rgba(255,255,255,0.04)",
                    color: active ? PRIO[p].color : "rgba(255,255,255,0.25)",
                    border: active ? `1px solid ${PRIO[p].border}` : "1px solid rgba(255,255,255,0.07)",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}>
                    {PRIO[p].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deadline + heure */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", marginBottom: 5 }}>Date (optionnel)</p>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                style={{ ...inputCss, colorScheme: "dark" }} {...focusBorder} />
            </div>
            <div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", marginBottom: 5 }}>Heure call</p>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                style={{ ...inputCss, colorScheme: "dark" }} {...focusBorder} />
            </div>
          </div>

          <button onClick={handleAdd} style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff", borderRadius: 10, padding: "9px 0",
            fontSize: 13, fontWeight: 600, width: "100%", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            opacity: title.trim() ? 1 : 0.5, transition: "opacity 0.15s ease",
            marginTop: "auto",
          }}>
            <Plus style={{ width: 14, height: 14 }} /> Ajouter
          </button>
        </div>

        {/* Right — Aujourd'hui */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Aujourd'hui</p>
            <span style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc", borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "2px 8px" }}>
              {todayTasks.filter(t => !t.done).length} à faire
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", maxHeight: 290, display: "flex", flexDirection: "column", gap: 4 }}>
            {todayTasks.length === 0
              ? <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", textAlign: "center", marginTop: 40 }}>Aucune tâche</p>
              : todayTasks.map(t => <TodayRow key={t.id} task={t} onToggle={toggle} />)
            }
          </div>
        </div>
      </div>

      {/* ══ BLOC 2 — Planning semaine ═════════════════════════ */}
      <div style={{ ...card, padding: "14px 14px 10px" }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 10 }}>
          Planning de la semaine
        </p>

        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>

          {/* Hour axis */}
          <div style={{ flexShrink: 0, paddingTop: 38, display: "flex", flexDirection: "column" }}>
            {HOUR_SLOTS.map(h => (
              <div key={h} style={{ height: 34, display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", fontFamily: "monospace", width: 32, textAlign: "right", paddingRight: 6 }}>{h}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, i) => {
            const dayStr   = fmtDay(day);
            const isToday  = dayStr === today;
            const dist     = Math.abs(i - todayIdx);
            const opacity  = dayOpacity(dist);
            const dayTasks = tasks.filter(t => t.deadline === dayStr);

            // Map tasks to slots
            const slotMap: Record<string, Task[]> = {};
            for (const slot of HOUR_SLOTS) slotMap[slot] = [];
            const unslotted: Task[] = [];
            for (const t of dayTasks) {
              const s = t.time ? slotForTime(t.time) : null;
              if (s) slotMap[s].push(t);
              else unslotted.push(t);
            }

            return (
              <div
                key={dayStr}
                style={{
                  flex: isToday ? "1.7 1 0" : "1 1 0",
                  opacity,
                  transition: "opacity 0.4s ease, flex 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                {/* Day header */}
                <div style={{
                  textAlign: "center",
                  padding: "6px 4px 8px",
                  borderRadius: "10px 10px 0 0",
                  background: isToday ? "rgba(168,85,247,0.12)" : "transparent",
                  border: isToday ? "1px solid rgba(168,85,247,0.25)" : "1px solid transparent",
                  borderBottom: "none",
                  marginBottom: 0,
                }}>
                  <p style={{ fontSize: isToday ? 11 : 10, fontWeight: 700, letterSpacing: "0.06em", color: isToday ? "#a855f7" : "rgba(255,255,255,0.3)" }}>
                    {FR_DAYS[i]}
                  </p>
                  <p style={{ fontSize: isToday ? 20 : 14, fontWeight: 800, color: isToday ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)", lineHeight: 1.1, marginTop: 1 }}>
                    {day.getDate()}
                  </p>
                  {isToday && <div style={{ width: 20, height: 2, background: "#a855f7", borderRadius: 2, margin: "4px auto 0", boxShadow: "0 0 8px #a855f7" }} />}
                </div>

                {/* Hour grid */}
                <div style={{
                  border: isToday ? "1px solid rgba(168,85,247,0.2)" : "1px solid rgba(255,255,255,0.05)",
                  borderTop: "none",
                  borderRadius: "0 0 10px 10px",
                  overflow: "hidden",
                }}>
                  {HOUR_SLOTS.map((slot, si) => {
                    const slotTasks = slotMap[slot];
                    return (
                      <div key={slot} style={{
                        height: 34,
                        borderTop: si === 0 ? "none" : `1px solid ${isToday ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.03)"}`,
                        padding: "2px 4px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        background: isToday && si % 2 === 0 ? "rgba(168,85,247,0.03)" : "transparent",
                        position: "relative",
                      }}>
                        {slotTasks.map(t => <WeekPill key={t.id} task={t} onToggle={toggle} />)}
                      </div>
                    );
                  })}

                  {/* Unslotted tasks + add button */}
                  <div style={{
                    borderTop: `1px solid ${isToday ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.04)"}`,
                    padding: "4px 4px",
                    display: "flex", flexDirection: "column", gap: 2,
                  }}>
                    {unslotted.map(t => <WeekPill key={t.id} task={t} onToggle={toggle} />)}
                    <button
                      onClick={() => prefillDate(dayStr)}
                      style={{
                        width: "100%", borderRadius: 5, padding: "2px 0",
                        background: "transparent",
                        border: "1px dashed rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.18)",
                        fontSize: 13, lineHeight: 1, cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.18)"; }}
                    >+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

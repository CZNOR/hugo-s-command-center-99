import { useState, Fragment } from "react";
import { Check, Plus, Phone, Trash2 } from "lucide-react";
import { useTasks, type Task, type TaskBusiness, type TaskPriority } from "@/lib/taskContext";
import { createCalendarEvent, isAuthenticated } from "@/lib/googleCalendar";

// ─── Config ──────────────────────────────────────────────────
const BIZ: Record<TaskBusiness, { label: string; color: string }> = {
  coaching: { label: "Coaching", color: "#7c3aed" },
  casino:   { label: "Casino",   color: "#00cc44" },
  content:  { label: "Contenu",  color: "#f97316" },
  equipe:   { label: "Équipe",   color: "#3b82f6" },
};

const PRIO: Record<TaskPriority, { label: string; color: string; border: string }> = {
  haute:   { label: "Haute",   color: "#ef4444",               border: "#ef4444"               },
  normale: { label: "Normale", color: "rgba(255,255,255,0.45)", border: "rgba(255,255,255,0.15)" },
  basse:   { label: "Basse",   color: "rgba(255,255,255,0.25)", border: "rgba(255,255,255,0.07)" },
};

const HOUR_SLOTS = ["9:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const FR_DAYS    = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Google Calendar colorId mapping per business
// 3=Grape(purple), 2=Sage(green), 6=Tangerine(orange), 9=Blueberry(blue)
const BIZ_GCAL_COLOR: Record<TaskBusiness, string> = {
  coaching: "3",
  casino:   "2",
  content:  "6",
  equipe:   "9",
};

// ─── Helpers ─────────────────────────────────────────────────
const todayStr  = () => new Date().toISOString().split("T")[0];
const fmtDay    = (d: Date) => d.toISOString().split("T")[0];

function getWeekDays(): Date[] {
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (now.getDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
}

function dayOpacity(dist: number): number {
  return dist === 0 ? 1 : dist === 1 ? 0.55 : dist === 2 ? 0.35 : 0.2;
}

function slotForTime(time: string): string | null {
  const [h] = time.split(":").map(Number);
  let best: string | null = null;
  for (const slot of HOUR_SLOTS) { const [sh] = slot.split(":").map(Number); if (sh <= h) best = slot; }
  return best;
}

// ─── Checkbox ────────────────────────────────────────────────
function RoundCheck({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
      border: checked ? "none" : "1.5px solid rgba(255,255,255,0.22)",
      background: checked ? "#7c3aed" : "transparent",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", transition: "all 0.15s ease",
    }}>
      {checked && <Check style={{ width: 11, height: 11, color: "#fff", strokeWidth: 3 }} />}
    </button>
  );
}

// ─── BizPill ─────────────────────────────────────────────────
function BizPill({ business }: { business: TaskBusiness }) {
  const { color, label } = BIZ[business];
  return (
    <span style={{
      background: `${color}22`, color, borderRadius: 20,
      fontSize: 11, fontWeight: 700, padding: "2px 9px", flexShrink: 0, letterSpacing: "0.03em",
    }}>
      {label}
    </span>
  );
}

// ─── Today task row ───────────────────────────────────────────
function TodayRow({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const prio   = PRIO[task.priority];
  const isDone = task.status === "done";
  const isCall = !!task.time;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 11,
      padding: "10px 14px", borderRadius: 12,
      borderLeft: `2px solid ${prio.border}`,
      background: isDone ? "transparent" : "rgba(255,255,255,0.03)",
      opacity: isDone ? 0.4 : 1,
      transition: "all 0.15s ease",
    }}>
      <RoundCheck checked={isDone} onToggle={() => onToggle(task.id)} />
      {isCall && !isDone && (
        <Phone style={{ width: 13, height: 13, color: "#a855f7", flexShrink: 0 }} />
      )}
      {task.time && (
        <span style={{
          fontSize: 14, fontWeight: 700, flexShrink: 0, fontFamily: "monospace",
          color: isDone ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.92)",
          minWidth: 46,
        }}>
          {task.time}
        </span>
      )}
      <span style={{
        flex: 1, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        color: isDone ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)",
        textDecoration: isDone ? "line-through" : "none",
      }}>
        {task.title}
      </span>
      <BizPill business={task.business} />
    </div>
  );
}

// ─── Week task pill ───────────────────────────────────────────
function WeekPill({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const { color } = BIZ[task.business];
  const isDone = task.status === "done";
  return (
    <button onClick={() => onToggle(task.id)} title={task.title} style={{
      width: "100%", textAlign: "left",
      background: isDone ? "rgba(255,255,255,0.03)" : `${color}1a`,
      borderLeft: `2px solid ${isDone ? "rgba(255,255,255,0.08)" : color}`,
      borderRadius: 6,
      padding: "4px 8px",
      fontSize: 12,
      color: isDone ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.85)",
      textDecoration: isDone ? "line-through" : "none",
      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      cursor: "pointer", transition: "all 0.15s ease",
      display: "flex", alignItems: "center", gap: 5,
    }}>
      {task.time && <Phone style={{ width: 10, height: 10, flexShrink: 0, color }} />}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</span>
    </button>
  );
}

// ─── Main TaskBoard ───────────────────────────────────────────
export default function TaskBoard() {
  const { tasks, toggle, addTask, deleteTask } = useTasks();
  const [title,       setTitle]      = useState("");
  const [business,    setBusiness]   = useState<TaskBusiness>("coaching");
  const [priority,    setPriority]   = useState<TaskPriority>("normale");
  const [deadline,    setDeadline]   = useState("");
  const [time,        setTime]       = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const doneTasks = tasks
    .filter(t => t.status === "done")
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  const handleAdd = () => {
    if (!title.trim()) return;
    const trimmedTitle = title.trim();
    addTask(trimmedTitle, business, priority, deadline || undefined, time || undefined);

    // Sync to Google Calendar (fire-and-forget — fails silently if not connected)
    if (isAuthenticated()) {
      const today = new Date().toISOString().split("T")[0];
      const eventDate = deadline || today;
      const isAllDay  = !time;
      const startStr  = isAllDay ? eventDate : `${eventDate}T${time}:00`;
      const endStr    = isAllDay
        ? undefined
        : new Date(new Date(`${eventDate}T${time}:00`).getTime() + 60 * 60 * 1000).toISOString();

      createCalendarEvent({
        summary:     trimmedTitle,
        description: business.includes("coaching") ? "[coaching]" : undefined,
        start:       startStr,
        end:         endStr,
        allDay:      isAllDay,
        colorId:     BIZ_GCAL_COLOR[business],
      }).catch(err => console.warn("[gcal] event creation failed:", err));
    }

    setTitle(""); setTime(""); setDeadline("");
  };

  const prefillDate = (d: string) => setDeadline(d);

  const today    = todayStr();
  const weekDays = getWeekDays();
  const todayIdx = weekDays.findIndex(d => fmtDay(d) === today);

  const todayTasks = tasks
    .filter(t => !t.deadline || t.deadline === today)
    .sort((a, b) => {
      const aDone = a.status === "done", bDone = b.status === "done";
      if (aDone !== bDone) return aDone ? 1 : -1;
      const po: Record<TaskPriority, number> = { haute: 0, normale: 1, basse: 2 };
      if (po[a.priority] !== po[b.priority]) return po[a.priority] - po[b.priority];
      return (b.time ? 1 : 0) - (a.time ? 1 : 0);
    });

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
  };

  const inputCss: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 10, padding: "10px 14px",
    fontSize: 14, color: "rgba(255,255,255,0.85)",
    outline: "none", transition: "border-color 0.15s ease",
  };

  const focusBorder = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#7c3aed"; },
    onBlur:  (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; },
  };

  const labelCss: React.CSSProperties = {
    fontSize: 11, color: "rgba(255,255,255,0.28)", marginBottom: 7,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ══ BLOC 1 — Deux cards côte à côte ══════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* LEFT — Formulaire */}
        <div className="glass-card" style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
            Nouvelle tâche
          </p>

          <input className="task-input" value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="Ce que tu dois faire..." style={inputCss} {...focusBorder} />

          {/* Business */}
          <div>
            <p style={labelCss}>Business</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(Object.keys(BIZ) as TaskBusiness[]).map(b => {
                const active = business === b;
                return (
                  <button key={b} onClick={() => setBusiness(b)} style={{
                    borderRadius: 20, fontSize: 12, fontWeight: 600, padding: "5px 13px",
                    background: active ? `${BIZ[b].color}22` : "rgba(255,255,255,0.04)",
                    color: active ? BIZ[b].color : "rgba(255,255,255,0.35)",
                    border: active ? `1px solid ${BIZ[b].color}55` : "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}>
                    {BIZ[b].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priorité */}
          <div>
            <p style={labelCss}>Priorité</p>
            <div style={{ display: "flex", gap: 6 }}>
              {(Object.keys(PRIO) as TaskPriority[]).map(p => {
                const active = priority === p;
                return (
                  <button key={p} onClick={() => setPriority(p)} style={{
                    borderRadius: 20, fontSize: 12, fontWeight: 600, padding: "5px 13px",
                    background: active ? `${PRIO[p].color}18` : "rgba(255,255,255,0.04)",
                    color: active ? PRIO[p].color : "rgba(255,255,255,0.3)",
                    border: active ? `1px solid ${PRIO[p].border}` : "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}>
                    {PRIO[p].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date + heure */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <p style={labelCss}>Date</p>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                style={{ ...inputCss, colorScheme: "dark" }} {...focusBorder} />
            </div>
            <div>
              <p style={labelCss}>Heure call</p>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                style={{ ...inputCss, colorScheme: "dark" }} {...focusBorder} />
            </div>
          </div>

          <button onClick={handleAdd} style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff", borderRadius: 11, padding: "12px 0",
            fontSize: 14, fontWeight: 700, width: "100%", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            opacity: title.trim() ? 1 : 0.45, transition: "opacity 0.15s ease",
            marginTop: "auto",
          }}>
            <Plus style={{ width: 16, height: 16 }} /> Ajouter
          </button>
        </div>

        {/* RIGHT — Aujourd'hui / Historique */}
        <div className="glass-card" style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  fontSize: 13, fontWeight: 700, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                  background: !showHistory ? "rgba(168,85,247,0.18)" : "transparent",
                  color: !showHistory ? "#c084fc" : "rgba(255,255,255,0.35)",
                  border: !showHistory ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
                }}
              >Aujourd'hui</button>
              <button
                onClick={() => setShowHistory(true)}
                style={{
                  fontSize: 13, fontWeight: 700, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                  background: showHistory ? "rgba(255,255,255,0.08)" : "transparent",
                  color: showHistory ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                  border: showHistory ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
                }}
              >Historique</button>
            </div>
            {!showHistory && (
              <span style={{ background: "rgba(168,85,247,0.18)", color: "#c084fc", borderRadius: 20, fontSize: 12, fontWeight: 700, padding: "3px 11px" }}>
                {todayTasks.filter(t => t.status !== "done").length} à faire
              </span>
            )}
            {showHistory && (
              <span style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", borderRadius: 20, fontSize: 12, fontWeight: 700, padding: "3px 11px" }}>
                {doneTasks.length} terminées
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", maxHeight: 320, display: "flex", flexDirection: "column", gap: 0 }}>
            {!showHistory ? (
              todayTasks.length === 0 ? (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.18)", textAlign: "center", marginTop: 40 }}>Aucune tâche pour aujourd'hui</p>
              ) : (() => {
                const bizOrder: TaskBusiness[] = ["coaching", "casino", "content", "equipe"];
                const groups = bizOrder
                  .map(biz => ({ biz, items: todayTasks.filter(t => t.business === biz) }))
                  .filter(g => g.items.length > 0);
                return groups.map((group, gi) => (
                  <Fragment key={group.biz}>
                    {gi > 0 && <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 0" }} />}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {group.items.map((t, idx) => (
                        <div key={t.id} className="task-slide-in" style={{ animationDelay: `${(gi * 10 + idx) * 0.05}s` }}>
                          <TodayRow task={t} onToggle={toggle} />
                        </div>
                      ))}
                    </div>
                  </Fragment>
                ));
              })()
            ) : (
              doneTasks.length === 0 ? (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.18)", textAlign: "center", marginTop: 40 }}>Aucune tâche terminée</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {doneTasks.map(t => (
                    <div key={t.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px", borderRadius: 10,
                      background: "rgba(255,255,255,0.02)",
                      opacity: 0.45,
                    }}>
                      <Check style={{ width: 14, height: 14, color: "#22c55e", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "line-through", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.title}
                        </p>
                        {t.completedAt && (
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>
                            {new Date(t.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                      <BizPill business={t.business} />
                      <button onClick={() => deleteTask(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0, opacity: 0.5 }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.5"}
                      >
                        <Trash2 style={{ width: 13, height: 13, color: "#ef4444" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ══ BLOC 2 — Planning semaine ═════════════════════════ */}
      <div style={{ ...card, padding: "20px 16px 14px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>
          Planning de la semaine
        </p>

        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>

          {/* Hour axis */}
          <div style={{ flexShrink: 0, paddingTop: 54, display: "flex", flexDirection: "column" }}>
            {HOUR_SLOTS.map(h => (
              <div key={h} style={{ height: 40, display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", width: 38, textAlign: "right", paddingRight: 8 }}>{h}</span>
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

            const slotMap: Record<string, Task[]> = {};
            for (const slot of HOUR_SLOTS) slotMap[slot] = [];
            const unslotted: Task[] = [];
            for (const t of dayTasks) {
              const s = t.time ? slotForTime(t.time) : null;
              if (s) slotMap[s].push(t); else unslotted.push(t);
            }

            return (
              <div key={dayStr} style={{
                flex: isToday ? "1.7 1 0" : "1 1 0",
                opacity,
                transition: "opacity 0.4s ease, flex 0.3s ease",
                display: "flex", flexDirection: "column", gap: 0,
              }}>
                {/* Day header */}
                <div style={{
                  textAlign: "center", padding: "8px 6px 10px",
                  borderRadius: "10px 10px 0 0",
                  background: isToday ? "rgba(168,85,247,0.12)" : "transparent",
                  border: isToday ? "1px solid rgba(168,85,247,0.25)" : "1px solid transparent",
                  borderBottom: "none",
                }}>
                  <p style={{ fontSize: isToday ? 13 : 11, fontWeight: 700, letterSpacing: "0.05em", color: isToday ? "#a855f7" : "rgba(255,255,255,0.32)" }}>
                    {FR_DAYS[i]}
                  </p>
                  <p style={{ fontSize: isToday ? 26 : 17, fontWeight: 800, color: isToday ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)", lineHeight: 1.1, marginTop: 2 }}>
                    {day.getDate()}
                  </p>
                  {isToday && <div style={{ width: 22, height: 2, background: "#a855f7", borderRadius: 2, margin: "5px auto 0", boxShadow: "0 0 8px #a855f7" }} />}
                </div>

                {/* Hour grid */}
                <div style={{
                  border: isToday ? "1px solid rgba(168,85,247,0.2)" : "1px solid rgba(255,255,255,0.05)",
                  borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden",
                }}>
                  {HOUR_SLOTS.map((slot, si) => (
                    <div key={slot} style={{
                      height: 40,
                      borderTop: si === 0 ? "none" : `1px solid ${isToday ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.04)"}`,
                      padding: "3px 5px",
                      display: "flex", flexDirection: "column", gap: 2,
                      background: isToday && si % 2 === 0 ? "rgba(168,85,247,0.03)" : "transparent",
                    }}>
                      {slotMap[slot].map(t => <WeekPill key={t.id} task={t} onToggle={toggle} />)}
                    </div>
                  ))}

                  {/* Unslotted + add */}
                  <div style={{
                    borderTop: `1px solid ${isToday ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.04)"}`,
                    padding: "5px 5px",
                    display: "flex", flexDirection: "column", gap: 3,
                  }}>
                    {unslotted.map(t => <WeekPill key={t.id} task={t} onToggle={toggle} />)}
                    <button
                      onClick={() => prefillDate(dayStr)}
                      style={{
                        width: "100%", borderRadius: 6, padding: "4px 0",
                        background: "transparent",
                        border: "1px dashed rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.2)",
                        fontSize: 15, lineHeight: 1, cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)"; }}
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

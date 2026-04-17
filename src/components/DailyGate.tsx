/**
 * Fullscreen blocking modal shown when a daily ritual is required.
 *
 * v2 — task-driven (no free-text priorities). The ritual mutates actual tasks:
 *  - Morning: user confirms/picks EXACTLY 3 tasks as today's priorities.
 *    Those tasks get their deadline set to TODAY. Pre-selected with yesterday's
 *    evening plan if it exists.
 *  - Evening: user marks today's tasks as "Done" (status=done) and MUST pick
 *    EXACTLY 3 tasks for tomorrow (deadline=tomorrow). Plus win + energy.
 *
 * /tasks remains reachable while either gate is shown.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Flame, Moon, Sparkles, ArrowRight, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { useRitual } from "@/lib/dailyRitualContext";
import { useTasks, type Task } from "@/lib/taskContext";

// ─── Date helpers (local tz, not UTC) ───────────────────────
function localISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayLocal(): string { return localISODate(new Date()); }
function tomorrowLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return localISODate(d);
}
function yesterdayLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localISODate(d);
}

// Sort tasks: overdue → today → no-date → future
function rankTask(t: Task, today: string): number {
  if (t.deadline && t.deadline < today) return 0;
  if (t.deadline === today) return 1;
  if (!t.deadline) return 2;
  return 3;
}
function sortedOpenTasks(tasks: Task[], today: string): Task[] {
  return [...tasks.filter(t => t.status !== "done")].sort((a, b) => {
    const ra = rankTask(a, today), rb = rankTask(b, today);
    if (ra !== rb) return ra - rb;
    return (a.deadline ?? "").localeCompare(b.deadline ?? "");
  });
}

// ─── Shell ──────────────────────────────────────────────────
function Shell({ children, variant }: { children: React.ReactNode; variant: "morning" | "evening" }) {
  const bg = variant === "morning"
    ? "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(168,85,247,0.18) 0%, transparent 60%), #07040f"
    : "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(59,130,246,0.15) 0%, transparent 60%), #050510";
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: bg,
      overflowY: "auto",
      paddingTop: "calc(max(32px, env(safe-area-inset-top)))",
      paddingBottom: "calc(32px + env(safe-area-inset-bottom))",
      paddingLeft: 16, paddingRight: 16,
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Task row (reused in morning + evening pickers) ─────────
function TaskRow({
  task, today, selected, onToggle, accent, disabled,
  rightSlot,
}: {
  task: Task;
  today: string;
  selected: boolean;
  onToggle?: () => void;
  accent: string;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
}) {
  const overdue = !!(task.deadline && task.deadline < today);
  const isToday = task.deadline === today;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 10,
        background: selected
          ? `${accent}18`
          : overdue ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${
          selected ? accent
          : overdue ? "rgba(245,158,11,0.25)"
          : "rgba(255,255,255,0.06)"
        }`,
        textAlign: "left", cursor: disabled && !selected ? "not-allowed" : "pointer",
        opacity: disabled && !selected ? 0.4 : 1,
        transition: "all 0.15s",
      }}
    >
      {/* Checkbox */}
      <span style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        background: selected ? accent : "rgba(255,255,255,0.05)",
        border: `1px solid ${selected ? accent : "rgba(255,255,255,0.12)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && <Check style={{ width: 12, height: 12, color: "#fff" }} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {task.title}
        </div>
        {(overdue || isToday || task.deadline) && (
          <div style={{
            fontSize: 10, fontWeight: 600, marginTop: 2,
            color: overdue ? "#f59e0b" : isToday ? accent : "rgba(255,255,255,0.35)",
            textTransform: "uppercase", letterSpacing: "0.04em",
          }}>
            {overdue ? `en retard · ${task.deadline}` : isToday ? "aujourd'hui" : task.deadline}
          </div>
        )}
      </div>
      {rightSlot}
    </button>
  );
}

// ─── Energy picker (1-5) ────────────────────────────────────
function EnergyPicker({ value, onChange, accent }: { value: number; onChange: (n: 1 | 2 | 3 | 4 | 5) => void; accent: string }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {[1, 2, 3, 4, 5].map(n => {
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n as 1 | 2 | 3 | 4 | 5)}
            style={{
              flex: 1, height: 44, borderRadius: 10,
              background: selected ? `${accent}30` : "rgba(255,255,255,0.05)",
              border: `1px solid ${selected ? accent : "rgba(255,255,255,0.08)"}`,
              color: selected ? "#fff" : "rgba(255,255,255,0.5)",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

// ─── Section card ───────────────────────────────────────────
function Section({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: 18, marginBottom: 14,
    }}>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        marginBottom: 12,
      }}>
        <label style={{
          color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>{label}</label>
        {sublabel && (
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500 }}>
            {sublabel}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Morning gate ───────────────────────────────────────────
function MorningGate() {
  const { submitMorning, streak, todayLog } = useRitual();
  const { tasks, editTask } = useTasks();

  const today = todayLocal();
  const yesterdayKey = yesterdayLocal();
  // Access raw logs via hack: useRitual doesn't expose all days, but we stored yesterday.
  // Simpler: peek at localStorage directly.
  const planned = useMemo<string[]>(() => {
    try {
      const raw = localStorage.getItem("czn_ritual_v1");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed?.logs?.[yesterdayKey]?.evening?.tomorrowTaskIds ?? [];
    } catch { return []; }
  }, [yesterdayKey]);

  const openTasks = useMemo(() => sortedOpenTasks(tasks, today), [tasks, today]);
  // Only pre-select planned IDs that still correspond to OPEN tasks
  const plannedValid = useMemo(
    () => planned.filter(id => openTasks.some(t => t.id === id)),
    [planned, openTasks]
  );

  const [selected, setSelected] = useState<string[]>(() => plannedValid.slice(0, 3));
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);

  // If the user reloads or tasks change, ensure the pre-selected IDs still match
  useEffect(() => {
    if (selected.length === 0 && plannedValid.length > 0) {
      setSelected(plannedValid.slice(0, 3));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plannedValid.length]);

  const canSubmit = selected.length === 3;

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) {
        toast.info("3 priorités max — décoche avant d'en ajouter une");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error("Sélectionne exactement 3 tâches");
      return;
    }
    // Mutate tasks: ensure they are deadline=today so TasksPage shows them as today's priorities
    selected.forEach(id => {
      const t = tasks.find(x => x.id === id);
      if (t && t.deadline !== today) editTask(id, { deadline: today });
    });
    submitMorning({
      selectedTaskIds: [selected[0], selected[1], selected[2]] as [string, string, string],
      energy,
    });
    toast.success("Journée démarrée 🚀", {
      description: `Streak : ${streak + (streak === 0 ? 1 : 0)}j`,
    });
  };

  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Bonjour" : "Bon après-midi";
  const firstName = "Hugo";

  const plannedCount = plannedValid.length;

  return (
    <Shell variant="morning">
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28, marginTop: 20 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: "0 auto 14px",
          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(168,85,247,0.4)",
        }}>
          <Sparkles style={{ width: 28, height: 28, color: "#fff" }} />
        </div>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
          {greeting}, {firstName}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 6 }}>
          {plannedCount > 0
            ? `Tes ${plannedCount} priorité${plannedCount > 1 ? "s" : ""} d'hier soir ${plannedCount > 1 ? "sont" : "est"} déjà sélectionnée${plannedCount > 1 ? "s" : ""}`
            : "Choisis 3 tâches comme priorités du jour"}
        </p>
        {streak > 0 && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 12, padding: "4px 12px", borderRadius: 20,
            background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)",
            color: "#f97316", fontSize: 12, fontWeight: 700,
          }}>
            <Flame style={{ width: 12, height: 12 }} />
            {streak} jour{streak > 1 ? "s" : ""} d'affilée
          </div>
        )}
      </div>

      {/* Task picker */}
      <Section
        label="Priorités aujourd'hui"
        sublabel={`${selected.length} / 3`}
      >
        {openTasks.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            Aucune tâche ouverte. <Link to="/tasks" style={{ color: "#a855f7" }}>Crée-en d'abord →</Link>
          </p>
        ) : (
          <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {openTasks.slice(0, 40).map(t => (
              <TaskRow
                key={t.id}
                task={t}
                today={today}
                selected={selected.includes(t.id)}
                onToggle={() => toggle(t.id)}
                accent="#a855f7"
                disabled={selected.length >= 3}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Energy */}
      <Section label="Énergie · 1 = KO, 5 = feu">
        <EnergyPicker value={energy} onChange={setEnergy} accent="#a855f7" />
      </Section>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: "100%", padding: "16px 20px", borderRadius: 14,
          background: canSubmit
            ? "linear-gradient(135deg, #7c3aed, #a855f7)"
            : "rgba(255,255,255,0.08)",
          color: canSubmit ? "#fff" : "rgba(255,255,255,0.3)",
          border: "none", cursor: canSubmit ? "pointer" : "not-allowed",
          fontSize: 15, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: canSubmit ? "0 8px 32px rgba(168,85,247,0.35)" : undefined,
        }}
      >
        Je suis prêt à travailler
        <ArrowRight style={{ width: 18, height: 18 }} />
      </button>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Link to="/tasks" style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textDecoration: "none" }}>
          Gérer mes tâches →
        </Link>
      </div>
    </Shell>
  );
}

// ─── Evening gate ───────────────────────────────────────────
function EveningGate() {
  const { submitEvening, streak } = useRitual();
  const { tasks, setStatus, editTask } = useTasks();

  const today = todayLocal();

  const openTasks = useMemo(() => sortedOpenTasks(tasks, today), [tasks, today]);
  // Today's tasks (scheduled for today) — those are the ones to review for "done"
  const todaysTasks = useMemo(
    () => openTasks.filter(t => t.deadline === today || (t.deadline && t.deadline < today)),
    [openTasks, today]
  );
  // All open tasks are candidates for tomorrow's priorities
  const allCandidates = openTasks;

  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [tomorrowIds, setTomorrowIds] = useState<string[]>([]);
  const [win, setWin] = useState("");
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);

  const canSubmit = win.trim() && tomorrowIds.length === 3;

  const toggleDone = (id: string) => {
    setDoneIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    // If user marks a todo as done, it shouldn't also be in tomorrow's plan
    setTomorrowIds(prev => prev.filter(x => x !== id));
  };

  const toggleTomorrow = (id: string) => {
    // Prevent adding done tasks to tomorrow
    if (doneIds.has(id)) return;
    setTomorrowIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) {
        toast.info("3 priorités max pour demain");
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSubmit = () => {
    if (tomorrowIds.length !== 3) {
      toast.error("Sélectionne 3 tâches pour demain");
      return;
    }
    if (!win.trim()) {
      toast.error("Écris au moins un win du jour");
      return;
    }
    // Apply: mark done tasks, set tomorrow's priorities deadline
    const tomorrow = tomorrowLocal();
    doneIds.forEach(id => setStatus(id, "done"));
    tomorrowIds.forEach(id => {
      const t = tasks.find(x => x.id === id);
      if (t && t.deadline !== tomorrow) editTask(id, { deadline: tomorrow });
    });
    submitEvening({
      win: win.trim(),
      energy,
      tasksDoneIds: Array.from(doneIds),
      tomorrowTaskIds: [tomorrowIds[0], tomorrowIds[1], tomorrowIds[2]] as [string, string, string],
    });
    toast.success("Journée bouclée 🌙", {
      description: `Streak : ${streak + 1}j · ${doneIds.size} faites · 3 priorités pour demain`,
    });
  };

  const overdueCount = todaysTasks.filter(t => t.deadline && t.deadline < today).length;

  return (
    <Shell variant="evening">
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28, marginTop: 20 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: "0 auto 14px",
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(59,130,246,0.4)",
        }}>
          <Moon style={{ width: 28, height: 28, color: "#fff" }} />
        </div>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
          Fin de journée
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 6 }}>
          Clôture ta journée et prépare demain
        </p>
      </div>

      {/* Today recap — mark done */}
      {todaysTasks.length > 0 && (
        <Section
          label="Ce que tu as fait aujourd'hui"
          sublabel={`${doneIds.size} / ${todaysTasks.length}`}
        >
          {overdueCount > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
              padding: "6px 10px", borderRadius: 8,
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              fontSize: 11, color: "#f59e0b",
            }}>
              <AlertTriangle style={{ width: 12, height: 12 }} />
              {overdueCount} en retard — coche ce qui est fait, sinon ajoute-les à demain ci-dessous
            </div>
          )}
          <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {todaysTasks.map(t => (
              <TaskRow
                key={t.id}
                task={t}
                today={today}
                selected={doneIds.has(t.id)}
                onToggle={() => toggleDone(t.id)}
                accent="#22c55e"
              />
            ))}
          </div>
        </Section>
      )}

      {/* Tomorrow picker */}
      <Section
        label="Tes 3 priorités pour demain"
        sublabel={`${tomorrowIds.length} / 3`}
      >
        {allCandidates.filter(t => !doneIds.has(t.id)).length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            Aucune tâche ouverte restante. <Link to="/tasks" style={{ color: "#6366f1" }}>Crée-en une →</Link>
          </p>
        ) : (
          <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {allCandidates.filter(t => !doneIds.has(t.id)).slice(0, 40).map(t => (
              <TaskRow
                key={t.id}
                task={t}
                today={today}
                selected={tomorrowIds.includes(t.id)}
                onToggle={() => toggleTomorrow(t.id)}
                accent="#6366f1"
                disabled={tomorrowIds.length >= 3}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Win */}
      <Section label="Le win du jour">
        <input
          value={win}
          onChange={e => setWin(e.target.value)}
          placeholder="Ex: J'ai closé Delphine · Live qui a cartonné…"
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff", fontSize: 14, outline: "none",
          }}
        />
      </Section>

      {/* Energy */}
      <Section label="Énergie fin de journée">
        <EnergyPicker value={energy} onChange={setEnergy} accent="#6366f1" />
      </Section>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: "100%", padding: "16px 20px", borderRadius: 14,
          background: canSubmit
            ? "linear-gradient(135deg, #3b82f6, #6366f1)"
            : "rgba(255,255,255,0.08)",
          color: canSubmit ? "#fff" : "rgba(255,255,255,0.3)",
          border: "none", cursor: canSubmit ? "pointer" : "not-allowed",
          fontSize: 15, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: canSubmit ? "0 8px 32px rgba(59,130,246,0.35)" : undefined,
        }}
      >
        Fin de journée
        <Moon style={{ width: 18, height: 18 }} />
      </button>
    </Shell>
  );
}

// ─── Post-evening lock ──────────────────────────────────────
function NightLock() {
  const { todayLog } = useRitual();
  return (
    <Shell variant="evening">
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <Moon style={{ width: 48, height: 48, color: "#6366f1", margin: "0 auto 16px" }} />
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: 0 }}>Journée terminée</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 8 }}>
          Tu as bouclé ta journée. L'app rouvre demain matin.
        </p>
        {todayLog.evening?.win && (
          <div style={{
            marginTop: 32, padding: 16, borderRadius: 12,
            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
            maxWidth: 400, margin: "32px auto 0",
          }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
              Win du jour
            </p>
            <p style={{ color: "#fff", fontSize: 15, marginTop: 6, margin: 0 }}>
              {todayLog.evening.win}
            </p>
          </div>
        )}
        <div style={{ marginTop: 40 }}>
          <Link to="/tasks" style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textDecoration: "underline" }}>
            Juste jeter un œil sur demain
          </Link>
        </div>
      </div>
    </Shell>
  );
}

// ─── Root gate controller ───────────────────────────────────
export default function DailyGate() {
  const { morningRequired, eveningRequired, todayLog, allowedPathWhileGated, settings } = useRitual();
  const location = useLocation();

  const onAllowedPath = allowedPathWhileGated.some(p => location.pathname === p || location.pathname.startsWith(p + "/"));

  if (settings.strictness !== "strict") return null;

  if (morningRequired && !onAllowedPath) return <MorningGate />;
  if (eveningRequired && !onAllowedPath) return <EveningGate />;

  if (todayLog.evening?.completedAt && !onAllowedPath && location.pathname !== "/") {
    const now = new Date();
    if (now.getHours() >= settings.eveningHour) return <NightLock />;
  }

  return null;
}

export { MorningGate, EveningGate, NightLock };

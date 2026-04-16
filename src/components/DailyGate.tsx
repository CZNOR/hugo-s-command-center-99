/**
 * Fullscreen blocking modal shown when a daily ritual is required.
 * - Morning: type 3 priorities + intent + energy → unlocks the day
 * - Evening: pick tasks done / deferred + win + energy → closes the day
 * While visible, the app is locked except for /tasks (allowed path).
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Flame, Moon, Sparkles, CheckSquare, ArrowRight, ListChecks, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRitual } from "@/lib/dailyRitualContext";
import { useTasks } from "@/lib/taskContext";

// Local YYYY-MM-DD (not UTC)
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

// ─── Energy picker (1-5) ────────────────────────────────────
function EnergyPicker({ value, onChange }: { value: number; onChange: (n: 1 | 2 | 3 | 4 | 5) => void }) {
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
              background: selected ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${selected ? "#a855f7" : "rgba(255,255,255,0.08)"}`,
              color: selected ? "#fff" : "rgba(255,255,255,0.5)",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

// ─── Morning gate ───────────────────────────────────────────
function MorningGate() {
  const { submitMorning, streak } = useRitual();
  const { tasks } = useTasks();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");
  const [intent, setIntent] = useState("");
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);

  const today = todayLocal();
  // Suggest overdue + today + "haute" tasks as priority candidates
  const suggestions = useMemo(() => {
    return tasks
      .filter(t => t.status !== "done")
      .filter(t =>
        (t.deadline && t.deadline <= today) ||
        (t.priority === "haute" && (!t.deadline || t.deadline === today))
      )
      .slice(0, 6);
  }, [tasks, today]);

  const fillNextSlot = (title: string) => {
    if (!p1.trim()) { setP1(title); return; }
    if (!p2.trim()) { setP2(title); return; }
    if (!p3.trim()) { setP3(title); return; }
    toast.info("3 priorités déjà remplies — remplace une case à la main");
  };

  const canSubmit = p1.trim() && p2.trim() && p3.trim() && intent.trim();

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error("Remplis les 3 priorités et ton intention");
      return;
    }
    submitMorning({ top3: [p1.trim(), p2.trim(), p3.trim()], intent: intent.trim(), energy });
    toast.success("Journée démarrée 🚀", { description: `Streak : ${streak + (streak === 0 ? 1 : 0)} jour${streak + 1 > 1 ? "s" : ""}` });
  };

  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Bonjour" : "Bon après-midi";
  const firstName = "Hugo";

  return (
    <Shell variant="morning">
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32, marginTop: 24 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(168,85,247,0.4)",
        }}>
          <Sparkles style={{ width: 28, height: 28, color: "#fff" }} />
        </div>
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
          {greeting}, {firstName}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 6 }}>
          Pose ta journée avant de démarrer
        </p>
        {streak > 0 && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 12, padding: "4px 12px", borderRadius: 20,
            background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)",
            color: "#f97316", fontSize: 12, fontWeight: 700,
          }}>
            <Flame style={{ width: 12, height: 12 }} />
            {streak} jour{streak > 1 ? "s" : ""} d'affilée · ne casse pas ça
          </div>
        )}
      </div>

      {/* Priorities */}
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: 20, marginBottom: 16,
      }}>
        <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
          Tes 3 priorités aujourd'hui
        </label>
        {[
          { n: 1, val: p1, set: setP1, color: "#ef4444" },
          { n: 2, val: p2, set: setP2, color: "#f59e0b" },
          { n: 3, val: p3, set: setP3, color: "#22c55e" },
        ].map(({ n, val, set, color }) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{
              width: 24, height: 24, borderRadius: 6,
              background: `${color}22`, color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, flexShrink: 0,
            }}>{n}</span>
            <input
              value={val}
              onChange={e => set(e.target.value)}
              placeholder={n === 1 ? "La plus importante" : n === 2 ? "La 2e" : "La 3e"}
              style={{
                flex: 1, padding: "10px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff", fontSize: 14, outline: "none",
              }}
            />
          </div>
        ))}
        {suggestions.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              Tes candidates · clique pour remplir
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {suggestions.map(t => {
                const overdue = !!(t.deadline && t.deadline < today);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => fillNextSlot(t.title)}
                    style={{
                      padding: "5px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                      background: overdue ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${overdue ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`,
                      color: overdue ? "#f59e0b" : "rgba(255,255,255,0.7)",
                      cursor: "pointer",
                      maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                    title={t.title + (t.deadline ? ` · ${t.deadline}` : "")}
                  >
                    {overdue ? "⚠ " : ""}{t.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Intent */}
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: 20, marginBottom: 16,
      }}>
        <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
          Intention du jour
        </label>
        <input
          value={intent}
          onChange={e => setIntent(e.target.value)}
          placeholder="Ex: rester focus, ne pas ouvrir Insta avant 14h…"
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff", fontSize: 14, outline: "none",
          }}
        />
      </div>

      {/* Energy */}
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: 20, marginBottom: 20,
      }}>
        <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
          Énergie ce matin · 1 = KO, 5 = feu
        </label>
        <EnergyPicker value={energy} onChange={setEnergy} />
      </div>

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
          transition: "all 0.15s",
        }}
      >
        Je suis prêt à travailler
        <ArrowRight style={{ width: 18, height: 18 }} />
      </button>

      {/* Escape hatch */}
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Link
          to="/tasks"
          style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textDecoration: "none" }}
        >
          Je veux voir mes tâches d'abord →
        </Link>
      </div>
    </Shell>
  );
}

// ─── Evening gate ───────────────────────────────────────────
function EveningGate() {
  const { submitEvening, streak } = useRitual();
  const { tasks, setStatus, editTask } = useTasks();
  const [win, setWin] = useState("");
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [deferredIds, setDeferredIds] = useState<Set<string>>(new Set());

  const today = todayLocal();

  // Sort open tasks: overdue first, then today, then no-date, then upcoming
  const { openTasks, overdueCount } = useMemo(() => {
    const open = tasks.filter(t => t.status !== "done");
    const rank = (t: typeof open[number]) => {
      if (t.deadline && t.deadline < today) return 0;   // overdue — top
      if (t.deadline === today) return 1;               // due today
      if (!t.deadline) return 2;                        // no date
      return 3;                                         // future
    };
    const sorted = [...open].sort((a, b) => {
      const ra = rank(a), rb = rank(b);
      if (ra !== rb) return ra - rb;
      return (a.deadline ?? "").localeCompare(b.deadline ?? "");
    });
    return { openTasks: sorted, overdueCount: open.filter(t => t.deadline && t.deadline < today).length };
  }, [tasks, today]);

  // Auto-pre-check overdue tasks as "→ Demain" (user's explicit request: "toutes les tâches
  // en retard tu les mets demain"). They can uncheck any they already did.
  useEffect(() => {
    if (overdueCount === 0) return;
    setDeferredIds(prev => {
      if (prev.size > 0) return prev; // user already interacted
      const next = new Set<string>();
      openTasks.forEach(t => {
        if (t.deadline && t.deadline < today) next.add(t.id);
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overdueCount]);

  const canSubmit = win.trim();

  const toggle = (setFn: React.Dispatch<React.SetStateAction<Set<string>>>) => (id: string) => {
    setFn(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error("Écris au moins un win du jour");
      return;
    }
    // Persist evening entry first
    submitEvening({
      win: win.trim(),
      energy,
      tasksDoneIds: Array.from(doneIds),
      tasksDeferredIds: Array.from(deferredIds),
    });
    // Actually mutate the tasks: mark done, move deferred to tomorrow
    const tomorrow = tomorrowLocal();
    doneIds.forEach(id => setStatus(id, "done"));
    deferredIds.forEach(id => editTask(id, { deadline: tomorrow }));
    toast.success("Journée bouclée 🌙", {
      description: `Streak : ${streak + 1}j · ${doneIds.size} faites, ${deferredIds.size} reportées`,
    });
  };

  return (
    <Shell variant="evening">
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32, marginTop: 24 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(59,130,246,0.4)",
        }}>
          <Moon style={{ width: 28, height: 28, color: "#fff" }} />
        </div>
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
          Fin de journée
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 6 }}>
          Bilan en 30 secondes, puis tu décroches
        </p>
      </div>

      {/* Tasks recap */}
      {openTasks.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: 20, marginBottom: 16,
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            <ListChecks style={{ width: 14, height: 14 }} />
            Faite aujourd'hui ? ({openTasks.length} ouvertes)
          </label>
          {overdueCount > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
              padding: "6px 10px", borderRadius: 8,
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              fontSize: 11, color: "#f59e0b",
            }}>
              <AlertTriangle style={{ width: 12, height: 12 }} />
              <span>{overdueCount} tâche{overdueCount > 1 ? "s" : ""} en retard — auto-reportée{overdueCount > 1 ? "s" : ""} à demain. Décoche si déjà faite.</span>
            </div>
          )}
          <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {openTasks.slice(0, 30).map(t => {
              const isDone = doneIds.has(t.id);
              const isDeferred = deferredIds.has(t.id);
              const isOverdue = !!(t.deadline && t.deadline < today);
              const isToday = t.deadline === today;
              return (
                <div key={t.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", borderRadius: 8,
                  background: isOverdue ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isOverdue ? "rgba(245,158,11,0.25)" : "transparent"}`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ color: "#fff", fontSize: 13 }}>{t.title}</span>
                    {(isOverdue || isToday) && (
                      <span style={{
                        marginLeft: 6, fontSize: 10, fontWeight: 700,
                        color: isOverdue ? "#f59e0b" : "#a855f7",
                        textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>
                        {isOverdue ? `· en retard (${t.deadline})` : "· aujourd'hui"}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { toggle(setDoneIds)(t.id); if (isDeferred) toggle(setDeferredIds)(t.id); }}
                    style={{
                      padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: isDone ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
                      color: isDone ? "#22c55e" : "rgba(255,255,255,0.4)",
                      border: `1px solid ${isDone ? "#22c55e" : "transparent"}`,
                      cursor: "pointer",
                    }}
                  >
                    ✓ Done
                  </button>
                  <button
                    type="button"
                    onClick={() => { toggle(setDeferredIds)(t.id); if (isDone) toggle(setDoneIds)(t.id); }}
                    style={{
                      padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: isDeferred ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)",
                      color: isDeferred ? "#f97316" : "rgba(255,255,255,0.4)",
                      border: `1px solid ${isDeferred ? "#f97316" : "transparent"}`,
                      cursor: "pointer",
                    }}
                  >
                    → Demain
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Win */}
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: 20, marginBottom: 16,
      }}>
        <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
          Le win du jour
        </label>
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
      </div>

      {/* Energy */}
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: 20, marginBottom: 20,
      }}>
        <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
          Énergie en fin de journée
        </label>
        <EnergyPicker value={energy} onChange={setEnergy} />
      </div>

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
          transition: "all 0.15s",
        }}
      >
        Fin de journée
        <Moon style={{ width: 18, height: 18 }} />
      </button>
    </Shell>
  );
}

// ─── Post-evening lock (rest-of-evening screen) ─────────────
function NightLock() {
  const { todayLog } = useRitual();
  return (
    <Shell variant="evening">
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <Moon style={{ width: 48, height: 48, color: "#6366f1", margin: "0 auto 16px" }} />
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: 0 }}>Journée terminée</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 8 }}>
          Tu as bouclé ta journée. L'app rouvre demain à 9h.
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
            Juste jeter un œil sur mes tâches de demain
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

  // If user explicitly navigated to an allowed path (e.g. /tasks), let them through
  const onAllowedPath = allowedPathWhileGated.some(p => location.pathname === p || location.pathname.startsWith(p + "/"));

  // Strict mode only blocks; other modes could be added later
  if (settings.strictness !== "strict") return null;

  // 1. Morning gate
  if (morningRequired && !onAllowedPath) {
    return <MorningGate />;
  }
  // 2. Evening gate
  if (eveningRequired && !onAllowedPath) {
    return <EveningGate />;
  }
  // 3. After evening completed: soft-lock screen on non-tasks routes (until next morning reset)
  if (todayLog.evening?.completedAt && !onAllowedPath && location.pathname !== "/") {
    // Only lock if we're past the evening hour — during the day, allow normal use
    const now = new Date();
    if (now.getHours() >= settings.eveningHour) {
      return <NightLock />;
    }
  }

  return null;
}

// Export sub-components for storybook / tests
export { MorningGate, EveningGate, NightLock };

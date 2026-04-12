import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Circle, Clock, Calendar, Phone, TrendingUp, Zap, AlertCircle } from "lucide-react";
import { useTasks } from "@/lib/taskContext";
import { useCoachingStats } from "@/lib/coachingStats";
import { listCalendarEvents, isAuthenticated, type GCalEvent } from "@/lib/googleCalendar";
import { fetchAllBookings, type CalBooking } from "@/lib/calcom";
import { usePrivacy } from "@/lib/privacyContext";

// ─── Helpers ──────────────────────────────────────────────────
const today     = () => new Date().toISOString().split("T")[0];
const fmt       = (n: number) => n.toLocaleString("fr-FR") + " €";
const fmtTime   = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const isToday   = (iso: string) => iso?.startsWith(today());
const isPast    = (d: string)   => d < today();
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function sbFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { return [] as unknown as T; }
  if (!res.ok) throw new Error((data as any)?.message ?? `HTTP ${res.status}`);
  return data as T;
}

// ─── Greeting ─────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Bonne nuit";
  if (h < 12) return "Bon matin";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function dayLabel() {
  return new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// ─── Section title ────────────────────────────────────────────
function SectionTitle({ icon: Icon, label, count, accent = "#a855f7" }: {
  icon: React.ElementType; label: string; count?: number; accent?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <Icon size={14} style={{ color: accent }} />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
        {label}
      </span>
      {count !== undefined && (
        <span style={{
          marginLeft: 2, fontSize: 10, fontWeight: 700,
          background: `${accent}25`, color: accent,
          padding: "2px 7px", borderRadius: 99,
        }}>{count}</span>
      )}
    </div>
  );
}

// ─── Card shell ───────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20,
      padding: "18px 20px",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Task row ─────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  coaching: "#a855f7", casino: "#00cc44", contenu: "#f59e0b",
  équipe: "#22d3ee", admin: "#94a3b8",
};

function TaskRow({ task }: { task: any }) {
  const overdue  = isPast(task.deadline) && task.status !== "done";
  const isNow    = isToday(task.deadline);
  const accent   = CAT_COLORS[task.category?.toLowerCase()] ?? "#a855f7";
  const catLabel = task.category ? task.category.charAt(0).toUpperCase() + task.category.slice(1) : "";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
      borderRadius: 14, marginBottom: 6,
      background: overdue ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.02)",
      border: overdue ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(255,255,255,0.05)",
      transition: "background 0.15s",
    }}>
      {task.status === "done"
        ? <CheckCircle2 size={16} style={{ color: "#4ade80", flexShrink: 0 }} />
        : overdue
        ? <AlertCircle size={16} style={{ color: "#f87171", flexShrink: 0 }} />
        : <Circle size={16} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: task.status === "done" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)",
          textDecoration: task.status === "done" ? "line-through" : "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{task.title}</p>
        {task.deadline && (
          <p style={{ fontSize: 10, marginTop: 2, color: overdue ? "#f87171" : "rgba(255,255,255,0.3)" }}>
            {overdue ? "⚠ En retard · " : ""}{task.deadline}
            {task.time ? ` · ${task.time}` : ""}
          </p>
        )}
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
        background: `${accent}18`, color: accent, flexShrink: 0,
      }}>{catLabel}</span>
    </div>
  );
}

// ─── Agenda card ──────────────────────────────────────────────
function AgendaCard() {
  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const auth = isAuthenticated();

  useEffect(() => {
    if (!auth) { setLoaded(true); return; }
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);
    listCalendarEvents(start.toISOString(), end.toISOString())
      .then(evts => { setEvents(evts); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [auth]);

  const evtTime = (e: GCalEvent) =>
    e.start.dateTime ? fmtTime(e.start.dateTime) : "Toute la journée";

  return (
    <Card>
      <SectionTitle icon={Calendar} label="Agenda aujourd'hui" count={events.length} accent="#818cf8" />
      {!auth && (
        <Link to="/agenda" style={{ display: "block", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "8px 0" }}>
          Connecter Google Agenda →
        </Link>
      )}
      {auth && !loaded && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", padding: "8px 0" }}>Chargement…</p>
      )}
      {loaded && events.length === 0 && auth && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", padding: "8px 0" }}>Rien aujourd'hui 🎉</p>
      )}
      {events.slice(0, 4).map(e => (
        <div key={e.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", flexShrink: 0, marginTop: 2, minWidth: 44 }}>
            {evtTime(e)}
          </span>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.4, fontWeight: 500 }}>
            {e.summary}
          </p>
        </div>
      ))}
      {events.length > 4 && (
        <Link to="/agenda" style={{ fontSize: 11, color: "#818cf8", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          +{events.length - 4} autres <ArrowRight size={11} />
        </Link>
      )}
    </Card>
  );
}

// ─── Calls card ───────────────────────────────────────────────
function CallsCard() {
  const [calls, setCalls] = useState<CalBooking[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchAllBookings()
      .then(all => {
        const todayCalls = all
          .filter(b => b.status === "accepted" && isToday(b.startTime))
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        // Also show next 2 upcoming if no calls today
        if (todayCalls.length === 0) {
          const upcoming = all
            .filter(b => b.status === "accepted" && b.startTime > new Date().toISOString())
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .slice(0, 3);
          setCalls(upcoming);
        } else {
          setCalls(todayCalls);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const noToday = calls.length > 0 && !isToday(calls[0].startTime);

  return (
    <Card>
      <SectionTitle icon={Phone} label={noToday ? "Prochains calls" : "Calls aujourd'hui"} count={calls.length} accent="#00cc44" />
      {!loaded && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", padding: "8px 0" }}>Chargement…</p>}
      {loaded && calls.length === 0 && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", padding: "8px 0" }}>Aucun call prévu 🎉</p>
      )}
      {calls.slice(0, 4).map(c => (
        <div key={c.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#00cc44", flexShrink: 0, marginTop: 2, minWidth: 44 }}>
              {fmtTime(c.startTime)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.attendee.name}
              </p>
              <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                {c.budget && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#00cc44", background: "rgba(0,204,68,0.1)", padding: "2px 6px", borderRadius: 99 }}>
                    {c.budget}
                  </span>
                )}
                {c.niveau && (
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 99 }}>
                    {c.niveau}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      <Link to="/coaching/appels" style={{ fontSize: 11, color: "#00cc44", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
        Tous les calls <ArrowRight size={11} />
      </Link>
    </Card>
  );
}

// ─── Task checklist card ──────────────────────────────────────
function TaskCheckCard() {
  const { tasks } = useTasks();
  const t = today();

  const todayTasks   = useMemo(() => tasks.filter(tk => tk.deadline === t && tk.status !== "done"), [tasks, t]);
  const overdueTasks = useMemo(() => tasks.filter(tk => tk.deadline && isPast(tk.deadline) && tk.status !== "done"), [tasks, t]);
  const doneTasks    = useMemo(() => tasks.filter(tk => tk.deadline === t && tk.status === "done"), [tasks, t]);
  const total        = todayTasks.length + doneTasks.length;
  const pct          = total === 0 ? 0 : Math.round((doneTasks.length / total) * 100);

  const showTasks = [
    ...overdueTasks.slice(0, 2),
    ...todayTasks,
  ].slice(0, 5);

  return (
    <Card style={{ gridColumn: "1 / -1" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <SectionTitle icon={CheckCircle2} label="Check-up journée" accent="#a855f7" />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {overdueTasks.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#f87171", background: "rgba(239,68,68,0.12)", padding: "3px 10px", borderRadius: 99 }}>
              ⚠ {overdueTasks.length} en retard
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 700, color: "#a855f7" }}>
            {doneTasks.length}/{total} faites
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", marginBottom: 16, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`, borderRadius: 99,
            background: "linear-gradient(90deg, #7c3aed, #a855f7)",
            boxShadow: "0 0 8px rgba(168,85,247,0.5)",
            transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
      )}

      {/* Tasks */}
      {tasks.length === 0 && (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "16px 0" }}>
          Aucune tâche — journée libre 🎉
        </p>
      )}
      {showTasks.map(tk => <TaskRow key={tk.id} task={tk} />)}
      {doneTasks.map(tk => <TaskRow key={tk.id} task={tk} />)}

      {/* Footer link */}
      <Link to="/tasks" style={{
        display: "flex", alignItems: "center", gap: 6, marginTop: 10,
        fontSize: 12, fontWeight: 600, color: "rgba(168,85,247,0.7)",
      }}>
        Voir toutes les tâches ({tasks.length}) <ArrowRight size={12} />
      </Link>
    </Card>
  );
}

// ─── Business quick stats ─────────────────────────────────────
function CoachingQuickCard() {
  const { stats: c, loading } = useCoachingStats();
  const { hidden } = usePrivacy();
  return (
    <Card style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.3s", filter: hidden ? "blur(8px)" : "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎓</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>Coaching & Formation</p>
            <p style={{ fontSize: 10, color: "rgba(168,85,247,0.7)" }}>HT · Formation 990 €</p>
          </div>
        </div>
        <Link to="/coaching" style={{ fontSize: 11, color: "rgba(168,85,247,0.6)", display: "flex", alignItems: "center", gap: 3 }}>
          Voir <ArrowRight size={11} />
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "CA HT",     value: fmt(c.caTotal),       accent: "#a855f7" },
          { label: "Closing",   value: `${c.tauxClosing}%`,  accent: "#a855f7" },
          { label: "Bookings",  value: String(c.bookings),   accent: "#a855f7" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", padding: "10px 6px", borderRadius: 12, background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.1)" }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{s.value}</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CasinoQuickCard() {
  const [stats, setStats] = useState({ commission: 0, depots: 0, revshare: 0 });
  const { hidden } = usePrivacy();

  useEffect(() => {
    sbFetch<any[]>("casino_stats?brand=eq.corgibet&order=updated_at.desc&limit=1")
      .then(rows => { if (rows?.[0]) setStats(rows[0]); })
      .catch(() => {});
  }, []);

  const caTotal = stats.commission + stats.depots * 80 + stats.revshare;

  return (
    <Card style={{ filter: hidden ? "blur(8px)" : "none", transition: "filter 0.25s" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎰</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>Casino Affiliation</p>
            <p style={{ fontSize: 10, color: "rgba(0,204,68,0.7)" }}>CPA + RevShare</p>
          </div>
        </div>
        <Link to="/casino" style={{ fontSize: 11, color: "rgba(0,204,68,0.6)", display: "flex", alignItems: "center", gap: 3 }}>
          Voir <ArrowRight size={11} />
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "CA total",    value: fmt(caTotal),              accent: "#00cc44" },
          { label: "Dépôts",      value: String(stats.depots),      accent: "#00cc44" },
          { label: "RevShare",    value: fmt(stats.revshare),       accent: "#00cc44" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", padding: "10px 6px", borderRadius: 12, background: "rgba(0,204,68,0.06)", border: "1px solid rgba(0,204,68,0.1)" }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{s.value}</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Day progress hero ────────────────────────────────────────
function HeroHeader() {
  const { tasks } = useTasks();
  const t         = today();
  const todayAll  = tasks.filter(tk => tk.deadline === t);
  const done      = todayAll.filter(tk => tk.status === "done").length;
  const total     = todayAll.length;
  const pct       = total === 0 ? 0 : Math.round((done / total) * 100);
  const overdue   = tasks.filter(tk => tk.deadline && isPast(tk.deadline) && tk.status !== "done").length;

  const statusMsg = total === 0
    ? "Journée libre — profites-en 🎉"
    : done === total ? "Journée complète ! 🎉"
    : overdue > 0 ? `${overdue} tâche${overdue > 1 ? "s" : ""} en retard ⚠`
    : pct >= 50 ? `${pct}% accompli, continue ! 💪`
    : "C'est parti pour aujourd'hui 🚀";

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Date + greeting */}
      <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
        {greeting()} · <span style={{ color: "rgba(255,255,255,0.45)" }}>{dayLabel().charAt(0).toUpperCase() + dayLabel().slice(1)}</span>
      </p>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
          Command Center <span style={{ fontSize: 24 }}>⚡</span>
        </h1>
        {/* Day progress pill */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
          background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)",
          borderRadius: 16, padding: "12px 18px", minWidth: 220,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>JOURNÉE</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{done}<span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>/{total}</span></span>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${pct}%`, borderRadius: 99,
              background: "linear-gradient(90deg, #7c3aed, #a855f7)",
              boxShadow: "0 0 8px rgba(168,85,247,0.4)",
              transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
          <p style={{ fontSize: 11, color: overdue > 0 ? "#f87171" : "rgba(255,255,255,0.35)" }}>{statusMsg}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function CommandCenter() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <HeroHeader />

      {/* Top row: 3 overview cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 14 }}>
        <AgendaCard />
        <CallsCard />
      </div>

      {/* Task checklist — full width */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 14 }}>
        <TaskCheckCard />
      </div>

      {/* Business stats — 2 cols */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: 12 }}>
          Mes business
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          <CoachingQuickCard />
          <CasinoQuickCard />
        </div>
      </div>
    </div>
  );
}

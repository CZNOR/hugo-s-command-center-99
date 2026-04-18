import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CheckCircle2, Circle, Calendar, Phone,
  AlertTriangle, Clock, TrendingUp,
} from "lucide-react";
import { useTasks } from "@/lib/taskContext";
import { useCoachingStats } from "@/lib/coachingStats";
import { listCalendarEvents, isAuthenticated, type GCalEvent } from "@/lib/googleCalendar";
import { fetchAllBookings, type CalBooking } from "@/lib/calcom";
import { loadManualCalls, callToLocalDate, type ManualCall } from "@/lib/manualCalls";
import { usePrivacy } from "@/lib/privacyContext";

// ─── Utils ────────────────────────────────────────────────────
const todayStr  = () => new Date().toISOString().split("T")[0];
const isPast    = (d: string) => !!d && d < todayStr();
const isToday   = (iso: string) => !!iso && iso.startsWith(todayStr());
const fmtMoney  = (n: number) => n.toLocaleString("fr-FR") + " €";
const fmtTime   = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const SB = import.meta.env.VITE_SUPABASE_URL as string;
const SK = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
async function sbGet<T>(path: string): Promise<T> {
  const r = await fetch(`${SB}/rest/v1/${path}`, { headers: { apikey: SK, Authorization: `Bearer ${SK}` } });
  const t = await r.text(); try { return JSON.parse(t); } catch { return [] as T; }
}

const BIZ_COLOR: Record<string, string> = {
  coaching: "#a855f7", casino: "#00cc44", content: "#f59e0b",
  equipe: "#22d3ee", admin: "#94a3b8",
};
const BIZ_LABEL: Record<string, string> = {
  coaching: "Coaching", casino: "Casino", content: "Contenu",
  equipe: "Équipe", admin: "Admin",
};

// ─── Greeting ─────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  return h < 5 ? "Bonne nuit" : h < 12 ? "Bon matin" : h < 18 ? "Bon après-midi" : "Bonsoir";
}

// ─── Card wrapper ─────────────────────────────────────────────
function Card({ children, accent, style }: {
  children: React.ReactNode; accent?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: `1px solid ${accent ? accent + "22" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 18, padding: "16px 18px",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Label pill ───────────────────────────────────────────────
function Label({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
      background: color + "20", color, textTransform: "capitalize",
    }}>{text}</span>
  );
}

// ─── HERO ─────────────────────────────────────────────────────
function Hero({ todayCount, overdueCount, caTotal }: {
  todayCount: number; overdueCount: number; caTotal: number;
}) {
  const { hidden } = usePrivacy();
  const now = new Date();
  const dateLabel = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ marginBottom: 22 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.28)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>
        {getGreeting()} · {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
          Command Center <span style={{ fontSize: 22, opacity: 0.8 }}>⚡</span>
        </h1>
        {/* Hero stats */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            {
              label: overdueCount > 0 ? `${overdueCount} en retard` : `${todayCount} aujourd'hui`,
              color: overdueCount > 0 ? "#f87171" : "#a855f7",
              icon: overdueCount > 0 ? "⚠" : "✓",
            },
            {
              label: hidden ? "CA masqué" : fmtMoney(caTotal),
              color: "#4ade80",
              icon: "↑",
            },
          ].map((s, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: s.color + "12", border: `1px solid ${s.color}30`,
              borderRadius: 99, padding: "6px 14px",
            }}>
              <span style={{ fontSize: 11, color: s.color }}>{s.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Agenda card ──────────────────────────────────────────────
function AgendaCard() {
  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = isAuthenticated();

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const s = new Date(); s.setHours(0, 0, 0, 0);
    const e = new Date(); e.setHours(23, 59, 59, 999);
    listCalendarEvents(s.toISOString(), e.toISOString())
      .then(ev => { setEvents(ev); setLoading(false); })
      .catch(() => setLoading(false));
  }, [auth]);

  return (
    <Card accent="#818cf8">
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
        <Calendar size={13} style={{ color: "#818cf8" }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
          Agenda aujourd'hui
        </span>
        {!loading && (
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#818cf8", background: "#818cf820", padding: "2px 7px", borderRadius: 99 }}>
            {events.length}
          </span>
        )}
      </div>

      {loading && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Chargement…</p>}

      {!loading && !auth && (
        <Link to="/agenda" style={{ fontSize: 12, color: "#818cf8", display: "block", paddingBottom: 4 }}>
          Connecter Google Agenda →
        </Link>
      )}

      {!loading && auth && events.length === 0 && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", paddingBottom: 4 }}>Rien de prévu 🎉</p>
      )}

      {events.slice(0, 5).map(ev => (
        <div key={ev.id} style={{ display: "flex", gap: 10, marginBottom: 9, alignItems: "flex-start" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", minWidth: 40, marginTop: 1, flexShrink: 0 }}>
            {ev.start.dateTime ? fmtTime(ev.start.dateTime) : "Journée"}
          </span>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.4, fontWeight: 500 }}>
            {ev.summary}
          </p>
        </div>
      ))}

      {events.length > 5 && (
        <Link to="/agenda" style={{ fontSize: 11, color: "#818cf8", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          +{events.length - 5} autres <ArrowRight size={10} />
        </Link>
      )}
    </Card>
  );
}

// ─── Budget colour ────────────────────────────────────────────
function budgetColor(budget?: string): string {
  if (!budget) return "rgba(255,255,255,0.3)";
  const b = budget.toLowerCase();
  if (b.includes("moins") || b.includes("100"))    return "#f87171"; // < 100 → rouge
  if (b.includes("500") && !b.includes("1"))        return "#fb923c"; // ~500 → orange
  if (b.includes("1 000") || b.includes("1000"))    return "#f59e0b"; // 1k → jaune
  if (b.includes("3 000") || b.includes("3000"))    return "#4ade80"; // 3k → vert
  if (b.includes("5 000") || b.includes("5000"))    return "#a855f7"; // 5k → violet
  if (b.includes("10 000") || b.includes("10000"))  return "#818cf8"; // 10k+ → indigo
  return "#60a5fa"; // défaut → bleu
}

// ─── Calls card ───────────────────────────────────────────────
// A unified row wraps both Cal.com bookings and manual calls. `source` tells the
// renderer which icon/tag to show (manual calls use the green Phone chip).
interface UnifiedCallRow {
  id: string;
  source: "cal" | "manual";
  startISO: string;          // ISO of start time (UTC for cal, local-built for manual)
  label: string;             // display name
  budget?: string;
  niveau?: string;
  business?: string;
}

function CallsCard() {
  const [calls, setCalls] = useState<UnifiedCallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpcoming, setIsUpcoming] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchAllBookings().catch(() => [] as CalBooking[]),
      loadManualCalls().catch(() => [] as ManualCall[]),
    ]).then(([bookings, manuals]) => {
      const calRows: UnifiedCallRow[] = bookings
        .filter(b => b.status === "accepted")
        .map(b => ({
          id: `cal-${b.id}`, source: "cal", startISO: b.startTime,
          label: b.attendee.name, budget: b.budget, niveau: b.niveau,
        }));
      const manualRows: UnifiedCallRow[] = manuals.map(mc => ({
        id: `mc-${mc.id}`, source: "manual",
        startISO: callToLocalDate(mc).toISOString(),
        label: mc.clientName, business: mc.business,
      }));
      const all = [...calRows, ...manualRows];
      const nowISO = new Date().toISOString();
      const todayList = all.filter(r => isToday(r.startISO))
                            .sort((a, b) => a.startISO.localeCompare(b.startISO));
      if (todayList.length > 0) {
        setCalls(todayList); setIsUpcoming(false);
      } else {
        const next = all.filter(r => r.startISO > nowISO)
                        .sort((a, b) => a.startISO.localeCompare(b.startISO))
                        .slice(0, 4);
        setCalls(next); setIsUpcoming(true);
      }
      setLoading(false);
    });
  }, []);

  const dateLabel = (iso: string) => {
    const d = new Date(iso);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tom   = new Date(today); tom.setDate(tom.getDate() + 1);
    if (d >= today && d < tom) return fmtTime(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + " · " + fmtTime(iso);
  };

  return (
    <Card accent="#00cc44">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
        <Phone size={13} style={{ color: "#00cc44" }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
          {isUpcoming ? "Prochains calls" : "Calls aujourd'hui"}
        </span>
        {!loading && (
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#00cc44", background: "#00cc4420", padding: "2px 7px", borderRadius: 99 }}>
            {calls.length}
          </span>
        )}
      </div>

      {loading && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Chargement…</p>}
      {!loading && calls.length === 0 && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", paddingBottom: 4 }}>Aucun call prévu 🎉</p>
      )}

      {calls.map(c => {
        const bc = budgetColor(c.budget);
        return (
          <div key={c.id} style={{
            display: "flex", gap: 10, marginBottom: 8, alignItems: "center",
            padding: "8px 10px", borderRadius: 12,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}>
            {/* Time */}
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#00cc44",
              minWidth: 56, flexShrink: 0, lineHeight: 1.3,
            }}>
              {dateLabel(c.startISO)}
            </span>
            {/* Name */}
            <p style={{
              flex: 1, fontSize: 12, fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              minWidth: 0, display: "flex", alignItems: "center", gap: 6,
            }}>
              {c.source === "manual" && (
                <Phone size={10} style={{ color: "#22c55e", flexShrink: 0 }} />
              )}
              {c.label}
            </p>
            {/* Tags */}
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {c.source === "manual" && c.business && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                  background: "rgba(34,197,94,0.18)", color: "#86efac", textTransform: "uppercase",
                }}>
                  {c.business}
                </span>
              )}
              {c.budget && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                  background: bc + "20", color: bc,
                }}>
                  {c.budget}
                </span>
              )}
              {c.niveau && (
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
                  background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)",
                }}>
                  {c.niveau}
                </span>
              )}
            </div>
          </div>
        );
      })}

      <Link to="/coaching" style={{ fontSize: 11, color: "#00cc44", display: "flex", alignItems: "center", gap: 3, marginTop: 6 }}>
        Tous les calls <ArrowRight size={10} />
      </Link>
    </Card>
  );
}

// ─── Task check section ───────────────────────────────────────
function TaskSection() {
  const { tasks } = useTasks();
  const t = todayStr();

  const overdue  = useMemo(() => tasks.filter(tk => isPast(tk.deadline) && tk.status !== "done"), [tasks]);
  const todayTodo = useMemo(() => tasks.filter(tk => tk.deadline === t && tk.status !== "done"), [tasks, t]);
  const todayDone = useMemo(() => tasks.filter(tk => tk.deadline === t && tk.status === "done"), [tasks, t]);
  const total     = todayTodo.length + todayDone.length;
  const pct       = total === 0 ? 0 : Math.round((todayDone.length / total) * 100);

  return (
    <Card style={{ padding: "18px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <CheckCircle2 size={13} style={{ color: "#a855f7" }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
            Check-up journée
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {overdue.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#f87171", background: "rgba(239,68,68,0.1)", padding: "3px 8px", borderRadius: 99, display: "flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={10} /> {overdue.length} en retard
            </span>
          )}
          <span style={{ fontSize: 10, fontWeight: 700, color: "#a855f7" }}>
            {todayDone.length}/{total} faites
          </span>
        </div>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.05)", marginBottom: 14, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`, borderRadius: 99,
            background: "linear-gradient(90deg, #7c3aed, #a855f7)",
            boxShadow: "0 0 8px rgba(168,85,247,0.4)",
            transition: "width 0.7s cubic-bezier(.4,0,.2,1)",
          }} />
        </div>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "#f87171", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>En retard</p>
          {overdue.slice(0, 4).map(tk => <Row key={tk.id} task={tk} />)}
          {overdue.length > 4 && (
            <p style={{ fontSize: 11, color: "rgba(239,68,68,0.6)", paddingLeft: 28, marginTop: 2 }}>
              +{overdue.length - 4} autres en retard
            </p>
          )}
        </div>
      )}

      {/* Today */}
      {(todayTodo.length > 0 || todayDone.length > 0) && (
        <div style={{ marginBottom: 8 }}>
          {overdue.length > 0 && (
            <p style={{ fontSize: 9, fontWeight: 700, color: "#a855f7", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Aujourd'hui</p>
          )}
          {todayTodo.map(tk => <Row key={tk.id} task={tk} />)}
          {todayDone.map(tk => <Row key={tk.id} task={tk} done />)}
        </div>
      )}

      {tasks.length === 0 && (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "12px 0" }}>
          Journée vide — profites-en 🎉
        </p>
      )}

      {total === 0 && overdue.length === 0 && tasks.length > 0 && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", paddingBottom: 4 }}>
          Aucune tâche prévue aujourd'hui
        </p>
      )}

      <Link to="/tasks" style={{
        fontSize: 11, fontWeight: 600, color: "rgba(168,85,247,0.6)",
        display: "flex", alignItems: "center", gap: 5, marginTop: 10,
      }}>
        Toutes les tâches ({tasks.length}) <ArrowRight size={11} />
      </Link>
    </Card>
  );
}

function Row({ task, done }: { task: any; done?: boolean }) {
  const overdue = isPast(task.deadline) && task.status !== "done";
  const biz     = task.business?.toLowerCase() ?? "";
  const accent  = BIZ_COLOR[biz] ?? "#a855f7";
  const label   = BIZ_LABEL[biz] ?? task.business ?? "—";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 12px", borderRadius: 12, marginBottom: 5,
      background: overdue ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.02)",
      border: overdue ? "1px solid rgba(239,68,68,0.12)" : "1px solid rgba(255,255,255,0.04)",
    }}>
      {done
        ? <CheckCircle2 size={14} style={{ color: "#4ade80", flexShrink: 0 }} />
        : overdue
        ? <AlertTriangle size={14} style={{ color: "#f87171", flexShrink: 0 }} />
        : <Circle size={14} style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
      }
      <p style={{
        flex: 1, fontSize: 12, fontWeight: 600, minWidth: 0,
        color: done ? "rgba(255,255,255,0.3)" : overdue ? "rgba(255,150,150,0.85)" : "rgba(255,255,255,0.8)",
        textDecoration: done ? "line-through" : "none",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{task.title}</p>
      <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
        {task.time && (
          <span style={{ fontSize: 10, color: overdue ? "#f87171" : "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: 3 }}>
            <Clock size={9} />{task.time}
          </span>
        )}
        <Label text={label} color={accent} />
      </div>
    </div>
  );
}

// ─── Business cards ───────────────────────────────────────────
function CoachingCard() {
  const { stats: c, loading } = useCoachingStats();
  const { hidden } = usePrivacy();
  const stats = [
    { label: "CA HT",    value: hidden ? "—" : fmtMoney(c.caTotal),    color: "#a855f7" },
    { label: "Closing",  value: `${c.tauxClosing}%`,                    color: "#a855f7" },
    { label: "Bookings", value: String(c.bookings),                     color: "#a855f7" },
  ];
  return (
    <Card accent="#a855f7" style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>🎓</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>Coaching & Formation</p>
            <p style={{ fontSize: 9, color: "rgba(168,85,247,0.6)" }}>HT · Formation 990€</p>
          </div>
        </div>
        <Link to="/coaching" style={{ fontSize: 10, color: "rgba(168,85,247,0.5)", display: "flex", alignItems: "center", gap: 2 }}>
          Voir <ArrowRight size={10} />
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {stats.map(s => (
          <div key={s.label} style={{ textAlign: "center", padding: "10px 4px", borderRadius: 10, background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.12)" }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", filter: hidden && s.label === "CA HT" ? "blur(6px)" : "none" }}>{s.value}</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CasinoCard() {
  const [s, setS] = useState({ commission: 0, depots: 0, revshare: 0 });
  const { hidden } = usePrivacy();
  useEffect(() => {
    sbGet<any[]>("casino_stats?brand=eq.corgibet&order=updated_at.desc&limit=1")
      .then(rows => { if (rows?.[0]) setS(rows[0]); });
  }, []);
  const caTotal = s.commission + s.depots * 80 + s.revshare;
  const stats = [
    { label: "CA total",  value: hidden ? "—" : fmtMoney(caTotal), color: "#00cc44" },
    { label: "Dépôts",   value: String(s.depots),                   color: "#00cc44" },
    { label: "RevShare", value: hidden ? "—" : fmtMoney(s.revshare), color: "#00cc44" },
  ];
  return (
    <Card accent="#00cc44">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>🎰</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>Casino Affiliation</p>
            <p style={{ fontSize: 9, color: "rgba(0,204,68,0.6)" }}>CPA + RevShare</p>
          </div>
        </div>
        <Link to="/casino" style={{ fontSize: 10, color: "rgba(0,204,68,0.5)", display: "flex", alignItems: "center", gap: 2 }}>
          Voir <ArrowRight size={10} />
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {stats.map(st => (
          <div key={st.label} style={{ textAlign: "center", padding: "10px 4px", borderRadius: 10, background: "rgba(0,204,68,0.06)", border: "1px solid rgba(0,204,68,0.1)" }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", filter: hidden && st.label !== "Dépôts" ? "blur(6px)" : "none" }}>{st.value}</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{st.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function CommandCenter() {
  const { tasks } = useTasks();
  const { stats: coaching } = useCoachingStats();
  const t = todayStr();

  const overdueCount = useMemo(() => tasks.filter(tk => isPast(tk.deadline) && tk.status !== "done").length, [tasks]);
  const todayCount   = useMemo(() => tasks.filter(tk => tk.deadline === t && tk.status !== "done").length, [tasks, t]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>

      <Hero
        todayCount={todayCount}
        overdueCount={overdueCount}
        caTotal={coaching.caTotal}
      />

      {/* Row 1 — Agenda + Calls */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        <AgendaCard />
        <CallsCard />
      </div>

      {/* Row 2 — Tasks */}
      <TaskSection />


    </div>
  );
}

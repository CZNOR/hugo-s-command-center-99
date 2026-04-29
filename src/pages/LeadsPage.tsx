import { useState, useEffect } from "react";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
  Phone, CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp,
  User, RefreshCw, TrendingUp, Target,
} from "lucide-react";
import { fetchAllBookings, fetchCalStats, type CalBooking, type CalStats } from "@/lib/calcom";

// ─── Types ───────────────────────────────────────────────────
type LeadStatus = "confirmé" | "présent" | "annulé" | "en attente";
type Tab = "pipeline" | "stats";

interface Lead {
  id: string;
  nom: string;
  email: string;
  phone?: string;
  dateISO: string;
  closer: string;
  statut: LeadStatus;
  budget?: string;
  niveau?: string;
  objectif?: string;     // objectif-principal
  blocage?: string;      // blocage-principal
  historique?: string;   // historique-investissement
  vision?: string;       // projet-vision (textarea)
  formation?: string;
}

// ─── Cal.com status → Lead status ────────────────────────────
function toLeadStatus(b: CalBooking): LeadStatus {
  const past = new Date(b.startTime) < new Date();
  if (b.status === "CANCELLED" || b.status === "REJECTED") return "annulé";
  if (b.status === "PENDING") return "en attente";
  return past ? "présent" : "confirmé";
}

function toLead(b: CalBooking): Lead {
  return {
    id: String(b.id),
    nom: b.attendee.name,
    email: b.attendee.email,
    phone: b.attendee.phone,
    dateISO: b.startTime,
    closer: b.closer,
    statut: toLeadStatus(b),
    budget: b.budget,
    niveau: b.niveau,
    objectif: b.objectif,
    blocage: b.blocage,
    historique: b.historique,
    vision: b.vision,
    formation: b.formation,
  };
}

// ─── Status config ────────────────────────────────────────────
const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  confirmé:     { label: "Confirmé",   color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: Clock },
  présent:      { label: "Présent ✓",  color: "#22c55e", bg: "rgba(34,197,94,0.12)",  icon: CheckCircle },
  annulé:       { label: "Annulé",     color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: XCircle },
  "en attente": { label: "En attente", color: "#6b7280", bg: "rgba(107,114,128,0.12)", icon: AlertCircle },
};

const BUDGET_POTENTIAL: { match: string; color: string; glow: string }[] = [
  { match: "Plus de 1500", color: "#22c55e", glow: "rgba(34,197,94,0.35)" },
  { match: "Entre 500",    color: "#eab308", glow: "rgba(234,179,8,0.35)" },
  { match: "Entre 100",    color: "#f97316", glow: "rgba(249,115,22,0.35)" },
  { match: "Moins de 100", color: "#ef4444", glow: "rgba(239,68,68,0.35)" },
];

function getBudgetPotential(budget?: string) {
  if (!budget) return { color: "#6b7280", glow: "rgba(107,114,128,0.2)" };
  const hit = BUDGET_POTENTIAL.find(b => budget.includes(b.match));
  return hit ?? { color: "#6b7280", glow: "rgba(107,114,128,0.2)" };
}

// ─── Styles ──────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(139,92,246,0.15)",
  borderRadius: "16px",
};
const cardGlow: React.CSSProperties = {
  ...card,
  boxShadow: "0 0 40px rgba(139,92,246,0.10)",
};

function shortCloser(name: string) { return name.split(" ")[0]; }

// ─── Lead row ─────────────────────────────────────────────────
function LeadRow({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const status     = STATUS_CONFIG[lead.statut];
  const StatusIcon = status.icon;
  const dt         = new Date(lead.dateISO);
  const dateLabel  = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const timeLabel  = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const hasDetails = !!(lead.budget || lead.niveau || lead.objectif || lead.blocage || lead.historique || lead.vision || lead.formation || lead.phone || lead.email);
  const potential  = getBudgetPotential(lead.budget);

  return (
    <div style={{ border: "1px solid rgba(139,92,246,0.12)", borderRadius: "12px", overflow: "hidden" }}>
      <button
        className="w-full flex items-center gap-3 p-4 transition-all text-left"
        style={{ background: open ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)" }}
        onClick={() => hasDetails && setOpen(!open)}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${potential.color}20`,
            border: `1.5px solid ${potential.color}50`,
            boxShadow: `0 0 10px ${potential.glow}`,
          }}>
          <User className="w-4 h-4" style={{ color: potential.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{lead.nom}</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {dateLabel} · {timeLabel}
          </p>
        </div>

        <span className="text-[11px] px-2 py-0.5 rounded-full hidden lg:inline-flex items-center gap-1 flex-shrink-0"
          style={{ background: "rgba(168,85,247,0.08)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(168,85,247,0.12)" }}>
          {lead.closer.split(" ")[0]}
        </span>

        {lead.budget && (
          <span className="text-[11px] px-2 py-0.5 rounded-full hidden md:inline-flex items-center flex-shrink-0 font-semibold"
            style={{ background: `${potential.color}15`, color: potential.color, border: `1px solid ${potential.color}35` }}>
            {lead.budget}
          </span>
        )}

        <span className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: status.bg, color: status.color }}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>

        {hasDetails && (open
          ? <ChevronUp  className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
          : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {lead.email && (
              <div className="p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>Email</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.email}</p>
              </div>
            )}
            {lead.phone && (
              <div className="p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>Téléphone</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.phone}</p>
              </div>
            )}
            {lead.budget && (
              <div className="p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>Budget</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.budget}</p>
              </div>
            )}
            {lead.niveau && (
              <div className="p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>Niveau actuel</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.niveau}</p>
              </div>
            )}
            {lead.objectif && (
              <div className="p-3 rounded-xl sm:col-span-2" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>Objectif principal</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.objectif}</p>
              </div>
            )}
            {lead.blocage && (
              <div className="p-3 rounded-xl sm:col-span-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#f87171" }}>Plus gros blocage</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.78)" }}>{lead.blocage}</p>
              </div>
            )}
            {lead.historique && (
              <div className="p-3 rounded-xl sm:col-span-2" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>Historique d'investissement</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.historique}</p>
              </div>
            )}
            {lead.vision && (
              <div className="p-3 rounded-xl sm:col-span-2" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#4ade80" }}>Sa vision du projet</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.55 }}>{lead.vision}</p>
              </div>
            )}
            {lead.formation && (
              <div className="p-3 rounded-xl sm:col-span-2" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>Formation</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.formation}</p>
              </div>
            )}
            <div className="p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>Closer</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.closer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Booking row (for stats tab) ──────────────────────────────
function BookingRow({ booking: b, upcoming }: { booking: CalBooking; upcoming?: boolean }) {
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex items-start gap-4 p-3 rounded-xl"
      style={{
        background: upcoming ? "rgba(96,165,250,0.05)" : "rgba(255,255,255,0.02)",
        border: upcoming ? "1px solid rgba(96,165,250,0.15)" : "1px solid rgba(139,92,246,0.08)",
      }}>
      <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: upcoming ? "rgba(96,165,250,0.15)" : "rgba(168,85,247,0.12)" }}>
        {upcoming
          ? <Clock className="w-4 h-4" style={{ color: "#60a5fa" }} />
          : <CheckCircle className="w-4 h-4" style={{ color: "#a855f7" }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{b.attendee.name}</p>
          {b.budget && <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>{b.budget}</span>}
          {b.niveau && <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.1)", color: "#c4b5fd" }}>{b.niveau}</span>}
        </div>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          {fmtDate(b.startTime)} {fmtTime(b.startTime)} · {shortCloser(b.closer)}
          {b.attendee.email && <span className="ml-2 opacity-60">{b.attendee.email}</span>}
        </p>
      </div>
    </div>
  );
}

// ─── Stats tab content ────────────────────────────────────────
function StatsTab({ stats, loading }: { stats: CalStats | null; loading: boolean }) {
  const cancellRate = stats ? Math.round((stats.cancelled / stats.total) * 100) : 0;
  const closerData = stats
    ? Object.entries(stats.byCloser).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name: name.split(" ")[0], count }))
    : [];
  const budgetData = stats
    ? Object.entries(stats.byBudget).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({
        label: label.replace("Entre ", "").replace(" et ", "–"),
        count,
      }))
    : [];

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total calls", value: stats.total,     color: "#a855f7", Icon: Phone      },
          { label: "Ce mois-ci",  value: stats.thisMonth, color: "#60a5fa", Icon: Target     },
          { label: "Confirmés",   value: stats.accepted,  color: "#22c55e", Icon: CheckCircle },
          { label: "Annulations", value: `${cancellRate}%`, color: "#f59e0b", Icon: TrendingUp },
        ].map(k => (
          <div key={k.label} className="p-5" style={cardGlow}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${k.color}18` }}>
              <k.Icon className="w-4 h-4" style={{ color: k.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-5" style={cardGlow}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Calls par closer</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={closerData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "rgba(10,5,25,0.95)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", color: "rgba(255,255,255,0.9)", fontSize: 12 }}
                cursor={{ fill: "rgba(139,92,246,0.06)" }}
                formatter={(val: number) => [val, "calls"]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#a855f7" fillOpacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-5" style={cardGlow}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Budget déclaré</h2>
          <div className="space-y-3">
            {budgetData.map((b, i) => {
              const total = budgetData.reduce((s, x) => s + x.count, 0);
              const pct = Math.round((b.count / total) * 100);
              const colors = ["#22c55e", "#a855f7", "#f59e0b", "#60a5fa", "#ef4444"];
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>{b.label}</span>
                    <div className="flex items-center gap-2">
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>{b.count}x</span>
                      <span style={{ color: colors[i % colors.length], fontWeight: 600 }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length], opacity: 0.7 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming */}
      {stats.upcoming.length > 0 && (
        <div className="p-5" style={cardGlow}>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
            <Clock className="w-4 h-4 text-blue-400" />
            Prochains calls ({stats.upcoming.length})
          </h2>
          <div className="space-y-2">
            {stats.upcoming.map(b => <BookingRow key={b.id} booking={b} upcoming />)}
          </div>
        </div>
      )}

      {/* History */}
      <div className="p-5" style={cardGlow}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
          Historique ({stats.accepted} confirmés)
        </h2>
        <div className="space-y-2">
          {stats.bookings.slice(0, 30).map(b => <BookingRow key={b.id} booking={b} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function LeadsPage() {
  const [tab, setTab] = useState<Tab>("pipeline");

  // Pipeline state
  const [leads,        setLeads]       = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError,   setLeadsError]  = useState<string | null>(null);
  const [filter,       setFilter]      = useState<LeadStatus | "tous">("confirmé");
  const [search,       setSearch]      = useState("");

  // Stats state
  const [stats,        setStats]       = useState<CalStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsLoaded,  setStatsLoaded]  = useState(false);

  const loadLeads = async () => {
    setLeadsLoading(true);
    setLeadsError(null);
    try {
      const raw = await fetchAllBookings();
      const now = Date.now();
      setLeads(
        raw
          .sort((a, b) => {
            const aTime = new Date(a.startTime).getTime();
            const bTime = new Date(b.startTime).getTime();
            const aFuture = aTime > now;
            const bFuture = bTime > now;
            if (aFuture && bFuture) return aTime - bTime;
            if (!aFuture && !bFuture) return bTime - aTime;
            return aFuture ? -1 : 1;
          })
          .map(toLead)
      );
    } catch (e) {
      setLeadsError(String(e));
    } finally {
      setLeadsLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await fetchCalStats();
      setStats(data);
      setStatsLoaded(true);
    } catch { /* silent */ }
    finally { setStatsLoading(false); }
  };

  useEffect(() => { loadLeads(); }, []);

  // Lazy-load stats when tab is clicked
  useEffect(() => {
    if (tab === "stats" && !statsLoaded) loadStats();
  }, [tab]);

  const confirmed = leads.filter(l => l.statut === "confirmé").length;
  const presents  = leads.filter(l => l.statut === "présent").length;
  const cancelled = leads.filter(l => l.statut === "annulé").length;
  const pending   = leads.filter(l => l.statut === "en attente").length;
  const total     = leads.length;
  const txConfirm = total > 0 ? Math.round(((presents + confirmed) / total) * 100) : 0;

  const filtered = leads
    .filter(l => filter === "tous" || l.statut === filter)
    .filter(l => !search || l.nom.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
            Leads & Appels
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Bookings Cal.com · {leadsLoading ? "chargement…" : `${total} au total`}
          </p>
        </div>
        <button
          onClick={() => tab === "pipeline" ? loadLeads() : loadStats()}
          disabled={leadsLoading || statsLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{
            background: "rgba(168,85,247,0.12)",
            border: "1px solid rgba(168,85,247,0.25)",
            color: "#a855f7",
            opacity: (leadsLoading || statsLoading) ? 0.5 : 1,
            cursor: (leadsLoading || statsLoading) ? "wait" : "pointer",
          }}>
          <RefreshCw className={`w-3.5 h-3.5 ${(leadsLoading || statsLoading) ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.12)", width: "fit-content" }}>
        {(["pipeline", "stats"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={tab === t ? {
              background: "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(168,85,247,0.25))",
              color: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(139,92,246,0.3)",
            } : {
              color: "rgba(255,255,255,0.4)",
              border: "1px solid transparent",
            }}>
            {t === "pipeline" ? "Pipeline" : "Statistiques"}
          </button>
        ))}
      </div>

      {/* ── Pipeline tab ── */}
      {tab === "pipeline" && (
        <>
          {leadsError && (
            <div className="p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              <p className="text-sm font-medium">Erreur Cal.com</p>
              <p className="text-xs mt-1 opacity-70">{leadsError}</p>
            </div>
          )}

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total bookings",  value: total,           color: "#a855f7", icon: "📋" },
              { label: "Présents",        value: presents,        color: "#22c55e", icon: "✅" },
              { label: "Confirmés",       value: confirmed,       color: "#60a5fa", icon: "📅" },
              { label: "Taux présence",   value: `${txConfirm}%`, color: "#f59e0b", icon: "📊" },
            ].map(s => (
              <div key={s.label} className="p-4" style={cardGlow}>
                <span className="text-xl">{s.icon}</span>
                <p className="text-2xl font-bold mt-2" style={{ color: s.color }}>
                  {leadsLoading ? "—" : s.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email…"
              style={{
                flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.15)",
                borderRadius: 10, padding: "8px 14px", fontSize: 13, color: "rgba(255,255,255,0.8)", outline: "none",
              }} />
            <div className="flex flex-wrap gap-2">
              {([
                ["tous",       `Tous (${total})`],
                ["présent",    `Présents (${presents})`],
                ["confirmé",   `Confirmés (${confirmed})`],
                ["annulé",     `Annulés (${cancelled})`],
                ["en attente", `En attente (${pending})`],
              ] as const).map(([val, label]) => (
                <button key={val} onClick={() => setFilter(val)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
                  style={filter === val ? {
                    background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))",
                    border: "1px solid rgba(139,92,246,0.4)", color: "rgba(255,255,255,0.9)",
                  } : {
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(139,92,246,0.12)", color: "rgba(255,255,255,0.45)",
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {leadsLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "rgba(168,85,247,0.5)" }} />
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(lead => <LeadRow key={lead.id} lead={lead} />)}
              {filtered.length === 0 && (
                <div className="p-10 text-center" style={card}>
                  <Phone className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {search ? "Aucun résultat pour cette recherche" : "Aucun lead dans cette catégorie"}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Stats tab ── */}
      {tab === "stats" && <StatsTab stats={stats} loading={statsLoading} />}

    </div>
  );
}

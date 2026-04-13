import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  TrendingUp, Users, DollarSign, Target, Zap, ArrowRight,
  Phone, Edit2, Save, X, RefreshCw, AlertTriangle,
} from "lucide-react";
import { useCoachingStats, type CoachingStats } from "@/lib/coachingStats";
import { usePrivacy } from "@/lib/privacyContext";
import { fetchAllBookings, type CalBooking } from "@/lib/calcom";

// ─── Helpers ──────────────────────────────────────────────────
const fmtEur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const isToday = (iso: string) =>
  iso.startsWith(new Date().toISOString().split("T")[0]);

const SB  = import.meta.env.VITE_SUPABASE_URL as string;
const SK  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
async function sbGet<T>(path: string): Promise<T> {
  const r = await fetch(`${SB}/rest/v1/${path}`, {
    headers: { apikey: SK, Authorization: `Bearer ${SK}` },
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return [] as T; }
}

// ─── Count-up animation ───────────────────────────────────────
function useCountUp(target: number, duration = 1200, decimals = 0) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return val.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function Num({ n, d = 0 }: { n: number; d?: number }) {
  const s = useCountUp(n, 1200, d);
  return <>{s}</>;
}

// ─── Card base ────────────────────────────────────────────────
function Card({
  children, accent = "rgba(255,255,255,0.06)", style,
}: {
  children: React.ReactNode; accent?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: `1px solid ${accent}`,
      borderRadius: 18,
      padding: "20px 22px",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── KPI hero pill ─────────────────────────────────────────────
function KpiCard({
  label, value, sub, color, icon: Icon, to, loading, blur,
}: {
  label: string; value: React.ReactNode; sub?: string;
  color: string; icon: React.ElementType;
  to?: string; loading?: boolean; blur?: boolean;
}) {
  const inner = (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: `1px solid ${color}22`,
      borderRadius: 18,
      padding: "20px 22px",
      display: "flex", flexDirection: "column", gap: 12,
      opacity: loading ? 0.5 : 1,
      transition: "opacity .3s, box-shadow .2s, border-color .2s",
      cursor: to ? "pointer" : "default",
    }}
      onMouseEnter={e => to && ((e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${color}22`)}
      onMouseLeave={e => to && ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
    >
      {/* Icon + label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: color + "18",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
          color: "rgba(255,255,255,0.28)", textTransform: "uppercase",
        }}>
          {label}
        </span>
      </div>
      {/* Value */}
      <div>
        <p style={{
          fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1,
          filter: blur ? "blur(8px)" : "none", userSelect: blur ? "none" : "auto",
        }}>
          {loading ? "—" : value}
        </p>
        {sub && (
          <p style={{
            fontSize: 11, color: color, marginTop: 5, fontWeight: 600,
            filter: blur ? "blur(6px)" : "none",
          }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: "none", display: "block" }}>{inner}</Link> : inner;
}

// ─── Revenue source mini-card ─────────────────────────────────
function RevCard({
  emoji, label, ca, sub, color, to, hidden,
}: {
  emoji: string; label: string; ca: number; sub: string; color: string; to: string; hidden: boolean;
}) {
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <div style={{
        background: color + "08",
        border: `1px solid ${color}18`,
        borderRadius: 14,
        padding: "16px 18px",
        display: "flex", flexDirection: "column", gap: 8,
        transition: "box-shadow .2s",
        cursor: "pointer",
      }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${color}22`}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{emoji}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
          <ArrowRight size={10} style={{ color, marginLeft: "auto" }} />
        </div>
        <p style={{
          fontSize: 22, fontWeight: 800, color: "#fff",
          filter: hidden ? "blur(7px)" : "none", userSelect: hidden ? "none" : "auto",
        }}>
          {fmtEur(ca)}
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{sub}</p>
      </div>
    </Link>
  );
}

// ─── Update Modal ─────────────────────────────────────────────
function UpdateModal({ stats, onSave, onClose }: {
  stats: CoachingStats; onSave: (s: CoachingStats) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState({ ...stats });
  const [saving, setSaving] = useState(false);
  const field = (key: keyof CoachingStats, label: string, step = 1) => (
    <div>
      <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
        {label}
      </label>
      <input type="number" step={step}
        value={form[key] as number}
        onChange={e => setForm(f => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
        style={{
          display: "block", width: "100%", marginTop: 4,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(139,92,246,0.25)",
          borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 14, outline: "none",
        }}
      />
    </div>
  );
  const handleSave = async () => { setSaving(true); await onSave(form); setSaving(false); onClose(); };
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#0d0b1a", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 20,
        padding: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 0 60px rgba(139,92,246,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: 16 }}>Mettre à jour les stats</h2>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {field("caTotal", "CA coaching HT (€)")}
          {field("clients", "Clients signés")}
          {field("bookings", "Bookings Cal.com")}
          {field("tauxClosing", "Taux closing (%)", 0.1)}
          {field("formationPrix", "Prix formation (€)")}
          {field("formationVentes", "Ventes formation")}
          {field("academieCA", "CA académie (€)")}
          {field("academiePayants", "Premium académie")}
          {field("agenceCA", "CA agence total (€)")}
          {field("agenceNetHugo", "Net Hugo agence (€)")}
        </div>
        <button onClick={handleSave} disabled={saving} style={{
          marginTop: 20, width: "100%",
          background: saving ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg,#7c3aed,#a855f7)",
          color: "#fff", border: "none", borderRadius: 10,
          padding: "11px 0", fontWeight: 700, fontSize: 14,
          cursor: saving ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

// ─── Upcoming calls mini ──────────────────────────────────────
function UpcomingCalls() {
  const [calls, setCalls] = useState<CalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchAllBookings().then(all => {
      const now = new Date().toISOString();
      const todayList = all.filter(b => b.status === "accepted" && isToday(b.startTime))
                           .sort((a, b) => a.startTime.localeCompare(b.startTime));
      const list = todayList.length > 0 ? todayList
        : all.filter(b => b.status === "accepted" && b.startTime > now)
             .sort((a, b) => a.startTime.localeCompare(b.startTime))
             .slice(0, 3);
      setCalls(list); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const budgetColor = (b?: string) => {
    if (!b) return "rgba(255,255,255,0.3)";
    const bl = b.toLowerCase();
    if (bl.includes("moins") || bl.includes("100")) return "#f87171";
    if (bl.includes("500") && !bl.includes("1"))    return "#fb923c";
    if (bl.includes("1 000") || bl.includes("1000")) return "#f59e0b";
    if (bl.includes("3 000") || bl.includes("3000")) return "#4ade80";
    if (bl.includes("5 000") || bl.includes("5000")) return "#a855f7";
    return "#60a5fa";
  };

  return (
    <Card accent="rgba(0,204,68,0.15)" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
        <Phone size={13} style={{ color: "#00cc44" }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
          Prochains calls
        </span>
        <Link to="/coaching" style={{ marginLeft: "auto", fontSize: 10, color: "#00cc44", display: "flex", alignItems: "center", gap: 3 }}>
          Voir tout <ArrowRight size={9} />
        </Link>
      </div>
      {loading && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Chargement…</p>}
      {!loading && calls.length === 0 && (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Aucun call prévu</p>
      )}
      {calls.map(c => {
        const bc = budgetColor(c.budget);
        const d = new Date(c.startTime);
        const today = new Date(); today.setHours(0,0,0,0);
        const tom = new Date(today); tom.setDate(tom.getDate()+1);
        const timeLabel = d >= today && d < tom
          ? fmtTime(c.startTime)
          : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + " · " + fmtTime(c.startTime);
        return (
          <div key={c.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: 12, marginBottom: 6,
            background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)",
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#00cc44", minWidth: 56, flexShrink: 0 }}>
              {timeLabel}
            </span>
            <p style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {c.attendee.name}
            </p>
            {c.budget && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: bc + "20", color: bc, flexShrink: 0 }}>
                {c.budget}
              </span>
            )}
          </div>
        );
      })}
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const { stats: c, loading, save } = useCoachingStats();
  const { hidden } = usePrivacy();
  const [showModal, setShowModal] = useState(false);
  const [casino, setCasino] = useState({ commission: 0, depots: 0, revshare: 0 });

  useEffect(() => {
    sbGet<any[]>("casino_stats?brand=eq.corgibet&order=updated_at.desc&limit=1")
      .then(rows => { if (rows?.[0]) setCasino(rows[0]); });
  }, []);

  const casinoTotal  = casino.commission + casino.depots * 80 + casino.revshare;
  const formationCA  = c.formationPrix * c.formationVentes;
  const totalGlobal  = c.caTotal + formationCA + c.academieCA + c.agenceCA + casinoTotal;
  const netHugo      = Math.round(c.caTotal / 3) + formationCA + Math.round(c.academieCA / 3) + c.agenceNetHugo;

  // Chart data — monthly stacked
  const chartData = c.monthlyData.map(m => ({
    m:        m.m,
    coaching: m.coaching,
    agence:   m.agence,
    academie: m.academie,
    total:    m.coaching + m.agence + m.academie,
  }));

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 5 }}>
            Vue globale · Toutes les activités
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)",
          borderRadius: 10, padding: "8px 16px", color: "#a855f7",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          <Edit2 size={13} /> Mettre à jour
        </button>
      </div>

      {/* ── Row 1 — 4 KPI cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <KpiCard label="CA global" color="#f59e0b" icon={DollarSign} loading={loading}
          value={<>{hidden ? "—" : <><Num n={totalGlobal} /> €</>}</>}
          sub={hidden ? undefined : `net Hugo ≈ ${fmtEur(netHugo)}`}
          blur={hidden}
        />
        <KpiCard label="Coaching HT" color="#a855f7" icon={TrendingUp} to="/coaching" loading={loading}
          value={<>{hidden ? "—" : <><Num n={c.caTotal} /> €</>}</>}
          sub={`${c.clients} clients · ${c.tauxClosing.toFixed(1)}% closing`}
          blur={hidden}
        />
        <KpiCard label="Casino Affiliation" color="#00cc44" icon={DollarSign} to="/casino" loading={loading}
          value={<>{hidden ? "—" : <><Num n={casinoTotal} /> €</>}</>}
          sub={`${casino.depots} dépôts · CPA + RevShare`}
          blur={hidden}
        />
        <KpiCard label="Leads entrants" color="#22d3ee" icon={Users} to="/coaching/leads" loading={loading}
          value={<><Num n={c.bookings} /></>}
          sub={`${c.clients + c.academiePayants} closés`}
        />
      </div>

      {/* ── Row 2 — Chart + Calls ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14 }}>

        {/* Chart */}
        <Card accent="rgba(139,92,246,0.15)" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
              CA mensuel — Coaching + Agence + Académie
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "Coaching", color: "#a855f7" },
                { label: "Agence",   color: "#22d3ee" },
                { label: "Académie", color: "#818cf8" },
              ].map(l => (
                <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: "inline-block" }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ filter: hidden ? "blur(8px)" : "none", transition: "filter .25s" }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="gCoaching" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAgence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAcademie" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="m" tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.22)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? `${(v/1000).toFixed(0)}k` : "0"} />
                <Tooltip
                  formatter={(v: number, name: string) => [fmtEur(v), name.charAt(0).toUpperCase() + name.slice(1)]}
                  contentStyle={{ background: "rgba(10,5,25,0.96)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 10, color: "#fff", fontSize: 12 }}
                  cursor={{ stroke: "rgba(168,85,247,0.3)", strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="coaching" stroke="#a855f7" strokeWidth={2} fill="url(#gCoaching)" stackId="1" dot={false} />
                <Area type="monotone" dataKey="agence"   stroke="#22d3ee" strokeWidth={2} fill="url(#gAgence)"   stackId="1" dot={false} />
                <Area type="monotone" dataKey="academie" stroke="#818cf8" strokeWidth={2} fill="url(#gAcademie)" stackId="1" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Upcoming calls */}
        <UpcomingCalls />
      </div>

      {/* ── Row 3 — Revenue breakdown ── */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: 12 }}>
          Revenus par source
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
          <RevCard emoji="🎯" label="Coaching HT"  color="#a855f7" ca={c.caTotal}     to="/coaching"           hidden={hidden}
            sub={`${c.clients} clients · moy. ${c.clients > 0 ? fmtEur(Math.round(c.caTotal / c.clients)) : "—"}`} />
          <RevCard emoji="📚" label="Formation"    color="#ec4899" ca={formationCA}   to="/coaching/paiements" hidden={hidden}
            sub={`${c.formationVentes} vente${c.formationVentes !== 1 ? "s" : ""} · ${fmtEur(c.formationPrix)} / unité`} />
          <RevCard emoji="🎓" label="Académie"     color="#818cf8" ca={c.academieCA}  to="/coaching"           hidden={hidden}
            sub={`${c.academiePayants} premium · historique inactif`} />
          <RevCard emoji="🏢" label="Agence"       color="#22d3ee" ca={c.agenceCA}    to="/coaching/agence"    hidden={hidden}
            sub={`net Hugo ≈ ${fmtEur(c.agenceNetHugo)}`} />
          <RevCard emoji="🎰" label="Casino"       color="#00cc44" ca={casinoTotal}   to="/casino"             hidden={hidden}
            sub={`${casino.depots} dépôts · ${fmtEur(casino.revshare)} RevShare`} />
        </div>
      </div>

      {/* ── Row 4 — Funnel + Closing ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Funnel */}
        <Card accent="rgba(139,92,246,0.12)">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 16 }}>
            Funnel de conversion
          </p>
          {[
            { icon: "📱", label: "Réseaux sociaux",  sub: "~12 400 vues / sem",                to: "/coaching/social"   },
            { icon: "🔗", label: "Clics Beacons",    sub: "186 clics / semaine",               to: "/coaching/beacons"  },
            { icon: "📞", label: "Appels réservés",  sub: `${c.bookings} bookings Cal.com`,    to: "/coaching/leads"    },
            { icon: "✅", label: "Clients signés",   sub: `${c.clients} closés HT`,            to: "/coaching/clients"  },
          ].map((s, i, arr) => (
            <div key={s.label}>
              <Link to={s.to} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 12,
                  background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.1)",
                  transition: "background .15s",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.12)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.06)"}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{s.label}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{s.sub}</p>
                  </div>
                  <ArrowRight size={12} style={{ color: "rgba(139,92,246,0.5)", flexShrink: 0 }} />
                </div>
              </Link>
              {i < arr.length - 1 && (
                <div style={{ display: "flex", justifyContent: "center", padding: "3px 0" }}>
                  <div style={{ width: 1, height: 14, background: "linear-gradient(to bottom, rgba(139,92,246,0.4), rgba(139,92,246,0.08))" }} />
                </div>
              )}
            </div>
          ))}
        </Card>

        {/* Stats closing */}
        <Card accent="rgba(168,85,247,0.15)">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 16 }}>
            Performance closing
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, filter: hidden ? "blur(7px)" : "none" }}>
            {[
              { label: "Bookings",     value: c.bookings,            color: "#22d3ee", suffix: "" },
              { label: "Taux closing", value: c.tauxClosing,         color: "#a855f7", suffix: "%", dec: 1 },
              { label: "Clients HT",  value: c.clients,              color: "#4ade80", suffix: "" },
              { label: "Panier moy",  value: c.clients > 0 ? Math.round(c.caTotal / c.clients) : 0, color: "#f59e0b", suffix: " €" },
            ].map(s => (
              <div key={s.label} style={{
                padding: "14px 16px", borderRadius: 14,
                background: s.color + "08", border: `1px solid ${s.color}18`,
                textAlign: "center",
              }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                  {loading ? "—" : <><Num n={s.value} d={s.dec ?? 0} />{s.suffix}</>}
                </p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 5 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Académie historique */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(99,102,241,0.5)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              Made Académie · Historique
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, filter: hidden ? "blur(6px)" : "none" }}>
              {[
                { label: "CA",       value: fmtEur(c.academieCA) },
                { label: "Membres",  value: String(c.academieMembres) },
                { label: "Premium",  value: String(c.academiePayants) },
                { label: "Lives",    value: String(c.academieLives) },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>{s.value}</p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Row 5 — Quick nav ── */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: 12 }}>
          Accès rapide
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {[
            { emoji: "🎯", label: "Coaching",        to: "/coaching" },
            { emoji: "📞", label: "Leads & Appels",  to: "/coaching/leads" },
            { emoji: "👥", label: "Clients",         to: "/coaching/clients" },
            { emoji: "💳", label: "Paiements",       to: "/coaching/paiements" },
            { emoji: "🎰", label: "Casino",          to: "/casino" },
            { emoji: "🎬", label: "Contenu",         to: "/content" },
            { emoji: "📅", label: "Agenda",          to: "/agenda" },
            { emoji: "✅", label: "Tâches",          to: "/tasks" },
          ].map(l => (
            <Link key={l.to} to={l.to} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", borderRadius: 14,
                background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
                transition: "border-color .2s, box-shadow .2s",
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(139,92,246,0.3)"; el.style.boxShadow = "0 0 16px rgba(139,92,246,0.1)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.06)"; el.style.boxShadow = "none"; }}
              >
                <span style={{ fontSize: 16 }}>{l.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{l.label}</span>
                <ArrowRight size={11} style={{ color: "rgba(139,92,246,0.4)", marginLeft: "auto" }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && <UpdateModal stats={c} onSave={save} onClose={() => setShowModal(false)} />}
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  ArrowRight, TrendingUp, Users, Phone, DollarSign,
  MessageCircle, Target, Zap, RefreshCw, Edit2, Save, X,
} from "lucide-react";
import AffiliateCopyButton from "@/components/AffiliateCopyButton";
import { useCoachingStats, type CoachingStats, type MonthEntry } from "@/lib/coachingStats";
import { usePrivacy } from "@/lib/privacyContext";

// ─── Supabase ─────────────────────────────────────────────────
const SB  = import.meta.env.VITE_SUPABASE_URL as string;
const SK  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
async function sbGet<T>(path: string): Promise<T> {
  const r = await fetch(`${SB}/rest/v1/${path}`, {
    headers: { apikey: SK, Authorization: `Bearer ${SK}` },
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return [] as T; }
}

// ─── Period filter ────────────────────────────────────────────
type Period = "1M" | "3M" | "6M" | "1an" | "2025";
const PERIODS: { key: Period; label: string }[] = [
  { key: "1M",   label: "1M"   },
  { key: "3M",   label: "3M"   },
  { key: "6M",   label: "6M"   },
  { key: "1an",  label: "1an"  },
  { key: "2025", label: "2025" },
];
function filterMonths(months: MonthEntry[], p: Period) {
  if (p === "1M")   return months.slice(-1);
  if (p === "3M")   return months.slice(-3);
  if (p === "6M")   return months.slice(-6);
  if (p === "1an")  return months;
  return months.slice(0, 12); // Jan–Déc 2025
}

// ─── Count-up ─────────────────────────────────────────────────
function useCountUp(target: number, dur = 1000) {
  const [v, setV] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setV((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return v;
}
function AnimNum({ n, suffix = "" }: { n: number; suffix?: string }) {
  const v = useCountUp(n);
  return <>{v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + suffix}</>;
}

const fmt = (n: number) => n.toLocaleString("fr-FR") + " €";

// ─── Update Modal ─────────────────────────────────────────────
function UpdateModal({ stats, onSave, onClose }: {
  stats: CoachingStats; onSave: (s: CoachingStats) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState({ ...stats });
  const [saving, setSaving] = useState(false);
  const f = (key: keyof CoachingStats, label: string, step = 1) => (
    <div key={String(key)}>
      <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{label}</label>
      <input type="number" step={step} value={form[key] as number}
        onChange={e => setForm(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
        style={{ display: "block", width: "100%", marginTop: 4, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 14, outline: "none" }}
      />
    </div>
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0d0b1a", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 0 60px rgba(139,92,246,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Mettre à jour les stats</h2>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {f("caTotal", "CA coaching HT (€)")}
          {f("clients", "Clients signés")}
          {f("bookings", "Bookings Cal.com")}
          {f("tauxClosing", "Taux closing (%)", 0.1)}
          {f("dmSemaine", "DMs / semaine")}
          {f("formationPrix", "Prix formation (€)")}
          {f("formationVentes", "Ventes formation")}
          {f("academieCA", "CA académie (€)")}
          {f("academiePayants", "Premium académie")}
          {f("academieMembres", "Membres académie")}
          {f("academieLives", "Lives académie")}
          {f("agenceCA", "CA agence total (€)")}
          {f("agenceNetHugo", "Net Hugo agence (€)")}
        </div>
        <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false); onClose(); }}
          disabled={saving}
          style={{ marginTop: 20, width: "100%", background: saving ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {saving ? <RefreshCw size={14} /> : <Save size={14} />}
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

// ─── KPI mini card ────────────────────────────────────────────
function KPICard({ label, value, delta, up, accent, icon: Icon }: {
  label: string; value: string; delta?: string; up?: boolean; accent: string; icon?: React.ElementType;
}) {
  return (
    <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 16, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {Icon && (
          <div style={{ width: 28, height: 28, borderRadius: 8, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={14} style={{ color: accent }} />
          </div>
        )}
        {delta && (
          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 99, marginLeft: "auto", background: up ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: up ? "#4ade80" : "#f87171" }}>
            {up ? "↑ " : ""}{delta}
          </span>
        )}
      </div>
      <p style={{ fontSize: 20, fontWeight: 800, color: "rgba(255,255,255,0.95)", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{label}</p>
    </div>
  );
}

// ─── Coaching panel ───────────────────────────────────────────
function CoachingPanel({ c, loading }: { c: CoachingStats; loading: boolean }) {
  return (
    <div style={{ background: "rgba(3,0,10,0.95)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 20, padding: "22px 22px", display: "flex", flexDirection: "column", gap: 16, opacity: loading ? 0.7 : 1, transition: "opacity .4s" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎓</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>Coaching & Formation</p>
            <p style={{ fontSize: 11, color: "rgba(124,58,237,0.8)" }}>HT · Formation {c.formationPrix.toLocaleString("fr-FR")} € · ex-Académie</p>
          </div>
        </div>
        <Link to="/coaching" style={{ fontSize: 12, color: "rgba(168,85,247,0.6)", display: "flex", alignItems: "center", gap: 3, textDecoration: "none" }}>
          Voir tout <ArrowRight size={12} />
        </Link>
      </div>

      <div style={{ height: 1, background: "linear-gradient(to right, rgba(168,85,247,0.3), transparent)" }} />

      {/* Formation badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 14, padding: "12px 16px" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#a855f7", letterSpacing: "0.07em", textTransform: "uppercase" }}>Formation actuelle</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>La Formation Complète E-commerce</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>De A à Z · Meta Ads · Klaviyo</p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
          <p style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{c.formationPrix} €</p>
          {c.formationVentes > 0 && <p style={{ fontSize: 11, color: "#4ade80" }}>{c.formationVentes} ventes</p>}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <KPICard label="DMs reçus cette semaine" value={String(c.dmSemaine)} delta="/ sem" up accent="#a855f7" icon={MessageCircle} />
        <KPICard label="Bookings Cal.com"         value={String(c.bookings)} delta="total" up accent="#a855f7" icon={Phone} />
        <KPICard label="Taux de closing"          value={`${c.tauxClosing}%`} delta={`${c.clients} clients`} up accent="#a855f7" icon={Target} />
        <KPICard label="CA coaching HT"           value={c.caTotal.toLocaleString("fr-FR") + " €"} delta={`${c.clients} signés`} up accent="#a855f7" icon={DollarSign} />
      </div>

      {/* Académie historique */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
          Made Académie — historique (Circle.so)
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Membres",  value: String(c.academieMembres) },
            { label: "Payants",  value: String(c.academiePayants) },
            { label: "Lives",    value: String(c.academieLives)   },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>{s.value}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Leads",     path: "/coaching/leads",     emoji: "📞" },
          { label: "Clients",   path: "/coaching/clients",   emoji: "🎯" },
          { label: "Paiements", path: "/coaching/paiements", emoji: "💳" },
        ].map(l => (
          <Link key={l.path} to={l.path} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 8px", borderRadius: 12, background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.18)", color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: 11, fontWeight: 600 }}>
            <span>{l.emoji}</span>{l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Casino panel ─────────────────────────────────────────────
function CasinoPanel() {
  const [stats, setStats] = useState({ commission: 0, registrations: 0, ctr: 0, qftd: 0, impressions: 0, depots: 0, revshare: 0 });
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const rows = await sbGet<any[]>("casino_stats?brand=eq.corgibet&order=updated_at.desc&limit=1");
      if (rows?.[0]) setStats(rows[0]);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const s = stats;
  const cpa = s.depots * 80;
  const caTotal = s.commission + cpa + s.revshare;
  const fmtE = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " €";

  return (
    <div style={{ background: "rgba(0,5,2,0.95)", border: "1px solid rgba(0,204,68,0.15)", borderRadius: 20, padding: "22px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(0,204,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎰</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>Casino Affiliation</p>
            <p style={{ fontSize: 11, color: "rgba(0,180,60,0.8)" }}>Coolaff · CPA + RevShare · Corgibet</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loading && <RefreshCw size={14} style={{ color: "#00cc44", animation: "spin 1s linear infinite" }} />}
          <AffiliateCopyButton compact />
          <Link to="/casino" style={{ fontSize: 12, color: "rgba(0,204,68,0.6)", display: "flex", alignItems: "center", gap: 3, textDecoration: "none" }}>
            Voir tout <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div style={{ height: 1, background: "linear-gradient(to right, rgba(0,204,68,0.3), transparent)" }} />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <KPICard label="Commission ce mois"    value={fmtE(s.commission)}      accent="#00cc44" icon={DollarSign} />
        <KPICard label="Inscriptions générées" value={String(s.registrations)} accent="#00cc44" icon={Users} />
        <KPICard label="Dépôts validés (CPA)"  value={String(s.depots)}        accent="#00cc44" icon={Target} />
        <KPICard label="CPA encaissé"          value={fmtE(cpa)}               accent="#00cc44" icon={DollarSign} />
        <KPICard label="RevShare estimé"       value={fmtE(s.revshare)}        accent="#00cc44" icon={TrendingUp} />
        <KPICard label="CA affiliation total"  value={fmtE(caTotal)}           accent="#00cc44" icon={Zap} />
      </div>

      <p style={{ fontSize: 10, textAlign: "center", color: "rgba(255,255,255,0.2)" }}>
        CPA calculé à 80 € / dépôt · données Supabase live
      </p>
    </div>
  );
}

// ─── Main CA chart card ───────────────────────────────────────
function RevenueCard({ c, loading }: { c: CoachingStats; loading: boolean }) {
  const { hidden } = usePrivacy();
  const [period, setPeriod] = useState<Period>("6M");

  const chartData = useMemo(() => filterMonths(c.monthlyData, period), [c.monthlyData, period]);

  const pTotals = useMemo(() => {
    const coaching  = chartData.reduce((s, d) => s + d.coaching, 0);
    const academie  = chartData.reduce((s, d) => s + d.academie, 0);
    const agence    = chartData.reduce((s, d) => s + d.agence,   0);
    const formation = c.formationPrix * c.formationVentes;
    const gross = coaching + academie + agence + formation;
    const net   = Math.round(coaching / 3) + Math.round(academie / 3) + agence + formation;
    return { gross, net, coaching, academie, agence, formation };
  }, [chartData, c]);

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20, overflow: "hidden",
      opacity: loading ? 0.6 : 1,
      transition: "opacity .4s",
    }}>
      {/* Header */}
      <div style={{ padding: "18px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ filter: hidden ? "blur(10px)" : "none", transition: "filter .25s", userSelect: hidden ? "none" : "auto" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>
            CA {period === "1an" ? "Jan 25 → Avr 26" : period === "2025" ? "année 2025" : period === "1M" ? "ce mois" : `sur ${period}`}
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
              {loading ? "—" : <AnimNum n={pTotals.gross} suffix=" €" />}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#4ade80", marginTop: 4, fontWeight: 600 }}>
            net Hugo ≈ {loading ? "—" : <AnimNum n={pTotals.net} suffix=" €" />}
          </p>
        </div>

        {/* Period pills */}
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} style={{
              padding: "5px 10px", borderRadius: 99,
              fontSize: 11, fontWeight: 600,
              border: period === p.key ? "1px solid rgba(168,85,247,0.6)" : "1px solid rgba(255,255,255,0.1)",
              background: period === p.key ? "rgba(168,85,247,0.2)" : "transparent",
              color: period === p.key ? "#a855f7" : "rgba(255,255,255,0.4)",
              cursor: "pointer", transition: "all .15s",
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 180, filter: hidden ? "blur(8px)" : "none", transition: "filter .25s" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dcCoaching" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="dcAcademie" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="dcAgence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="m" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} interval={chartData.length > 6 ? 1 : 0} />
            <YAxis hide domain={[0, "auto"]} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const coaching = (payload.find((p: any) => p.dataKey === "coaching")?.value ?? 0) as number;
              const academie = (payload.find((p: any) => p.dataKey === "academie")?.value ?? 0) as number;
              const agence   = (payload.find((p: any) => p.dataKey === "agence")?.value   ?? 0) as number;
              const total    = coaching + academie + agence;
              const net      = Math.round(coaching / 3) + Math.round(academie / 3) + agence;
              return (
                <div style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 14px", fontSize: 12, minWidth: 170 }}>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontWeight: 700, marginBottom: 8 }}>{label}</p>
                  {coaching > 0 && <p style={{ color: "#a855f7", marginBottom: 3 }}>Coaching HT : <b>{fmt(coaching)}</b></p>}
                  {academie > 0 && <p style={{ color: "#818cf8", marginBottom: 3 }}>Académie : <b>{fmt(academie)}</b></p>}
                  {agence   > 0 && <p style={{ color: "#22d3ee", marginBottom: 3 }}>Agence : <b>{fmt(agence)}</b></p>}
                  {total > 0 && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 8, paddingTop: 8 }}>
                      <p style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, marginBottom: 3 }}>Total : {fmt(total)}</p>
                      <p style={{ color: "#4ade80", fontWeight: 700, fontSize: 11 }}>net Hugo ≈ {fmt(net)}</p>
                    </div>
                  )}
                </div>
              );
            }} />
            <Area type="monotone" dataKey="agence"   stackId="a" stroke="#22d3ee" strokeWidth={1.5} fill="url(#dcAgence)" dot={false} />
            <Area type="monotone" dataKey="academie" stackId="a" stroke="#818cf8" strokeWidth={1.5} fill="url(#dcAcademie)" dot={false} />
            <Area type="monotone" dataKey="coaching" stackId="a" stroke="#a855f7" strokeWidth={2}   fill="url(#dcCoaching)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, padding: "6px 20px 4px", justifyContent: "flex-end" }}>
        {[
          { label: "Coaching", color: "#a855f7" },
          { label: "Académie", color: "#818cf8" },
          { label: "Agence",   color: "#22d3ee" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 6, filter: hidden ? "blur(8px)" : "none", userSelect: hidden ? "none" : "auto" }}>
        {[
          { label: "Coaching HT", value: c.caTotal,    net: Math.round(c.caTotal / 3),    color: "#a855f7" },
          { label: "Académie",    value: c.academieCA, net: Math.round(c.academieCA / 3), color: "#818cf8" },
          { label: "Agence",      value: c.agenceCA,   net: c.agenceNetHugo,              color: "#22d3ee" },
          { label: "Formation",   value: c.formationPrix * c.formationVentes, net: c.formationPrix * c.formationVentes, color: "#ec4899" },
        ].map((m, i, arr) => (
          <div key={i} style={{ padding: "12px 10px", borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>{m.label}</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{fmt(m.value)}</p>
            <p style={{ fontSize: 9, color: "#4ade80", marginTop: 2 }}>net {fmt(m.net)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const { stats: c, loading, save } = useCoachingStats();
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Dashboard <span style={{ fontSize: 22 }}>📊</span>
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 5 }}>
            Vue globale · Toutes les activités
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)",
          borderRadius: 10, padding: "8px 16px", color: "#a855f7",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          <Edit2 size={13} /> Mettre à jour
        </button>
      </div>

      {/* Revenue card — big chart avec période */}
      <RevenueCard c={c} loading={loading} />

      {/* Business panels */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
          Mes business
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          <CoachingPanel c={c} loading={loading} />
          <CasinoPanel />
        </div>
      </div>

      {showModal && <UpdateModal stats={c} onSave={save} onClose={() => setShowModal(false)} />}
    </div>
  );
}

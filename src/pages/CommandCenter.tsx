import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, TrendingUp, Users,
  Phone, DollarSign, MessageCircle, Target, Zap, RefreshCw,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { gamificationProfile } from "@/lib/mock-data";
import TaskBoard from "@/components/TaskBoard";
import AffiliateCopyButton from "@/components/AffiliateCopyButton";
import HomeParticles from "@/components/HomeParticles";
import { useBusiness } from "@/lib/businessContext";
import { useTasks } from "@/lib/taskContext";
import { useCoachingStats } from "@/lib/coachingStats";
import { usePrivacy } from "@/lib/privacyContext";

// ─── Supabase helper ─────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
async function sbFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// Formation info (statique — le prix ne change pas souvent)
const FORMATION = {
  prix: 990,
  nom: "La Formation Complète E-commerce",
  description: "De A à Z · Meta Ads · Klaviyo",
};

// ─── Colors ──────────────────────────────────────────────────
const CASINO_COLOR  = "#00ff88";
const CASINO_DIM    = "#00d97b";
const CASINO_GLOW   = "rgba(0,255,136,0.12)";
const VIOLET_COLOR  = "#a855f7";
const VIOLET_DIM    = "#7c3aed";
const VIOLET_GLOW   = "rgba(168,85,247,0.12)";

// ─── Monthly CA data — données exactes (CSV Notion + tableau clients) ─
// Coaching HT : 9 clients avec dates exactes de signature
//   Aoû 25 : Ayoub 2490 + Amèle 2397 + Yassine 2397 = 7 284
//   Sep 25 : Shirlie 2200 + Aristote 3000 + Thomas 3000 = 8 200
//   Oct 25 : Kryz Emile 2999
//   Nov 25 : Flavio 3500
//   Déc 25 : Lenny 3500  → total : 25 483 ✓
// Académie + Agence : données CSV Notion avec dates exactes
const ALL_MONTHS = [
  { m: "Jan 25", coaching: 0,    academie: 0,    agence: 2200 },
  { m: "Fév 25", coaching: 0,    academie: 0,    agence: 1000 },
  { m: "Mar 25", coaching: 0,    academie: 0,    agence: 1200 },
  { m: "Avr 25", coaching: 0,    academie: 0,    agence: 0    },
  { m: "Mai 25", coaching: 0,    academie: 0,    agence: 1350 },
  { m: "Jun 25", coaching: 0,    academie: 0,    agence: 4690 },
  { m: "Jul 25", coaching: 0,    academie: 0,    agence: 3580 },
  { m: "Aoû 25", coaching: 7284, academie: 0,    agence: 1475 },
  { m: "Sep 25", coaching: 8200, academie: 0,    agence: 0    },
  { m: "Oct 25", coaching: 2999, academie: 1940, agence: 1650 },
  { m: "Nov 25", coaching: 3500, academie: 1940, agence: 4491 },
  { m: "Déc 25", coaching: 3500, academie: 1940, agence: 1000 },
  { m: "Jan 26", coaching: 0,    academie: 1940, agence: 1700 },
  { m: "Fév 26", coaching: 0,    academie: 970,  agence: 1700 },
  { m: "Mar 26", coaching: 0,    academie: 0,    agence: 1700 },
];

type Period = "3M" | "6M" | "1an" | "2025";
const PERIODS: { key: Period; label: string }[] = [
  { key: "3M",   label: "3M"   },
  { key: "6M",   label: "6M"   },
  { key: "1an",  label: "1an"  },
  { key: "2025", label: "2025" },
];
function filterMonths(p: Period) {
  if (p === "3M")   return ALL_MONTHS.slice(-3);            // Jan-Mar 26
  if (p === "6M")   return ALL_MONTHS.slice(-6);            // Oct 25-Mar 26
  if (p === "1an")  return ALL_MONTHS;                      // Jan 25-Mar 26 (tout)
  return ALL_MONTHS.slice(0, 12);                           // Jan-Déc 2025 uniquement
}

// ─── Mobile overview ──────────────────────────────────────────
function MobileOverview() {
  const { stats: rawStats } = useCoachingStats();
  const { hidden } = usePrivacy();
  const c = { academieCA: 8_730, agenceCA: 50_523, agenceNetHugo: 29_436, ...rawStats };
  const [period, setPeriod] = useState<Period>("6M");

  // Filtered chart data
  const chartData = useMemo(() => filterMonths(period), [period]);

  // Period totals — cohérent avec les données mensuelles (agence = part Hugo)
  const pTotals = useMemo(() => {
    const coaching  = chartData.reduce((s, d) => s + d.coaching, 0);
    const academie  = chartData.reduce((s, d) => s + d.academie, 0);
    const agence    = chartData.reduce((s, d) => s + d.agence,   0);
    const formation = c.formationPrix * c.formationVentes;
    const gross = coaching + academie + agence + formation;
    const net   = Math.round(coaching / 3) + Math.round(academie / 3) + agence + formation;
    return { gross, net };
  }, [chartData]);

  return (
    <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* CA card — Shopify-style */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20, overflow: "hidden",
        filter: hidden ? "blur(10px)" : "none",
        transition: "filter 0.25s ease",
        userSelect: hidden ? "none" : "auto",
      }}>
        {/* Header: metric + period pills */}
        <div style={{ padding: "16px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>
              CA {period === "1an" ? "Jan 25 → Mar 26" : period === "2025" ? "année 2025" : `sur ${period}`}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                {pTotals.gross.toLocaleString("fr-FR")} €
              </span>
            </div>
            <p style={{ fontSize: 11, color: "#4ade80", marginTop: 3 }}>
              net Hugo ≈ <span style={{ fontWeight: 700 }}>{pTotals.net.toLocaleString("fr-FR")} €</span>
            </p>
          </div>

          {/* Period pills */}
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 20,
                  fontSize: 10, fontWeight: 600,
                  border: period === p.key ? "1px solid rgba(168,85,247,0.6)" : "1px solid rgba(255,255,255,0.1)",
                  background: period === p.key ? "rgba(168,85,247,0.2)" : "transparent",
                  color: period === p.key ? "#a855f7" : "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >{p.label}</button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: 160, paddingBottom: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gCoaching" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="gAcademie" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="gAgence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="m"
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                axisLine={false} tickLine={false}
                interval={chartData.length > 6 ? 1 : 0}
              />
              <YAxis hide domain={[0, "auto"]} />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const coaching = payload.find((p: any) => p.dataKey === "coaching")?.value ?? 0;
                const academie = payload.find((p: any) => p.dataKey === "academie")?.value ?? 0;
                const agence   = payload.find((p: any) => p.dataKey === "agence")?.value ?? 0;
                const total    = coaching + academie + agence;
                const net      = Math.round(coaching / 3) + Math.round(academie / 3) + agence;
                return (
                  <div style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 14px", fontSize: 12, minWidth: 160 }}>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontWeight: 700, marginBottom: 8, letterSpacing: "0.02em" }}>{label}</p>
                    {coaching > 0 && <p style={{ color: "#a855f7", marginBottom: 3 }}>Coaching HT : <b>{coaching.toLocaleString("fr-FR")} €</b></p>}
                    {academie > 0 && <p style={{ color: "#818cf8", marginBottom: 3 }}>Académie : <b>{academie.toLocaleString("fr-FR")} €</b></p>}
                    {agence   > 0 && <p style={{ color: "#22d3ee", marginBottom: 3 }}>Agence : <b>{agence.toLocaleString("fr-FR")} €</b></p>}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 8, paddingTop: 8 }}>
                      <p style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, marginBottom: 3 }}>Total : {total.toLocaleString("fr-FR")} €</p>
                      <p style={{ color: "#4ade80", fontWeight: 700, fontSize: 11 }}>net Hugo ≈ {net.toLocaleString("fr-FR")} €</p>
                    </div>
                  </div>
                );
              }} />
              <Area type="monotone" dataKey="agence"   stackId="a" stroke="#22d3ee" strokeWidth={1.5} fill="url(#gAgence)"   />
              <Area type="monotone" dataKey="academie"  stackId="a" stroke="#818cf8" strokeWidth={1.5} fill="url(#gAcademie)"  />
              <Area type="monotone" dataKey="coaching"  stackId="a" stroke="#a855f7" strokeWidth={2}   fill="url(#gCoaching)"  />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 12, padding: "8px 16px 4px", justifyContent: "flex-end" }}>
          {[
            { label: "Coaching", color: "#a855f7" },
            { label: "Académie", color: "#818cf8" },
            { label: "Agence",   color: "#22d3ee" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 6 }}>
          {[
            { label: "Coaching HT", value: c.caTotal,                          net: Math.round(c.caTotal / 3),          color: "#a855f7" },
            { label: "Académie",    value: c.academieCA,                        net: Math.round(c.academieCA / 3),       color: "#818cf8" },
            { label: "Agence",      value: c.agenceCA,                          net: c.agenceNetHugo,                    color: "#22d3ee" },
            { label: "Formation",   value: c.formationPrix * c.formationVentes, net: c.formationPrix * c.formationVentes, color: "#ec4899" },
          ].map((m, i, arr) => (
            <div key={i} style={{ padding: "10px 8px", borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>{m.label}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: m.color }}>{m.value.toLocaleString("fr-FR")} €</p>
              <p style={{ fontSize: 9, color: "#4ade80", marginTop: 1 }}>net {m.net.toLocaleString("fr-FR")} €</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats clés */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { emoji: "📞", label: "Bookings", value: String(c.bookings), sub: "Cal.com total" },
          { emoji: "🎯", label: "Closing",  value: c.tauxClosing + "%", sub: c.clients + " clients signés" },
        ].map((item, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>{item.emoji}</span>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{item.value}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{item.label}</p>
              <p style={{ fontSize: 10, color: "#4ade80", marginTop: 1 }}>{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {[
          { label: "Leads",     path: "/coaching/leads",     emoji: "📞", color: "#7c3aed" },
          { label: "Paiements", path: "/coaching/paiements", emoji: "💳", color: "#7c3aed" },
          { label: "Casino",    path: "/casino",             emoji: "🎰", color: "#00cc44" },
        ].map(l => (
          <Link key={l.path} to={l.path} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
            padding: "12px 8px", borderRadius: 14,
            background: `${l.color}10`, border: `1px solid ${l.color}25`,
            color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 11, fontWeight: 600,
          }}>
            <span style={{ fontSize: 20 }}>{l.emoji}</span>
            {l.label}
          </Link>
        ))}
      </div>

    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────
function KPICard({ label, value, delta, up, accent, icon: Icon }: {
  label: string; value: string; delta?: string; up?: boolean;
  accent: string; icon?: React.ElementType;
}) {
  return (
    <div
      className="kpi-hover p-4 rounded-2xl flex flex-col gap-2"
      style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="flex items-center justify-between">
        {Icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
          </div>
        )}
        {delta && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-auto"
            style={{ background: up ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: up ? "#4ade80" : "#f87171" }}
          >
            {up ? "↑" : ""} {delta}
          </span>
        )}
      </div>
      <p className="text-xl font-bold leading-none" style={{ color: "rgba(255,255,255,0.95)" }}>{value}</p>
      <p className="text-[11px] leading-tight" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
    </div>
  );
}

// ─── Casino panel (live Supabase) ─────────────────────────────
interface CasinoStats {
  commission: number; registrations: number; ctr: number;
  qftd: number; impressions: number; depots: number; revshare: number;
}
const CASINO_DEFAULTS: CasinoStats = {
  commission: 0, registrations: 0, ctr: 0,
  qftd: 0, impressions: 0, depots: 0, revshare: 0,
};

function CasinoPanel() {
  const [stats, setStats] = useState<CasinoStats>(CASINO_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const rows = await sbFetch<any[]>(
        "casino_stats?brand=eq.corgibet&order=updated_at.desc&limit=1"
      );
      if (rows?.[0]) setStats(rows[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const s = stats;
  const cpa = s.depots * 80;
  const caTotal = s.commission + cpa + s.revshare;
  const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " €";

  return (
    <div className="panel-inner p-5 flex flex-col gap-4 relative" style={{ background: "rgba(0,5,2,0.95)" }}>
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${CASINO_COLOR}18`, boxShadow: `0 0 16px ${CASINO_GLOW}` }}>🎰</div>
          <div>
            <p className="text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Casino Affiliation</p>
            <p className="text-[11px]" style={{ color: CASINO_DIM }}>Coolaff · CPA + RevShare</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: CASINO_DIM }} />}
          <div className="hidden sm:block"><AffiliateCopyButton /></div>
          <Link to="/casino" className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: `${CASINO_DIM}99` }}>
            Voir tout <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
      <div className="h-px relative z-10" style={{ background: `linear-gradient(to right, ${CASINO_COLOR}30, transparent)` }} />
      <div className="grid grid-cols-2 gap-2.5 relative z-10">
        <KPICard label="Commission ce mois"     value={fmt(s.commission)}     accent={CASINO_COLOR} icon={DollarSign} />
        <KPICard label="Inscriptions générées"  value={String(s.registrations)} accent={CASINO_COLOR} icon={Users} />
        <KPICard label="Dépôts validés (CPA)"   value={String(s.depots)}      accent={CASINO_COLOR} icon={Target} />
        <KPICard label="CPA encaissé"           value={fmt(cpa)}              accent={CASINO_COLOR} icon={DollarSign} />
        <KPICard label="RevShare estimé"        value={fmt(s.revshare)}       accent={CASINO_COLOR} icon={TrendingUp} />
        <KPICard label="CA affiliation total"   value={fmt(caTotal)}          accent={CASINO_COLOR} icon={Zap} />
      </div>
      <p className="text-[10px] text-center relative z-10" style={{ color: "rgba(255,255,255,0.2)" }}>
        CPA calculé à 80 € / dépôt · données Supabase live
      </p>
    </div>
  );
}

// ─── Coaching panel ───────────────────────────────────────────
function CoachingPanel() {
  const { stats: c } = useCoachingStats();
  return (
    <div className="panel-inner p-5 flex flex-col gap-4 relative" style={{ background: "rgba(3,0,10,0.95)" }}>

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${VIOLET_COLOR}18`, boxShadow: `0 0 16px ${VIOLET_GLOW}` }}>🎓</div>
          <div>
            <p className="text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Coaching & Formation</p>
            <p className="text-[11px]" style={{ color: VIOLET_DIM + "bb" }}>HT · Formation 990 € · ex-Académie</p>
          </div>
        </div>
        <Link to="/coaching" className="flex items-center gap-1 text-xs" style={{ color: `${VIOLET_COLOR}99` }}>
          Voir tout <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="h-px relative z-10" style={{ background: `linear-gradient(to right, ${VIOLET_COLOR}30, transparent)` }} />

      {/* Formation 990€ badge */}
      <div className="relative z-10 flex items-center justify-between rounded-xl px-4 py-3"
        style={{ background: `${VIOLET_COLOR}12`, border: `1px solid ${VIOLET_COLOR}30` }}>
        <div>
          <p className="text-xs font-bold" style={{ color: VIOLET_COLOR, letterSpacing: "0.06em" }}>FORMATION ACTUELLE</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>{FORMATION.nom}</p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{FORMATION.description}</p>
        </div>
        <div className="flex-shrink-0 ml-3 text-right">
          <span className="text-2xl font-black" style={{ color: "#fff" }}>{c.formationPrix} €</span>
          {c.formationVentes > 0 && (
            <p className="text-[11px] mt-0.5" style={{ color: "#4ade80" }}>{c.formationVentes} ventes</p>
          )}
        </div>
      </div>

      {/* Coaching HT KPIs */}
      <div className="grid grid-cols-2 gap-2.5 relative z-10">
        <KPICard label="DMs reçus cette semaine" value={String(c.dmSemaine)}                        delta="/ sem"           up accent={VIOLET_COLOR} icon={MessageCircle} />
        <KPICard label="Bookings Cal.com"         value={String(c.bookings)}                        delta="total"          up accent={VIOLET_COLOR} icon={Phone} />
        <KPICard label="Taux de closing"          value={`${c.tauxClosing}%`}                       delta={`${c.clients} clients`} up accent={VIOLET_COLOR} icon={Target} />
        <KPICard label="CA coaching HT encaissé"  value={c.caTotal.toLocaleString("fr-FR") + " €"} delta={`${c.clients} signés`}  up accent={VIOLET_COLOR} icon={DollarSign} />
      </div>

      {/* Made Académie — historique */}
      <div className="relative z-10">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>
          Made Académie — historique (Circle.so)
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Membres",  value: String(c.academieMembres) },
            { label: "Payants",  value: String(c.academiePayants) },
            { label: "Lives",    value: String(c.academieLives)   },
          ].map((s, i) => (
            <div key={i} className="rounded-xl text-center py-2.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-2 relative z-10">
        {[
          { label: "Leads",     path: "/coaching/leads",     emoji: "📞" },
          { label: "Appels",    path: "/coaching/appels",    emoji: "🎯" },
          { label: "Paiements", path: "/coaching/paiements", emoji: "💳" },
        ].map(l => (
          <Link key={l.path} to={l.path} className="flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-medium justify-center"
            style={{ background: `${VIOLET_COLOR}10`, border: `1px solid ${VIOLET_COLOR}20`, color: "rgba(255,255,255,0.55)" }}>
            <span>{l.emoji}</span> {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Day Progress Bar ─────────────────────────────────────────
function DayProgress() {
  const { tasks } = useTasks();
  const { activeBusiness } = useBusiness();
  const accent = activeBusiness.id === "casino" ? "#00cc44" : "#a855f7";
  const accentDim = activeBusiness.id === "casino" ? "rgba(0,204,68,0.15)" : "rgba(168,85,247,0.15)";
  const accentBorder = activeBusiness.id === "casino" ? "rgba(0,204,68,0.25)" : "rgba(168,85,247,0.25)";

  // Today's tasks only (deadline === today)
  const today      = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter(t => t.deadline === today);
  const total      = todayTasks.length;
  const done       = todayTasks.filter(t => t.status === "done").length;
  const pct        = total === 0 ? 0 : Math.round((done / total) * 100);

  // Status label
  const status = total === 0
    ? "Aucune tâche pour aujourd'hui"
    : done === total
    ? "🎉 Journée complète !"
    : pct >= 75
    ? "Presque fini, tiens bon !"
    : pct >= 50
    ? "La moitié est faite 💪"
    : pct > 0
    ? "C'est parti !"
    : "La journée commence…";

  return (
    <div
      className="animate-fade-up"
      style={{
        padding: "14px 20px",
        borderRadius: 16,
        background: accentDim,
        border: `1px solid ${accentBorder}`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minWidth: 260,
        flex: "1 1 260px",
        maxWidth: 420,
        animationDelay: "0.18s",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>
          JOURNÉE
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{pct}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 6, borderRadius: 99,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 99,
          background: `linear-gradient(90deg, ${accent}99, ${accent})`,
          boxShadow: `0 0 10px ${accent}66`,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{status}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>
          {done}/{total} tâche{total !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

// ─── Greeting ─────────────────────────────────────────────────
function Greeting() {
  const hour    = new Date().getHours();
  const salut   = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const now     = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex items-start justify-between flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0s" }}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
          {salut} · <span style={{ color: "rgba(255,255,255,0.45)" }}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</span>
        </p>
        <h1 className="text-3xl font-bold mt-1">
          <span className="czn-title">Command Center</span>{" "}
          <span style={{ fontSize: "1.5rem" }}>⚡</span>
        </h1>
      </div>
      <DayProgress />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function CommandCenter() {
  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <Greeting />

      {/* Mobile overview — recap + chart */}
      <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <MobileOverview />
      </div>

      {/* Task board — planning + today + week */}
      <div className="animate-fade-up" style={{ animationDelay: "0.22s" }}>
        <TaskBoard />
      </div>

      {/* Business panels */}
      <div className="animate-fade-up" style={{ animationDelay: "0.32s" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
          Mes business
        </p>
        {/* Particle canvas behind panels */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: "-20px", zIndex: 0, pointerEvents: "none", overflow: "hidden", borderRadius: 24 }}>
            <HomeParticles />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ position: "relative", zIndex: 1 }}>
            <div className="panel-coaching-wrap"><CoachingPanel /></div>
            <div className="panel-casino-wrap"><CasinoPanel /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

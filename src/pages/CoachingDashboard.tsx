import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Users, DollarSign, Target, Zap, ArrowRight, TrendingUp, Edit2, X, Save } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid,
} from "recharts";
import { useCoachingStats, type CoachingStats } from "@/lib/coachingStats";

// ─── Count-up hook ───────────────────────────────────────────
function useCountUp(target: number, duration = 1200, decimals = 0): string {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(eased * target);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return val.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ─── Animated number ─────────────────────────────────────────
function AnimatedNum({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const s = useCountUp(value, 1400, decimals);
  return <>{s}</>;
}

// CA mensuel réel — paiements encaissés août–déc 2025
const trendData = [
  { week: "Août", ca: 7.284 },
  { week: "Sep",  ca: 8.2   },
  { week: "Oct",  ca: 2.999 },
  { week: "Nov",  ca: 3.5   },
  { week: "Déc",  ca: 3.5   },
];

const quickLinks = [
  { label: "Réseaux sociaux", path: "/coaching/social", emoji: "📱" },
  { label: "Contenu",         path: "/content",         emoji: "🎬" },
  { label: "Paiements",       path: "/coaching/paiements", emoji: "💳" },
  { label: "Équipe",          path: "/coaching/equipe",  emoji: "👥" },
];

// ─── Style helpers ───────────────────────────────────────────
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(139,92,246,0.15)",
  borderRadius: "16px",
};

const cardGlow: React.CSSProperties = {
  ...card,
  boxShadow: "0 0 40px rgba(139,92,246,0.10)",
};

// ─── Update Modal ─────────────────────────────────────────────
function UpdateModal({ stats, onSave, onClose }: {
  stats: CoachingStats;
  onSave: (s: CoachingStats) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...stats });
  const [saving, setSaving] = useState(false);

  const field = (key: keyof CoachingStats, label: string, step = 1) => (
    <div>
      <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
        {label}
      </label>
      <input
        type="number"
        step={step}
        value={form[key] as number}
        onChange={e => setForm(f => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
        style={{
          display: "block", width: "100%", marginTop: 4,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(139,92,246,0.25)",
          borderRadius: 8, padding: "8px 10px",
          color: "rgba(255,255,255,0.9)", fontSize: 14,
          outline: "none",
        }}
      />
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#0d0b1a",
        border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: 20, padding: 24,
        width: "100%", maxWidth: 480,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 0 60px rgba(139,92,246,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: 16 }}>Mettre à jour les stats</h2>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {field("caTotal",      "CA total encaissé (€)")}
          {field("clients",      "Clients signés")}
          {field("bookings",     "Bookings Cal.com")}
          {field("tauxClosing",  "Taux closing (%)", 0.1)}
          {field("dmSemaine",    "DMs / semaine")}
          {field("formationPrix",   "Prix formation (€)")}
          {field("formationVentes", "Ventes formation")}
        </div>

        <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginBottom: 12 }}>
            Historique Made Académie
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {field("academieCA",      "CA total académie (€)")}
            {field("academieMembres", "Membres total")}
            {field("academiePayants", "Premium payants")}
            {field("academieLives",   "Lives organisés")}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            marginTop: 20, width: "100%",
            background: saving ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Save style={{ width: 15, height: 15 }} />
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────
export default function CoachingDashboard() {
  const { stats: c, loading, save } = useCoachingStats();
  const [showModal, setShowModal] = useState(false);

  // Funnel sublabels built from live stats
  const funnelSteps = [
    { label: "Réseaux sociaux", sublabel: "12 400 vues / semaine", icon: "📱", path: "/coaching/social", conversionRate: "1.5%" },
    { label: "Clics Beacons",   sublabel: "186 clics / semaine",   icon: "🔗", path: "/coaching/beacons", conversionRate: `${(c.bookings / 186 * 100).toFixed(0)}%` },
    { label: "Appels réservés", sublabel: `${c.bookings} bookings · Cal.com`, icon: "📞", path: "/coaching/leads", conversionRate: `${c.tauxClosing.toFixed(1)}%` },
    { label: "Clients signés",  sublabel: `${c.clients} clients · ${c.caTotal.toLocaleString("fr-FR")} €`, icon: "✅", path: "/coaching/paiements" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
            Coaching Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Coaching HT · Formation {c.formationPrix.toLocaleString("fr-FR")} €
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.25)",
            borderRadius: 10, padding: "8px 14px",
            color: "#a855f7", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Edit2 style={{ width: 13, height: 13 }} />
          Mettre à jour
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bookings */}
        <Link to="/coaching/leads" className="block p-5 transition-all duration-200" style={{ ...cardGlow, borderColor: "#a855f722" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px #a855f722"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(139,92,246,0.10)"; }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#a855f718" }}>
              <Users className="w-4 h-4" style={{ color: "#a855f7" }} />
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>
              ↑ total
            </span>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
            {loading ? "—" : <AnimatedNum value={c.bookings} />}
          </p>
          <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Leads entrants</p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>total Cal.com</p>
        </Link>

        {/* Taux closing */}
        <Link to="/coaching/appels" className="block p-5 transition-all duration-200" style={{ ...cardGlow, borderColor: "#22c55e22" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px #22c55e22"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(139,92,246,0.10)"; }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#22c55e18" }}>
              <Target className="w-4 h-4" style={{ color: "#22c55e" }} />
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>
              ↑ {c.clients} signés
            </span>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
            {loading ? "—" : <><AnimatedNum value={c.tauxClosing} decimals={1} />%</>}
          </p>
          <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Taux closing</p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>{c.clients} / {c.bookings} bookings</p>
        </Link>

        {/* CA total */}
        <Link to="/coaching/paiements" className="block p-5 transition-all duration-200" style={{ ...cardGlow, borderColor: "#f59e0b22" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px #f59e0b22"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(139,92,246,0.10)"; }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f59e0b18" }}>
              <DollarSign className="w-4 h-4" style={{ color: "#f59e0b" }} />
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>
              ↑ {c.clients} clients
            </span>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
            {loading ? "—" : <><AnimatedNum value={c.caTotal} /> €</>}
          </p>
          <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>CA total encaissé</p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>{c.clients} clients signés</p>
        </Link>

        {/* Formation */}
        <div className="block p-5" style={{ ...cardGlow, borderColor: "#ec4899" + "22" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#ec489918" }}>
              <Zap className="w-4 h-4" style={{ color: "#ec4899" }} />
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>
              ↑ actif
            </span>
          </div>
          <p className="text-2xl font-bold mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
            {loading ? "—" : <><AnimatedNum value={c.formationPrix} /> €</>}
          </p>
          <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Formation</p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>
            {c.formationVentes > 0 ? `${c.formationVentes} vente${c.formationVentes > 1 ? "s" : ""}` : "En cours de vente"}
          </p>
        </div>
      </div>

      {/* ── Revenus détaillés ── */}
      {!loading && (
        <div className="p-5" style={{ ...cardGlow, borderColor: "rgba(139,92,246,0.2)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
            Revenus — toutes sources
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Coaching HT */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.15)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🎯</span>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#a855f7" }}>Coaching HT</p>
              </div>
              <p className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
                <AnimatedNum value={c.caTotal} /> €
              </p>
              <div className="mt-2 space-y-0.5">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {c.clients} client{c.clients !== 1 ? "s" : ""}
                </p>
                {c.clients > 0 && (
                  <p className="text-[11px] font-mono" style={{ color: "rgba(168,85,247,0.7)" }}>
                    moy. {Math.round(c.caTotal / c.clients).toLocaleString("fr-FR")} €
                  </p>
                )}
              </div>
            </div>

            {/* Formation */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(236,72,153,0.07)", border: "1px solid rgba(236,72,153,0.15)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">📚</span>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#ec4899" }}>Formation</p>
              </div>
              <p className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
                <AnimatedNum value={c.formationPrix * c.formationVentes} /> €
              </p>
              <div className="mt-2 space-y-0.5">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {c.formationVentes} vente{c.formationVentes !== 1 ? "s" : ""} · {c.formationPrix.toLocaleString("fr-FR")} €
                </p>
                {c.formationVentes === 0 && (
                  <p className="text-[11px] font-mono" style={{ color: "rgba(236,72,153,0.6)" }}>
                    En lancement
                  </p>
                )}
              </div>
            </div>

            {/* Made Académie */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🎓</span>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#818cf8" }}>Académie</p>
              </div>
              <p className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
                <AnimatedNum value={c.academieCA} /> €
              </p>
              <div className="mt-2 space-y-0.5">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {c.academiePayants} premium · 97 €/mois
                </p>
                <p className="text-[11px] font-mono" style={{ color: "rgba(99,102,241,0.7)" }}>
                  historique · inactif
                </p>
              </div>
            </div>

            {/* Total global */}
            <div className="p-4 rounded-xl" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">💰</span>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#f59e0b" }}>Total cumulé</p>
              </div>
              <p className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
                <AnimatedNum value={c.caTotal + c.formationPrix * c.formationVentes + c.academieCA} /> €
              </p>
              <div className="mt-2 space-y-0.5">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  HT + Formation + Académie
                </p>
                <p className="text-[11px] font-mono" style={{ color: "rgba(245,158,11,0.7)" }}>
                  {c.clients + c.formationVentes + c.academiePayants} acheteurs
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Funnel */}
        <div className="lg:col-span-2 p-5 space-y-2" style={cardGlow}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: "#a855f7" }} />
            <h2 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
              Funnel de conversion
            </h2>
          </div>

          {funnelSteps.map((step, i) => (
            <div key={step.label}>
              <Link
                to={step.path}
                className="flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.12)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.14)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.07)"; }}
              >
                <span className="text-xl flex-shrink-0">{step.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{step.label}</p>
                  <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{step.sublabel}</p>
                </div>
                {step.conversionRate && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg flex-shrink-0"
                    style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}>
                    {step.conversionRate}
                  </span>
                )}
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(168,85,247,0.5)" }} />
              </Link>
              {i < funnelSteps.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="w-px h-4" style={{ background: "linear-gradient(to bottom, rgba(139,92,246,0.4), rgba(139,92,246,0.1))" }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Trend Chart */}
        <div className="lg:col-span-3 p-5" style={cardGlow}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
              CA mensuel · Août–Déc 2025
            </h2>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#22c55e", display: "inline-block" }} />
              CA encaissé (k€)
            </span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradCa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`${v.toLocaleString("fr-FR")} k€`, "CA"]}
                contentStyle={{ background: "rgba(10,5,25,0.95)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", color: "rgba(255,255,255,0.9)", fontSize: 12 }}
                cursor={{ stroke: "rgba(34,197,94,0.3)", strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="ca" stroke="#22c55e" strokeWidth={2} fill="url(#gradCa)" dot={{ fill: "#22c55e", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Made Académie — historical */}
      <div className="p-5" style={{ ...card, borderColor: "rgba(99,102,241,0.12)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(99,102,241,0.5)" }}>
          Made Académie · Historique (inactif)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "CA total",  value: c.academieCA,      suffix: " €" },
            { label: "Membres",   value: c.academieMembres, suffix: "" },
            { label: "Premium",   value: c.academiePayants, suffix: "" },
            { label: "Lives",     value: c.academieLives,   suffix: "" },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.55)" }}>
                {loading ? "—" : <><AnimatedNum value={item.value} />{item.suffix}</>}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
          Accès rapide
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.path} to={link.path} className="flex items-center gap-3 p-4 rounded-xl transition-all" style={card}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.3)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(139,92,246,0.1)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.15)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <span className="text-xl">{link.emoji}</span>
              <span className="text-sm font-medium flex-1" style={{ color: "rgba(255,255,255,0.65)" }}>{link.label}</span>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: "rgba(139,92,246,0.5)" }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Update modal */}
      {showModal && (
        <UpdateModal
          stats={c}
          onSave={save}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

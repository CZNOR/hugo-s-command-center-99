import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Users, DollarSign, Target, Zap, ArrowRight, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid,
} from "recharts";

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

// ─── Animated KPI value ──────────────────────────────────────
function AnimatedValue({ value }: { value: string }) {
  // Parse numeric values — skip strings like "Instagram"
  const numeric = parseFloat(value.replace(/\s/g, "").replace(",", ".").replace(/[^0-9.]/g, ""));
  const isNumeric = !isNaN(numeric) && isFinite(numeric);
  const isPercent = value.includes("%");
  const isEuro    = value.includes("€");
  const decimals  = value.includes(",") || isPercent ? 1 : 0;
  const displayed = useCountUp(isNumeric ? numeric : 0, 1400, decimals);

  if (!isNumeric) return <>{value}</>;

  const formatted = isEuro
    ? `${displayed} €`
    : isPercent
    ? `${displayed}%`
    : displayed;

  return <>{formatted}</>;
}

// ─── Types ───────────────────────────────────────────────────
interface KPICard {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  icon: React.ElementType;
  path: string;
  color: string;
}

interface FunnelStep {
  label: string;
  sublabel: string;
  icon: string;
  path: string;
  conversionRate?: string;
}

// ─── Real data ───────────────────────────────────────────────
// CA total encaissé : 9 clients · 25 483 € (paiements réels août–déc 2025)
// Bookings Cal.com  : 165 total · 9 signés → taux closing 5,5%
const kpis: KPICard[] = [
  { label: "Leads entrants", value: "165", delta: "total Cal.com", up: true, icon: Users, path: "/coaching/leads", color: "#a855f7" },
  { label: "Taux closing", value: "5,5%", delta: "9 / 165 bookings", up: true, icon: Target, path: "/coaching/appels", color: "#22c55e" },
  { label: "CA total encaissé", value: "25 483 €", delta: "9 clients signés", up: true, icon: DollarSign, path: "/coaching/paiements", color: "#f59e0b" },
  { label: "Meilleure source", value: "Instagram", delta: "42% des clics Beacons", up: true, icon: Zap, path: "/coaching/beacons", color: "#ec4899" },
];

const funnelSteps: FunnelStep[] = [
  { label: "Réseaux sociaux", sublabel: "12 400 vues / semaine", icon: "📱", path: "/coaching/social", conversionRate: "1.5%" },
  { label: "Clics Beacons", sublabel: "186 clics / semaine", icon: "🔗", path: "/coaching/beacons", conversionRate: "13%" },
  { label: "Appels réservés", sublabel: "165 bookings · Cal.com", icon: "📞", path: "/coaching/leads", conversionRate: "5,5%" },
  { label: "Clients signés", sublabel: "9 clients · 25 483 €", icon: "✅", path: "/coaching/paiements" },
];

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
  { label: "Contenu", path: "/content", emoji: "🎬" },
  { label: "Paiements", path: "/coaching/paiements", emoji: "💳" },
  { label: "Équipe", path: "/coaching/equipe", emoji: "👥" },
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

// ─── Component ───────────────────────────────────────────────
export default function CoachingDashboard() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
          Coaching Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Vue globale · programme high-ticket 4 000 €
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            to={kpi.path}
            className="block p-5 transition-all duration-200"
            style={{
              ...cardGlow,
              borderColor: `${kpi.color}22`,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${kpi.color}22`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(139,92,246,0.10)"; }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${kpi.color}18` }}
              >
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: kpi.up ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                  color: kpi.up ? "#4ade80" : "#f87171",
                }}
              >
                {kpi.up ? "↑" : "↓"} {kpi.delta.split(" ")[0]}
              </span>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
              <AnimatedValue value={kpi.value} />
            </p>
            <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
              {kpi.label}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>
              {kpi.delta}
            </p>
          </Link>
        ))}
      </div>

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
                style={{
                  background: "rgba(139,92,246,0.07)",
                  border: "1px solid rgba(139,92,246,0.12)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.14)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.07)"; }}
              >
                <span className="text-xl flex-shrink-0">{step.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                    {step.label}
                  </p>
                  <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
                    {step.sublabel}
                  </p>
                </div>
                {step.conversionRate && (
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded-lg flex-shrink-0"
                    style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}
                  >
                    {step.conversionRate}
                  </span>
                )}
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(168,85,247,0.5)" }} />
              </Link>

              {i < funnelSteps.length - 1 && (
                <div className="flex justify-center py-1">
                  <div
                    className="w-px h-4"
                    style={{
                      background: "linear-gradient(to bottom, rgba(139,92,246,0.4), rgba(139,92,246,0.1))",
                    }}
                  />
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
              <XAxis
                dataKey="week"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [`${v.toLocaleString("fr-FR")} k€`, "CA"]}
                contentStyle={{
                  background: "rgba(10,5,25,0.95)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: "10px",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 12,
                }}
                cursor={{ stroke: "rgba(34,197,94,0.3)", strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="ca" stroke="#22c55e" strokeWidth={2} fill="url(#gradCa)" dot={{ fill: "#22c55e", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
          Accès rapide
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="flex items-center gap-3 p-4 rounded-xl transition-all"
              style={card}
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
              <span className="text-sm font-medium flex-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                {link.label}
              </span>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: "rgba(139,92,246,0.5)" }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { DollarSign, TrendingUp, Percent, Users, ArrowRight } from "lucide-react";
import AffiliateCopyButton from "@/components/AffiliateCopyButton";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid,
} from "recharts";

const ACCENT = "#00cc44";

interface KPI {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  icon: React.ElementType;
  path: string;
  color: string;
}

const kpis: KPI[] = [
  { label: "Dépôts ce mois", value: "14 800 €", delta: "+3 200 € vs M-1", up: true, icon: DollarSign, path: "/casino/depots", color: "#00cc44" },
  { label: "RevShare total", value: "3 240 €", delta: "+8% vs M-1", up: true, icon: Percent, path: "/casino/revshare", color: "#22c55e" },
  { label: "Joueurs actifs", value: "47", delta: "+6 ce mois", up: true, icon: Users, path: "/casino/depots", color: "#f59e0b" },
  { label: "CPA validés", value: "9", delta: "+2 vs M-1", up: true, icon: TrendingUp, path: "/casino/depots", color: "#ec4899" },
];

const trendData = [
  { month: "Nov", depots: 9, rev: 1800 },
  { month: "Déc", depots: 11, rev: 2100 },
  { month: "Jan", depots: 10, rev: 2400 },
  { month: "Fév", depots: 13, rev: 2900 },
  { month: "Mar", depots: 14, rev: 3240 },
];

const quickLinks = [
  { label: "Réseaux sociaux", path: "/casino/social", emoji: "📱" },
  { label: "Dépôts & CPA", path: "/casino/depots", emoji: "💰" },
  { label: "RevShare", path: "/casino/revshare", emoji: "📈" },
  { label: "Contenu", path: "/content", emoji: "🎬" },
];

// ─── Card wrapper ─────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function CasinoDashboard() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: ACCENT }}>Casino</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Vue d'ensemble de votre activité affiliate
          </p>
        </div>
        <AffiliateCopyButton />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <Link key={k.label} to={k.path}>
            <Card style={{ cursor: "pointer" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{k.label}</span>
                <k.icon style={{ width: 16, height: 16, color: k.color }} />
              </div>
              <div className="text-xl font-bold" style={{ color: "#fff" }}>{k.value}</div>
              <div className={`text-xs mt-1 ${k.up ? "text-green-400" : "text-red-400"}`}>{k.delta}</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Chart + Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card style={{ gridColumn: "span 2" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
            Évolution dépôts & RevShare
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="casino-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 12 }}
                cursor={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <Area type="monotone" dataKey="depots" stroke={ACCENT} fill="url(#casino-grad)" strokeWidth={2} name="Dépôts" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Accès rapide</h3>
          <div className="space-y-2">
            {quickLinks.map(l => (
              <Link
                key={l.path}
                to={l.path}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors"
                style={{ background: "rgba(255,255,255,0.04)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,204,68,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              >
                <div className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                  <span>{l.emoji}</span>
                  <span>{l.label}</span>
                </div>
                <ArrowRight style={{ width: 13, height: 13, color: "rgba(255,255,255,0.3)" }} />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

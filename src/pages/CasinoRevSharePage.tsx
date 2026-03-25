import { Percent, TrendingUp, Users, DollarSign } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from "recharts";

const ACCENT = "#00cc44";

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, ...style }}>
      {children}
    </div>
  );
}

const stats = [
  { label: "RevShare ce mois", value: "3 240 €", delta: "+8%", icon: DollarSign, color: "#00cc44" },
  { label: "Taux moyen", value: "28%", delta: "+2% vs M-1", icon: Percent, color: "#22c55e" },
  { label: "Joueurs actifs", value: "47", delta: "ce mois", icon: Users, color: "#a855f7" },
  { label: "NGR total", value: "11 570 €", delta: "+9%", icon: TrendingUp, color: "#f59e0b" },
];

const trendData = [
  { month: "Nov", revshare: 1800, ngr: 6400 },
  { month: "Déc", revshare: 2100, ngr: 7500 },
  { month: "Jan", revshare: 2400, ngr: 8600 },
  { month: "Fév", revshare: 2900, ngr: 10300 },
  { month: "Mar", revshare: 3240, ngr: 11570 },
];

const programs = [
  { casino: "Coolaff", rate: "35%", ngr: "5 200 €", revshare: "1 820 €", players: 18 },
  { casino: "AffKing", rate: "30%", ngr: "3 900 €", revshare: "1 170 €", players: 14 },
  { casino: "BetPartners", rate: "25%", ngr: "1 880 €", revshare: "470 €", players: 9 },
  { casino: "SpinRevs", rate: "20%", ngr: "590 €", revshare: "118 €", players: 6 },
];

export default function CasinoRevSharePage() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: ACCENT }}>RevShare</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Revenus de partage sur les gains des casinos partenaires</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</span>
              <s.icon style={{ width: 15, height: 15, color: s.color }} />
            </div>
            <div className="text-xl font-bold" style={{ color: "#fff" }}>{s.value}</div>
            <div className="text-xs mt-1 text-green-400">{s.delta}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card style={{ gridColumn: "span 2" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Évolution RevShare mensuel</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
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
              <Area type="monotone" dataKey="revshare" stroke={ACCENT} fill="url(#rev-grad)" strokeWidth={2} name="RevShare (€)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Par programme</h3>
          <div className="space-y-3">
            {programs.map(p => (
              <div key={p.casino} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium" style={{ color: "#fff" }}>{p.casino}</span>
                  <span className="text-xs font-bold" style={{ color: ACCENT }}>{p.revshare}</span>
                </div>
                <div className="flex gap-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <span>Taux: <strong style={{ color: "rgba(255,255,255,0.6)" }}>{p.rate}</strong></span>
                  <span>NGR: <strong style={{ color: "rgba(255,255,255,0.6)" }}>{p.ngr}</strong></span>
                  <span>{p.players} joueurs</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

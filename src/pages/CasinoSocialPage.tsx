import { TrendingUp, Eye, Heart, UserPlus } from "lucide-react";

const ACCENT = "#00cc44";

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, ...style }}>
      {children}
    </div>
  );
}

const stats = [
  { label: "Vues / semaine", value: "18 400", delta: "+12%", icon: Eye, color: "#00cc44" },
  { label: "Engagement moyen", value: "4.2%", delta: "+0.8%", icon: Heart, color: "#f97316" },
  { label: "Nouveaux abonnés", value: "+342", delta: "ce mois", icon: UserPlus, color: "#a855f7" },
  { label: "Posts publiés", value: "21", delta: "ce mois", icon: TrendingUp, color: "#22c55e" },
];

const platforms = [
  { name: "Instagram", handle: "@casino_affiliate", followers: "4 200", reach: "11 800", color: "#e1306c" },
  { name: "TikTok", handle: "@czn_casino", followers: "2 900", reach: "6 600", color: "#69c9d0" },
  { name: "Twitter/X", handle: "@czncasino", followers: "1 100", reach: "0", color: "#1da1f2" },
];

export default function CasinoSocialPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: ACCENT }}>Réseaux sociaux — Casino</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Performance de vos comptes affiliate</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map(p => (
          <Card key={p.name}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="font-semibold text-sm" style={{ color: "#fff" }}>{p.name}</span>
              <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.35)" }}>{p.handle}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: "rgba(255,255,255,0.45)" }}>Abonnés</span>
                <span style={{ color: "#fff" }}>{p.followers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "rgba(255,255,255,0.45)" }}>Portée / semaine</span>
                <span style={{ color: "#fff" }}>{p.reach}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

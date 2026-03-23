import { useState } from "react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid, BarChart, Bar,
} from "recharts";
import { TrendingUp, Eye, Heart, ExternalLink } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type Platform = "instagram" | "tiktok" | "youtube";

interface PlatformData {
  id: Platform;
  label: string;
  emoji: string;
  color: string;
  stats: {
    vuesSemaine: string;
    tauxEngagement: string;
    clicsBio: string;
    abonnes: string;
  };
  weeklyData: { week: string; vues: number; engagement: number }[];
  topContent: { titre: string; vues: string; likes: string; format: string }[];
}

// ─── Mock data ───────────────────────────────────────────────
const platforms: PlatformData[] = [
  {
    id: "instagram",
    label: "Instagram",
    emoji: "📸",
    color: "#e1306c",
    stats: {
      vuesSemaine: "8 240",
      tauxEngagement: "4.2%",
      clicsBio: "94",
      abonnes: "3 840",
    },
    weeklyData: [
      { week: "S1", vues: 5200, engagement: 3.1 },
      { week: "S2", vues: 6800, engagement: 3.8 },
      { week: "S3", vues: 7100, engagement: 4.0 },
      { week: "S4", vues: 8240, engagement: 4.2 },
    ],
    topContent: [
      { titre: "Comment j'ai signé 3 clients en 1 semaine", vues: "12 400", likes: "840", format: "Reel" },
      { titre: "La vérité sur le coaching high-ticket", vues: "8 900", likes: "612", format: "Carrousel" },
      { titre: "Mon système de closing en 5 étapes", vues: "6 200", likes: "480", format: "Story" },
    ],
  },
  {
    id: "tiktok",
    label: "TikTok",
    emoji: "🎵",
    color: "#69c9d0",
    stats: {
      vuesSemaine: "24 100",
      tauxEngagement: "6.8%",
      clicsBio: "61",
      abonnes: "2 200",
    },
    weeklyData: [
      { week: "S1", vues: 12000, engagement: 5.2 },
      { week: "S2", vues: 18400, engagement: 6.0 },
      { week: "S3", vues: 20800, engagement: 6.5 },
      { week: "S4", vues: 24100, engagement: 6.8 },
    ],
    topContent: [
      { titre: "Je gagne 30k€/mois en coaching", vues: "48 200", likes: "3 100", format: "Valeur rapide" },
      { titre: "Pourquoi la plupart des coachs échouent", vues: "29 400", likes: "1 820", format: "Storytelling" },
      { titre: "Mon appel de vente de 45 min", vues: "18 700", likes: "940", format: "Double cam" },
    ],
  },
  {
    id: "youtube",
    label: "YouTube",
    emoji: "▶️",
    color: "#ff0000",
    stats: {
      vuesSemaine: "3 600",
      tauxEngagement: "8.1%",
      clicsBio: "31",
      abonnes: "1 180",
    },
    weeklyData: [
      { week: "S1", vues: 1800, engagement: 6.4 },
      { week: "S2", vues: 2400, engagement: 7.2 },
      { week: "S3", vues: 3100, engagement: 7.8 },
      { week: "S4", vues: 3600, engagement: 8.1 },
    ],
    topContent: [
      { titre: "Build a 30K/mois coaching business (full process)", vues: "4 800", likes: "312", format: "YouTube" },
      { titre: "Mon système d'acquisition en 2024", vues: "3 200", likes: "248", format: "YouTube" },
      { titre: "Comment qualifier un lead en 10 min", vues: "2 100", likes: "164", format: "YouTube" },
    ],
  },
];

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

// ─── Sub-components ──────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="p-4" style={card}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{value}</p>
    </div>
  );
}

function PlatformPanel({ data }: { data: PlatformData }) {
  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Vues semaine" value={data.stats.vuesSemaine} icon={Eye} color={data.color} />
        <StatCard label="Taux engagement" value={data.stats.tauxEngagement} icon={Heart} color={data.color} />
        <StatCard label="Clics bio" value={data.stats.clicsBio} icon={ExternalLink} color={data.color} />
        <StatCard label="Abonnés" value={data.stats.abonnes} icon={TrendingUp} color={data.color} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Area chart */}
        <div className="p-5" style={cardGlow}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>
            Vues · 4 semaines
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id={`grad-${data.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={data.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={data.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(10,5,25,0.95)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  borderRadius: "10px",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 12,
                }}
                cursor={{ stroke: "rgba(139,92,246,0.2)", strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="vues" stroke={data.color} strokeWidth={2} fill={`url(#grad-${data.id})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement bar chart */}
        <div className="p-5" style={cardGlow}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>
            Engagement (%) · 4 semaines
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(10,5,25,0.95)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  borderRadius: "10px",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 12,
                }}
                cursor={{ fill: "rgba(139,92,246,0.08)" }}
              />
              <Bar dataKey="engagement" fill={data.color} fillOpacity={0.7} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top contents */}
      <div className="p-5" style={cardGlow}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>
          Top contenus
        </h3>
        <div className="space-y-2">
          {data.topContent.map((content, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-xl"
              style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.1)" }}
            >
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: `${data.color}22`, color: data.color }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {content.titre}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {content.format}
                </p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0 text-xs">
                <span className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <Eye className="w-3 h-3" /> {content.vues}
                </span>
                <span className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <Heart className="w-3 h-3" /> {content.likes}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function SocialPage() {
  const [active, setActive] = useState<Platform>("instagram");
  const current = platforms.find((p) => p.id === active)!;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
          Réseaux sociaux
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Performance par plateforme · données mockées
        </p>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-2">
        {platforms.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={active === p.id ? {
              background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))",
              border: `1px solid ${p.color}44`,
              color: "rgba(255,255,255,0.9)",
              boxShadow: `0 0 20px ${p.color}18`,
            } : {
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(139,92,246,0.12)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            <span>{p.emoji}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Platform panel */}
      <PlatformPanel data={current} />
    </div>
  );
}

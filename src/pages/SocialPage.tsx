import { useState } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  Eye,
  Heart,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { useSocialStats, type PlatformStats } from "@/hooks/useSocialStats";

// ─── Constants ────────────────────────────────────────────────
type Tab = "instagram" | "tiktok" | "youtube";

const TAB_META: Record<Tab, { label: string; emoji: string; color: string }> = {
  instagram: { label: "Instagram", emoji: "📸", color: "#e1306c" },
  tiktok:    { label: "TikTok",    emoji: "🎵", color: "#69c9d0" },
  youtube:   { label: "YouTube",   emoji: "▶️", color: "#ff0000" },
};

// Mock YouTube (unchanged)
const YOUTUBE_MOCK: PlatformStats = {
  followers: 1180,
  following: 0,
  postsCount: 42,
  avgEngagement: 8.1,
  topPosts: [
    { id: "1", url: "#", views: 4800,  likes: 312, comments: 44, date: "", type: "YouTube" },
    { id: "2", url: "#", views: 3200,  likes: 248, comments: 31, date: "", type: "YouTube" },
    { id: "3", url: "#", views: 2100,  likes: 164, comments: 22, date: "", type: "YouTube" },
  ],
  weeklyHistory: [
    { week: "S1", followers: 980,  avgEngagement: 6.4, avgViews: 1800 },
    { week: "S2", followers: 1040, avgEngagement: 7.2, avgViews: 2400 },
    { week: "S3", followers: 1110, avgEngagement: 7.8, avgViews: 3100 },
    { week: "S4", followers: 1180, avgEngagement: 8.1, avgViews: 3600 },
  ],
};

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

// ─── Helpers ─────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "—";
  }
}

// ─── Skeleton ─────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/5 ${className ?? ""}`} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4" style={card}>
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5" style={cardGlow}><Skeleton className="h-[180px]" /></div>
        <div className="p-5" style={cardGlow}><Skeleton className="h-[180px]" /></div>
      </div>
      <div className="p-5 space-y-3" style={cardGlow}>
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="p-4" style={card}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          {label}
        </span>
      </div>
      <p className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
        {value}
      </p>
    </div>
  );
}

// ─── Platform panel ───────────────────────────────────────────
function PlatformPanel({
  data,
  color,
  id,
}: {
  data: PlatformStats;
  color: string;
  id: Tab;
}) {
  const avgViews =
    data.topPosts.length > 0
      ? Math.round(
          data.topPosts.reduce((s, p) => s + p.views, 0) / data.topPosts.length
        )
      : 0;

  const history =
    data.weeklyHistory.length > 0
      ? data.weeklyHistory
      : [{ week: "S1", followers: data.followers, avgEngagement: data.avgEngagement, avgViews }];

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Abonnés"         value={fmt(data.followers)}       icon={TrendingUp}   color={color} />
        <StatCard label="Vues moy."       value={fmt(avgViews)}             icon={Eye}          color={color} />
        <StatCard label="Taux engagement" value={`${data.avgEngagement}%`}  icon={Heart}        color={color} />
        <StatCard label="Posts"           value={fmt(data.postsCount)}      icon={ExternalLink} color={color} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Followers sparkline */}
        <div className="p-5" style={cardGlow}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>
            Abonnés · 4 semaines
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
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
                contentStyle={{
                  background: "rgba(10,5,25,0.95)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  borderRadius: "10px",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 12,
                }}
                cursor={{ stroke: "rgba(139,92,246,0.2)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="followers"
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-${id})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement bar chart */}
        <div className="p-5" style={cardGlow}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>
            Engagement (%) · 4 semaines
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="week"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
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
              <Bar
                dataKey="avgEngagement"
                fill={color}
                fillOpacity={0.7}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 posts */}
      <div className="p-5" style={cardGlow}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>
          Top 5 posts
        </h3>
        <div className="space-y-2">
          {data.topPosts.slice(0, 5).map((post, i) => (
            <a
              key={post.id || i}
              href={post.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-white/5"
              style={{
                background: "rgba(139,92,246,0.06)",
                border: "1px solid rgba(139,92,246,0.1)",
                textDecoration: "none",
                display: "flex",
              }}
            >
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: `${color}22`, color }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {post.type}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {fmtDate(post.date)}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                <span className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <Eye className="w-3 h-3" /> {fmt(post.views)}
                </span>
                <span className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <Heart className="w-3 h-3" /> {fmt(post.likes)}
                </span>
                <span className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <MessageCircle className="w-3 h-3" /> {fmt(post.comments)}
                </span>
              </div>
            </a>
          ))}

          {data.topPosts.length === 0 && (
            <p className="text-center text-xs py-4" style={{ color: "rgba(255,255,255,0.3)" }}>
              Aucun post récupéré
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function SocialPage() {
  const [active, setActive] = useState<Tab>("instagram");
  const { instagram, tiktok, loading, error, lastUpdated, refresh } =
    useSocialStats();

  const dataMap: Record<Tab, PlatformStats | null> = {
    instagram,
    tiktok,
    youtube: YOUTUBE_MOCK,
  };

  const current = dataMap[active];
  const isLive = active !== "youtube";
  const showLoading = isLive && loading && !current;
  const showError   = isLive && !!error && !current;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
            Réseaux sociaux
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            {lastUpdated
              ? `Dernière sync : ${lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
              : loading
              ? "Chargement en cours…"
              : "Performance par plateforme"}
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(139,92,246,0.2)",
            color: loading ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.65)",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-2">
        {(["instagram", "tiktok", "youtube"] as Tab[]).map((tab) => {
          const meta = TAB_META[tab];
          return (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={
                active === tab
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))",
                      border: `1px solid ${meta.color}44`,
                      color: "rgba(255,255,255,0.9)",
                      boxShadow: `0 0 20px ${meta.color}18`,
                    }
                  : {
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(139,92,246,0.12)",
                      color: "rgba(255,255,255,0.45)",
                    }
              }
            >
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* States */}
      {showLoading && <LoadingSkeleton />}

      {showError && (
        <div
          className="flex flex-col items-center gap-4 py-16"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <AlertCircle className="w-10 h-10 text-red-400/60" />
          <p className="text-sm text-center max-w-xs">{error}</p>
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "rgba(239,68,68,0.9)",
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réessayer
          </button>
        </div>
      )}

      {!showLoading && !showError && current && (
        <PlatformPanel data={current} color={TAB_META[active].color} id={active} />
      )}
    </div>
  );
}

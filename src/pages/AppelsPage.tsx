import { useState, useEffect } from "react";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { TrendingUp, Target, CheckCircle, XCircle, RefreshCw, Clock, Phone } from "lucide-react";
import { fetchCalStats, type CalStats, type CalBooking } from "@/lib/calcom";

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

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className ?? ""}`} />;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch { return "—"; }
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function isUpcoming(iso: string) {
  return new Date(iso) > new Date();
}

// Shorten closer name: "Lionel Mathis - Équipe Made" → "Lionel"
function shortCloser(name: string) {
  return name.split(" ")[0];
}

// ─── Main page ────────────────────────────────────────────────
export default function AppelsPage() {
  const [stats, setStats] = useState<CalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCalStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cancellRate = stats
    ? Math.round((stats.cancelled / stats.total) * 100)
    : 0;

  // Closer chart data
  const closerData = stats
    ? Object.entries(stats.byCloser)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }))
    : [];

  // Budget chart data
  const budgetData = stats
    ? Object.entries(stats.byBudget)
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label: label.replace("Entre ", "").replace(" et ", "–"), count }))
    : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
            Appels de vente
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            {lastUpdated
              ? `Cal.com · sync ${lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
              : loading ? "Chargement…" : "Données Cal.com en direct"}
          </p>
        </div>
        <button
          onClick={load}
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

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* KPIs */}
      {loading && !stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total calls", value: stats.total, color: "#a855f7", icon: Phone },
            { label: "Ce mois-ci", value: stats.thisMonth, color: "#60a5fa", icon: Target },
            { label: "Confirmés", value: stats.accepted, color: "#22c55e", icon: CheckCircle },
            { label: "Annulations", value: `${cancellRate}%`, color: "#f59e0b", icon: TrendingUp },
          ].map((k) => (
            <div key={k.label} className="p-5" style={cardGlow}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${k.color}18` }}>
                <k.icon className="w-4 h-4" style={{ color: k.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Calls par closer */}
          <div className="p-5" style={cardGlow}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
              Calls par closer
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={closerData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "rgba(10,5,25,0.95)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", color: "rgba(255,255,255,0.9)", fontSize: 12 }}
                  cursor={{ fill: "rgba(139,92,246,0.06)" }}
                  formatter={(val: number) => [val, "calls"]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#a855f7" fillOpacity={0.75} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Budget déclaré */}
          <div className="p-5" style={cardGlow}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
              Budget déclaré
            </h2>
            <div className="space-y-3">
              {budgetData.map((b, i) => {
                const total = budgetData.reduce((s, x) => s + x.count, 0);
                const pct = Math.round((b.count / total) * 100);
                const colors = ["#22c55e", "#a855f7", "#f59e0b", "#60a5fa", "#ef4444"];
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: "rgba(255,255,255,0.7)" }}>{b.label}</span>
                      <div className="flex items-center gap-2">
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>{b.count}x</span>
                        <span style={{ color: colors[i % colors.length], fontWeight: 600 }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length], opacity: 0.7 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Prochains calls */}
      {stats && stats.upcoming.length > 0 && (
        <div className="p-5" style={cardGlow}>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
            <Clock className="w-4 h-4 text-blue-400" />
            Prochains calls ({stats.upcoming.length})
          </h2>
          <div className="space-y-2">
            {stats.upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} upcoming />
            ))}
          </div>
        </div>
      )}

      {/* Historique */}
      {loading && !stats ? (
        <div className="p-5 space-y-2" style={cardGlow}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : stats && (
        <div className="p-5" style={cardGlow}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
            Historique appels ({stats.accepted} confirmés)
          </h2>
          <div className="space-y-2">
            {stats.bookings.slice(0, 30).map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Booking row component ────────────────────────────────────
function BookingRow({ booking: b, upcoming }: { booking: CalBooking; upcoming?: boolean }) {
  return (
    <div
      className="flex items-start gap-4 p-3 rounded-xl"
      style={{
        background: upcoming ? "rgba(96,165,250,0.05)" : "rgba(255,255,255,0.02)",
        border: upcoming ? "1px solid rgba(96,165,250,0.15)" : "1px solid rgba(139,92,246,0.08)",
      }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: upcoming ? "rgba(96,165,250,0.15)" : "rgba(168,85,247,0.12)" }}
      >
        {upcoming
          ? <Clock className="w-4 h-4" style={{ color: "#60a5fa" }} />
          : <CheckCircle className="w-4 h-4" style={{ color: "#a855f7" }} />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
            {b.attendee.name}
          </p>
          {b.budget && (
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>
              {b.budget}
            </span>
          )}
          {b.niveau && (
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.1)", color: "#c4b5fd" }}>
              {b.niveau}
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
          {fmtDate(b.startTime)} {fmtTime(b.startTime)} · {shortCloser(b.closer)}
          {b.attendee.email && <span className="ml-2 opacity-60">{b.attendee.email}</span>}
        </p>
      </div>
    </div>
  );
}

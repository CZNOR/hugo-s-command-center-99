import {
  BarChart, Bar, ResponsiveContainer, XAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { TrendingUp, Target, CheckCircle, XCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
interface Call {
  id: string;
  lead: string;
  date: string;
  duree: string;
  resultat: "win" | "lost";
  montant?: number;
  objection?: string;
  notes: string;
}

interface WeeklyRate {
  week: string;
  closing: number;
  appels: number;
}

// ─── Mock data ───────────────────────────────────────────────
const WEEKLY_RATES: WeeklyRate[] = [
  { week: "S1", closing: 25, appels: 8 },
  { week: "S2", closing: 33, appels: 6 },
  { week: "S3", closing: 50, appels: 4 },
  { week: "S4", closing: 38, appels: 8 },
];

const TOP_OBJECTIONS = [
  { objection: "Prix trop élevé", count: 6, pct: 40 },
  { objection: "Pas le bon moment", count: 4, pct: 27 },
  { objection: "Doit en parler à son conjoint", count: 3, pct: 20 },
  { objection: "Pas confiant dans le résultat", count: 2, pct: 13 },
];

const CALLS: Call[] = [
  { id: "1", lead: "Thomas Durand", date: "2024-01-22", duree: "48 min", resultat: "win", montant: 4000, notes: "Très motivé, closing rapide. A sorti sa CB en direct." },
  { id: "2", lead: "Sarah Martin", date: "2024-01-23", duree: "52 min", resultat: "win", montant: 4000, notes: "Quelques hésitations sur le ROI mais convaincue sur la valeur." },
  { id: "3", lead: "Lucas Petit", date: "2024-01-24", duree: "35 min", resultat: "lost", objection: "Prix trop élevé", notes: "Pas aligné sur le budget. Lead froid dès le début." },
  { id: "4", lead: "Marie Lefevre", date: "2024-01-25", duree: "61 min", resultat: "win", montant: 4000, notes: "Top lead. Situation d'urgence réelle, décision immédiate." },
  { id: "5", lead: "Antoine Bernard", date: "2024-01-15", duree: "28 min", resultat: "lost", objection: "Pas le bon moment", notes: "Pas assez qualifié. A rappeler dans 3 mois." },
  { id: "6", lead: "Julie Moreau", date: "2024-01-18", duree: "44 min", resultat: "win", montant: 4000, notes: "A demandé un paiement en 3x, validé." },
  { id: "7", lead: "Kevin Blanc", date: "2024-01-10", duree: "39 min", resultat: "lost", objection: "Doit en parler à son conjoint", notes: "Relance prévue dans 1 semaine." },
  { id: "8", lead: "Emma Lebrun", date: "2024-01-08", duree: "55 min", resultat: "win", montant: 4000, notes: "Closing après avoir retraité l'objection prix." },
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

// ─── Main page ────────────────────────────────────────────────
export default function AppelsPage() {
  const wins = CALLS.filter((c) => c.resultat === "win");
  const losses = CALLS.filter((c) => c.resultat === "lost");
  const totalCA = wins.reduce((sum, c) => sum + (c.montant || 0), 0);
  const txClosing = Math.round((wins.length / CALLS.length) * 100);
  const avgDuree = Math.round(
    CALLS.reduce((sum, c) => sum + parseInt(c.duree), 0) / CALLS.length
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
          Appels de vente
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Performance closer · données mockées
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Taux closing", value: `${txClosing}%`, color: "#22c55e", icon: Target },
          { label: "CA closé", value: `${totalCA.toLocaleString("fr-FR")} €`, color: "#f59e0b", icon: TrendingUp },
          { label: "Wins", value: wins.length, color: "#a855f7", icon: CheckCircle },
          { label: "Durée moy.", value: `${avgDuree} min`, color: "#60a5fa", icon: XCircle },
        ].map((k) => (
          <div key={k.label} className="p-5" style={cardGlow}>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${k.color}18` }}
            >
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Closing rate chart */}
        <div className="p-5" style={cardGlow}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
            Taux closing semaine (%)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={WEEKLY_RATES} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
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
                cursor={{ fill: "rgba(139,92,246,0.06)" }}
                formatter={(val: number) => [`${val}%`, "Closing"]}
              />
              <Bar dataKey="closing" radius={[6, 6, 0, 0]}>
                {WEEKLY_RATES.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.closing >= 40 ? "#22c55e" : entry.closing >= 30 ? "#a855f7" : "#f59e0b"}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top objections */}
        <div className="p-5" style={cardGlow}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
            Top objections
          </h2>
          <div className="space-y-3">
            {TOP_OBJECTIONS.map((obj, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{obj.objection}</span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>{obj.count}x</span>
                    <span style={{ color: "#a855f7", fontWeight: 600 }}>{obj.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${obj.pct}%`,
                      background: i === 0 ? "#ef4444" : i === 1 ? "#f59e0b" : i === 2 ? "#a855f7" : "#6b7280",
                      opacity: 0.75,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Score closer */}
          <div
            className="mt-5 pt-4 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(139,92,246,0.12)" }}
          >
            <div>
              <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Score closer</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: "#a855f7" }}>82 / 100</p>
            </div>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "conic-gradient(#a855f7 295deg, rgba(255,255,255,0.06) 0deg)",
                boxShadow: "0 0 20px rgba(168,85,247,0.25)",
              }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: "#08080f" }}
              >
                <span className="text-sm font-bold" style={{ color: "#a855f7" }}>82</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calls list */}
      <div className="p-5" style={cardGlow}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
          Historique appels
        </h2>
        <div className="space-y-2">
          {CALLS.map((call) => (
            <div
              key={call.id}
              className="flex items-start gap-4 p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(139,92,246,0.08)" }}
            >
              {/* Win/lost badge */}
              <div
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: call.resultat === "win" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                }}
              >
                {call.resultat === "win"
                  ? <CheckCircle className="w-4 h-4" style={{ color: "#22c55e" }} />
                  : <XCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{call.lead}</p>
                  {call.resultat === "win" && call.montant && (
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}
                    >
                      +{call.montant.toLocaleString("fr-FR")} €
                    </span>
                  )}
                  {call.resultat === "lost" && call.objection && (
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}
                    >
                      {call.objection}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {new Date(call.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {call.duree}
                </p>
                {call.notes && (
                  <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>{call.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

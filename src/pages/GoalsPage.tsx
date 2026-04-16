import { useState } from "react";
import { Target, Plus, TrendingUp, TrendingDown, Minus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useBusiness } from "@/lib/businessContext";
import type { Goal } from "@/lib/mock-data";

// Données vides — à connecter Supabase
const goals: Goal[] = [];

const notifyGoalWip = () =>
  toast.info("Créer un objectif — bientôt disponible", {
    description: "La persistance Supabase des objectifs arrive.",
  });

const CATEGORIES = [
  { id: "all", label: "Tous" },
  { id: "revenue", label: "Revenus" },
  { id: "growth", label: "Croissance" },
  { id: "content", label: "Contenu" },
  { id: "ops", label: "Ops" },
  { id: "personal", label: "Perso" },
] as const;

function ProgressBar({ current, target, color }: { current: number; target: number; color: string }) {
  const pct = Math.min(100, target > 0 ? Math.round((current / target) * 100) : 0);
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function GoalCard({ goal, accent, gradient }: { goal: Goal; accent: string; gradient: string }) {
  const pct = Math.min(100, goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0);
  const delta = goal.current - goal.target;
  const trend = delta >= 0 ? "up" : "down";

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 transition-all hover:scale-[1.01]"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90 leading-tight truncate">{goal.title}</p>
          <p className="text-xs text-white/35 mt-0.5">Échéance : {goal.deadline}</p>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0"
          style={{ background: `${accent}20`, color: accent }}
        >
          {goal.category}
        </span>
      </div>

      <ProgressBar current={goal.current} target={goal.target} color={accent} />

      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="font-mono font-bold text-white/80">{goal.current.toLocaleString()}</span>
          <span className="text-white/30"> / {goal.target.toLocaleString()} {goal.unit}</span>
        </div>
        <div className="flex items-center gap-1">
          {trend === "up" ? (
            <TrendingUp className="w-3 h-3" style={{ color: "#10B981" }} />
          ) : trend === "down" ? (
            <TrendingDown className="w-3 h-3 text-red-400" />
          ) : (
            <Minus className="w-3 h-3 text-white/30" />
          )}
          <span
            className="font-mono font-semibold"
            style={{ color: pct >= 100 ? "#10B981" : pct >= 60 ? accent : "rgba(255,255,255,0.4)" }}
          >
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const { activeBusiness } = useBusiness();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = activeCategory === "all"
    ? goals.filter(g => g.business_id === activeBusiness.id || !g.business_id)
    : goals.filter(g =>
        g.category === activeCategory &&
        (g.business_id === activeBusiness.id || !g.business_id)
      );

  const total = filtered.length;
  const done = filtered.filter(g => g.current >= g.target).length;
  const avgPct = total > 0
    ? Math.round(filtered.reduce((acc, g) => acc + Math.min(100, (g.current / g.target) * 100), 0) / total)
    : 0;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5" style={{ color: activeBusiness.accent }} />
          <h1 className="text-lg font-semibold text-white/90">Objectifs</h1>
          {total > 0 && (
            <span className="text-xs text-white/35">
              {done}/{total} atteints · {avgPct}% moyen
            </span>
          )}
        </div>
        <button
          onClick={notifyGoalWip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
          style={{ background: activeBusiness.gradient, boxShadow: `0 4px 12px ${activeBusiness.glow}` }}
        >
          <Plus className="w-3.5 h-3.5" />
          Objectif
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", scrollbarWidth: "none" }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={
              activeCategory === cat.id
                ? { background: activeBusiness.gradient, color: "#fff" }
                : { color: "rgba(255,255,255,0.45)" }
            }
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Goals grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              accent={activeBusiness.accent}
              gradient={activeBusiness.gradient}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div
          className="rounded-2xl p-12 flex flex-col items-center justify-center gap-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: `${activeBusiness.accent}15` }}
          >
            <Target className="w-7 h-7" style={{ color: activeBusiness.accent }} />
          </div>
          <div className="text-center">
            <p className="text-white/50 font-medium">Aucun objectif défini</p>
            <p className="text-white/25 text-sm mt-1">
              Ajoute des objectifs pour suivre ta progression sur{" "}
              <span style={{ color: activeBusiness.accent }}>{activeBusiness.label}</span>
            </p>
          </div>
          <button
            onClick={notifyGoalWip}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white mt-1"
            style={{ background: activeBusiness.gradient, boxShadow: `0 4px 16px ${activeBusiness.glow}` }}
          >
            <Plus className="w-4 h-4" />
            Créer mon premier objectif
          </button>
        </div>
      )}
    </div>
  );
}

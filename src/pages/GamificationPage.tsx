import { Zap, Trophy, Flame, Star, Target, Award } from "lucide-react";
import { useBusiness } from "@/lib/businessContext";
import { gamificationProfile } from "@/lib/mock-data";

export default function GamificationPage() {
  const { activeBusiness } = useBusiness();
  const g = gamificationProfile;
  const xpPct = Math.min((g.total_xp / g.xp_for_next_level) * 100, 100);

  return (
    <div className="p-4 lg:p-6 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white/90">Progression</h1>
        <p className="text-sm text-white/40 mt-1">Votre parcours et vos accomplissements</p>
      </div>

      {/* Level card */}
      <div
        className="rounded-2xl p-6 mb-5 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${activeBusiness.accent}18, ${activeBusiness.accent}06)`,
          border: `1px solid ${activeBusiness.accent}35`,
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-widest font-medium">Niveau {g.level}</p>
            <p className="text-3xl font-black mt-1" style={{ color: activeBusiness.accent }}>
              {g.level_title}
            </p>
          </div>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black"
            style={{ background: `${activeBusiness.accent}20`, color: activeBusiness.accent }}
          >
            {g.level}
          </div>
        </div>

        {/* XP progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/40">
            <span>{g.total_xp.toLocaleString()} XP</span>
            <span>Prochain niveau : {g.xp_for_next_level.toLocaleString()} XP</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpPct}%`, background: activeBusiness.gradient }}
            />
          </div>
          <p className="text-xs text-white/30 text-right">{xpPct.toFixed(0)}% vers le niveau {g.level + 1}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { icon: <Flame className="w-5 h-5 text-orange-400" />, label: "Streak actuel", value: `${g.current_streak}j` },
          { icon: <Zap className="w-5 h-5 text-yellow-400" />, label: "XP aujourd'hui", value: g.xp_today.toString() },
          { icon: <Trophy className="w-5 h-5 text-yellow-500" />, label: "Record streak", value: `${g.longest_streak}j` },
          { icon: <Star className="w-5 h-5" style={{ color: activeBusiness.accent }} />, label: "Score record", value: g.score_record.toString() },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {stat.icon}
            <div>
              <p className="text-xl font-bold text-white/90">{stat.value}</p>
              <p className="text-xs text-white/40">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <h2 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4" style={{ color: activeBusiness.accent }} />
          Succès débloqués
        </h2>
        <div className="flex flex-col items-center py-10 gap-3">
          <Target className="w-9 h-9 text-white/10" />
          <p className="text-sm text-white/30">Aucun succès pour l'instant</p>
          <p className="text-xs text-white/20">Complétez des tâches et atteignez vos objectifs pour débloquer des succès</p>
        </div>
      </div>
    </div>
  );
}

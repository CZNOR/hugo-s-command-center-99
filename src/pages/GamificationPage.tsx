import { motion } from "framer-motion";
import { Trophy, Gem, Flame, Star, Zap, Lock } from "lucide-react";
import { gamificationProfile, skills, badges, xpHistory, dailyMissions } from "@/lib/mock-data";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

import { stagger, fadeUp } from "@/lib/animations";

const rarityBorder = { common: "border-border", rare: "border-hugoos-cyan/40", epic: "border-hugoos-purple/40", legendary: "border-hugoos-orange/40 shadow-[0_0_12px_hsl(33_100%_55%/0.15)]" };
const rarityLabel = { common: "text-muted-foreground", rare: "text-hugoos-cyan", epic: "text-hugoos-purple", legendary: "text-hugoos-orange" };

export default function GamificationPage() {
  const g = gamificationProfile;
  const xpPercent = (g.total_xp / g.xp_for_next_level) * 100;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5 max-w-5xl mx-auto">
      {/* Hero */}
      <motion.div variants={fadeUp} className="glass-card gradient-border p-6 lg:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
              H
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-hugoos-purple flex items-center justify-center text-xs font-bold text-white shadow-md">
              {g.level}
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">HUGO</h1>
            <p className="text-primary font-medium">{g.level_title}</p>
            <div className="mt-3 max-w-md">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Niveau {g.level}</span>
                <span className="font-mono-data">{g.total_xp.toLocaleString()} / {g.xp_for_next_level.toLocaleString()} XP</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden bg-black/[0.06]">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{ background: "linear-gradient(90deg, hsl(239 84% 67%), hsl(263 70% 62%))" }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total XP", value: g.total_xp, icon: Gem, color: "text-hugoos-purple" },
          { label: "Niveau", value: g.level, icon: Star, color: "text-hugoos-indigo" },
          { label: "Badges", value: badges.filter(b => b.earned).length, icon: Trophy, color: "text-hugoos-orange" },
          { label: "Streak max", value: g.longest_streak, icon: Flame, color: "text-hugoos-orange" },
          { label: "Tâches", value: 142, icon: Zap, color: "text-hugoos-green" },
        ].map((s, i) => (
          <motion.div key={i} variants={fadeUp} className="glass-card p-4 text-center">
            <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
            <p className="font-mono-data text-xl font-bold text-foreground"><AnimatedNumber value={s.value} /></p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Skills */}
      <motion.div variants={fadeUp} className="glass-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Compétences</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {skills.map((skill) => {
            const pct = (skill.xp / skill.max_xp) * 100;
            return (
              <div key={skill.name} className="p-4 rounded-xl text-center bg-black/[0.03]">
                <p className="text-sm font-medium text-foreground">{skill.name}</p>
                <p className="font-mono-data text-lg font-bold mt-1" style={{ color: skill.color }}>Lv.{skill.level}</p>
                <div className="h-1.5 rounded-full overflow-hidden mt-2 bg-black/[0.06]">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: skill.color }} />
                </div>
                <p className="text-[10px] text-muted-foreground font-mono-data mt-1">{skill.xp.toLocaleString()} / {skill.max_xp.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div variants={fadeUp} className="glass-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Badges & Achievements</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {badges.map((badge) => (
            <div key={badge.id} className={`relative p-4 rounded-2xl border text-center transition-all ${badge.earned ? rarityBorder[badge.rarity] : "border-border/50 opacity-40"} ${badge.earned ? "hover:scale-105 cursor-pointer bg-white/30" : "bg-black/[0.02]"}`}>
              <span className="text-2xl block mb-1.5">{badge.earned ? badge.icon : "🔒"}</span>
              <p className="text-xs font-medium text-foreground truncate">{badge.earned ? badge.name : "???"}</p>
              <p className={`text-[10px] capitalize mt-0.5 ${rarityLabel[badge.rarity]}`}>{badge.rarity}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* XP History */}
      <motion.div variants={fadeUp} className="glass-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Historique XP</h2>
        <div className="space-y-2">
          {xpHistory.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-black/[0.03] transition-colors">
              <div className="flex items-center gap-3">
                <Gem className="w-4 h-4 text-hugoos-purple flex-shrink-0" />
                <p className="text-sm text-foreground">{entry.reason}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono-data text-sm font-bold text-hugoos-purple">+{entry.amount} XP</span>
                <span className="text-[11px] text-muted-foreground">{entry.time}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { Target, Plus } from "lucide-react";

import { stagger, fadeUp } from "@/lib/animations";

const goals = [
  { title: "Atteindre 40K€ MRR consolidé", horizon: "Trimestre", progress: 67, current: "€26.8K", target: "€40K", business: "Global" },
  { title: "Lancer SaaS Vision v2", horizon: "Mois", progress: 45, current: "45%", target: "100%", business: "SaaS Vision" },
  { title: "100 clients agence actifs", horizon: "Année", progress: 38, current: "38", target: "100", business: "Agence Made" },
  { title: "50K followers total", horizon: "Trimestre", progress: 82, current: "41K", target: "50K", business: "Hugo Contenu" },
  { title: "Déployer 10 agents IA", horizon: "Année", progress: 50, current: "5", target: "10", business: "Global" },
];

const horizonColors: Record<string, string> = { Mois: "chip-indigo", Trimestre: "chip-cyan", Année: "chip-purple" };

export default function GoalsPage() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5 max-w-5xl mx-auto">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Objectifs</h2>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors active:scale-[0.97]">
          <Plus className="w-4 h-4" /> Nouvel Objectif
        </button>
      </motion.div>

      <div className="space-y-3">
        {goals.map((goal, i) => (
          <motion.div key={i} variants={fadeUp} className="glass-card-hover p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{goal.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{goal.business}</p>
              </div>
              <span className={`${horizonColors[goal.horizon]} text-[10px]`}>{goal.horizon}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "hsl(235 22% 18%)" }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.progress}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                  style={{ background: goal.progress >= 75 ? "hsl(160 84% 40%)" : goal.progress >= 40 ? "hsl(239 84% 67%)" : "hsl(43 96% 56%)" }}
                />
              </div>
              <span className="font-mono-data text-sm font-bold text-foreground min-w-[3rem] text-right">{goal.progress}%</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted-foreground font-mono-data">Actuel: {goal.current}</span>
              <span className="text-xs text-muted-foreground font-mono-data">Cible: {goal.target}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

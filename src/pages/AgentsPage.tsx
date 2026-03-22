import { motion } from "framer-motion";
import { Bot, Plus, ExternalLink, Activity, CheckCircle2, XCircle, Info } from "lucide-react";
import { aiAgents } from "@/lib/mock-data";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16, filter: "blur(4px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } };

const statusConfig = {
  active: { label: "Actif", color: "bg-hugoos-green/20 text-hugoos-green", dot: "bg-hugoos-green" },
  paused: { label: "En pause", color: "bg-hugoos-orange/20 text-hugoos-orange", dot: "bg-hugoos-orange" },
  building: { label: "En dev", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
};

const agentLogs = [
  { type: "success", agent: "Aria", message: "Article 'IA en 2026' rédigé et envoyé", time: "il y a 2 min" },
  { type: "success", agent: "Nexus", message: "Batch 12 outreach — 45 emails envoyés", time: "il y a 8 min" },
  { type: "info", agent: "Orion", message: "Rapport analytics Q1 en cours de génération", time: "il y a 15 min" },
  { type: "error", agent: "Vega", message: "Erreur API TikTok — rate limit atteint", time: "il y a 2h" },
  { type: "success", agent: "Aria", message: "Script vidéo YouTube terminé", time: "il y a 3h" },
];

const logIcons = { success: CheckCircle2, error: XCircle, info: Info };
const logColors = { success: "text-hugoos-green", error: "text-hugoos-red", info: "text-hugoos-cyan" };

export default function AgentsPage() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Équipe IA</h2>
          <span className="chip-cyan">{aiAgents.length} agents</span>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors active:scale-[0.97]">
          <Plus className="w-4 h-4" />
          Nouvel Agent
        </button>
      </motion.div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiAgents.map((agent) => {
          const s = statusConfig[agent.status];
          const successRate = agent.tasks_total > 0 ? Math.round((agent.tasks_success / agent.tasks_total) * 100) : 0;

          return (
            <motion.div key={agent.id} variants={fadeUp} className="glass-card-hover p-5 cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: "hsl(189 94% 43% / 0.15)", color: "hsl(189 94% 65%)" }}>
                      {agent.avatar}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${s.dot}`} style={{ borderColor: "hsl(235 22% 11%)" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
              </div>

              <div className="flex items-center gap-1.5 mb-3">
                <span className="chip-cyan text-[10px]">{agent.model}</span>
                {agent.tools.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-muted-foreground">{t}</span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <span className="text-xs text-muted-foreground font-mono-data">{agent.tasks_total} tâches</span>
                {agent.tasks_total > 0 && (
                  <span className={`text-xs font-mono-data font-medium ${successRate >= 95 ? "text-hugoos-green" : successRate >= 80 ? "text-hugoos-orange" : "text-hugoos-red"}`}>
                    {successRate}% succès
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Logs */}
      <motion.div variants={fadeUp} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-hugoos-cyan" />
          <h2 className="text-base font-semibold text-foreground">Logs d'Activité</h2>
        </div>
        <div className="space-y-2">
          {agentLogs.map((log, i) => {
            const Icon = logIcons[log.type as keyof typeof logIcons];
            const color = logColors[log.type as keyof typeof logColors];
            return (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{log.agent}</span>
                    <span className="text-muted-foreground"> — </span>
                    {log.message}
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground flex-shrink-0">{log.time}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

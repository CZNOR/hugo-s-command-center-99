import { motion } from "framer-motion";
import { Users, Bot } from "lucide-react";
import { teamMembers, aiAgents } from "@/lib/mock-data";
import { useState } from "react";

import { stagger, fadeUp } from "@/lib/animations";

export default function TeamPage() {
  const [tab, setTab] = useState<"humans" | "ai">("humans");

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5 max-w-5xl mx-auto">
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-foreground">Équipe</h2>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-lg" style={{ background: "hsl(235 22% 11%)" }}>
        <button onClick={() => setTab("humans")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === "humans" ? "bg-white/[0.08] text-foreground" : "text-muted-foreground"}`}>
          <Users className="w-4 h-4" /> Humains
        </button>
        <button onClick={() => setTab("ai")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === "ai" ? "bg-white/[0.08] text-foreground" : "text-muted-foreground"}`}>
          <Bot className="w-4 h-4" /> Agents IA
        </button>
      </motion.div>

      {tab === "humans" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamMembers.map((m) => (
            <motion.div key={m.id} variants={fadeUp} className="glass-card-hover p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-hugoos-green/15 flex items-center justify-center text-sm font-bold text-hugoos-green">{m.avatar}</div>
                <div>
                  <p className="font-semibold text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="chip-green text-[10px]">{m.status}</span>
                  <span className="text-xs text-muted-foreground font-mono-data">{m.tasks_assigned} tâches</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiAgents.map((agent) => (
            <motion.div key={agent.id} variants={fadeUp} className="glass-card-hover p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-hugoos-cyan/15 flex items-center justify-center text-sm font-bold text-hugoos-cyan">{agent.avatar}</div>
                <div>
                  <p className="font-semibold text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="chip-cyan text-[10px]">{agent.model}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${agent.status === "active" ? "bg-hugoos-green/20 text-hugoos-green" : agent.status === "paused" ? "bg-hugoos-orange/20 text-hugoos-orange" : "bg-muted text-muted-foreground"}`}>
                  {agent.status === "active" ? "Actif" : agent.status === "paused" ? "Pause" : "En dev"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

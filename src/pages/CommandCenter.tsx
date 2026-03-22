import { motion } from "framer-motion";
import { Star, Flame, Gem, TrendingUp, CheckCircle2, Bot, ArrowUpRight, Plus } from "lucide-react";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { useXPFloat, XPFloats } from "@/components/ui/XPFloat";
import { gamificationProfile, businesses, aiAgents, tasks, dailyMissions } from "@/lib/mock-data";
import { useState } from "react";

import { stagger, fadeUp } from "@/lib/animations";

export default function CommandCenter() {
  const g = gamificationProfile;
  const { floats, triggerXP } = useXPFloat();
  const [missions, setMissions] = useState(dailyMissions);
  const [taskList, setTaskList] = useState(tasks);
  const [captureText, setCaptureText] = useState("");

  const completedMissions = missions.filter((m) => m.completed).length;
  const scorePercent = (g.score_today / g.score_record) * 100;

  const handleMissionComplete = (id: string) => {
    const mission = missions.find((m) => m.id === id);
    if (mission && !mission.completed) {
      setMissions((prev) => prev.map((m) => m.id === id ? { ...m, completed: true } : m));
      triggerXP(mission.xp);
    }
  };

  const handleTaskComplete = (id: string) => {
    const task = taskList.find((t) => t.id === id);
    if (task && task.status !== "done") {
      setTaskList((prev) => prev.map((t) => t.id === id ? { ...t, status: "done" as const } : t));
      triggerXP(task.xp);
    }
  };

  const priorityColors = {
    urgent: "bg-hugoos-red/20 text-hugoos-red",
    high: "bg-hugoos-orange/20 text-hugoos-orange",
    medium: "bg-hugoos-indigo/20 text-hugoos-indigo",
    low: "bg-muted text-muted-foreground",
  };

  const activeBusiness = businesses[0];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5 max-w-7xl mx-auto relative">
      <XPFloats floats={floats} />

      {/* ROW 1: Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score */}
        <motion.div variants={fadeUp} className="glass-card p-5 gradient-border">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-hugoos-orange" />
            <span className="text-sm font-medium text-muted-foreground">Score du Jour</span>
          </div>
          <div className="font-mono-data text-3xl font-bold text-foreground tracking-tight">
            <AnimatedNumber value={g.score_today} />
            <span className="text-lg text-muted-foreground ml-1">pts</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <TrendingUp className="w-3.5 h-3.5 text-hugoos-green" />
            <span className="text-xs text-hugoos-green font-medium">+12% vs hier</span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Record: {g.score_record.toLocaleString()}</span>
              <span>{Math.round(scorePercent)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(235 22% 18%)" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(scorePercent, 100)}%`, background: "linear-gradient(90deg, hsl(43 96% 56%), hsl(25 95% 53%))" }} />
            </div>
          </div>
        </motion.div>

        {/* Streak */}
        <motion.div variants={fadeUp} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-hugoos-orange" />
            <span className="text-sm font-medium text-muted-foreground">Streak</span>
          </div>
          <div className="font-mono-data text-3xl font-bold text-foreground tracking-tight">
            <AnimatedNumber value={g.current_streak} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">jours consécutifs</p>
          <p className="text-xs text-muted-foreground mt-3">Record: <span className="text-hugoos-orange font-mono-data">{g.longest_streak} jours</span></p>
        </motion.div>

        {/* XP Today */}
        <motion.div variants={fadeUp} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Gem className="w-4 h-4 text-hugoos-purple" />
            <span className="text-sm font-medium text-muted-foreground">XP Aujourd'hui</span>
          </div>
          <div className="font-mono-data text-3xl font-bold text-foreground tracking-tight">
            <span className="text-hugoos-purple">+</span><AnimatedNumber value={g.xp_today} />
            <span className="text-lg text-muted-foreground ml-1">XP</span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Lv.{g.level} — {g.level_title}</span>
              <span className="font-mono-data">{g.total_xp.toLocaleString()} / {g.xp_for_next_level.toLocaleString()}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(235 22% 18%)" }}>
              <div className="h-full rounded-full" style={{ width: `${(g.total_xp / g.xp_for_next_level) * 100}%`, background: "linear-gradient(90deg, hsl(239 84% 67%), hsl(263 70% 66%))" }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ROW 2: Missions */}
      <motion.div variants={fadeUp} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Missions du Jour</h2>
          <span className="chip-green">{completedMissions}/{missions.length} complétées</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {missions.map((m) => (
            <button
              key={m.id}
              onClick={() => handleMissionComplete(m.id)}
              disabled={m.completed}
              className={`relative text-left p-3 rounded-lg border transition-all duration-200 active:scale-[0.97] ${
                m.completed
                  ? "border-hugoos-green/20 bg-hugoos-green/5 opacity-70"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:-translate-y-0.5"
              }`}
            >
              <span className="text-lg mb-1 block">{m.icon}</span>
              <p className={`text-sm font-medium ${m.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{m.title}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="chip-purple text-[10px]">+{m.xp} XP</span>
                {m.completed && <CheckCircle2 className="w-4 h-4 text-hugoos-green" />}
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ROW 3: Business + Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={fadeUp} className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Business Live</h2>
            <div className="flex gap-1">
              {businesses.map((b) => (
                <span key={b.id} className="px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors" style={{ background: b.id === "1" ? `${b.color}22` : "transparent", color: b.id === "1" ? b.color : "hsl(215 19% 62%)" }}>
                  {b.name}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg" style={{ background: "hsl(235 22% 14%)" }}>
              <p className="text-xs text-muted-foreground mb-1">Revenue MTD</p>
              <p className="font-mono-data text-xl font-bold text-hugoos-green">€{activeBusiness.revenue_mtd.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: "hsl(235 22% 14%)" }}>
              <p className="text-xs text-muted-foreground mb-1">MRR</p>
              <p className="font-mono-data text-xl font-bold text-hugoos-cyan">€{activeBusiness.mrr.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: "hsl(235 22% 14%)" }}>
              <p className="text-xs text-muted-foreground mb-1">Deals actifs</p>
              <p className="font-mono-data text-xl font-bold text-foreground">{activeBusiness.deals_active}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: "hsl(235 22% 14%)" }}>
              <p className="text-xs text-muted-foreground mb-1">Dépenses</p>
              <p className="font-mono-data text-xl font-bold text-hugoos-red/80">€{activeBusiness.expenses.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Agents Actifs</h2>
            <span className="chip-cyan">{aiAgents.filter(a => a.status === "active").length} actifs</span>
          </div>
          <div className="space-y-2.5">
            {aiAgents.slice(0, 4).map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: agent.status === "active" ? "hsl(189 94% 43% / 0.15)" : agent.status === "paused" ? "hsl(43 96% 56% / 0.15)" : "hsl(235 15% 25%)", color: agent.status === "active" ? "hsl(189 94% 65%)" : agent.status === "paused" ? "hsl(43 96% 70%)" : "hsl(215 19% 55%)" }}>
                  {agent.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{agent.name}</p>
                  <p className="text-[11px] text-muted-foreground">{agent.last_action}</p>
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${agent.status === "active" ? "bg-hugoos-green" : agent.status === "paused" ? "bg-hugoos-orange" : "bg-muted-foreground"}`} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ROW 4: Tasks + Capture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={fadeUp} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Tâches Prioritaires</h2>
            <a href="/tasks" className="text-xs text-primary flex items-center gap-1 hover:underline">Voir tout <ArrowUpRight className="w-3 h-3" /></a>
          </div>
          <div className="space-y-1.5">
            {taskList.filter(t => t.status !== "done").slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors group relative">
                <button onClick={() => handleTaskComplete(task.id)} className="w-4.5 h-4.5 rounded border border-white/20 flex-shrink-0 hover:border-hugoos-green hover:bg-hugoos-green/20 transition-colors active:scale-90" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${priorityColors[task.priority]}`}>{task.priority}</span>
                    <span className="text-[11px] text-muted-foreground">{task.due_date}</span>
                  </div>
                </div>
                <span className="chip-purple text-[10px]">+{task.xp}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="glass-card p-5">
          <h2 className="text-base font-semibold text-foreground mb-4">Capture Rapide</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={captureText}
              onChange={(e) => setCaptureText(e.target.value)}
              placeholder="Nouvelle tâche... (appuie sur Entrée)"
              className="w-full px-4 py-3 rounded-lg text-sm text-foreground placeholder:text-muted-foreground border border-white/[0.06] focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              style={{ background: "hsl(235 22% 14%)" }}
              onKeyDown={(e) => { if (e.key === "Enter" && captureText.trim()) { triggerXP(10); setCaptureText(""); } }}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {(["low", "medium", "high", "urgent"] as const).map((p) => (
                  <span key={p} className={`text-[10px] px-2 py-1 rounded cursor-pointer ${priorityColors[p]}`}>{p}</span>
                ))}
              </div>
              <span className="chip-purple text-[10px]">+10 XP</span>
            </div>
            <button className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors active:scale-[0.97] flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

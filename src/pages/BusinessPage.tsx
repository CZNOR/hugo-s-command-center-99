import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { businesses, revenueData, deals } from "@/lib/mock-data";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import { stagger, fadeUp } from "@/lib/animations";

const stageLabels: Record<string, string> = { lead: "Lead", qualified: "Qualifié", proposal: "Proposition", negotiation: "Négo", won: "Gagné", lost: "Perdu" };
const stageColors: Record<string, string> = { lead: "border-muted-foreground/30", qualified: "border-hugoos-cyan/40", proposal: "border-hugoos-indigo/40", negotiation: "border-hugoos-orange/40", won: "border-hugoos-green/40", lost: "border-hugoos-red/40" };

export default function BusinessPage() {
  const [activeBiz, setActiveBiz] = useState("1");
  const biz = businesses.find((b) => b.id === activeBiz) || businesses[0];
  const margin = biz.revenue_mtd - biz.expenses;
  const marginPct = biz.revenue_mtd > 0 ? Math.round((margin / biz.revenue_mtd) * 100) : 0;
  const stages = ["lead", "qualified", "proposal", "negotiation", "won"];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5 max-w-7xl mx-auto">
      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "hsl(235 22% 11%)" }}>
        {businesses.map((b) => (
          <button key={b.id} onClick={() => setActiveBiz(b.id)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeBiz === b.id ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {b.name}
          </button>
        ))}
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue MTD", value: biz.revenue_mtd, prefix: "€", color: "text-hugoos-green", trend: "+18%" },
          { label: "MRR", value: biz.mrr, prefix: "€", color: "text-hugoos-cyan", trend: "+7%" },
          { label: "Dépenses", value: biz.expenses, prefix: "€", color: "text-hugoos-red/80", trend: "+3%" },
          { label: "Marge", value: marginPct, suffix: "%", color: marginPct > 50 ? "text-hugoos-green" : "text-hugoos-orange", trend: `€${margin.toLocaleString()}` },
        ].map((kpi, i) => (
          <motion.div key={i} variants={fadeUp} className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
            <p className={`font-mono-data text-2xl font-bold ${kpi.color}`}>
              {kpi.prefix}<AnimatedNumber value={kpi.value} />{kpi.suffix}
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              <TrendingUp className="w-3 h-3 text-hugoos-green" />
              <span className="text-[11px] text-hugoos-green">{kpi.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div variants={fadeUp} className="glass-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Évolution Revenue — 6 mois</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(235 15% 18%)" />
              <XAxis dataKey="month" stroke="hsl(215 19% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 19% 55%)" fontSize={12} tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(235 22% 11%)", border: "1px solid hsl(0 0% 100% / 0.06)", borderRadius: "8px", color: "hsl(213 31% 95%)", fontSize: "12px" }}
                formatter={(value: number) => [`€${value.toLocaleString()}`, undefined]}
              />
              <Bar dataKey="agence" fill="#6366F1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saas" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="contenu" fill="#EC4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Pipeline */}
      <motion.div variants={fadeUp} className="glass-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Pipeline Deals</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stages.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage);
            return (
              <div key={stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stageLabels[stage]}</h3>
                  <span className="text-[10px] text-muted-foreground">{stageDeals.length}</span>
                </div>
                <div className="space-y-2">
                  {stageDeals.map((deal) => (
                    <div key={deal.id} className={`p-3 rounded-lg border-l-2 ${stageColors[stage]} hover:bg-white/[0.03] transition-colors cursor-pointer`} style={{ background: "hsl(235 22% 14%)" }}>
                      <p className="text-sm font-medium text-foreground">{deal.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{deal.client}</p>
                      <p className="font-mono-data text-sm font-bold text-foreground mt-1.5">€{deal.value?.toLocaleString()}</p>
                    </div>
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="p-3 rounded-lg border border-dashed border-white/[0.06] text-center">
                      <p className="text-xs text-muted-foreground">Aucun deal</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

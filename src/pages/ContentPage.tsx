import { motion } from "framer-motion";
import { Smartphone, Instagram, Youtube, Tv } from "lucide-react";

import { stagger, fadeUp } from "@/lib/animations";

const platforms = [
  { name: "Instagram", followers: "12.4K", reach: "45.2K", engagement: "4.8%", posts: 8, color: "#E4405F", delta: "+320" },
  { name: "TikTok", followers: "28.7K", reach: "189K", engagement: "7.2%", posts: 12, color: "#00F2EA", delta: "+1.2K" },
  { name: "YouTube", followers: "5.8K", reach: "32K", engagement: "6.1%", posts: 3, color: "#FF0000", delta: "+180" },
  { name: "Dlive.tv", followers: "890", reach: "2.1K", engagement: "12.4%", posts: 2, color: "#FFD700", delta: "+45" },
];

const contentPipeline = [
  { col: "Idée", items: [{ title: "Tutoriel agents IA avancé", platform: "YouTube" }, { title: "Day in my life CEO", platform: "TikTok" }] },
  { col: "Script", items: [{ title: "Comment j'utilise l'IA", platform: "YouTube" }] },
  { col: "Montage", items: [{ title: "Review outils no-code", platform: "TikTok" }] },
  { col: "Programmé", items: [{ title: "Reel — 5 tips productivité", platform: "Instagram" }] },
  { col: "Publié", items: [{ title: "Thread IA business", platform: "TikTok" }, { title: "Vlog bureau setup", platform: "YouTube" }] },
];

export default function ContentPage() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5 max-w-7xl mx-auto">
      <motion.div variants={fadeUp}>
        <h2 className="text-xl font-bold text-foreground">Contenu & Réseaux</h2>
      </motion.div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {platforms.map((p) => (
          <motion.div key={p.name} variants={fadeUp} className="glass-card-hover p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${p.color}12` }}>
                <Smartphone className="w-4 h-4" style={{ color: p.color }} />
              </div>
              <span className="text-sm font-semibold text-foreground">{p.name}</span>
            </div>
            <p className="font-mono-data text-2xl font-bold text-foreground">{p.followers}</p>
            <p className="text-xs text-hugoos-green font-medium mt-0.5">{p.delta} cette semaine</p>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
              <div>
                <p className="text-[10px] text-muted-foreground">Reach</p>
                <p className="text-xs font-mono-data font-medium text-foreground">{p.reach}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Engage.</p>
                <p className="text-xs font-mono-data font-medium text-hugoos-green">{p.engagement}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Posts</p>
                <p className="text-xs font-mono-data font-medium text-foreground">{p.posts}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Content Pipeline Kanban */}
      <motion.div variants={fadeUp} className="glass-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Pipeline Contenu</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {contentPipeline.map((col) => (
            <div key={col.col}>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{col.col}</h3>
              <div className="space-y-2">
                {col.items.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl border border-border/50 bg-white/30 hover:bg-white/50 transition-colors cursor-pointer">
                    <p className="text-sm text-foreground">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{item.platform}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

import { Bot, Plus, Zap, Play } from "lucide-react";
import { toast } from "sonner";
import { useBusiness } from "@/lib/businessContext";

export default function AgentsPage() {
  const { activeBusiness } = useBusiness();

  const notifyWip = (label: string) =>
    toast.info(`${label} — bientôt disponible`, { description: "Module Agents IA en cours d'intégration." });

  const agentTypes = [
    { label: "Prospection", desc: "Automatise la recherche de clients" },
    { label: "Contenu", desc: "Génère et publie du contenu" },
    { label: "Suivi", desc: "Relance et nurturing automatique" },
  ];

  return (
    <div className="p-4 lg:p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Agents IA</h1>
          <p className="text-sm text-white/40 mt-1">Automatisez vos workflows avec l'IA</p>
        </div>
        <button
          onClick={() => notifyWip("Créer un agent")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0"
          style={{ background: activeBusiness.gradient, boxShadow: `0 4px 12px ${activeBusiness.glow}` }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Créer un agent</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { label: "Agents actifs", value: "0", icon: Bot },
          { label: "Tâches/jour", value: "0", icon: Zap },
          { label: "Temps économisé", value: "0h", icon: Play },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="mb-2" style={{ color: activeBusiness.accent }}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-white/90">{value}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Agent templates */}
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {agentTypes.map((type) => (
            <div
              key={type.label}
              onClick={() => notifyWip(`Template ${type.label}`)}
              className="rounded-2xl p-4 cursor-pointer transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${activeBusiness.accent}30` }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${activeBusiness.accent}20` }}
              >
                <Bot className="w-4 h-4" style={{ color: activeBusiness.accent }} />
              </div>
              <p className="text-sm font-semibold text-white/80">{type.label}</p>
              <p className="text-xs text-white/40 mt-1">{type.desc}</p>
              <button
                onClick={(e) => { e.stopPropagation(); notifyWip(`Configurer ${type.label}`); }}
                className="mt-3 text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: `${activeBusiness.accent}20`, color: activeBusiness.accent }}
              >
                Configurer →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state for active agents */}
      <div
        className="rounded-2xl flex flex-col items-center justify-center py-16 gap-4"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: `${activeBusiness.accent}15`, border: `1px solid ${activeBusiness.accent}30` }}
        >
          <Bot className="w-8 h-8" style={{ color: activeBusiness.accent }} />
        </div>
        <div className="text-center">
          <p className="text-white/60 font-medium">Aucun agent configuré</p>
          <p className="text-white/30 text-sm mt-1">Créez votre premier agent pour automatiser vos workflows</p>
        </div>
        <button
          onClick={() => notifyWip("Créer un agent")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white mt-1"
          style={{ background: activeBusiness.gradient, boxShadow: `0 4px 12px ${activeBusiness.glow}` }}
        >
          <Zap className="w-4 h-4" />
          Créer mon premier agent
        </button>
      </div>
    </div>
  );
}

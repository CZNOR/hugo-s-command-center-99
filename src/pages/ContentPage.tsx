import { BookOpen, Plus, Video, FileText, Image, TrendingUp } from "lucide-react";
import { useBusiness } from "@/lib/businessContext";

export default function ContentPage() {
  const { activeBusiness } = useBusiness();

  const contentTypes = [
    { icon: Video, label: "Vidéos", count: 0 },
    { icon: FileText, label: "Articles", count: 0 },
    { icon: Image, label: "Posts", count: 0 },
    { icon: TrendingUp, label: "Campagnes", count: 0 },
  ];

  const statuses = ["Tous", "Brouillon", "Publié", "Planifié"];

  return (
    <div className="p-4 lg:p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Contenu</h1>
          <p className="text-sm text-white/40 mt-1">Créez et gérez votre stratégie de contenu</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: activeBusiness.gradient, boxShadow: `0 4px 12px ${activeBusiness.glow}` }}
        >
          <Plus className="w-4 h-4" />
          Créer
        </button>
      </div>

      {/* Type cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {contentTypes.map(({ icon: Icon, label, count }) => (
          <div
            key={label}
            className="rounded-2xl p-4 cursor-pointer transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="mb-3" style={{ color: activeBusiness.accent }}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white/90">{count}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-5">
        {statuses.map((s, i) => (
          <button
            key={s}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
            style={{
              background: i === 0 ? `${activeBusiness.accent}22` : "rgba(255,255,255,0.04)",
              borderColor: i === 0 ? activeBusiness.accent : "rgba(255,255,255,0.08)",
              color: i === 0 ? activeBusiness.accent : "rgba(248,250,252,0.5)",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div
        className="rounded-2xl flex flex-col items-center justify-center py-20 gap-4"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: `${activeBusiness.accent}15`, border: `1px solid ${activeBusiness.accent}30` }}
        >
          <BookOpen className="w-8 h-8" style={{ color: activeBusiness.accent }} />
        </div>
        <div className="text-center">
          <p className="text-white/60 font-medium">Aucun contenu pour l'instant</p>
          <p className="text-white/30 text-sm mt-1">Commencez à créer votre stratégie de contenu</p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white mt-1"
          style={{ background: activeBusiness.gradient, boxShadow: `0 4px 12px ${activeBusiness.glow}` }}
        >
          <Plus className="w-4 h-4" />
          Créer mon premier contenu
        </button>
      </div>
    </div>
  );
}

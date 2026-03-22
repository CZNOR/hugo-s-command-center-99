import { Plus, CheckSquare } from "lucide-react";
import { useBusiness } from "@/lib/businessContext";

export default function TasksPage() {
  const { activeBusiness } = useBusiness();

  const columns = ["À faire", "En cours", "Terminé"];

  return (
    <div className="p-4 lg:p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Tâches</h1>
          <p className="text-sm text-white/40 mt-1">Gérez vos tâches et projets</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: activeBusiness.gradient, boxShadow: `0 4px 12px ${activeBusiness.glow}` }}
        >
          <Plus className="w-4 h-4" />
          Nouvelle tâche
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["Toutes", "Aujourd'hui", "Cette semaine", "En retard"].map((f, i) => (
          <button
            key={f}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
            style={{
              background: i === 0 ? `${activeBusiness.accent}22` : "rgba(255,255,255,0.04)",
              borderColor: i === 0 ? activeBusiness.accent : "rgba(255,255,255,0.08)",
              color: i === 0 ? activeBusiness.accent : "rgba(248,250,252,0.5)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div
            key={col}
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white/70">{col}</span>
              <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">0</span>
            </div>
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <CheckSquare className="w-7 h-7 text-white/10" />
              <p className="text-xs text-white/25">Aucune tâche</p>
              <button
                className="mt-2 text-xs px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
                style={{
                  borderColor: `${activeBusiness.accent}40`,
                  color: activeBusiness.accent,
                  background: `${activeBusiness.accent}10`,
                }}
              >
                + Ajouter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

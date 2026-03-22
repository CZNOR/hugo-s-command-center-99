import { useEffect, useState } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import { useBusiness } from "@/lib/businessContext";
import { supabase } from "@/integrations/supabase/client";

interface ContentItem {
  id: string;
  sujet: string;
  script: string;
  format: string;
  date: string;
  statut: string;
  business: string;
  notes: string;
}

const FORMAT_ICONS: Record<string, string> = {
  "Storytelling": "🎬",
  "Double cam": "🎥",
  "Valeur rapide": "⚡",
  "Valeur travaillée": "🎯",
  "YouTube": "▶️",
  "Live": "🔴",
  "Carrousel": "🖼️",
  "Story": "📱",
  "Reel": "📲",
};

const FORMAT_COLORS: Record<string, string> = {
  "Storytelling": "rgba(239,68,68,0.15)",
  "Double cam": "rgba(59,130,246,0.15)",
  "Valeur rapide": "rgba(234,179,8,0.15)",
  "Valeur travaillée": "rgba(168,85,247,0.15)",
  "YouTube": "rgba(34,197,94,0.15)",
  "Live": "rgba(249,115,22,0.15)",
  "Carrousel": "rgba(236,72,153,0.15)",
  "Story": "rgba(156,163,175,0.15)",
  "Reel": "rgba(99,102,241,0.15)",
};

const STATUT_COLORS: Record<string, string> = {
  "Idée": "#6b7280",
  "Script": "#eab308",
  "À tourner": "#f97316",
  "Tourné": "#3b82f6",
  "Monté": "#a855f7",
  "Publié": "#22c55e",
};

function ContentCard({ item }: { item: ContentItem }) {
  const fmtColor = FORMAT_COLORS[item.format] || "rgba(255,255,255,0.08)";
  const fmtIcon = FORMAT_ICONS[item.format] || "📄";
  const statColor = STATUT_COLORS[item.statut] || "#6b7280";
  return (
    <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: fmtColor }}>
        {fmtIcon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/90 font-medium text-sm truncate">{item.sujet || "Sans titre"}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {item.format && <span className="text-xs text-white/50">{item.format}</span>}
          {item.business && <span className="text-xs text-white/30">· {item.business}</span>}
          {item.date && (
            <span className="text-xs text-white/30">
              · {new Date(item.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </div>
      <span className="text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0"
        style={{ background: statColor + "25", color: statColor }}>
        {item.statut || "—"}
      </span>
    </div>
  );
}

function Section({ title, items, emptyMsg }: { title: string; items: ContentItem[]; emptyMsg: string }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">{title}</h2>
      {items.length === 0 ? (
        <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <p className="text-white/30 text-sm">{emptyMsg}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => <ContentCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

export default function ContentPage() {
  const { activeBusiness } = useBusiness();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("notion-content");
      if (error) throw error;
      setItems(data?.items || []);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion Notion");
    } finally {
      setLoading(false);
      setLastSync(new Date());
    }
  };

  useEffect(() => { fetchContent(); }, []);

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

  const todayItems = items.filter(i => i.date === today && i.statut === "À tourner");
  const scriptItems = items.filter(i => i.statut === "Script" || i.statut === "Idée");
  const thisWeekItems = items.filter(i => {
    if (!i.date || i.statut === "Publié") return false;
    const d = new Date(i.date + "T12:00:00");
    return d > now && d <= weekEnd;
  });

  return (
    <div className="p-4 lg:p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Contenu</h1>
          <p className="text-sm text-white/40 mt-1">Calendrier édito — sync Notion</p>
        </div>
        <button
          onClick={fetchContent}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: activeBusiness.gradient, boxShadow: `0 4px 12px ${activeBusiness.glow}` }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Sync..." : "Actualiser"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <p className="text-red-400 text-sm font-medium">⚠️ {error}</p>
          <p className="text-white/30 text-xs mt-1">Vérifie que la Edge Function est déployée et NOTION_TOKEN configuré dans Supabase.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "À tourner", value: items.filter(i => i.statut === "À tourner").length, color: activeBusiness.accent },
          { label: "En prépa", value: scriptItems.length, color: "#eab308" },
          { label: "Cette semaine", value: thisWeekItems.length, color: "#22c55e" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Formats legend */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["Storytelling", "Double cam", "Valeur rapide", "Valeur travaillée", "YouTube", "Live"].map(fmt => (
          <span key={fmt} className="text-xs px-2 py-1 rounded-lg" style={{ background: FORMAT_COLORS[fmt], color: "rgba(255,255,255,0.7)" }}>
            {FORMAT_ICONS[fmt]} {fmt}
          </span>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white/50 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/30 text-sm">Connexion à Notion...</p>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div className="space-y-6">
          <Section title="🎬 À tourner aujourd'hui" items={todayItems} emptyMsg="Rien à tourner aujourd'hui" />
          <Section title="✍️ Scripts & idées en cours" items={scriptItems} emptyMsg="Aucun script en attente" />
          <Section title="📅 Cette semaine" items={thisWeekItems} emptyMsg="Rien de planifié cette semaine" />

          {items.filter(i => i.statut !== "Publié").length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">📋 Tout le contenu</h2>
              <div className="space-y-2">
                {items.map(item => <ContentCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Calendar className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-white/50 font-medium">Calendrier vide</p>
              <p className="text-white/25 text-sm mt-1">Ajoute des contenus dans Notion pour les voir ici</p>
            </div>
          )}
        </div>
      )}

      <p className="text-white/15 text-xs mt-8 text-center">
        Dernière sync · {lastSync.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}

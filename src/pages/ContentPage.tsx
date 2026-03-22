import { useEffect, useState } from "react";
import { Calendar, RefreshCw, Plus, X, Sparkles, ChevronDown } from "lucide-react";
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

const FORMATS = ["Storytelling", "Double cam", "Valeur rapide", "Valeur travaillée", "YouTube", "Live", "Carrousel", "Story", "Reel"];
const STATUTS = ["Idée", "Script", "À tourner", "Tourné", "Monté", "Publié"];
const BUSINESSES = ["Made Solution", "Hugo Coaching", "Personal Brand"];

// ─── Create Entry Modal ─────────────────────────────────────
function CreateEntryModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { activeBusiness } = useBusiness();
  const [form, setForm] = useState({
    sujet: "",
    format: "Storytelling",
    date: new Date().toISOString().slice(0, 10),
    statut: "Idée",
    business: "Made Solution",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!form.sujet.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("notion-content", {
        body: { action: "create", ...form },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 animate-scale-in"
        style={{
          background: "rgba(12,6,28,0.98)",
          border: "1px solid rgba(124,58,237,0.4)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.15)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">Nouveau contenu</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white transition-colors hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Sujet */}
          <div>
            <label className="text-xs font-medium text-white/50 mb-1.5 block uppercase tracking-wider">Sujet / Titre</label>
            <input
              autoFocus
              value={form.sujet}
              onChange={e => setForm(p => ({ ...p, sujet: e.target.value }))}
              placeholder="Mon idée de contenu..."
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(168,85,247,0.5)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            />
          </div>

          {/* Format + Statut */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block uppercase tracking-wider">Format</label>
              <select
                value={form.format}
                onChange={e => setForm(p => ({ ...p, format: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none appearance-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {FORMATS.map(f => <option key={f} value={f}>{FORMAT_ICONS[f] || "📄"} {f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block uppercase tracking-wider">Statut</label>
              <select
                value={form.statut}
                onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none appearance-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Date + Business */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block uppercase tracking-wider">Date de tournage</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", colorScheme: "dark" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block uppercase tracking-wider">Business</label>
              <select
                value={form.business}
                onChange={e => setForm(p => ({ ...p, business: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none appearance-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {BUSINESSES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-white/50 mb-1.5 block uppercase tracking-wider">Notes / Idées</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Contexte, angle, hook..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none resize-none transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(168,85,247,0.5)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl p-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <p className="text-red-400 text-xs">⚠️ {error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-white/60 transition-colors hover:text-white/90"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !form.sujet.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Création...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Créer dans Notion
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Content Card ───────────────────────────────────────────
function ContentCard({ item, onStatusChange }: { item: ContentItem; onStatusChange?: (id: string, statut: string) => void }) {
  const fmtColor = FORMAT_COLORS[item.format] || "rgba(255,255,255,0.08)";
  const fmtIcon = FORMAT_ICONS[item.format] || "📄";
  const statColor = STATUT_COLORS[item.statut] || "#6b7280";
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4 group relative"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", transition: "all 0.2s ease" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.2)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
      }}
    >
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

      {/* Status badge - clickable to change */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium transition-colors"
          style={{ background: statColor + "25", color: statColor, border: `1px solid ${statColor}40` }}
        >
          {item.statut || "—"}
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {showStatusMenu && onStatusChange && (
          <div
            className="absolute right-0 top-8 z-20 rounded-xl overflow-hidden shadow-2xl"
            style={{ background: "rgba(15,8,30,0.98)", border: "1px solid rgba(255,255,255,0.12)", minWidth: 120 }}
          >
            {STATUTS.map(s => (
              <button
                key={s}
                onClick={() => { onStatusChange(item.id, s); setShowStatusMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-white/10"
                style={{ color: STATUT_COLORS[s] || "#fff" }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, items, emptyMsg, onStatusChange }: {
  title: string; items: ContentItem[]; emptyMsg: string;
  onStatusChange?: (id: string, statut: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">{title}</h2>
      {items.length === 0 ? (
        <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <p className="text-white/30 text-sm">{emptyMsg}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => <ContentCard key={item.id} item={item} onStatusChange={onStatusChange} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function ContentPage() {
  const { activeBusiness } = useBusiness();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [showCreate, setShowCreate] = useState(false);

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

  const handleStatusChange = async (id: string, statut: string) => {
    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, statut } : i));
    try {
      await supabase.functions.invoke("notion-content", {
        body: { action: "update", id, statut },
      });
    } catch {
      // Revert on error
      fetchContent();
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
    <div className="page-enter p-4 lg:p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Contenu</h1>
          <p className="text-sm text-white/40 mt-1">Calendrier édito — sync Notion</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 4px 12px rgba(124,58,237,0.4)" }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau</span>
          </button>
          <button
            onClick={fetchContent}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{loading ? "Sync..." : "Actualiser"}</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <p className="text-red-400 text-sm font-medium">⚠️ {error}</p>
          <p className="text-white/30 text-xs mt-1">Vérifie que la Edge Function est déployée et NOTION_TOKEN configuré dans Supabase.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 stagger-children">
        {[
          { label: "À tourner", value: items.filter(i => i.statut === "À tourner").length, color: activeBusiness.accent },
          { label: "En prépa", value: scriptItems.length, color: "#eab308" },
          { label: "Cette semaine", value: thisWeekItems.length, color: "#22c55e" },
        ].map(s => (
          <div key={s.label} className="violet-card p-4">
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
            <div className="w-8 h-8 border-2 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/30 text-sm">Connexion à Notion...</p>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div className="space-y-6">
          <Section title="🎬 À tourner aujourd'hui" items={todayItems} emptyMsg="Rien à tourner aujourd'hui" onStatusChange={handleStatusChange} />
          <Section title="✍️ Scripts & idées en cours" items={scriptItems} emptyMsg="Aucun script en attente" onStatusChange={handleStatusChange} />
          <Section title="📅 Cette semaine" items={thisWeekItems} emptyMsg="Rien de planifié cette semaine" onStatusChange={handleStatusChange} />
          {items.filter(i => i.statut !== "Publié").length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">📋 Tout le contenu</h2>
              <div className="space-y-2">
                {items.map(item => <ContentCard key={item.id} item={item} onStatusChange={handleStatusChange} />)}
              </div>
            </div>
          )}
          {items.length === 0 && !error && (
            <div
              className="rounded-2xl p-12 text-center cursor-pointer transition-all hover:border-purple-500/30"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}
              onClick={() => setShowCreate(true)}
            >
              <Calendar className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-white/50 font-medium">Calendrier vide</p>
              <p className="text-white/25 text-sm mt-1">Clique pour créer ton premier contenu</p>
            </div>
          )}
        </div>
      )}

      <p className="text-white/15 text-xs mt-8 text-center">
        Dernière sync · {lastSync.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </p>

      {/* Create modal */}
      {showCreate && (
        <CreateEntryModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { fetchContent(); }}
        />
      )}
    </div>
  );
}

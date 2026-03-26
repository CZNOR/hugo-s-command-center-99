import { useEffect, useState } from "react";
import { Calendar, RefreshCw, Plus, X, Sparkles, ChevronDown, LayoutGrid, CalendarDays, Target } from "lucide-react";
import { useBusiness } from "@/lib/businessContext";

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
const BUSINESSES = ["Coaching", "Affiliation", "Ecom"];

// ─── Create Entry Modal (glass style) ───────────────────────
function CreateEntryModal({ onClose, onCreated, onLocalCreate }: {
  onClose: () => void;
  onCreated: () => void;
  onLocalCreate: (item: ContentItem) => void;
}) {
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
      const r = await fetch("/api/notion-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...form }),
      });
      const data = await r.json();
      if (!r.ok || data?.error) throw new Error(data?.error ?? r.statusText);
      onCreated();
      onClose();
    } catch (err: any) {
      // Fallback: add locally if API unavailable
      onLocalCreate({
        id: Date.now().toString(),
        sujet: form.sujet,
        script: "",
        format: form.format,
        date: form.date,
        statut: form.statut,
        business: form.business,
        notes: form.notes,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-card w-full max-w-lg p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Nouveau contenu</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-white/30">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Sujet / Titre *</label>
            <input
              autoFocus
              value={form.sujet}
              onChange={e => setForm(p => ({ ...p, sujet: e.target.value }))}
              placeholder="Mon idée de contenu..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Format</label>
              <select value={form.format} onChange={e => setForm(p => ({ ...p, format: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                {FORMATS.map(f => <option key={f} value={f}>{FORMAT_ICONS[f] || "📄"} {f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Statut</label>
              <select value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Business</label>
              <select value={form.business} onChange={e => setForm(p => ({ ...p, business: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                {BUSINESSES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Contexte, angle, hook..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl p-3 bg-red-50 border border-red-200">
              <p className="text-red-600 text-xs">⚠️ {error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-muted-foreground bg-white/40 border border-border hover:bg-white/60 transition-colors">Annuler</button>
          <button
            onClick={handleCreate}
            disabled={saving || !form.sujet.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Création..." : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Content Card (glass style) ─────────────────────────────
function ContentCard({ item, onStatusChange }: { item: ContentItem; onStatusChange?: (id: string, statut: string) => void }) {
  const fmtColor = FORMAT_COLORS[item.format] || "rgba(255,255,255,0.08)";
  const fmtIcon = FORMAT_ICONS[item.format] || "📄";
  const statColor = STATUT_COLORS[item.statut] || "#6b7280";
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  return (
    <div className="glass-card p-4 flex items-center gap-4 group relative">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: fmtColor }}>
        {fmtIcon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-medium text-sm truncate">{item.sujet || "Sans titre"}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {item.format && <span className="text-xs text-muted-foreground">{item.format}</span>}
          {item.business && <span className="text-xs text-muted-foreground/60">· {item.business}</span>}
          {item.date && (
            <span className="text-xs text-muted-foreground/60">
              · {new Date(item.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium transition-colors"
          style={{ background: statColor + "18", color: statColor, border: `1px solid ${statColor}30` }}
        >
          {item.statut || "—"}
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {showStatusMenu && onStatusChange && (
          <div className="absolute right-0 top-8 z-20 rounded-xl overflow-hidden shadow-2xl glass-card border border-border" style={{ minWidth: 120 }}>
            {STATUTS.map(s => (
              <button
                key={s}
                onClick={() => { onStatusChange(item.id, s); setShowStatusMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-white/30"
                style={{ color: STATUT_COLORS[s] || "#6b7280" }}
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
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h2>
      {items.length === 0 ? (
        <div className="glass-card p-5 text-center border-dashed">
          <p className="text-muted-foreground text-sm">{emptyMsg}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => <ContentCard key={item.id} item={item} onStatusChange={onStatusChange} />)}
        </div>
      )}
    </div>
  );
}

const OBJECTIF_MENSUEL = 20;

// ─── Week view component ─────────────────────────────────────
function WeekView({ items, onStatusChange }: { items: ContentItem[]; onStatusChange?: (id: string, statut: string) => void }) {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay() + 1 + i);
    return d;
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const key = day.toISOString().split("T")[0];
        const dayItems = items.filter((i) => i.date === key);
        const isToday = key === now.toISOString().split("T")[0];
        return (
          <div key={key} className="min-h-[120px] rounded-xl p-2" style={{
            background: isToday ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)",
            border: isToday ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(139,92,246,0.08)",
          }}>
            <p className="text-[10px] font-semibold mb-1 text-center" style={{ color: isToday ? "#a855f7" : "rgba(255,255,255,0.35)" }}>
              {day.toLocaleDateString("fr-FR", { weekday: "short" }).toUpperCase()}
            </p>
            <p className="text-sm font-bold text-center mb-2" style={{ color: isToday ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)" }}>
              {day.getDate()}
            </p>
            <div className="space-y-1">
              {dayItems.map((item) => {
                const color = STATUT_COLORS[item.statut] || "#6b7280";
                return (
                  <div key={item.id} className="text-[10px] leading-tight px-1.5 py-1 rounded-lg truncate" style={{ background: color + "18", color, border: `1px solid ${color}22` }}>
                    {item.sujet || "Sans titre"}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
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
  const [viewMode, setViewMode] = useState<"liste" | "semaine">("liste");

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/notion-content");
      if (!r.ok) throw new Error(r.statusText);
      const data = await r.json();
      if (data?.error) throw new Error(data.error);
      setItems(data?.items || []);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion Notion");
    } finally {
      setLoading(false);
      setLastSync(new Date());
    }
  };

  const handleLocalCreate = (item: ContentItem) => {
    setItems(prev => [item, ...prev]);
  };

  const handleStatusChange = async (id: string, statut: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, statut } : i));
    try {
      const r = await fetch("/api/notion-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id, statut }),
      });
      if (!r.ok) throw new Error();
    } catch {
      fetchContent();
    }
  };

  useEffect(() => { fetchContent(); }, []);

  const now2 = new Date();
  const publishedThisMonth = items.filter((i) => {
    if (i.statut !== "Publié" || !i.date) return false;
    const d = new Date(i.date + "T12:00:00");
    return d.getMonth() === now2.getMonth() && d.getFullYear() === now2.getFullYear();
  }).length;

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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contenu</h1>
          <p className="text-sm text-muted-foreground mt-1">Calendrier éditorial — sync Notion</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.2)" }}>
            <button
              onClick={() => setViewMode("liste")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all"
              style={viewMode === "liste" ? { background: "rgba(139,92,246,0.2)", color: "#c4b5fd" } : { background: "transparent", color: "rgba(255,255,255,0.4)" }}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Liste
            </button>
            <button
              onClick={() => setViewMode("semaine")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all"
              style={viewMode === "semaine" ? { background: "rgba(139,92,246,0.2)", color: "#c4b5fd" } : { background: "transparent", color: "rgba(255,255,255,0.4)" }}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Semaine
            </button>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau</span>
          </button>
          <button
            onClick={fetchContent}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground bg-white/40 border border-border hover:bg-white/60 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{loading ? "Sync..." : "Actualiser"}</span>
          </button>
        </div>
      </div>

      {/* Objectif mensuel */}
      {!loading && (
        <div className="p-4 rounded-xl" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: "#a855f7" }} />
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                Objectif mensuel
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: publishedThisMonth >= OBJECTIF_MENSUEL ? "#22c55e" : "#a855f7" }}>
              {publishedThisMonth} / {OBJECTIF_MENSUEL} publiés
            </span>
          </div>
          <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((publishedThisMonth / OBJECTIF_MENSUEL) * 100, 100)}%`,
                background: publishedThisMonth >= OBJECTIF_MENSUEL
                  ? "#22c55e"
                  : "linear-gradient(90deg, #7c3aed, #a855f7)",
              }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card p-4 border-red-200 bg-red-50/50">
          <p className="text-red-600 text-sm font-medium">⚠️ {error}</p>
          <p className="text-muted-foreground text-xs mt-1">Vérifie que la Edge Function est déployée et NOTION_TOKEN configuré.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "À tourner", value: items.filter(i => i.statut === "À tourner").length, color: "#f97316" },
          { label: "En prépa", value: scriptItems.length, color: "#eab308" },
          { label: "Cette semaine", value: thisWeekItems.length, color: "#22c55e" },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Formats legend */}
      <div className="flex flex-wrap gap-2">
        {["Storytelling", "Double cam", "Valeur rapide", "Valeur travaillée", "YouTube", "Live"].map(fmt => (
          <span key={fmt} className="text-xs px-2 py-1 rounded-lg text-foreground/70" style={{ background: FORMAT_COLORS[fmt] }}>
            {FORMAT_ICONS[fmt]} {fmt}
          </span>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Connexion à Notion...</p>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && viewMode === "semaine" && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">📅 Vue semaine</h2>
          <WeekView items={items} onStatusChange={handleStatusChange} />
        </div>
      )}

      {!loading && viewMode === "liste" && (
        <div className="space-y-6">
          <Section title="🎬 À tourner aujourd'hui" items={todayItems} emptyMsg="Rien à tourner aujourd'hui" onStatusChange={handleStatusChange} />
          <Section title="✍️ Scripts & idées en cours" items={scriptItems} emptyMsg="Aucun script en attente" onStatusChange={handleStatusChange} />
          <Section title="📅 Cette semaine" items={thisWeekItems} emptyMsg="Rien de planifié cette semaine" onStatusChange={handleStatusChange} />
          {items.filter(i => i.statut !== "Publié").length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">📋 Tout le contenu</h2>
              <div className="space-y-2">
                {items.map(item => <ContentCard key={item.id} item={item} onStatusChange={handleStatusChange} />)}
              </div>
            </div>
          )}
          {items.length === 0 && !error && (
            <div className="glass-card p-12 text-center cursor-pointer border-dashed hover:border-primary/30 transition-colors" onClick={() => setShowCreate(true)}>
              <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-foreground/60 font-medium">Calendrier vide</p>
              <p className="text-muted-foreground text-sm mt-1">Clique pour créer ton premier contenu</p>
            </div>
          )}
        </div>
      )}

      <p className="text-muted-foreground/40 text-xs mt-8 text-center">
        Dernière sync · {lastSync.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </p>

      {/* Create modal */}
      {showCreate && (
        <CreateEntryModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { fetchContent(); }}
          onLocalCreate={handleLocalCreate}
        />
      )}
    </div>
  );
}

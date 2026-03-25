import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, TrendingUp, Users, RefreshCw,
  AlertTriangle, Edit3, X, Check,
} from "lucide-react";
import AffiliateCopyButton from "@/components/AffiliateCopyButton";

const ACCENT = "#00ff44";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ─── Supabase helper ─────────────────────────────────────────
async function sbFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// ─── Types ───────────────────────────────────────────────────
interface CasinoStats {
  id?: string;
  brand: string;
  commission: number;
  registrations: number;
  ctr: number;
  qftd: number;
  impressions: number;
  depots: number;
  revshare: number;
  updated_at?: string;
}

const DEFAULT_STATS: CasinoStats = {
  brand: "corgibet",
  commission: 0,
  registrations: 0,
  ctr: 0,
  qftd: 0,
  impressions: 0,
  depots: 0,
  revshare: 0,
};

// ─── Card wrapper ─────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── KPI card ────────────────────────────────────────────────
function KPI({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color?: string;
}) {
  const c = color ?? ACCENT;
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
        <Icon style={{ width: 15, height: 15, color: c }} />
      </div>
      <div className="text-xl font-bold" style={{ color: "#fff" }}>{value}</div>
    </Card>
  );
}

// ─── Update modal ─────────────────────────────────────────────
function UpdateModal({
  initial, onSave, onClose,
}: {
  initial: CasinoStats;
  onSave: (data: CasinoStats) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...initial });
  const [saving, setSaving] = useState(false);

  const field = (key: keyof CasinoStats, label: string, step = "0.01") => (
    <div>
      <label className="text-xs font-medium block mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</label>
      <input
        type="number"
        step={step}
        value={(form as any)[key] ?? 0}
        onChange={e => setForm(f => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
        className="w-full px-3 py-2 rounded-lg text-sm"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff",
          outline: "none",
        }}
      />
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md mx-4 rounded-2xl p-6 space-y-4"
        style={{ background: "#0d0d18", border: "1px solid rgba(0,255,68,0.2)", boxShadow: "0 0 40px rgba(0,255,68,0.08)" }}>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: ACCENT }}>Mettre à jour · Corgibet</h2>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field("commission",   "Commission (€)")}
          {field("registrations","Registrations", "1")}
          {field("depots",       "Dépôts validés", "1")}
          {field("revshare",     "RevShare (€)")}
          {field("impressions",  "Impressions", "1")}
          {field("qftd",         "QFTD", "1")}
          {field("ctr",          "CTR (%)")}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          style={{
            background: saving ? "rgba(0,255,68,0.12)" : "rgba(0,255,68,0.18)",
            border: "1px solid rgba(0,255,68,0.4)",
            color: ACCENT,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? "Enregistrement…" : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────
export default function CasinoDashboard() {
  const [stats, setStats] = useState<CasinoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await sbFetch<any[]>(
        "casino_stats?brand=eq.corgibet&order=updated_at.desc&limit=1"
      );
      setStats(rows?.[0] ?? null);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: CasinoStats) => {
    const payload = {
      brand: "corgibet",
      commission: data.commission,
      registrations: data.registrations,
      ctr: data.ctr,
      qftd: data.qftd,
      impressions: data.impressions,
      depots: data.depots,
      revshare: data.revshare,
      updated_at: new Date().toISOString(),
    };
    if (stats?.id) {
      await sbFetch(`casino_stats?id=eq.${stats.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await sbFetch("casino_stats", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    await load();
  };

  const s = stats ?? DEFAULT_STATS;
  const cpa = s.depots * 80;
  const caTotal = s.commission + cpa + s.revshare;

  // Stale warning: last update > 7 days ago
  const isStale = stats?.updated_at
    ? Date.now() - new Date(stats.updated_at).getTime() > 7 * 24 * 60 * 60 * 1000
    : true;

  const fmtEur = (n: number) =>
    n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  const lastUpdate = stats?.updated_at
    ? new Date(stats.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: ACCENT }}>
            Casino Affiliation · <span style={{ color: "#fff" }}>Corgibet</span>
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              {loading ? "Chargement…" : lastUpdate ? `Mis à jour le ${lastUpdate}` : "Aucune donnée enregistrée"}
            </p>
            {isStale && !loading && (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                <AlertTriangle className="w-3 h-3" />
                Données &gt; 7 jours
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <AffiliateCopyButton />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: "rgba(0,255,68,0.1)",
              border: "1px solid rgba(0,255,68,0.3)",
              color: ACCENT,
              cursor: "pointer",
            }}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Mettre à jour
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KPI label="Commission ce mois" value={fmtEur(s.commission)} icon={DollarSign} color={ACCENT} />
        <KPI label="Registrations"       value={String(s.registrations)} icon={Users} color="#60a5fa" />
        <KPI label="Dépôts validés"      value={String(s.depots)} icon={TrendingUp} color="#a855f7" />
        <KPI label="CPA encaissé"        value={fmtEur(cpa)} icon={DollarSign} color="#22c55e" />
        <KPI label="RevShare estimé"     value={fmtEur(s.revshare)} icon={TrendingUp} color="#f59e0b" />
        <KPI label="CA total"            value={fmtEur(caTotal)} icon={DollarSign} color={ACCENT} />
      </div>

      {/* Extra metrics */}
      {(s.impressions > 0 || s.ctr > 0 || s.qftd > 0) && (
        <div className="grid grid-cols-3 gap-3">
          <KPI label="Impressions" value={s.impressions.toLocaleString("fr-FR")} icon={TrendingUp} color="rgba(255,255,255,0.4)" />
          <KPI label="CTR"         value={`${s.ctr}%`} icon={TrendingUp} color="rgba(255,255,255,0.4)" />
          <KPI label="QFTD"        value={String(s.qftd)} icon={Users} color="rgba(255,255,255,0.4)" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !stats && (
        <Card>
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              Aucune donnée enregistrée pour Corgibet.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(0,255,68,0.12)", border: "1px solid rgba(0,255,68,0.3)", color: ACCENT, cursor: "pointer" }}
            >
              Ajouter les premières stats
            </button>
          </div>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <UpdateModal
          initial={s}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

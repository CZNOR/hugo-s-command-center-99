import { useState, useMemo, useEffect, useRef } from "react";
import {
  DollarSign, Plus, Pencil, Trash2, X, Save,
  TrendingUp, TrendingDown, Target,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { usePrivacy } from "@/lib/privacyContext";

// ─── Supabase ─────────────────────────────────────────────────
const SB_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function sbFetch<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(opts?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!text) return [] as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    // Non-JSON response (HTML 502/timeout etc.) — treat as empty
    return [] as unknown as T;
  }
}

// ─── Types ────────────────────────────────────────────────────
type FinanceCategory = "agence" | "coaching" | "formation" | "casino" | "autre";
type FinanceType = "entree" | "depense" | "investissement";

interface FinanceEntry {
  id: string;
  label: string;
  amount: number;
  type: FinanceType;
  category: FinanceCategory;
  date: string;
  status: "recu" | "en_attente" | "prevu";
  notes?: string;
  client_name?: string;
  created_at?: string;
}

// ─── Clients par catégorie (source: ClientsPage + CoachingDashboard) ──
const CLIENT_SUGGESTIONS: Record<FinanceCategory, string[]> = {
  agence:    ["Alexandre Senek", "Angello", "Aymane", "Guilan", "Lilo", "sabri bk",
              "ines", "Dimitry Santiago", "Geneviève", "Bryan Ecom", "Luka Metral", "Sofiane"],
  coaching:  ["Ayoub", "Amèle", "Yassine", "Shirlie", "Aristote", "Thomas",
              "Kryz Emile", "Flavio", "Lenny"],
  formation: ["Académie Premium", "Membre Circle.so"],
  casino:    ["Affiliation casino"],
  autre:     [],
};

interface MonthlyObjective {
  id?: string;
  month: string;
  target: number;
  target_agence: number;
  target_coaching: number;
  target_formation: number;
  target_casino: number;
}

// ─── Design constants ─────────────────────────────────────────
const CAT_COLORS: Record<FinanceCategory, string> = {
  agence:    "#22d3ee",
  coaching:  "#a855f7",
  formation: "#f97316",
  casino:    "#22c55e",
  autre:     "#6b7280",
};

const CAT_LABELS: Record<FinanceCategory, string> = {
  agence: "Agence", coaching: "Coaching", formation: "Formation", casino: "Casino", autre: "Autre",
};

const TYPE_COLORS: Record<FinanceType, string> = {
  entree:         "#22c55e",
  depense:        "#ef4444",
  investissement: "#f59e0b",
};

const TYPE_LABELS: Record<FinanceType, string> = {
  entree:         "Entrée",
  depense:        "Dépense",
  investissement: "Investissement",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  recu:       { label: "Reçu",       color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
  en_attente: { label: "En attente", color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  prevu:      { label: "Prévu",      color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(139,92,246,0.15)",
  borderRadius: 16,
  padding: "16px 14px",
};

const cardGlow: React.CSSProperties = {
  ...card,
  boxShadow: "0 0 40px rgba(139,92,246,0.08)",
};

// ─── Seed data ────────────────────────────────────────────────
const SEED_ENTRIES: Omit<FinanceEntry, "id" | "created_at">[] = [
  { label: "CA Coaching HT (cumul)",         amount: 25483, type: "entree", category: "coaching", date: "2025-12-31", status: "recu",  client_name: "9 clients HT" },
  { label: "CA Agence Made Solution (cumul)", amount: 45623, type: "entree", category: "agence",   date: "2025-12-31", status: "recu",  client_name: "Multi-clients" },
  { label: "CA Académie (cumul)",             amount: 5820,  type: "entree", category: "formation", date: "2025-12-31", status: "recu",  client_name: "16 membres premium" },
  { label: "Casino affiliation",              amount: 19.56, type: "entree", category: "casino",    date: "2025-12-31", status: "recu" },
  { label: "Retainer Senek Fév 26",           amount: 1700,  type: "entree", category: "agence",    date: "2026-02-01", status: "recu",  client_name: "Alexandre Senek" },
  { label: "Retainer Senek Mar 26",           amount: 1700,  type: "entree", category: "agence",    date: "2026-03-01", status: "recu",  client_name: "Alexandre Senek" },
  { label: "Retainer Senek Avr 26 (prévu)",   amount: 1700,  type: "entree", category: "agence",    date: "2026-04-01", status: "prevu", client_name: "Alexandre Senek" },
];

const DEFAULT_OBJECTIVE: MonthlyObjective = {
  month:            "2026-03",
  target:           15000,
  target_agence:    8000,
  target_coaching:  5000,
  target_formation: 1000,
  target_casino:    1000,
};

// ─── CRUD ─────────────────────────────────────────────────────
async function loadEntries(): Promise<FinanceEntry[]> {
  try {
    const rows = await sbFetch<FinanceEntry[]>("finance_entries?order=date.desc");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

async function saveEntry(entry: Omit<FinanceEntry, "id" | "created_at">): Promise<FinanceEntry | null> {
  const rows = await sbFetch<FinanceEntry[] | { code?: string; message?: string }>("finance_entries", {
    method: "POST",
    body: JSON.stringify(entry),
  });
  // Supabase error object (table missing, etc.) → return null
  if (!Array.isArray(rows) && (rows as any)?.code) return null;
  if (!Array.isArray(rows)) return null;
  return rows[0] ?? null;
}

async function updateEntry(id: string, updates: Partial<FinanceEntry>): Promise<void> {
  await sbFetch(`finance_entries?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

async function deleteEntry(id: string): Promise<void> {
  await sbFetch(`finance_entries?id=eq.${id}`, { method: "DELETE" });
}

async function loadObjective(month: string): Promise<MonthlyObjective | null> {
  try {
    const rows = await sbFetch<MonthlyObjective[]>(
      `monthly_objectives?month=eq.${month}&limit=1`
    );
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

async function saveObjective(obj: MonthlyObjective): Promise<void> {
  // Upsert on month column — use on_conflict query param + merge-duplicates
  await sbFetch("monthly_objectives?on_conflict=month", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(obj),
  });
}

// ─── Count-up hook ────────────────────────────────────────────
function useCountUp(target: number, duration = 1200, decimals = 0): string {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(eased * target);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return val.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function AnimatedNum({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const s = useCountUp(Math.abs(value), 1400, decimals);
  return <>{value < 0 ? "-" : ""}{s}</>;
}

// ─── ProgressBar ─────────────────────────────────────────────
function ProgressBar({
  value, max, color, height = 6,
}: { value: number; max: number; color: string; height?: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ height, borderRadius: height / 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: height / 2,
        width: `${pct}%`, background: color,
        transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

// ─── Toggle group (reusable inside modals) ───────────────────
function ToggleGroup<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { key: T; label: string; color?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
      {options.map(o => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: value === o.key
              ? `1px solid ${o.color ?? "#a855f7"}`
              : "1px solid rgba(255,255,255,0.1)",
            background: value === o.key
              ? `${o.color ?? "#a855f7"}22`
              : "rgba(255,255,255,0.04)",
            color: value === o.key ? (o.color ?? "#a855f7") : "rgba(255,255,255,0.45)",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Filter Pills ─────────────────────────────────────────────
function FilterPill<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 5, overflowX: "auto", flexShrink: 0, paddingBottom: 2, scrollbarWidth: "none" }}>
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
            whiteSpace: "nowrap", flexShrink: 0,
            border: value === o.key ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
            background: value === o.key ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.03)",
            color: value === o.key ? "#c084fc" : "rgba(255,255,255,0.55)",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Entry form data ─────────────────────────────────────────
type EntryFormData = {
  label: string;
  amount: string;
  type: FinanceType;
  category: FinanceCategory;
  date: string;
  status: "recu" | "en_attente" | "prevu";
  notes: string;
  client_name: string;
};

const EMPTY_FORM: EntryFormData = {
  label:       "",
  amount:      "",
  type:        "entree",
  category:    "agence",
  date:        new Date().toISOString().split("T")[0],
  status:      "recu",
  notes:       "",
  client_name: "",
};

// ─── Entry Modal (Add / Edit) ─────────────────────────────────
function EntryModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: FinanceEntry | null;
  onSave: (data: EntryFormData) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<EntryFormData>(
    initial
      ? {
          label:       initial.label,
          amount:      String(initial.amount),
          type:        initial.type,
          category:    initial.category,
          date:        initial.date,
          status:      initial.status,
          notes:       initial.notes ?? "",
          client_name: initial.client_name ?? "",
        }
      : EMPTY_FORM
  );
  const clientSuggestions = CLIENT_SUGGESTIONS[form.category] ?? [];
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial;

  const inputStyle: React.CSSProperties = {
    display: "block", width: "100%", marginTop: 4,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(139,92,246,0.25)",
    borderRadius: 8, padding: "8px 10px",
    color: "rgba(255,255,255,0.9)", fontSize: 14, outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.45)", fontSize: 11,
    fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.amount) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0d0b1a", border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: 20, padding: "20px 16px",
        width: "100%", maxWidth: 500,
        maxHeight: "92dvh", overflowY: "auto",
        boxShadow: "0 0 60px rgba(139,92,246,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: 16 }}>
            {isEdit ? "Modifier l'entrée" : "Ajouter une entrée"}
          </h2>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4, background: "none", border: "none" }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Libellé *</label>
            <input
              type="text" required value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="Ex: Retainer Senek Mars"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Montant (€) *</label>
            <input
              type="number" step="0.01" required value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0.00" style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Type</label>
            <ToggleGroup
              value={form.type}
              onChange={v => setForm(f => ({ ...f, type: v }))}
              options={[
                { key: "entree"         as FinanceType, label: "Entrée",         color: TYPE_COLORS.entree         },
                { key: "depense"        as FinanceType, label: "Dépense",        color: TYPE_COLORS.depense        },
                { key: "investissement" as FinanceType, label: "Investissement", color: TYPE_COLORS.investissement },
              ]}
            />
          </div>

          <div>
            <label style={labelStyle}>Catégorie</label>
            <ToggleGroup
              value={form.category}
              onChange={v => setForm(f => ({ ...f, category: v }))}
              options={[
                { key: "agence"    as FinanceCategory, label: "Agence",    color: CAT_COLORS.agence    },
                { key: "coaching"  as FinanceCategory, label: "Coaching",  color: CAT_COLORS.coaching  },
                { key: "formation" as FinanceCategory, label: "Formation", color: CAT_COLORS.formation },
                { key: "casino"    as FinanceCategory, label: "Casino",    color: CAT_COLORS.casino    },
                { key: "autre"     as FinanceCategory, label: "Autre",     color: CAT_COLORS.autre     },
              ]}
            />
          </div>

          {/* Client selector — suggestions based on category */}
          <div>
            <label style={labelStyle}>Client (optionnel)</label>
            <div style={{ position: "relative", marginTop: 4 }}>
              <input
                type="text"
                list={`clients-${form.category}`}
                value={form.client_name}
                onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                placeholder={clientSuggestions.length > 0 ? `Ex: ${clientSuggestions[0]}` : "Nom du client…"}
                style={inputStyle}
              />
              <datalist id={`clients-${form.category}`}>
                {clientSuggestions.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            {/* Quick-pick chips */}
            {clientSuggestions.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                {clientSuggestions.slice(0, 5).map(c => (
                  <button
                    key={c} type="button"
                    onClick={() => setForm(f => ({ ...f, client_name: c }))}
                    style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                      cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)",
                      background: form.client_name === c
                        ? `${CAT_COLORS[form.category]}22`
                        : "rgba(255,255,255,0.04)",
                      color: form.client_name === c ? CAT_COLORS[form.category] : "rgba(255,255,255,0.5)",
                      transition: "all 0.1s",
                    }}
                  >{c}</button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Date</label>
            <input
              type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Statut</label>
            <ToggleGroup
              value={form.status}
              onChange={v => setForm(f => ({ ...f, status: v }))}
              options={[
                { key: "recu"       as const, label: "Reçu",       color: STATUS_CONFIG.recu.color       },
                { key: "en_attente" as const, label: "En attente", color: STATUS_CONFIG.en_attente.color },
                { key: "prevu"      as const, label: "Prévu",      color: STATUS_CONFIG.prevu.color      },
              ]}
            />
          </div>

          <div>
            <label style={labelStyle}>Notes (optionnel)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Remarques…"
              rows={2}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          <button
            type="submit" disabled={saving}
            style={{
              marginTop: 4, width: "100%",
              background: saving ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "#fff", border: "none", borderRadius: 10,
              padding: "11px 0", fontWeight: 700, fontSize: 14,
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Save style={{ width: 15, height: 15 }} />
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Objective Modal ──────────────────────────────────────────
const OBJ_CATS = [
  { key: "target_agence"    as const, label: "Agence",    color: CAT_COLORS.agence    },
  { key: "target_coaching"  as const, label: "Coaching",  color: CAT_COLORS.coaching  },
  { key: "target_formation" as const, label: "Formation", color: CAT_COLORS.formation },
  { key: "target_casino"    as const, label: "Casino",    color: CAT_COLORS.casino    },
];

function ObjectiveModal({
  objective, onSave, onClose,
}: {
  objective: MonthlyObjective;
  onSave: (obj: MonthlyObjective) => Promise<void>;
  onClose: () => void;
}) {
  const [cats, setCats] = useState({
    target_agence:    objective.target_agence    ?? 0,
    target_coaching:  objective.target_coaching  ?? 0,
    target_formation: objective.target_formation ?? 0,
    target_casino:    objective.target_casino    ?? 0,
  });
  const [saving, setSaving] = useState(false);

  // Total auto-calculated from categories
  const total = cats.target_agence + cats.target_coaching + cats.target_formation + cats.target_casino;

  // Distribute total equally across 4 categories
  const distributeEqual = (t: number) => {
    const each = Math.round(t / 4);
    setCats({ target_agence: each, target_coaching: each, target_formation: each, target_casino: each });
  };

  const inputStyle: React.CSSProperties = {
    display: "block", width: "100%", marginTop: 4,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(139,92,246,0.25)",
    borderRadius: 8, padding: "9px 12px",
    color: "rgba(255,255,255,0.9)", fontSize: 15, fontWeight: 600, outline: "none",
  };

  const handleSave = async () => {
    setSaving(true);
    const obj: MonthlyObjective = { ...objective, ...cats, target: total };
    try { await onSave(obj); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0d0b1a", border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: 20, padding: "20px 18px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 0 60px rgba(139,92,246,0.2)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: 16 }}>Objectif du mois</h2>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4, background: "none", border: "none" }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Total auto-sum */}
        <div style={{
          background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
          borderRadius: 12, padding: "12px 14px", marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total objectif</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: "#a855f7", marginTop: 2 }}>
              {total.toLocaleString("fr-FR")} €
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Auto-calculé</p>
            {/* Quick distribute buttons */}
            {[5000, 10000, 15000, 20000].map(v => (
              <button
                key={v} type="button"
                onClick={() => distributeEqual(v)}
                style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                  background: total === v ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.05)",
                  border: total === v ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  color: total === v ? "#c084fc" : "rgba(255,255,255,0.45)",
                  cursor: "pointer",
                }}
              >
                {(v / 1000)}k
              </button>
            ))}
          </div>
        </div>

        {/* Category fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {OBJ_CATS.map(({ key, label, color }) => {
            const pct = total > 0 ? Math.round((cats[key] / total) * 100) : 0;
            return (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {label}
                  </label>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{pct}%</span>
                </div>
                <input
                  type="number" step="100" min="0"
                  value={cats[key] || ""}
                  placeholder="0"
                  onChange={e => setCats(c => ({ ...c, [key]: parseFloat(e.target.value) || 0 }))}
                  style={{ ...inputStyle, borderColor: `${color}44` }}
                />
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSave} disabled={saving}
          style={{
            marginTop: 18, width: "100%",
            background: saving ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "12px 0", fontWeight: 700, fontSize: 14,
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Save style={{ width: 15, height: 15 }} />
          {saving ? "Enregistrement…" : "Enregistrer l'objectif"}
        </button>
      </div>
    </div>
  );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { dataKey: string; color: string; value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,5,25,0.95)",
      border: "1px solid rgba(139,92,246,0.3)",
      borderRadius: 10, padding: "10px 14px",
      fontSize: 12, color: "rgba(255,255,255,0.9)",
    }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: "rgba(255,255,255,0.6)" }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {p.value.toLocaleString("fr-FR")} €
        </p>
      ))}
    </div>
  );
}

// ─── Month label formatter ────────────────────────────────────
function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

// ─── Entry Row ────────────────────────────────────────────────
function EntryRow({
  entry, onEdit, onDelete,
}: {
  entry: FinanceEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const statusCfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.recu;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 10px", borderRadius: 12,
        background: hovered ? "rgba(139,92,246,0.07)" : "rgba(255,255,255,0.02)",
        border: "1px solid",
        borderColor: hovered ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
        transition: "all 0.15s ease",
      }}
    >
      {/* Category dot */}
      <span style={{
        width: 9, height: 9, borderRadius: "50%",
        background: CAT_COLORS[entry.category], flexShrink: 0,
      }} />

      {/* Label + meta — clickable zone */}
      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={onEdit}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {entry.label}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
            background: `${CAT_COLORS[entry.category]}18`, color: CAT_COLORS[entry.category],
          }}>
            {CAT_LABELS[entry.category]}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
            background: statusCfg.bg, color: statusCfg.color,
          }}>
            {statusCfg.label}
          </span>
          {entry.client_name && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
              background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)",
            }}>
              👤 {entry.client_name}
            </span>
          )}
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>
            {new Date(entry.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </span>
        </div>
      </div>

      {/* Right side — amount + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: TYPE_COLORS[entry.type] }}>
          {entry.type === "entree" ? "+" : "−"}
          {entry.amount.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €
        </span>
        {/* Edit */}
        <button
          onClick={onEdit}
          style={{
            background: "rgba(139,92,246,0.1)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: 7, padding: "5px 7px",
            cursor: "pointer", display: "flex", alignItems: "center",
            opacity: hovered ? 1 : 0.4,
            transition: "opacity 0.15s",
          }}
        >
          <Pencil style={{ width: 12, height: 12, color: "#a855f7" }} />
        </button>
        {/* Delete */}
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 7, padding: "5px 7px",
            cursor: "pointer", display: "flex", alignItems: "center",
            opacity: hovered ? 1 : 0.35,
            transition: "opacity 0.15s",
          }}
        >
          <Trash2 style={{ width: 12, height: 12, color: "#ef4444" }} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function FinancesPage() {
  const { hidden } = usePrivacy();
  const [entries,            setEntries]            = useState<FinanceEntry[]>([]);
  const [objective,          setObjective]          = useState<MonthlyObjective>(DEFAULT_OBJECTIVE);
  const [loading,            setLoading]            = useState(true);
  const [selectedMonth,      setSelectedMonth]      = useState("2026-03");
  const [filterType,         setFilterType]         = useState<"all" | FinanceType>("all");
  const [filterCategory,     setFilterCategory]     = useState<"all" | FinanceCategory>("all");
  const [filterStatus,       setFilterStatus]       = useState<"all" | string>("all");
  const [showAddModal,       setShowAddModal]       = useState(false);
  const [editingEntry,       setEditingEntry]       = useState<FinanceEntry | null>(null);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);

  // ── Load on mount / month change ─────────────────────────
  useEffect(() => {
    setLoading(true);
    Promise.all([loadEntries(), loadObjective(selectedMonth)])
      .then(async ([ents, obj]) => {
        if (ents.length > 0) {
          setEntries(ents);
        } else {
          // First load: persist seed data to Supabase so all future loads are consistent
          try {
            const saved = await Promise.all(SEED_ENTRIES.map(e => saveEntry(e)));
            const valid = saved.filter((e): e is FinanceEntry => e !== null && !!e.id);
            if (valid.length > 0) {
              setEntries(valid);
            } else {
              // Table not created yet → show locally (won't persist)
              setEntries(SEED_ENTRIES.map((e, i) => ({ ...e, id: `seed_${i}` })));
            }
          } catch {
            setEntries(SEED_ENTRIES.map((e, i) => ({ ...e, id: `seed_${i}` })));
          }
        }
        if (obj) setObjective(obj);
        else {
          const defaultObj = { ...DEFAULT_OBJECTIVE, month: selectedMonth };
          setObjective(defaultObj);
          saveObjective(defaultObj).catch(() => {}); // persist default objective
        }
      })
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  // ── Computed ──────────────────────────────────────────────
  const monthEntries = useMemo(
    () => entries.filter(e => e?.id && e.date?.startsWith(selectedMonth)),
    [entries, selectedMonth]
  );

  const totalEntrees = useMemo(
    () => monthEntries.filter(e => e.type === "entree" && e.status === "recu").reduce((s, e) => s + e.amount, 0),
    [monthEntries]
  );
  const totalDepenses = useMemo(
    () => monthEntries.filter(e => e.type === "depense" && e.status === "recu").reduce((s, e) => s + e.amount, 0),
    [monthEntries]
  );
  const totalInvest = useMemo(
    () => monthEntries.filter(e => e.type === "investissement" && e.status === "recu").reduce((s, e) => s + e.amount, 0),
    [monthEntries]
  );
  const netMois = totalEntrees - totalDepenses - totalInvest;

  const catBreakdown = useMemo(() => {
    const cats: FinanceCategory[] = ["agence", "coaching", "formation", "casino", "autre"];
    return cats
      .map(cat => ({
        cat,
        amount: monthEntries
          .filter(e => e.category === cat && e.type === "entree" && e.status === "recu")
          .reduce((s, e) => s + e.amount, 0),
      }))
      .filter(c => c.amount > 0);
  }, [monthEntries]);

  const chartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      // Exclude cumulative summary seeds from the monthly chart
      const mEnts = entries.filter(e => e.date?.startsWith(key) && !e.label?.toLowerCase().includes("cumul"));
      months.push({
        month: label,
        "Entrées":         mEnts.filter(e => e.type === "entree"         && e.status === "recu").reduce((s, e) => s + e.amount, 0),
        "Dépenses":        mEnts.filter(e => e.type === "depense"        && e.status === "recu").reduce((s, e) => s + e.amount, 0),
        "Investissements": mEnts.filter(e => e.type === "investissement" && e.status === "recu").reduce((s, e) => s + e.amount, 0),
      });
    }
    return months;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter(e => e?.id && e.date?.startsWith(selectedMonth))
      .filter(e => filterType     === "all" || e.type     === filterType)
      .filter(e => filterCategory === "all" || e.category === filterCategory)
      .filter(e => filterStatus   === "all" || e.status   === filterStatus);
  }, [entries, selectedMonth, filterType, filterCategory, filterStatus]);

  // ── Handlers ─────────────────────────────────────────────
  const handleSaveEntry = async (data: EntryFormData) => {
    const payload = {
      label:       data.label.trim(),
      amount:      parseFloat(data.amount),
      type:        data.type,
      category:    data.category,
      date:        data.date,
      status:      data.status,
      notes:       data.notes.trim() || undefined,
      client_name: data.client_name?.trim() || undefined,
    };
    if (editingEntry) {
      try { await updateEntry(editingEntry.id, payload); } catch { /* seed/network → keep local update */ }
      setEntries(prev => prev.map(e => e.id === editingEntry.id ? { ...e, ...payload } : e));
      setEditingEntry(null);
    } else {
      let newEntry: FinanceEntry;
      try {
        const saved = await saveEntry(payload);
        // saveEntry returns null if table missing/error — use local fallback
        newEntry = saved ?? { ...payload, id: `local_${Date.now()}` };
      } catch {
        newEntry = { ...payload, id: `local_${Date.now()}` };
      }
      setEntries(prev => [newEntry, ...prev]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette entrée ?")) return;
    try { await deleteEntry(id); } catch { /* seed/network */ }
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleSaveObjective = async (obj: MonthlyObjective) => {
    try { await saveObjective(obj); } catch { /* ignore */ }
    setObjective(obj);
  };

  const openAdd = () => { setEditingEntry(null); setShowAddModal(true); };

  // ─────────────────────────────────────────────────────────
  return (
    <div
      className="space-y-4 lg:space-y-6 max-w-6xl mx-auto"
      style={{ filter: hidden ? "blur(10px)" : "none", transition: "filter 0.25s ease", userSelect: hidden ? "none" : "auto" }}
    >
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ color: "rgba(255,255,255,0.9)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em" }}>Finances</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>
            Revenus · dépenses · objectifs
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{
            display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            border: "none", borderRadius: 12, padding: "10px 16px",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
          }}
        >
          <Plus style={{ width: 15, height: 15 }} />
          <span>Ajouter</span>
        </button>
      </div>

      {/* ── SECTION 1: Objectif du mois ── */}
      <div style={cardGlow}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Target style={{ width: 18, height: 18, color: "#a855f7" }} />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: 15 }}>
                Objectif — {monthLabel(selectedMonth)}
              </p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 1 }}>
                Revenus reçus vs objectif mensuel
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowObjectiveModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
              background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)",
              borderRadius: 8, padding: "7px 11px",
              color: "#a855f7", fontSize: 12, fontWeight: 600, cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Pencil style={{ width: 12, height: 12 }} />
            <span className="hidden sm:inline">Modifier l'objectif</span>
            <span className="sm:hidden">Modifier</span>
          </button>
        </div>

        {/* Big number */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em" }}>
            {loading ? "—" : <AnimatedNum value={totalEntrees} />} €
          </span>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 15 }}>
            / {objective.target.toLocaleString("fr-FR")} €
          </span>
        </div>

        {/* Main progress bar */}
        <ProgressBar value={totalEntrees} max={objective.target} color="linear-gradient(90deg, #7c3aed, #a855f7)" height={8} />

        {/* Category progress bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 12, marginTop: 16 }}>
          {(
            [
              { key: "agence"    as FinanceCategory, target: objective.target_agence    },
              { key: "coaching"  as FinanceCategory, target: objective.target_coaching  },
              { key: "formation" as FinanceCategory, target: objective.target_formation },
              { key: "casino"    as FinanceCategory, target: objective.target_casino    },
            ] as const
          ).map(({ key, target }) => {
            const val = monthEntries
              .filter(e => e.category === key && e.type === "entree" && e.status === "recu")
              .reduce((s, e) => s + e.amount, 0);
            const pct = target > 0 ? Math.round((val / target) * 100) : 0;
            return (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: CAT_COLORS[key] }}>{CAT_LABELS[key]}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{pct}%</span>
                </div>
                <ProgressBar value={val} max={target} color={CAT_COLORS[key]} height={4} />
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
                  {val.toLocaleString("fr-FR")} / {target.toLocaleString("fr-FR")} €
                </p>
              </div>
            );
          })}
        </div>

        {/* Net */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 6 }}>
          {netMois >= 0
            ? <TrendingUp style={{ width: 14, height: 14, color: "#22c55e" }} />
            : <TrendingDown style={{ width: 14, height: 14, color: "#ef4444" }} />
          }
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Net du mois :</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: netMois >= 0 ? "#22c55e" : "#ef4444" }}>
            {netMois >= 0 ? "+" : ""}{netMois.toLocaleString("fr-FR")} €
          </span>
        </div>
      </div>

      {/* ── SECTION 2: KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* Entrées */}
        <div style={{ ...cardGlow, borderColor: "#22c55e22" }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#22c55e18", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp style={{ width: 15, height: 15, color: "#22c55e" }} />
            </div>
          </div>
          <p style={{ fontSize: 20, fontWeight: 800, color: "rgba(255,255,255,0.9)", marginBottom: 2 }}>
            {loading ? "—" : <><AnimatedNum value={totalEntrees} /> €</>}
          </p>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Entrées</p>
          <p style={{ fontSize: 10, marginTop: 2, color: "rgba(255,255,255,0.28)" }}>
            {monthEntries.filter(e => e.type === "entree" && e.status === "recu").length} txn
          </p>
        </div>

        {/* Dépenses */}
        <div style={{ ...cardGlow, borderColor: "#ef444422" }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#ef444418", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingDown style={{ width: 15, height: 15, color: "#ef4444" }} />
            </div>
          </div>
          <p style={{ fontSize: 20, fontWeight: 800, color: "rgba(255,255,255,0.9)", marginBottom: 2 }}>
            {loading ? "—" : <><AnimatedNum value={totalDepenses} /> €</>}
          </p>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Dépenses</p>
          <p style={{ fontSize: 10, marginTop: 2, color: "rgba(255,255,255,0.28)" }}>
            {monthEntries.filter(e => e.type === "depense" && e.status === "recu").length} txn
          </p>
        </div>

        {/* Investissements */}
        <div style={{ ...cardGlow, borderColor: "#f59e0b22" }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#f59e0b18", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign style={{ width: 15, height: 15, color: "#f59e0b" }} />
            </div>
          </div>
          <p style={{ fontSize: 20, fontWeight: 800, color: "rgba(255,255,255,0.9)", marginBottom: 2 }}>
            {loading ? "—" : <><AnimatedNum value={totalInvest} /> €</>}
          </p>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Invest.</p>
          <p style={{ fontSize: 10, marginTop: 2, color: "rgba(255,255,255,0.28)" }}>
            {monthEntries.filter(e => e.type === "investissement" && e.status === "recu").length} txn
          </p>
        </div>

        {/* Net */}
        <div style={{ ...cardGlow, borderColor: netMois >= 0 ? "#a855f722" : "#ef444422" }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: netMois >= 0 ? "#a855f718" : "#ef444418", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {netMois >= 0
                ? <TrendingUp style={{ width: 15, height: 15, color: "#a855f7" }} />
                : <TrendingDown style={{ width: 15, height: 15, color: "#ef4444" }} />
              }
            </div>
          </div>
          <p style={{ fontSize: 20, fontWeight: 800, color: netMois >= 0 ? "#a855f7" : "#ef4444", marginBottom: 2 }}>
            {loading ? "—" : <>{netMois >= 0 ? "+" : ""}<AnimatedNum value={Math.abs(netMois)} /> €</>}
          </p>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Net</p>
          <p style={{ fontSize: 10, marginTop: 2, color: "rgba(255,255,255,0.28)" }}>Entrées − Charges</p>
        </div>
      </div>

      {/* ── SECTION 3: Chart + Category breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Bar Chart */}
        <div className="lg:col-span-3" style={cardGlow}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
              Évolution · 6 derniers mois
            </h2>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { color: "#22c55e", label: "Entrées" },
                { color: "#ef4444", label: "Dépenses" },
                { color: "#f59e0b", label: "Invest." },
              ].map(({ color, label }) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="Entrées"         fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Dépenses"        fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Investissements" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="lg:col-span-2" style={cardGlow}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>
            Répartition des entrées
          </h2>
          {catBreakdown.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, textAlign: "center", paddingTop: 40 }}>
              Aucune entrée ce mois
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {catBreakdown.map(({ cat, amount }) => {
                const pct = totalEntrees > 0 ? Math.round((amount / totalEntrees) * 100) : 0;
                return (
                  <div key={cat}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: CAT_COLORS[cat], display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
                          {CAT_LABELS[cat]}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                          {amount.toLocaleString("fr-FR")} €
                        </span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", minWidth: 28, textAlign: "right" }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <ProgressBar value={amount} max={totalEntrees} color={CAT_COLORS[cat]} height={4} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 4: Entry list ── */}
      <div style={cardGlow}>
        {/* Filter bar header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {/* Row 1: Title + month picker + add */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
              Transactions
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "1px 7px", borderRadius: 20 }}>
                {filteredEntries.length}
              </span>
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(139,92,246,0.2)",
                  borderRadius: 8, padding: "6px 10px",
                  color: "rgba(255,255,255,0.8)", fontSize: 12, outline: "none", cursor: "pointer",
                  minWidth: 0,
                }}
              />
            </div>
          </div>

          {/* Row 2: Scrollable filter pills */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
            {/* Type group */}
            <FilterPill
              value={filterType}
              onChange={v => setFilterType(v)}
              options={[
                { key: "all",            label: "Tout" },
                { key: "entree",         label: "Entrée" },
                { key: "depense",        label: "Dépense" },
                { key: "investissement", label: "Invest." },
              ]}
            />
            <div style={{ width: 1, background: "rgba(255,255,255,0.08)", flexShrink: 0, margin: "4px 2px" }} />
            {/* Category group */}
            <FilterPill
              value={filterCategory}
              onChange={v => setFilterCategory(v)}
              options={[
                { key: "all",       label: "Cat." },
                { key: "agence",    label: "Agence" },
                { key: "coaching",  label: "Coaching" },
                { key: "formation", label: "Formation" },
                { key: "casino",    label: "Casino" },
                { key: "autre",     label: "Autre" },
              ]}
            />
            <div style={{ width: 1, background: "rgba(255,255,255,0.08)", flexShrink: 0, margin: "4px 2px" }} />
            {/* Status group */}
            <FilterPill
              value={filterStatus}
              onChange={v => setFilterStatus(v)}
              options={[
                { key: "all",        label: "Statut" },
                { key: "recu",       label: "Reçu" },
                { key: "en_attente", label: "Attente" },
                { key: "prevu",      label: "Prévu" },
              ]}
            />
          </div>
        </div>

        {/* List */}
        {filteredEntries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 600 }}>Aucune transaction ce mois</p>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 4, marginBottom: 16 }}>
              Modifiez les filtres ou ajoutez une entrée
            </p>
            <button
              onClick={openAdd}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                border: "none", borderRadius: 8, padding: "8px 16px",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              <Plus style={{ width: 14, height: 14 }} />
              Ajouter une entrée
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredEntries.map(entry => (
              <EntryRow
                key={entry.id}
                entry={entry}
                onEdit={() => { setEditingEntry(entry); setShowAddModal(true); }}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAddModal && (
        <EntryModal
          initial={editingEntry}
          onSave={handleSaveEntry}
          onClose={() => { setShowAddModal(false); setEditingEntry(null); }}
        />
      )}
      {showObjectiveModal && (
        <ObjectiveModal
          objective={objective}
          onSave={handleSaveObjective}
          onClose={() => setShowObjectiveModal(false)}
        />
      )}
    </div>
  );
}

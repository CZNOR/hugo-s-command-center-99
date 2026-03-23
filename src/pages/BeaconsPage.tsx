import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Save, RefreshCw, Link2 } from "lucide-react";

// ─── Supabase inline client (même pattern que ContentPage) ───
const supabase = {
  functions: {
    invoke: async (name: string, opts?: { body?: object }) => {
      const r = await fetch(`https://blrafgywziqparlbbznv.supabase.co/functions/v1/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opts?.body ?? {}),
      });
      return { data: await r.json(), error: r.ok ? null : new Error(r.statusText) };
    },
  },
};

// ─── Types ───────────────────────────────────────────────────
interface WeekEntry {
  id: string;
  week: string; // "2024-W04"
  label: string; // "Sem. 4 Jan"
  instagram: number;
  tiktok: number;
  youtube: number;
  total: number;
}

// ─── Helpers ─────────────────────────────────────────────────
function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const year = d.getFullYear();
  const week = Math.ceil(((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function getWeekLabel(weekKey: string): string {
  const [year, w] = weekKey.split("-W");
  const date = new Date(parseInt(year), 0, 1 + (parseInt(w) - 1) * 7);
  return `S${w} · ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
}

const SOURCES = [
  { key: "instagram" as const, label: "Instagram", color: "#e1306c", emoji: "📸" },
  { key: "tiktok" as const, label: "TikTok", color: "#69c9d0", emoji: "🎵" },
  { key: "youtube" as const, label: "YouTube", color: "#ff0000", emoji: "▶️" },
];

// ─── Seed mock history (8 semaines) ──────────────────────────
function seedMockHistory(): WeekEntry[] {
  const now = new Date();
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const week = getWeekKey(d);
    const insta = Math.floor(60 + Math.random() * 60);
    const tiktok = Math.floor(20 + Math.random() * 40);
    const yt = Math.floor(10 + Math.random() * 20);
    return {
      id: week,
      week,
      label: getWeekLabel(week),
      instagram: insta,
      tiktok,
      youtube: yt,
      total: insta + tiktok + yt,
    };
  }).reverse();
}

// ─── Styles ──────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(139,92,246,0.15)",
  borderRadius: "16px",
};

const cardGlow: React.CSSProperties = {
  ...card,
  boxShadow: "0 0 40px rgba(139,92,246,0.10)",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(139,92,246,0.2)",
  borderRadius: "10px",
  color: "rgba(255,255,255,0.9)",
  padding: "8px 12px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

// ─── Main page ────────────────────────────────────────────────
export default function BeaconsPage() {
  const [history, setHistory] = useState<WeekEntry[]>([]);
  const [form, setForm] = useState({ instagram: "", tiktok: "", youtube: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load from localStorage (with Supabase sync attempt)
  useEffect(() => {
    const stored = localStorage.getItem("beacons_history");
    if (stored) {
      setHistory(JSON.parse(stored));
    } else {
      const mock = seedMockHistory();
      setHistory(mock);
      localStorage.setItem("beacons_history", JSON.stringify(mock));
    }
  }, []);

  const currentWeek = getWeekKey(new Date());
  const currentEntry = history.find((h) => h.week === currentWeek);

  useEffect(() => {
    if (currentEntry) {
      setForm({
        instagram: String(currentEntry.instagram),
        tiktok: String(currentEntry.tiktok),
        youtube: String(currentEntry.youtube),
      });
    }
  }, [currentEntry]);

  const handleSave = async () => {
    setSaving(true);
    const insta = parseInt(form.instagram) || 0;
    const tiktok = parseInt(form.tiktok) || 0;
    const yt = parseInt(form.youtube) || 0;
    const entry: WeekEntry = {
      id: currentWeek,
      week: currentWeek,
      label: getWeekLabel(currentWeek),
      instagram: insta,
      tiktok,
      youtube: yt,
      total: insta + tiktok + yt,
    };

    const updated = history.filter((h) => h.week !== currentWeek);
    updated.push(entry);
    updated.sort((a, b) => a.week.localeCompare(b.week));
    const last8 = updated.slice(-8);

    setHistory(last8);
    localStorage.setItem("beacons_history", JSON.stringify(last8));

    // Attempt Supabase sync (fire and forget)
    try {
      await supabase.functions.invoke("beacons-data", { body: { action: "upsert", entry } });
    } catch {
      // Silently fail — local storage is source of truth
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Donut data (latest entry)
  const latest = history[history.length - 1];
  const donutData = latest
    ? SOURCES.map((s) => ({ name: s.label, value: latest[s.key], color: s.color })).filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
            Beacons
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Clics par source · saisie manuelle hebdomadaire
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
          style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)", color: "#c084fc" }}
        >
          <Link2 className="w-3.5 h-3.5" />
          Sync Supabase
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Form */}
        <div className="p-5 space-y-5" style={cardGlow}>
          <h2 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
            Saisie semaine en cours
          </h2>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {getWeekLabel(currentWeek)}
          </p>

          <div className="space-y-4">
            {SOURCES.map((s) => (
              <div key={s.key}>
                <label
                  className="text-xs font-medium mb-1.5 flex items-center gap-1.5"
                  style={{ color: "rgba(255,255,255,0.55)", display: "flex" }}
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={form[s.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [s.key]: e.target.value }))}
                  placeholder="0"
                  style={{ ...inputStyle, borderColor: `${s.color}33` }}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = s.color + "66"; }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = s.color + "33"; }}
                />
              </div>
            ))}
          </div>

          <div className="pt-1">
            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
              Total :{" "}
              <span style={{ color: "#a855f7", fontWeight: 600 }}>
                {(parseInt(form.instagram) || 0) + (parseInt(form.tiktok) || 0) + (parseInt(form.youtube) || 0)} clics
              </span>
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: saved
                  ? "rgba(34,197,94,0.2)"
                  : "linear-gradient(135deg, #7c3aed, #a855f7)",
                boxShadow: saved ? "none" : "0 0 20px rgba(139,92,246,0.4)",
                color: "white",
                border: saved ? "1px solid rgba(34,197,94,0.3)" : "none",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Sauvegarde...</>
              ) : saved ? (
                <>✓ Sauvegardé</>
              ) : (
                <><Save className="w-4 h-4" /> Enregistrer</>
              )}
            </button>
          </div>
        </div>

        {/* Donut chart */}
        <div className="p-5 flex flex-col" style={cardGlow}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
            Répartition — semaine actuelle
          </h2>
          {latest && (
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
              {latest.total} clics au total
            </p>
          )}
          <div className="flex-1 flex items-center justify-center">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,5,25,0.95)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      borderRadius: "10px",
                      color: "rgba(255,255,255,0.9)",
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                Aucune donnée cette semaine
              </p>
            )}
          </div>
        </div>

        {/* Source totals */}
        <div className="p-5 space-y-3" style={cardGlow}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
            Totaux 8 semaines
          </h2>
          {SOURCES.map((s) => {
            const total = history.reduce((sum, h) => sum + h[s.key], 0);
            const max = Math.max(...SOURCES.map((src) => history.reduce((sum, h) => sum + h[src.key], 0)));
            const pct = max > 0 ? (total / max) * 100 : 0;
            return (
              <div key={s.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                    <span>{s.emoji}</span> {s.label}
                  </span>
                  <span style={{ color: s.color, fontWeight: 600 }}>{total}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: s.color, opacity: 0.7 }}
                  />
                </div>
              </div>
            );
          })}

          <div
            className="mt-4 pt-4 space-y-3"
            style={{ borderTop: "1px solid rgba(139,92,246,0.12)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
              Meilleure semaine
            </p>
            {(() => {
              if (!history.length) return null;
              const best = [...history].sort((a, b) => b.total - a.total)[0];
              return (
                <div className="p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{best.label}</p>
                  <p className="text-lg font-bold mt-0.5" style={{ color: "#a855f7" }}>{best.total} clics</p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="p-5" style={cardGlow}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
          Historique · 8 semaines
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(139,92,246,0.12)" }}>
                <th className="pb-3 text-left text-xs font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Semaine</th>
                {SOURCES.map((s) => (
                  <th key={s.key} className="pb-3 text-right text-xs font-semibold" style={{ color: s.color }}>
                    {s.emoji} {s.label}
                  </th>
                ))}
                <th className="pb-3 text-right text-xs font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Total</th>
              </tr>
            </thead>
            <tbody className="space-y-1">
              {[...history].reverse().map((row) => (
                <tr
                  key={row.week}
                  style={{ borderBottom: "1px solid rgba(139,92,246,0.06)" }}
                >
                  <td className="py-2.5" style={{ color: row.week === currentWeek ? "#a855f7" : "rgba(255,255,255,0.7)" }}>
                    {row.label}
                    {row.week === currentWeek && (
                      <span
                        className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}
                      >
                        cette sem.
                      </span>
                    )}
                  </td>
                  {SOURCES.map((s) => (
                    <td key={s.key} className="py-2.5 text-right font-mono" style={{ color: "rgba(255,255,255,0.65)" }}>
                      {row[s.key]}
                    </td>
                  ))}
                  <td className="py-2.5 text-right font-bold font-mono" style={{ color: "rgba(255,255,255,0.9)" }}>
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────
export interface CoachingStats {
  // Coaching HT
  caTotal:      number;   // CA encaissé coaching HT €
  clients:      number;   // clients signés
  bookings:     number;   // bookings Cal.com
  tauxClosing:  number;   // taux de closing %
  dmSemaine:    number;   // DMs reçus / semaine
  // Formation
  formationPrix:   number; // prix formation €
  formationVentes: number; // ventes formation
  // Made Académie (historique)
  academieCA:      number; // CA total académie € (20 premium × 97€/mois)
  academieMembres: number; // membres total
  academiePayants: number; // membres payants (premium)
  academieLives:   number; // lives organisés
  // Agence (prestations de services)
  agenceCA:        number; // CA total agence €
}

export const COACHING_DEFAULTS: CoachingStats = {
  caTotal:         25_483,
  clients:         9,      // coaching HT uniquement
  bookings:        165,    // total Cal.com
  tauxClosing:     17.6,   // 29 closés (9 HT + 20 premium académie) / 165 bookings
  dmSemaine:       47,
  formationPrix:   990,
  formationVentes: 0,
  academieCA:      8_730,  // 20 premium × 97€ × mois (calculé depuis CSV Circle.so)
  academieMembres: 236,
  academiePayants: 20,
  academieLives:   14,
  agenceCA:        22_636, // CA agence (CSV Notion, Hugo + CM non-assignés — 36 ventes)
};

// ─── Supabase ─────────────────────────────────────────────────
const SB_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SNAPSHOT_KEY = "__coaching_stats_v1__";

async function sbFetch<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey:        SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      ...(opts?.headers ?? {}),
    },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : ([] as unknown as T);
}

// ─── Load ─────────────────────────────────────────────────────
async function loadCoachingStats(): Promise<CoachingStats | null> {
  try {
    const rows = await sbFetch<any[]>(
      `task_meta?notion_id=eq.${SNAPSHOT_KEY}&limit=1`
    );
    if (rows?.[0]?.completed_at) {
      return { ...COACHING_DEFAULTS, ...JSON.parse(rows[0].completed_at) } as CoachingStats;
    }
  } catch {}
  return null;
}

// ─── Save ─────────────────────────────────────────────────────
export async function saveCoachingStats(stats: CoachingStats): Promise<void> {
  await sbFetch("task_meta", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      notion_id:    SNAPSHOT_KEY,
      business:     "__coaching_stats__",
      priority:     "normale",
      time:         null,
      completed_at: JSON.stringify(stats),
      updated_at:   new Date().toISOString(),
    }),
  });
}

// ─── Hook ─────────────────────────────────────────────────────
export function useCoachingStats() {
  const [stats,   setStats]   = useState<CoachingStats>(COACHING_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadCoachingStats();
      if (data) setStats(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (updated: CoachingStats) => {
    await saveCoachingStats(updated);
    setStats(updated);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { stats, loading, save, reload: load };
}

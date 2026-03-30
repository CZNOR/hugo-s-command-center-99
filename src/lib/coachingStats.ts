import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────
export interface MonthEntry {
  m: string;        // label "Jan 25"
  coaching: number; // CA coaching HT encaissé ce mois
  academie: number; // CA académie ce mois
  agence:   number; // CA agence (part Hugo) ce mois
}

export interface CoachingStats {
  // Coaching HT
  caTotal:      number;   // CA encaissé coaching HT €
  clients:      number;   // clients signés
  bookings:     number;   // bookings Cal.com
  tauxClosing:  number;   // taux de closing %
  dmSemaine:    number;   // DMs reçus / semaine
  // Formation
  formationPrix:   number;
  formationVentes: number;
  // Made Académie
  academieCA:      number;
  academieMembres: number;
  academiePayants: number;
  academieLives:   number;
  // Agence
  agenceCA:        number; // CA total agence tous associés
  agenceNetHugo:   number; // part Hugo
  // Données mensuelles (graphique)
  monthlyData: MonthEntry[];
}

// ─── Données mensuelles — sources exactes ────────────────────
// Coaching : 9 clients avec dates exactes de signature
//   Aoû 25 : Ayoub 2490 + Amèle 2397 + Yassine 2397 = 7 284
//   Sep 25 : Shirlie 2200 + Aristote 3000 + Thomas 3000 = 8 200
//   Oct 25 : Kryz Emile 2999
//   Nov 25 : Flavio 3500
//   Déc 25 : Lenny 3500    → total 25 483 ✓
// Académie : Circle.so CSV — Oct 25 → Fév 26
// Agence   : Notion CSV + retainer Senek Jan-Mar 26
export const DEFAULT_MONTHLY: MonthEntry[] = [
  { m: "Jan 25", coaching: 0,    academie: 0,    agence: 2200 },
  { m: "Fév 25", coaching: 0,    academie: 0,    agence: 1000 },
  { m: "Mar 25", coaching: 0,    academie: 0,    agence: 1200 },
  { m: "Avr 25", coaching: 0,    academie: 0,    agence: 500  },
  { m: "Mai 25", coaching: 0,    academie: 0,    agence: 1350 },
  { m: "Jun 25", coaching: 0,    academie: 0,    agence: 4690 },
  { m: "Jul 25", coaching: 0,    academie: 0,    agence: 3385 },
  { m: "Aoû 25", coaching: 7284, academie: 0,    agence: 1475 },
  { m: "Sep 25", coaching: 8200, academie: 0,    agence: 0    },
  { m: "Oct 25", coaching: 2999, academie: 1940, agence: 1650 },
  { m: "Nov 25", coaching: 3500, academie: 1940, agence: 2796 },
  { m: "Déc 25", coaching: 3500, academie: 1940, agence: 1000 },
  { m: "Jan 26", coaching: 0,    academie: 0,    agence: 0    },
  { m: "Fév 26", coaching: 0,    academie: 0,    agence: 1700 },
  { m: "Mar 26", coaching: 0,    academie: 0,    agence: 1700 },
];

export const COACHING_DEFAULTS: CoachingStats = {
  caTotal:         25_483,
  clients:         9,
  bookings:        165,
  tauxClosing:     17.6,
  dmSemaine:       47,
  formationPrix:   990,
  formationVentes: 0,
  academieCA:      5_820,
  academieMembres: 236,
  academiePayants: 16,
  academieLives:   14,
  agenceCA:        45_623,
  agenceNetHugo:   26_346,
  monthlyData:     DEFAULT_MONTHLY,
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

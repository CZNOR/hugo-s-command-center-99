import { useState, useEffect, useCallback } from "react";
import {
  fetchInstagramProfile,
  fetchTikTokProfile,
  type SocialProfile,
} from "@/lib/apify";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ── Supabase REST helpers ─────────────────────────────────────
async function sbFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
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
  if (!res.ok) throw new Error(`Supabase error: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : ([] as unknown as T);
}

async function getCached(platform: string): Promise<SocialProfile | null> {
  const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();
  const rows = await sbFetch<any[]>(
    `social_stats?platform=eq.${platform}&fetched_at=gte.${encodeURIComponent(cutoff)}&order=fetched_at.desc&limit=1`
  );
  const row = rows?.[0];
  if (!row) return null;
  return {
    followers: row.followers ?? 0,
    following: row.following ?? 0,
    postsCount: row.posts_count ?? 0,
    avgEngagement: row.avg_engagement ?? 0,
    topPosts: row.top_posts ?? [],
  };
}

async function saveStats(
  platform: string,
  profile: SocialProfile
): Promise<void> {
  await sbFetch("social_stats", {
    method: "POST",
    body: JSON.stringify({
      platform,
      followers: profile.followers,
      following: profile.following,
      posts_count: profile.postsCount,
      avg_engagement: profile.avgEngagement,
      top_posts: profile.topPosts,
    }),
  });
}

// ── Weekly history (last 4 saved snapshots) for sparkline ─────
export interface WeeklyPoint {
  week: string;
  followers: number;
  avgEngagement: number;
  avgViews: number;
}

async function getWeeklyHistory(platform: string): Promise<WeeklyPoint[]> {
  const rows = await sbFetch<any[]>(
    `social_stats?platform=eq.${platform}&order=fetched_at.desc&limit=4`
  );
  return [...(rows ?? [])].reverse().map((row, i) => {
    const posts: any[] = row.top_posts ?? [];
    const avgViews =
      posts.length > 0
        ? Math.round(
            posts.reduce((s: number, p: any) => s + (p.views ?? 0), 0) /
              posts.length
          )
        : 0;
    return {
      week: `S${i + 1}`,
      followers: row.followers ?? 0,
      avgEngagement: Number(row.avg_engagement ?? 0),
      avgViews,
    };
  });
}

// ── Main hook ─────────────────────────────────────────────────
export interface PlatformStats extends SocialProfile {
  weeklyHistory: WeeklyPoint[];
}

export interface SocialStats {
  instagram: PlatformStats | null;
  tiktok: PlatformStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

async function loadPlatform(
  platform: "instagram" | "tiktok"
): Promise<PlatformStats> {
  let profile = await getCached(platform);
  if (!profile) {
    profile =
      platform === "instagram"
        ? await fetchInstagramProfile()
        : await fetchTikTokProfile();
    await saveStats(platform, profile);
  }
  const weeklyHistory = await getWeeklyHistory(platform);
  return { ...profile, weeklyHistory };
}

export function useSocialStats(): SocialStats {
  const [instagram, setInstagram] = useState<PlatformStats | null>(null);
  const [tiktok, setTiktok] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ig, tt] = await Promise.all([
        loadPlatform("instagram"),
        loadPlatform("tiktok"),
      ]);
      setInstagram(ig);
      setTiktok(tt);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, CACHE_TTL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return { instagram, tiktok, loading, error, lastUpdated, refresh: load };
}

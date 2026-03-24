// ── Apify REST client (browser-compatible, no Node.js deps) ────────────────
const APIFY_TOKEN = import.meta.env.VITE_APIFY_TOKEN as string;
const BASE = "https://api.apify.com/v2";

export interface SocialPost {
  id: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  date: string;
  type: string;
}

export interface SocialProfile {
  followers: number;
  following: number;
  postsCount: number;
  avgEngagement: number;
  topPosts: SocialPost[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function startRun(actorId: string, input: object): Promise<{ runId: string; datasetId: string }> {
  const slug = actorId.replace("/", "~");
  const res = await fetch(`${BASE}/acts/${slug}/runs?token=${APIFY_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Apify start run failed: ${res.status} ${await res.text()}`);
  const { data } = await res.json();
  return { runId: data.id, datasetId: data.defaultDatasetId };
}

async function waitForRun(runId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const res = await fetch(`${BASE}/actor-runs/${runId}?token=${APIFY_TOKEN}`);
    if (!res.ok) continue;
    const { data } = await res.json();
    if (data.status === "SUCCEEDED") return data.defaultDatasetId;
    if (data.status === "FAILED" || data.status === "ABORTED" || data.status === "TIMED-OUT")
      throw new Error(`Apify run ${data.status}`);
  }
  throw new Error("Apify run timed out after 4 minutes");
}

async function getDatasetItems(datasetId: string): Promise<any[]> {
  const res = await fetch(`${BASE}/datasets/${datasetId}/items?token=${APIFY_TOKEN}&limit=20`);
  if (!res.ok) throw new Error(`Apify dataset fetch failed: ${res.status}`);
  return res.json();
}

// ── Instagram ────────────────────────────────────────────────────────────────

export async function fetchInstagramProfile(): Promise<SocialProfile> {
  const { runId } = await startRun("apify/instagram-profile-scraper", {
    usernames: ["hugo.bnls"],
    resultsLimit: 10,
  });
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems(datasetId);
  const profile = items[0] as any;

  const posts: SocialPost[] = ((profile?.latestPosts ?? profile?.posts) || [])
    .slice(0, 10)
    .map((p: any) => ({
      id: p.id ?? p.shortCode ?? "",
      url: p.url ?? `https://www.instagram.com/p/${p.shortCode}/`,
      views: p.videoViewCount ?? p.videoPlayCount ?? 0,
      likes: p.likesCount ?? 0,
      comments: p.commentsCount ?? 0,
      date: p.timestamp ?? p.takenAtTimestamp ?? "",
      type: p.type ?? "Image",
    }));

  const followers = profile?.followersCount ?? 0;
  const avgEngagement =
    posts.length > 0 && followers > 0
      ? posts.reduce((acc, p) => acc + ((p.likes + p.comments) / followers) * 100, 0) /
        posts.length
      : 0;

  return {
    followers,
    following: profile?.followingCount ?? 0,
    postsCount: profile?.postsCount ?? 0,
    avgEngagement: Math.round(avgEngagement * 100) / 100,
    topPosts: posts,
  };
}

// ── TikTok ───────────────────────────────────────────────────────────────────

export async function fetchTikTokProfile(): Promise<SocialProfile> {
  const { runId } = await startRun("clockworks/free-tiktok-scraper", {
    profiles: ["hugo.bnls"],
    resultsPerPage: 10,
  });
  const datasetId = await waitForRun(runId);
  const items = await getDatasetItems(datasetId);

  const profileItem = items.find(
    (i: any) => i.followersCount !== undefined || i.stats?.followerCount !== undefined
  ) as any;
  const videoItems = items.filter((i: any) => i.webVideoUrl ?? i.videoUrl) as any[];

  const followers =
    profileItem?.followersCount ?? profileItem?.stats?.followerCount ?? 0;
  const following =
    profileItem?.followingCount ?? profileItem?.stats?.followingCount ?? 0;
  const postsCount = profileItem?.videoCount ?? videoItems.length;

  const posts: SocialPost[] = videoItems.slice(0, 10).map((v: any) => ({
    id: v.id ?? v.videoId ?? "",
    url: v.webVideoUrl ?? v.videoUrl ?? "",
    views: v.playCount ?? v.stats?.playCount ?? 0,
    likes: v.diggCount ?? v.stats?.diggCount ?? 0,
    comments: v.commentCount ?? v.stats?.commentCount ?? 0,
    date: v.createTime ? new Date(v.createTime * 1000).toISOString() : "",
    type: "Video",
  }));

  const avgEngagement =
    posts.length > 0 && followers > 0
      ? posts.reduce((acc, p) => acc + ((p.likes + p.comments) / followers) * 100, 0) /
        posts.length
      : 0;

  return {
    followers,
    following,
    postsCount,
    avgEngagement: Math.round(avgEngagement * 100) / 100,
    topPosts: posts,
  };
}

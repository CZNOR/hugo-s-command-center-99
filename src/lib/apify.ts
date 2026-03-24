import { ApifyClient } from "apify-client";

const client = new ApifyClient({
  token: import.meta.env.VITE_APIFY_TOKEN as string,
});

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

export async function fetchInstagramProfile(): Promise<SocialProfile> {
  const run = await client.actor("apify/instagram-profile-scraper").call({
    usernames: ["hugo.bnls"],
    resultsLimit: 10,
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
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
      ? posts.reduce(
          (acc, p) => acc + ((p.likes + p.comments) / followers) * 100,
          0
        ) / posts.length
      : 0;

  return {
    followers,
    following: profile?.followingCount ?? 0,
    postsCount: profile?.postsCount ?? 0,
    avgEngagement: Math.round(avgEngagement * 100) / 100,
    topPosts: posts,
  };
}

export async function fetchTikTokProfile(): Promise<SocialProfile> {
  const run = await client.actor("clockworks/free-tiktok-scraper").call({
    profiles: ["hugo.bnls"],
    resultsPerPage: 10,
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  const profileItem = items.find(
    (i: any) => i.followersCount !== undefined || i.stats?.followerCount !== undefined
  ) as any;
  const videoItems = items.filter(
    (i: any) => i.webVideoUrl ?? i.videoUrl
  ) as any[];

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
    date: v.createTime
      ? new Date(v.createTime * 1000).toISOString()
      : "",
    type: "Video",
  }));

  const avgEngagement =
    posts.length > 0 && followers > 0
      ? posts.reduce(
          (acc, p) => acc + ((p.likes + p.comments) / followers) * 100,
          0
        ) / posts.length
      : 0;

  return {
    followers,
    following,
    postsCount,
    avgEngagement: Math.round(avgEngagement * 100) / 100,
    topPosts: posts,
  };
}

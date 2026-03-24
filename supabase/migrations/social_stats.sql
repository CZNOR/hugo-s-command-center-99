CREATE TABLE social_stats (
  id          uuid        default gen_random_uuid() primary key,
  platform    text        not null,
  followers   integer,
  following   integer,
  posts_count integer,
  avg_engagement numeric,
  top_posts   jsonb,
  fetched_at  timestamptz default now()
);

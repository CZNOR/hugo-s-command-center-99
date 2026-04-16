-- Daily ritual logs — one row per day. Synced across devices so the morning
-- and evening gates stay consistent whether you open the app on your iPhone
-- or your laptop.
CREATE TABLE IF NOT EXISTS daily_rituals (
  date                 date        primary key,   -- YYYY-MM-DD in user's local tz (Bangkok)
  morning_at           timestamptz,
  top3                 jsonb,                     -- [string, string, string]
  intent               text,
  morning_energy       smallint,                  -- 1..5
  evening_at           timestamptz,
  win                  text,
  evening_energy       smallint,                  -- 1..5
  tasks_done_ids       jsonb,                     -- string[]
  tasks_deferred_ids   jsonb,                     -- string[]
  skipped              boolean     not null default false,
  updated_at           timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS daily_rituals_date_desc ON daily_rituals (date DESC);

-- Single-user personal app: allow unauthenticated read/write via the anon key.
ALTER TABLE daily_rituals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON daily_rituals;
CREATE POLICY "allow_all" ON daily_rituals FOR ALL USING (true) WITH CHECK (true);

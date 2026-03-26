-- Table to store task metadata (business, priority, time, completedAt)
-- that Notion doesn't support natively. Synced across all devices.
CREATE TABLE IF NOT EXISTS task_meta (
  notion_id    text        primary key,
  business     text        not null default 'coaching',
  priority     text        not null default 'normale',
  time         text,
  completed_at text,
  updated_at   timestamptz not null default now()
);

-- Allow public read/write (personal app, no auth needed)
ALTER TABLE task_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON task_meta FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS casino_stats (
  id            uuid        default gen_random_uuid() primary key,
  brand         text        not null default 'corgibet',
  commission    numeric     not null default 0,
  registrations integer     not null default 0,
  ctr           numeric     not null default 0,
  qftd          integer     not null default 0,
  impressions   integer     not null default 0,
  depots        integer     not null default 0,
  revshare      numeric     not null default 0,
  updated_at    timestamptz not null default now()
);

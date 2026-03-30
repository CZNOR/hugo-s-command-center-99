CREATE TABLE IF NOT EXISTS finance_entries (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  amount numeric not null,
  type text not null check (type in ('entree','depense','investissement')),
  category text not null check (category in ('agence','coaching','formation','casino','autre')),
  date date not null,
  status text default 'recu' check (status in ('recu','en_attente','prevu')),
  notes text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS monthly_objectives (
  id uuid default gen_random_uuid() primary key,
  month text not null unique,
  target numeric not null default 0,
  target_agence numeric default 0,
  target_coaching numeric default 0,
  target_formation numeric default 0,
  target_casino numeric default 0,
  created_at timestamptz default now()
);

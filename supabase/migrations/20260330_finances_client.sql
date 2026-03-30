-- Add client_name column to finance_entries (if not already present)
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS client_name text;

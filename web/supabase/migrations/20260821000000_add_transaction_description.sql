-- Expense descriptions are optional so transactions created before this
-- feature remain valid.
alter table public.transactions
  add column if not exists description text;

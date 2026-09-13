create table if not exists public.financial_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_month text not null check (cycle_month ~ '^[0-9]{4}-[0-9]{2}$'),
  next_month text not null check (next_month ~ '^[0-9]{4}-[0-9]{2}$'),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  rollover_action text check (rollover_action in ('start_fresh', 'carry_forward')),
  previous_balance numeric not null default 0,
  carried_forward_amount numeric not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cycle_month)
);

alter table public.financial_cycles enable row level security;

drop policy if exists "Users can read their own financial cycles" on public.financial_cycles;
create policy "Users can read their own financial cycles"
  on public.financial_cycles for select using (auth.uid() = user_id);

drop policy if exists "Users can create their own financial cycles" on public.financial_cycles;
create policy "Users can create their own financial cycles"
  on public.financial_cycles for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own financial cycles" on public.financial_cycles;
create policy "Users can update their own financial cycles"
  on public.financial_cycles for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own financial cycles" on public.financial_cycles;
create policy "Users can delete their own financial cycles"
  on public.financial_cycles for delete using (auth.uid() = user_id);

create index if not exists financial_cycles_user_month_idx
  on public.financial_cycles (user_id, cycle_month);

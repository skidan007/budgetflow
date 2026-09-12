create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  amount numeric not null check (amount > 0),
  currency text not null default 'NGN',
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  created_at timestamptz not null default now(),
  unique (user_id, category, currency, month)
);

alter table public.budgets enable row level security;

drop policy if exists "Users can read their own budgets" on public.budgets;
create policy "Users can read their own budgets"
  on public.budgets for select using (auth.uid() = user_id);

drop policy if exists "Users can create their own budgets" on public.budgets;
create policy "Users can create their own budgets"
  on public.budgets for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own budgets" on public.budgets;
create policy "Users can update their own budgets"
  on public.budgets for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own budgets" on public.budgets;
create policy "Users can delete their own budgets"
  on public.budgets for delete using (auth.uid() = user_id);

create index if not exists budgets_user_month_idx
  on public.budgets (user_id, month);
-- Keep goals as the canonical record. The linked production project did not
-- have this table, so create the schema expected by both clients when absent.
-- CREATE TABLE IF NOT EXISTS leaves any existing goal rows/table untouched.
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default '🎯 Goal',
  target_amount numeric not null check (target_amount > 0),
  current_amount numeric not null default 0,
  target_date date,
  currency text not null default 'NGN',
  created_at timestamptz not null default now()
);

create index if not exists goals_user_id_idx on public.goals (user_id);

grant select, insert, update, delete on public.goals to authenticated;

-- Contributions are child rows of the canonical goal record.
create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  date date not null default current_date,
  note text not null default '',
  source_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (goal_id, source_key)
);

create index if not exists goal_contributions_user_goal_date_idx
  on public.goal_contributions (user_id, goal_id, date desc);

-- Stable key for safely importing old browser-only goal rows exactly once.
alter table public.goals add column if not exists legacy_key text;
create unique index if not exists goals_user_legacy_key_unique
  on public.goals (user_id, legacy_key)
  where legacy_key is not null;

-- Replace any older goal policies with an explicit owner-only policy set.
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'goals'
  loop
    execute format('drop policy %I on public.goals', existing_policy.policyname);
  end loop;
end;
$$;

alter table public.goals enable row level security;
create policy "goal rows belong to authenticated owner"
  on public.goals for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- These existing tables are queried by user_id in both clients. Recreate an
-- owner-only policy set so legacy permissive policies cannot expose another
-- user's financial rows through PostgREST.
do $$
declare
  target_table text;
  existing_policy record;
begin
  foreach target_table in array array['transactions', 'financial_profiles']
  loop
    for existing_policy in
      select policyname
      from pg_policies
      where pg_policies.schemaname = 'public' and pg_policies.tablename = target_table
    loop
      execute format('drop policy %I on public.%I', existing_policy.policyname, target_table);
    end loop;
  end loop;
end;
$$;

alter table public.transactions enable row level security;
create policy "transaction rows belong to authenticated owner"
  on public.transactions for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.financial_profiles enable row level security;
create policy "financial profiles belong to authenticated owner"
  on public.financial_profiles for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.goal_contributions enable row level security;
drop policy if exists "goal contributions select own" on public.goal_contributions;
drop policy if exists "goal contributions insert own" on public.goal_contributions;
drop policy if exists "goal contributions update own" on public.goal_contributions;
drop policy if exists "goal contributions delete own" on public.goal_contributions;

create policy "goal contributions select own"
  on public.goal_contributions for select to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.goals g
      where g.id = goal_id and g.user_id = auth.uid()
    )
  );

create policy "goal contributions insert own"
  on public.goal_contributions for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.goals g
      where g.id = goal_id and g.user_id = auth.uid()
    )
  );

create policy "goal contributions update own"
  on public.goal_contributions for update to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.goals g
      where g.id = goal_id and g.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.goals g
      where g.id = goal_id and g.user_id = auth.uid()
    )
  );

create policy "goal contributions delete own"
  on public.goal_contributions for delete to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.goals g
      where g.id = goal_id and g.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.goal_contributions to authenticated;

create or replace function public.add_goal_contribution(
  p_goal_id uuid,
  p_amount numeric,
  p_date date default current_date,
  p_note text default ''
)
returns public.goal_contributions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_goal public.goals%rowtype;
  v_contribution public.goal_contributions%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Contribution must be greater than zero';
  end if;

  select * into v_goal
  from public.goals
  where id = p_goal_id and user_id = v_user_id
  for update;
  if not found then
    raise exception 'Goal not found';
  end if;
  if p_amount > greatest(v_goal.target_amount - v_goal.current_amount, 0) then
    raise exception 'Contribution exceeds the remaining goal amount';
  end if;

  insert into public.goal_contributions (goal_id, user_id, amount, date, note)
  values (p_goal_id, v_user_id, p_amount, coalesce(p_date, current_date), coalesce(p_note, ''))
  returning * into v_contribution;

  update public.goals
  set current_amount = current_amount + p_amount
  where id = p_goal_id and user_id = v_user_id;

  return v_contribution;
end;
$$;

create or replace function public.delete_goal_contribution(p_contribution_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_contribution public.goal_contributions%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_contribution
  from public.goal_contributions
  where id = p_contribution_id and user_id = v_user_id
  for update;
  if not found then
    raise exception 'Contribution not found';
  end if;

  delete from public.goal_contributions
  where id = p_contribution_id and user_id = v_user_id;
  update public.goals
  set current_amount = greatest(current_amount - v_contribution.amount, 0)
  where id = v_contribution.goal_id and user_id = v_user_id;
end;
$$;

revoke all on function public.add_goal_contribution(uuid, numeric, date, text) from public, anon;
revoke all on function public.delete_goal_contribution(uuid) from public, anon;
grant execute on function public.add_goal_contribution(uuid, numeric, date, text) to authenticated;
grant execute on function public.delete_goal_contribution(uuid) to authenticated;

-- Make PostgREST see the newly-created relations/functions immediately.
notify pgrst, 'reload schema';

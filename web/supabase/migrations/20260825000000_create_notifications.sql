create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('budget_warning', 'budget_exceeded', 'savings_progress', 'savings_goal', 'monthly_summary', 'reminder', 'achievement')),
  title text not null,
  message text not null,
  read boolean not null default false,
  event_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);

alter table public.notifications enable row level security;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own notifications" on public.notifications;
create policy "Users can insert their own notifications" on public.notifications for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists notifications_user_created_at_idx on public.notifications (user_id, created_at desc);

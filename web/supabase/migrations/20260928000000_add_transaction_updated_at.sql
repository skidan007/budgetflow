alter table public.transactions
  add column if not exists updated_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'created_at'
  ) then
    execute 'update public.transactions set updated_at = coalesce(updated_at, created_at, date::timestamptz, now())';
  else
    execute 'update public.transactions set updated_at = coalesce(updated_at, date::timestamptz, now())';
  end if;
end;
$$;

alter table public.transactions
  alter column updated_at set default now(),
  alter column updated_at set not null;

create or replace function public.set_transaction_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists transactions_set_updated_at on public.transactions;

create trigger transactions_set_updated_at
before update on public.transactions
for each row
execute function public.set_transaction_updated_at();
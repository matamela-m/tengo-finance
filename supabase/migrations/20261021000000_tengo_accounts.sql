-- Tengo optional accounts. Stores data only: the forecast is worked out in the browser, never here.
-- Every table has row-level security so a signed-in person can read and write only their own rows.
-- Run with the Supabase CLI (supabase db push) or the SQL editor. See docs/SETUP-SUPABASE.md.

-- One row per person: their own profile details and settings. Never an ID number, phone number or bank credential.
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nickname text check (char_length(nickname) <= 60),
  notice_version text,
  adult_confirmed_at timestamptz not null,
  sample boolean not null default false,
  onboarding_step smallint not null default 0,
  source text not null default 'manual' check (source in ('import', 'edited', 'manual')),
  balance_date date,
  seeded_on date not null default current_date,
  bill_decisions jsonb not null default '{}'::jsonb,
  flexible_groups text[] not null default '{}',
  movable_bills text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounts (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  kind text not null check (kind in ('bank', 'cash', 'wallet')),
  name text not null check (char_length(name) <= 60),
  balance numeric(14, 2) not null,
  primary key (user_id, id)
);

create table public.transactions (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  date date not null,
  description text not null check (char_length(description) <= 200),
  amount numeric(14, 2) not null,
  category text not null check (category in ('income', 'spend', 'bill')),
  one_off boolean not null default false,
  estimated boolean not null default false,
  account_id text,
  primary key (user_id, id)
);
create index transactions_user_date on public.transactions (user_id, date);

-- Informal obligations: stokvel, burial society, family support, informal loans.
create table public.recurring_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  kind text not null check (kind in ('stokvel', 'burial', 'family', 'loan', 'other')),
  name text not null check (char_length(name) <= 80),
  amount numeric(14, 2) not null check (amount > 0),
  every text not null check (every in ('week', 'month')),
  next_date date not null,
  movable boolean not null default false,
  primary key (user_id, id)
);

-- Consent is a log: every decision is a new row with its time and notice version. Never updated.
create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  core boolean not null,
  messages boolean not null,
  analytics boolean not null,
  notice_version text,
  decided_at timestamptz not null default now()
);
create index consent_user_time on public.consent_records (user_id, decided_at desc);

-- Audit log: append only. No descriptions or amounts in params (the app sends ids and field names only).
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now(),
  type text not null,
  params jsonb not null default '{}'::jsonb
);
create index audit_user_time on public.audit_log (user_id, at desc);

create table public.review_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now(),
  reason text not null,
  details text not null default '' check (char_length(details) <= 1000),
  contact text not null check (contact in ('inbox', 'none')),
  headline text not null
);

-- Deletion receipts hold no personal data and no user id, so they survive the deletion they prove.
create table public.deletion_receipts (
  id text primary key,
  at timestamptz not null default now(),
  transactions_removed integer not null,
  audit_entries_removed integer not null
);

-- Row-level security on every table.
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_items enable row level security;
alter table public.consent_records enable row level security;
alter table public.audit_log enable row level security;
alter table public.review_requests enable row level security;
alter table public.deletion_receipts enable row level security;

-- Own rows only, for every operation, on the tables a person edits.
create policy profiles_own on public.profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy accounts_own on public.accounts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy transactions_own on public.transactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy recurring_own on public.recurring_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reviews_own_read on public.review_requests for select to authenticated using (user_id = auth.uid());
create policy reviews_own_insert on public.review_requests for insert to authenticated with check (user_id = auth.uid());

-- Logs: read and add own rows, never change or remove them.
create policy consent_own_read on public.consent_records for select to authenticated using (user_id = auth.uid());
create policy consent_own_insert on public.consent_records for insert to authenticated with check (user_id = auth.uid());
create policy audit_own_read on public.audit_log for select to authenticated using (user_id = auth.uid());
create policy audit_own_insert on public.audit_log for insert to authenticated with check (user_id = auth.uid());
-- deletion_receipts: no policies, so no direct access. Written and read only through delete_my_account().

-- Nobody signed out can touch anything.
revoke all on all tables in schema public from anon;

-- Deletes everything the signed-in person has, including their sign-in, and returns a receipt with no
-- personal data. Runs with the owner's rights only to reach auth.users and the receipts table.
create or replace function public.delete_my_account()
returns public.deletion_receipts
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  me uuid := auth.uid();
  tx_count integer;
  audit_count integer;
  receipt public.deletion_receipts;
begin
  if me is null then
    raise exception 'not signed in';
  end if;
  select count(*) into tx_count from public.transactions where user_id = me;
  select count(*) into audit_count from public.audit_log where user_id = me;
  delete from public.transactions where user_id = me;
  delete from public.accounts where user_id = me;
  delete from public.recurring_items where user_id = me;
  delete from public.review_requests where user_id = me;
  delete from public.consent_records where user_id = me;
  delete from public.audit_log where user_id = me;
  delete from public.profiles where user_id = me;
  delete from auth.users where id = me;
  insert into public.deletion_receipts (id, transactions_removed, audit_entries_removed)
  values ('DEL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)), tx_count, audit_count)
  returning * into receipt;
  return receipt;
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Everything the signed-in person has, as one JSON document, for export.
create or replace function public.export_my_data()
returns jsonb
language sql
security invoker
stable
set search_path = public
as $$
  select jsonb_build_object(
    'exportedAt', now(),
    'profile', (select to_jsonb(p) - 'user_id' from public.profiles p where p.user_id = auth.uid()),
    'accounts', coalesce((select jsonb_agg(to_jsonb(a) - 'user_id') from public.accounts a where a.user_id = auth.uid()), '[]'::jsonb),
    'transactions', coalesce((select jsonb_agg(to_jsonb(t) - 'user_id' order by t.date) from public.transactions t where t.user_id = auth.uid()), '[]'::jsonb),
    'recurringItems', coalesce((select jsonb_agg(to_jsonb(r) - 'user_id') from public.recurring_items r where r.user_id = auth.uid()), '[]'::jsonb),
    'consentRecords', coalesce((select jsonb_agg(to_jsonb(c) - 'user_id' order by c.decided_at) from public.consent_records c where c.user_id = auth.uid()), '[]'::jsonb),
    'auditLog', coalesce((select jsonb_agg(to_jsonb(l) - 'user_id' order by l.at) from public.audit_log l where l.user_id = auth.uid()), '[]'::jsonb),
    'reviewRequests', coalesce((select jsonb_agg(to_jsonb(v) - 'user_id' order by v.at) from public.review_requests v where v.user_id = auth.uid()), '[]'::jsonb)
  );
$$;
revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

-- Retention: transactions older than 12 months are removed. Schedule daily with pg_cron, for example
--   select cron.schedule('tengo-retention', '15 2 * * *', 'select public.purge_old_transactions()');
-- or run it by hand on a fixed day (docs/SETUP-SUPABASE.md). The app also removes them on open.
create or replace function public.purge_old_transactions()
returns integer
language sql
security definer
set search_path = public
as $$
  with gone as (delete from public.transactions where date < (current_date - interval '12 months') returning 1)
  select count(*)::integer from gone;
$$;
revoke all on function public.purge_old_transactions() from public, anon, authenticated;

-- Keep updated_at honest.
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.accounts, public.transactions, public.recurring_items to authenticated;
grant select, insert on public.consent_records, public.audit_log, public.review_requests to authenticated;

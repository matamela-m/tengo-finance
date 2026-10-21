-- Row-level security tests with two users. User B must not be able to read, update or delete user A's
-- data in any table, directly or through the functions. Any failure raises an exception and stops the run.
\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.test');

-- Helper: act as a user (or as nobody).
create function pg_temp.act_as(u text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(u, ''), false);
end;
$$;

-- User A writes a full set of rows.
set role authenticated;
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
insert into public.profiles (user_id, nickname, adult_confirmed_at) values (auth.uid(), 'A', now());
insert into public.accounts values (auth.uid(), 'bank', 'bank', 'Bank account', 1000);
insert into public.transactions (user_id, id, date, description, amount, category) values (auth.uid(), 't1', current_date - 3, 'Groceries', -120, 'spend');
insert into public.recurring_items values (auth.uid(), 'o1', 'stokvel', 'Stokvel', 300, 'month', current_date + 5, false);
insert into public.consent_records (user_id, core, messages, analytics, notice_version) values (auth.uid(), true, false, false, 'v1');
insert into public.audit_log (user_id, type) values (auth.uid(), 'consent.given');
insert into public.review_requests (user_id, reason, contact, headline) values (auth.uid(), 'date', 'none', 'Tight until');

-- A sees their own rows.
do $$ begin
  if (select count(*) from public.transactions) <> 1 then raise exception 'A should see 1 transaction'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'A should see their profile'; end if;
end $$;

-- User B: sees nothing of A's, in any table.
select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
do $$
declare tbl text; n int;
begin
  foreach tbl in array array['profiles', 'accounts', 'transactions', 'recurring_items', 'consent_records', 'audit_log', 'review_requests'] loop
    execute format('select count(*) from public.%I', tbl) into n;
    if n <> 0 then raise exception 'B can read A''s rows in %', tbl; end if;
  end loop;
end $$;

-- B cannot update or delete A's rows: no rows are affected.
do $$
declare n int;
begin
  update public.transactions set amount = 0 where user_id = '11111111-1111-1111-1111-111111111111';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'B updated A''s transaction'; end if;
  delete from public.accounts where user_id = '11111111-1111-1111-1111-111111111111';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'B deleted A''s account'; end if;
  update public.profiles set nickname = 'hacked' where user_id = '11111111-1111-1111-1111-111111111111';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'B updated A''s profile'; end if;
  delete from public.transactions where user_id = '11111111-1111-1111-1111-111111111111';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'B deleted A''s transaction'; end if;
end $$;

-- B cannot write a row in A's name.
do $$ begin
  begin
    insert into public.transactions (user_id, id, date, description, amount, category) values ('11111111-1111-1111-1111-111111111111', 'x', current_date, 'x', -1, 'spend');
    raise exception 'B inserted a row as A';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.audit_log (user_id, type) values ('11111111-1111-1111-1111-111111111111', 'forged');
    raise exception 'B wrote to A''s audit log';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Logs are append only, even for their owner.
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
do $$ begin
  begin
    update public.audit_log set type = 'changed';
    raise exception 'audit log was updated';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.consent_records;
    raise exception 'consent record was deleted';
  exception when insufficient_privilege then null;
  end;
end $$;

-- The export function returns only the caller's data, without user ids.
select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
do $$ begin
  if jsonb_array_length(public.export_my_data() -> 'transactions') <> 0 then raise exception 'B export contains A''s transactions'; end if;
end $$;
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
do $$ begin
  if jsonb_array_length(public.export_my_data() -> 'transactions') <> 1 then raise exception 'A export is missing A''s transaction'; end if;
  if (public.export_my_data() -> 'transactions' -> 0) ? 'user_id' then raise exception 'export leaks user_id'; end if;
end $$;

-- Signed out: nothing at all.
select pg_temp.act_as(null);
reset role;
set role anon;
do $$ begin
  begin
    perform count(*) from public.transactions;
    raise exception 'anon can read transactions';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.delete_my_account();
    raise exception 'anon can call delete_my_account';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- B deleting their account removes only B; A's data stays. Receipts hold no user id.
set role authenticated;
select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
insert into public.profiles (user_id, adult_confirmed_at) values (auth.uid(), now());
insert into public.transactions (user_id, id, date, description, amount, category) values (auth.uid(), 'b1', current_date, 'Taxi', -20, 'spend');
do $$
declare r public.deletion_receipts;
begin
  r := public.delete_my_account();
  if r.transactions_removed <> 1 then raise exception 'receipt count wrong'; end if;
end $$;
reset role;
do $$ begin
  if exists (select 1 from auth.users where id = '22222222-2222-2222-2222-222222222222') then raise exception 'B sign-in not deleted'; end if;
  if exists (select 1 from public.transactions where user_id = '22222222-2222-2222-2222-222222222222') then raise exception 'B rows not deleted'; end if;
  if (select count(*) from public.transactions where user_id = '11111111-1111-1111-1111-111111111111') <> 1 then raise exception 'A rows were touched'; end if;
  if exists (select 1 from information_schema.columns where table_name = 'deletion_receipts' and column_name = 'user_id') then raise exception 'receipts hold a user id'; end if;
end $$;

-- Signed-in users cannot read receipts directly.
set role authenticated;
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
do $$ begin
  begin
    perform count(*) from public.deletion_receipts;
    raise exception 'receipts readable directly';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Retention removes only transactions older than 12 months.
insert into public.transactions (user_id, id, date, description, amount, category) values ('11111111-1111-1111-1111-111111111111', 'old', current_date - 400, 'Old', -1, 'spend');
do $$ begin
  if public.purge_old_transactions() <> 1 then raise exception 'retention removed the wrong number'; end if;
  if exists (select 1 from public.transactions where id = 'old') then raise exception 'old row kept'; end if;
  if (select count(*) from public.transactions where id = 't1') <> 1 then raise exception 'recent row removed'; end if;
end $$;

select 'All row-level security tests passed.' as result;

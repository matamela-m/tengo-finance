-- Test harness only: the small part of Supabase's auth schema the migration relies on, for running the
-- policies on a plain local Postgres when Docker (and so the Supabase local stack) is not available.
-- auth.uid() reads the signed-in user from a setting, the way Supabase reads it from the JWT.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

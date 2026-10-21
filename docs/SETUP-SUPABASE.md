# Setting up accounts (Supabase) and hosting (Vercel)

For the founder. Tengo runs fully as a guest with none of this done: accounts appear only when the two Supabase values below are set. Nothing here has been done for you; each step needs your own accounts and decisions. Menu names follow the Supabase and Vercel dashboards as of October 2026 and may move; the settings they point to are what matter.

## 1. Create the Supabase project

1. Sign in at supabase.com and create a new project.
2. Choose the region. A South African region keeps data in the country; if you pick a region abroad, name it in the privacy notice and confirm with a lawyer that it has adequate protection (POPIA section 72).
3. Choose a plan and note its backup retention (how long deleted data survives in backups). Put that period in the privacy notice under "How long it is kept".
4. Keep the database password in a password manager. It is not needed by the app.

## 2. Run the migrations

With the Supabase CLI, from the repository root:

```sh
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Or open the SQL editor in the Supabase dashboard and run `supabase/migrations/20261021000000_tengo_accounts.sql`.

This creates the tables, turns on row-level security on every table, and adds `delete_my_account()`, `export_my_data()` and `purge_old_transactions()`.

Before going live, run the policy tests locally: `npm run test:rls`. It needs Postgres installed (`brew install postgresql`); CI runs it too.

## 3. Retention

Transactions older than 12 months must be removed on the server, not only in the app. Either:

- Turn on the `pg_cron` extension (Database, Extensions) and run once in the SQL editor:
  `select cron.schedule('tengo-retention', '15 2 * * *', 'select public.purge_old_transactions()');`
- Or, if you cannot use pg_cron, run `select public.purge_old_transactions();` by hand on the first working day of every month and record the date.

## 4. Email sign-in

1. Authentication, Providers: keep Email on; turn off every other provider.
2. Authentication, Providers, Email: turn off "Confirm email" sign-up with password (Tengo uses one-time codes only), and set the one-time code length to 6.
3. Authentication, Email templates: edit "Magic Link" so it shows the code (`{{ .Token }}`) in plain words, names Tengo, and says you never ask for a PIN or password.
4. Authentication, SMTP: set up your own email sender (the built-in one is for testing and heavily rate limited). Name the email provider in the privacy notice as an operator.
5. Authentication, Rate limits: keep the email sign-in limit low (for example 30 an hour). The app also waits 60 seconds between code requests.
6. Authentication, Sessions: set the JWT expiry to 1 hour (3600 seconds) and keep refresh token rotation on. "Sign out everywhere" in the app ends all sessions.
7. Authentication, URL configuration: set the Site URL to your production address and add it to the redirect allow list.

## 5. Keys

1. Settings, API: copy the Project URL and the `anon` public key.
2. Create `.env.local` in the repository root (it is never committed) from `.env.example`:

```sh
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

3. Never copy the `service_role` key anywhere in this repository or into Vercel's browser variables. `npm run lint` and CI's gitleaks job fail if a service role key or token appears in the code.

## 6. Who is responsible

Fill these in `.env.local` and on Vercel before any real launch. Until then the app shows a warning on the privacy notice and the build prints one:

```sh
VITE_RESPONSIBLE_PARTY=<legal name and registration number>
VITE_RESPONSIBLE_PARTY_ADDRESS=<physical address>
VITE_INFORMATION_OFFICER=<name, registered with the Information Regulator>
VITE_PRIVACY_EMAIL=<contact address>
```

Register the Information Officer with the Information Regulator first. Have a lawyer review `/privacy-notice` and `/terms` (the text is in `src/i18n/locales/en.json` under `legalDoc`).

## 7. Vercel

1. Import the repository in Vercel. The build command is `npm run build` and the output folder is `dist`.
2. Project settings, Environment variables: add every `VITE_` variable above for Production (and Preview if you use it).
3. `vercel.json` already sets the security headers. Its Content Security Policy allows `https://*.supabase.co` for the database only; if you use a custom Supabase domain, add it to `connect-src`.
4. After the first deploy, open the site, check that accounts appear under Me, Save to an account, and that the privacy notice shows your details with no warning.

## 8. What still needs a person

See `docs/HUMAN-ACTIONS.md`: legal review of the notice and terms, the operator agreements with Supabase, Vercel and the email provider, and the cross-border assessment if data is stored outside South Africa.

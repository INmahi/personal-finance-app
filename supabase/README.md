# Supabase Backend — XpenseTracker

Phase 1 backend. Built and verified on the hosted project below (the local
Supabase CLI couldn't install due to a network issue at build time; migrations
here are the source of truth and replay locally once the CLI is available).

## Hosted project
- **Name:** `xpensetracker`
- **Project ref:** `uvabpvurkswoybmxuzjk`
- **Region:** `ap-south-1` (Mumbai)
- **API URL:** https://uvabpvurkswoybmxuzjk.supabase.co
- **Org:** `ishatnoormahi@gmail.com's Org` — free tier ($0/mo)

Client connection values live in [../.env.example](../.env.example) (publishable
key is client-public and RLS-protected).

## Schema (see `migrations/`)
- `profiles`, `categories` (kind: expense|income), `transactions`
  (direction: out|in, payment_method: cash|bkash|bank), `fixed_expenses`.
- Triggers: `set_updated_at` (all domain tables), `handle_new_user`
  (profile + 8 expense / 3 income seeded categories on signup).
- RLS enabled on all tables; users access only `user_id = auth.uid()` rows.
- Security advisors: clean.

## ⚠️ Required manual step — disable public signup (invite-only)
The hosted project still allows public signup by default. Until disabled, anyone
with the anon key could register. **You must turn it off:**

Dashboard → **Authentication → Sign In / Providers → Email** →
disable **"Allow new users to sign up"** → Save.

Then create invited users via **Authentication → Users → Add user** (or the
Management API); they receive an email to set a password.

## Running tests locally (later, once CLI installs)
pgTAP suites live in `tests/`. With Docker + the Supabase CLI:

```bash
npx supabase start
npx supabase db reset      # applies migrations/
npx supabase test db       # runs tests/
```

The hosted build was validated with equivalent SQL assertions (constraints,
trigger provisioning, updated_at bump, and RLS isolation).

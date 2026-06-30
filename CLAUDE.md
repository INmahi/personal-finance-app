# CLAUDE.md — XpenseTracker

Guidance for working in this repository. Update as the project evolves.

## What this is

A personal, invite-only money tracker for a small group. Each user privately
tracks money **in** (income: salary, family support, …) and money **out**
(expenses), sees their **balance**, and gets searchable records + monthly/custom
summaries. Currency is fixed **BDT (৳)**.

Full design: [docs/superpowers/specs/2026-06-29-xpensetracker-design.md](docs/superpowers/specs/2026-06-29-xpensetracker-design.md)

## Architecture (Supabase BaaS — no custom server)

- **Backend:** Supabase — Postgres + Auth (email/password) + Row-Level Security
  + DB triggers. Per-user isolation via `user_id = auth.uid()` RLS policies.
- **Web client:** React + Vite + TypeScript, `supabase-js`. Online-only.
- **Mobile client:** Expo + React Native + TypeScript. Offline-capable with a
  local `expo-sqlite` mirror and a pull/push sync engine (last-write-wins).
- **Auth:** invite-only (public signup disabled); persistent sessions.

## Data model (one line each)

- `profiles` — one per auth user (display name); auto-created on signup.
- `categories` — user-owned, `kind` = expense | income; seeded on signup.
- `transactions` — money in/out (`direction`), amount, date, category,
  `payment_method` (cash | bkash | bank), note. Balance = sum(in) − sum(out).
- `fixed_expenses` — separate list of recurring monthly commitments (reference
  only; not posted as transactions, does not affect balance).

All tables carry sync fields: `created_at`, `updated_at` (trigger-bumped),
`deleted` (soft-delete). UUID PKs are client-suppliable for offline use.

## Build order (phases)

1. **Backend foundation** — schema, RLS, auth, triggers (current focus).
2. **Web app** — full feature set, online-only.
3. **Mobile app** — Android + offline sync.
4. **Deferred** — public marketing site (tour + request-access).

Plans live in `docs/superpowers/plans/`. Build phases in order; each phase
produces working, testable software on its own.

## Conventions

- **TDD**: write a failing test, make it pass, refactor. See the per-phase
  testing strategy in the design spec (§8).
- **Soft-delete, never hard-delete** domain rows (sync depends on it).
- **Currency**: store amounts as `numeric(12,2)`; format as `৳` in the UI.
- **Money math**: never use floats for money in app logic; treat amounts as
  fixed-precision decimals / integer minor units where appropriate.
- Keep files small and single-responsibility; follow existing patterns once they
  exist.

## Status

**Phase 1 (backend) built and verified** on hosted Supabase project
`xpensetracker` (ref `uvabpvurkswoybmxuzjk`, ap-south-1). Schema, triggers, RLS,
and security hardening applied via migrations in `supabase/`; advisors clean;
RLS isolation verified. Connection values in `.env.example`.

⚠️ **Outstanding manual step:** disable public signup in the Supabase dashboard
(Authentication → Sign In/Providers → Email) to enforce invite-only — see
`supabase/README.md`.

Local Supabase CLI install was blocked by a network error at build time; the
backend was built via the Supabase MCP. Migrations replay locally with
`npx supabase db reset` once the CLI installs.

**Phase 2 (web app) — complete (mobile-first).** React + Vite + TS in `web/`.
**Claude-style warm theme** (ivory surfaces + coral accent) via shared design
tokens (`web/src/theme/tokens.css`); `supabase-js` with persistent sessions
(login once — stored in localStorage, key `xpense-auth`).

Navigation: sticky header with **Search** (→ `/search` page) and **Filter**
(→ Reports) buttons + a **Summary** slide-over; scrollable tabs. **Transactions
is the default page** (`/`). Screens: Transactions (add + list + soft-delete),
Overview (`/overview`: balance / spent / income), Search (note/category/amount/
payment/date), Reports & filters (date range + category/type/payment, colored
by-category bars, by-payment, fixed reference, matching list), Categories
(CRUD, **per-category colors** from a palette), Fixed expenses (CRUD + monthly
total), and the Summary slide-over (spent-this-month + remaining money,
expenses-only toggle, **this-month / all-time / custom range**, CSV export).

RLS re-verified: isolation holds across select/insert/update/delete (a user
cannot read, insert-as, update, or delete another user's rows).

Builds clean (`npm run build`). Run: `cd web && npm run dev`.
Demo login: `demo@xpense.app` / `Demo123456`.

Next: Phase 3 (mobile + offline sync). Remote:
https://github.com/INmahi/personal-finance-app

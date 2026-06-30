# XpenseTracker — MVP Design Spec

> **Status:** Draft for review. Living document — update as requirements evolve.
> **Date:** 2026-06-29
> **Author:** Brainstormed with Claude (superpowers:brainstorming)

## 1. Purpose

A personal money tracker for a small, invite-only group (the owner plus a few
invited people). Each user has their own private data. The core jobs:

1. **Awareness** — "Where did my money go, and how much this month?"
2. **Searchable record-keeping** — a reliable, filterable log of money in and out.
3. **Balance tracking** — money coming in (salary, family support, etc.) minus
   money going out, so the user knows where they stand.

This is built in-house (rather than using an existing app) to stay free, fully
private per user, work offline on mobile, and fit the owner's exact workflow.

## 2. Scope

### In scope (MVP)
- Multi-user, **invite-only** accounts (no public signup); each user's data is private.
- Email + password login with **persistent sessions** (no re-login on each open).
- **Transactions**: log money **out** (expenses) and money **in** (income).
  - Fields: amount, date, direction, category (optional), payment method, note.
- **Payment methods**: Cash (default), bKash, Bank.
- **Categories**: user-managed, typed as expense or income; seeded defaults on signup.
- **Fixed expenses**: a separate tracked list of recurring monthly commitments
  (name + amount + optional category/note + active toggle) with a total. Not
  auto-posted as transactions; shown in summaries for reference.
- **Balance**: total income − total expenses, shown on the home screen.
- **List + filter + search**: default current month, newest first; filter by date
  range, category, direction, and payment method; search note text; running total.
- **Summaries / reports**: This-month and custom-date-range; expense total,
  by-category breakdown (with a simple chart), income total, net for the period,
  by-payment-method breakdown, and fixed-monthly total for reference.
- **Summary tab (slide-over panel)**: a dedicated Summary view that opens with a
  horizontal **slide-in** transition. Headline numbers: **spent so far this
  month** and **remaining money** (= current balance, total in − total out).
  Within the panel the user can switch scope/options, including an
  **expenses-only** view, and **export / download** the (filtered) expenses as a
  **CSV** file.
- Single fixed currency: **BDT (৳)**.
- **Visual design**: **light theme** for the web app, guided by the UX design
  doc and a shared design-token set (see §6.3).
- Clients: **Web** (online-only) and **Android** (offline-capable with sync).

### Out of scope (MVP — deferred)
- Public marketing site: live-sandbox "take a tour" demo + request-access form.
- Multi-currency, currency conversion.
- Budgets / spending limits, alerts.
- Auto-recurring posting of fixed expenses; reminders / push notifications.
- Receipt photos / attachments.
- Trend-over-time charts (use custom date range instead).
- Shared / household data, collaboration.
- iOS app; web offline support.
- Automated account provisioning (accounts created manually for now).

## 3. Architecture

Approach: **Supabase BaaS** (no custom server).

```
┌──────────────┐        ┌──────────────┐
│  Web (React) │        │ Mobile (RN)  │
│ online-only  │        │ offline+sync │
└──────┬───────┘        └──────┬───────┘
       │  supabase-js          │ supabase-js + local SQLite mirror
       └───────────┬───────────┘
                   ▼
          ┌────────────────────┐
          │      Supabase      │
          │ Auth (email/pwd)   │
          │ Postgres + RLS     │
          │ DB triggers        │
          └────────────────────┘
```

- **Per-user isolation** is enforced in the database via Row-Level Security
  (`user_id = auth.uid()`). Neither client can read another user's rows.
- **Persistent sessions** via Supabase refresh tokens (browser storage on web,
  AsyncStorage on mobile).
- **Reports** are computed client-side from the user's own (small) dataset.
- **Hosting**: Supabase free tier; web app on a static host (e.g. Netlify/Vercel/
  Render free tier).

## 4. Data Model (Postgres)

All tables carry sync fields for the eventual mobile sync: `created_at`,
`updated_at` (bumped by trigger on every write), and `deleted` (boolean
soft-delete). Primary keys are UUIDs, client-suppliable so offline-created rows
keep their identity.

### `profiles`
| column | type | notes |
|---|---|---|
| id | uuid PK | = `auth.users.id`, FK, on delete cascade |
| display_name | text | nullable |
| created_at | timestamptz | default `now()` |

Auto-created by a trigger when a new auth user is created.

### `categories`
| column | type | notes |
|---|---|---|
| id | uuid PK | default `gen_random_uuid()` |
| user_id | uuid | FK → auth.users, not null |
| name | text | not null |
| kind | text | `'expense'` or `'income'` (check), not null |
| color | text | nullable |
| created_at / updated_at | timestamptz | |
| deleted | boolean | default false |

Unique `(user_id, name, kind)` among non-deleted rows. Seeded per user on signup:
- **expense:** Food, Groceries, Transport, Bills, Shopping, Health, Entertainment, Other
- **income:** Salary, Family support, Other

Deleting a category does **not** delete its transactions — they become
"Uncategorized".

### `transactions`
| column | type | notes |
|---|---|---|
| id | uuid PK | client-suppliable |
| user_id | uuid | FK → auth.users, not null |
| direction | text | `'out'` (expense) or `'in'` (income), check, not null |
| amount | numeric(12,2) | not null, check `> 0` |
| occurred_on | date | not null, defaults to today |
| category_id | uuid | FK → categories, nullable |
| payment_method | text | `'cash'` \| `'bkash'` \| `'bank'`, check, default `'cash'` |
| note | text | nullable |
| created_at / updated_at | timestamptz | |
| deleted | boolean | default false |

**Balance** = `sum(amount) where direction='in'` − `sum(amount) where direction='out'`
over non-deleted rows for the user.

### `fixed_expenses`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | FK → auth.users, not null |
| name | text | not null |
| amount | numeric(12,2) | not null, check `> 0` |
| category_id | uuid | FK → categories (expense kind), nullable |
| note | text | nullable |
| active | boolean | default true |
| created_at / updated_at | timestamptz | |
| deleted | boolean | default false |

Fixed-monthly total = `sum(amount) where active and not deleted`. Reference only;
does not affect balance.

### RLS policies
Enabled on all tables. `profiles`: row visible/editable where `id = auth.uid()`.
`categories`, `transactions`, `fixed_expenses`: select/insert/update/delete where
`user_id = auth.uid()`.

### Triggers
- On new `auth.users` row → insert `profiles` row + seed default categories.
- On insert/update of `categories`, `transactions`, `fixed_expenses` → set
  `updated_at = now()`.

## 5. Auth & Onboarding (v1)

- Email + password via Supabase Auth. **Public signup disabled.**
- The owner creates each invited user (Supabase dashboard / admin); the user
  receives an email to set their password.
- (Deferred public site will later add a "tour" + "request access" form.)

## 6. Clients

### 6.1 Web (online-only)
- **Stack:** React + Vite + TypeScript, `supabase-js`, React Router. Charts via a
  lightweight lib (e.g. Recharts). Styling: Tailwind or CSS modules (TBD at plan time).
- **Screens:**
  - **Login**
  - **Home / Overview** — balance, this-month spend, top categories, recent transactions, quick "add" actions.
  - **Transactions** — list (current month default, newest first) + filters (date range, category, direction, payment method) + note search + running total; add/edit/delete (soft-delete).
  - **Add money** — quick income entry (amount, date, source category, payment method, note).
  - **Categories** — manage expense + income categories.
  - **Fixed expenses** — manage the fixed list + see its total.
  - **Summary (slide-over panel)** — opens with a horizontal slide-in. Headline: **spent so far this month** + **remaining money** (current balance). Scope toggle (this month / custom range) and an **expenses-only** option; **Download CSV** of the filtered expenses.
  - **Reports** — this-month / custom range: expense total, by-category breakdown + chart, income total, net, by-payment-method, fixed-monthly reference.
- **Light theme** throughout; respects `prefers-reduced-motion` (slide-over falls back to a fade/instant open).
- Session persisted in browser.

### 6.2 Mobile (Android, offline-capable)
- **Stack:** Expo + React Native + TypeScript, `supabase-js` with AsyncStorage
  session persistence, **expo-sqlite** local mirror of `categories`,
  `transactions`, `fixed_expenses` + an outbox of pending changes.
- **Behavior:** UI reads/writes the local DB first (works fully offline). A sync
  module reconciles with Supabase on app foreground / connectivity regained:
  - **Pull**: rows where `updated_at > last_synced_at` (per table).
  - **Push**: local pending changes as upserts (including soft-deletes).
  - **Conflict policy**: last-write-wins by `updated_at` (safe — each user only
    edits their own data from their own devices).
- Same screens as web.

### 6.3 Visual design & UX
- **Theme:** light. Calm, high-contrast, finance-appropriate. Tokens (color,
  type scale, spacing, radii, motion) defined once and shared web→mobile; to be
  generated with the `ui-design-system` skill at Phase 2 plan time.
- **Summary slide-over:** ~280–320ms horizontal slide with ease-out; backdrop
  scrim; closes on scrim tap / Esc / swipe. Honors `prefers-reduced-motion`.
- UX research, the primary persona, and the Summary journey map live in
  [ux/2026-06-29-ux-design.md](../ux/2026-06-29-ux-design.md).

## 7. Delivery Phases

Each phase is its own implementation plan and produces working, testable software.

1. **Phase 1 — Backend foundation.** Supabase project, schema, RLS, auth config,
   signup trigger (profile + seeded categories), `updated_at` triggers, verified
   with SQL/integration tests. Deliverable: a secured, testable database.
2. **Phase 2 — Web app.** Full feature set against the backend, online-only.
   Deliverable: a usable web app.
3. **Phase 3 — Mobile app + offline sync.** Android app with local SQLite mirror
   and the sync engine. Deliverable: an installable Android app.
4. **Deferred — Public site.** Live-sandbox tour + request-access form.

## 8. Testing Strategy (per phase)

- **Phase 1:** SQL-level tests for RLS (a user cannot read another's rows),
  constraints (amount > 0, valid enums), and the signup trigger (profile + seeded
  categories created). Run against a local/branch Supabase.
- **Phase 2:** Component/unit tests for forms, filters, and report calculations
  (balance, by-category, by-payment-method); integration tests against a test
  Supabase project.
- **Phase 3:** Unit tests for the sync engine (pull cursor, push upsert,
  soft-delete propagation, LWW), plus offline→online round-trip tests.

## 9. Open Questions / To Revisit
- Web styling choice (Tailwind vs CSS modules) — decided at Phase 2 plan time.
- Whether income should support its own "fixed/recurring" list later (deferred).
- Static host choice for the web app (Netlify/Vercel/Render).

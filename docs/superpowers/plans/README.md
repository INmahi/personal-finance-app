# XpenseTracker — Implementation Roadmap

Source design: [../specs/2026-06-29-xpensetracker-design.md](../specs/2026-06-29-xpensetracker-design.md)

Build phases in order. Each phase is an independent implementation plan that
ends in working, testable software. A later phase's detailed plan is written
once the prior phase's concrete output exists (so the plan reflects reality, not
speculation).

| Phase | Plan | Deliverable | Status |
|---|---|---|---|
| 1 | [2026-06-29-phase-1-backend.md](2026-06-29-phase-1-backend.md) | Secured Supabase DB (schema, RLS, triggers, auth) | Ready to build |
| 2 | _to be written after Phase 1_ | Web app (online-only), full feature set | Planned |
| 3 | _to be written after Phase 2_ | Android app + offline sync | Planned |
| 4 (deferred) | — | Public site: tour + request-access | Deferred |

## Phase 2 — Web app (outline)

React + Vite + TS + `supabase-js`. Screens: Login, Home/Overview (balance, this
month, recent), Transactions (list + filters + search + add/edit/delete), Add
money, Categories, Fixed expenses, Reports (this-month/custom: expense total,
by-category + chart, income total, net, by-payment-method, fixed reference).
Online-only; session persisted. Tests: form/filter units, report calculations,
integration against a test Supabase project.

## Phase 3 — Mobile app + offline sync (outline)

Expo RN + TS. Local `expo-sqlite` mirror of categories/transactions/
fixed_expenses + outbox. UI reads/writes local first. Sync engine: pull
(`updated_at > last_synced_at`), push (upserts incl. soft-deletes), LWW conflict
policy. Session via AsyncStorage. Tests: sync-engine units (cursor, upsert,
delete propagation, LWW), offline→online round-trip.

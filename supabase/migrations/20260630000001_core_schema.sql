create extension if not exists "pgcrypto";

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  kind       text not null check (kind in ('expense','income')),
  color      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted    boolean not null default false
);
create unique index categories_user_name_kind_uq
  on public.categories (user_id, name, kind) where (deleted = false);

create table public.transactions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  direction      text not null check (direction in ('out','in')),
  amount         numeric(12,2) not null check (amount > 0),
  occurred_on    date not null default current_date,
  category_id    uuid references public.categories(id),
  payment_method text not null default 'cash' check (payment_method in ('cash','bkash','bank')),
  note           text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted        boolean not null default false
);
create index transactions_user_updated_idx on public.transactions (user_id, updated_at);

create table public.fixed_expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  amount      numeric(12,2) not null check (amount > 0),
  category_id uuid references public.categories(id),
  note        text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted     boolean not null default false
);

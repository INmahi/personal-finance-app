-- XpenseTracker — RESET + full setup.
-- ⚠️ Deletes any data in the four XpenseTracker tables. Run only on a project
-- dedicated to XpenseTracker. Dashboard → SQL Editor → paste → Run.

-- ---------- drop anything from a previous attempt ----------
drop table if exists public.fixed_expenses cascade;
drop table if exists public.transactions   cascade;
drop table if exists public.categories     cascade;
drop table if exists public.profiles       cascade;
drop function if exists public.handle_new_user() cascade;  -- also drops the auth.users trigger
drop function if exists public.set_updated_at()  cascade;

-- ---------- extensions ----------
create extension if not exists "pgcrypto";

-- ---------- tables ----------
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
  category_label text,
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

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_categories_updated_at     before update on public.categories     for each row execute function public.set_updated_at();
create trigger trg_transactions_updated_at   before update on public.transactions   for each row execute function public.set_updated_at();
create trigger trg_fixed_expenses_updated_at before update on public.fixed_expenses for each row execute function public.set_updated_at();

-- ---------- provision profile + seed categories on signup ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));

  insert into public.categories (user_id, name, kind)
  select new.id, name, 'expense' from unnest(array[
    'Food','Groceries','Transport','Bills','Shopping','Health','Entertainment','Other'
  ]) as name;

  insert into public.categories (user_id, name, kind)
  select new.id, name, 'income' from unnest(array[
    'Salary','Family support','Other'
  ]) as name;

  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- row-level security ----------
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.transactions   enable row level security;
alter table public.fixed_expenses enable row level security;

create policy profiles_self        on public.profiles       for all using (id = auth.uid())      with check (id = auth.uid());
create policy categories_owner     on public.categories     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy transactions_owner   on public.transactions   for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy fixed_expenses_owner on public.fixed_expenses for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- keep trigger functions out of the REST API ----------
revoke execute on function public.set_updated_at()  from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.transactions   enable row level security;
alter table public.fixed_expenses enable row level security;

-- profiles: own row by id
create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- own rows by user_id
create policy categories_owner on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy transactions_owner on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy fixed_expenses_owner on public.fixed_expenses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

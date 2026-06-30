create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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

begin;
select plan(3);

insert into auth.users (id, aud, role, email, instance_id)
values ('44444444-4444-4444-4444-444444444444','authenticated','authenticated','c@test.com','00000000-0000-0000-0000-000000000000');

select is(
  (select count(*)::int from public.profiles where id = '44444444-4444-4444-4444-444444444444'),
  1, 'profile row created for new user');

select is(
  (select count(*)::int from public.categories
   where user_id = '44444444-4444-4444-4444-444444444444' and kind = 'expense'),
  8, '8 expense categories seeded');

select is(
  (select count(*)::int from public.categories
   where user_id = '44444444-4444-4444-4444-444444444444' and kind = 'income'),
  3, '3 income categories seeded');

select * from finish();
rollback;

begin;
select plan(2);

insert into auth.users (id, aud, role, email, instance_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001','authenticated','authenticated','u1@test.com','00000000-0000-0000-0000-000000000000'),
  ('bbbbbbbb-0000-0000-0000-000000000002','authenticated','authenticated','u2@test.com','00000000-0000-0000-0000-000000000000');

insert into public.transactions (user_id, direction, amount, occurred_on) values
  ('aaaaaaaa-0000-0000-0000-000000000001','out', 100, current_date),
  ('bbbbbbbb-0000-0000-0000-000000000002','out', 200, current_date);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.transactions),
  1, 'user 1 sees only their own transaction');

select is(
  (select coalesce(sum(amount),0)::numeric from public.transactions),
  100::numeric, 'user 1 sees only their own amount');

select * from finish();
rollback;

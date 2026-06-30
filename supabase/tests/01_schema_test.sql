begin;
select plan(11);

select has_table('public','profiles','profiles table exists');
select has_table('public','categories','categories table exists');
select has_table('public','transactions','transactions table exists');
select has_table('public','fixed_expenses','fixed_expenses table exists');
select col_is_pk('public','transactions','id','transactions.id is pk');

insert into auth.users (id, aud, role, email, instance_id)
values ('11111111-1111-1111-1111-111111111111','authenticated','authenticated','a@test.com','00000000-0000-0000-0000-000000000000');

select lives_ok($$
  insert into public.transactions (user_id, direction, amount, occurred_on)
  values ('11111111-1111-1111-1111-111111111111','out', 12.50, current_date)
$$, 'valid expense inserts');

select throws_ok($$
  insert into public.transactions (user_id, direction, amount, occurred_on)
  values ('11111111-1111-1111-1111-111111111111','out', -1, current_date)
$$, '23514', null, 'rejects non-positive amount');

select throws_ok($$
  insert into public.transactions (user_id, direction, amount, occurred_on)
  values ('11111111-1111-1111-1111-111111111111','sideways', 5, current_date)
$$, '23514', null, 'rejects invalid direction');

select throws_ok($$
  insert into public.transactions (user_id, direction, amount, occurred_on, payment_method)
  values ('11111111-1111-1111-1111-111111111111','out', 5, current_date, 'paypal')
$$, '23514', null, 'rejects invalid payment_method');

select throws_ok($$
  insert into public.categories (user_id, name, kind)
  values ('11111111-1111-1111-1111-111111111111','Bad','neither')
$$, '23514', null, 'rejects invalid category kind');

select results_eq($$
  insert into public.transactions (user_id, direction, amount, occurred_on)
  values ('11111111-1111-1111-1111-111111111111','out', 3, current_date)
  returning payment_method
$$, $$ values ('cash'::text) $$, 'payment_method defaults to cash');

select * from finish();
rollback;

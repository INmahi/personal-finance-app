begin;
select plan(1);

insert into auth.users (id, aud, role, email, instance_id)
values ('22222222-2222-2222-2222-222222222222','authenticated','authenticated','b@test.com','00000000-0000-0000-0000-000000000000');

insert into public.transactions (id, user_id, direction, amount, occurred_on, updated_at)
values ('33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222','out', 9, current_date, '2000-01-01');

update public.transactions set amount = 10
where id = '33333333-3333-3333-3333-333333333333';

select ok(
  (select updated_at from public.transactions where id = '33333333-3333-3333-3333-333333333333') > '2020-01-01',
  'updated_at is bumped on update'
);

select * from finish();
rollback;

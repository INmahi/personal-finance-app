-- Pin search_path on the trigger function (advisor 0011).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Keep trigger functions out of the exposed REST API (advisors 0028/0029).
-- Triggers still fire: trigger execution does not require EXECUTE privilege.
revoke execute on function public.set_updated_at()  from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

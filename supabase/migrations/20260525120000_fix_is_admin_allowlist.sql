-- The previous is_admin() only allowed gamalielkelman@gmail.com.
-- Other admins (pennsunjo@gmail.com) were blocked by RLS from reading
-- other users' profiles in the admin dashboard, so the Users tab only
-- showed their own account. Align the SQL allowlist with the frontend
-- ADMIN_EMAILS list (src/hooks/use-admin.ts) so both admins see everything.
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  return auth.jwt() ->> 'email' IN (
    'gamalielkelman@gmail.com',
    'pennsunjo@gmail.com'
  );
end;
$$;

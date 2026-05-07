-- ============================================================
-- Migration : Sécurisation RLS et Rate Limits
-- ============================================================

-- 1. Fonction is_admin() pour centraliser la logique admin
-- On garde l'email pour l'instant mais on pourra ajouter un flag boolean plus tard
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  return (
    auth.jwt() ->> 'email' = 'gamalielkelman@gmail.com'
  );
end;
$$;

-- 2. Sécurisation de check_rate_limit
-- On ignore p_user_id passé en argument et on force auth.uid()
-- pour empêcher un utilisateur d'épuiser le quota d'un autre.
create or replace function public.check_rate_limit(
  p_user_id uuid, -- Gardé pour compatibilité signature mais ignoré
  p_function text,
  p_max_requests int default 20,
  p_window_hours int default 1
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_count int;
  v_window timestamptz;
  v_real_user_id uuid;
begin
  -- Force l'ID de l'utilisateur authentifié
  v_real_user_id := auth.uid();
  
  if v_real_user_id is null then
    return false;
  end if;

  v_window := now() - (p_window_hours || ' hours')::interval;

  select count into v_count
  from public.rate_limits
  where user_id = v_real_user_id
    and function_name = p_function
    and window_start > v_window;

  if v_count is null then
    insert into public.rate_limits (user_id, function_name, count, window_start)
    values (v_real_user_id, p_function, 1, now());
    return true;
  end if;

  if v_count >= p_max_requests then
    return false;
  end if;

  update public.rate_limits
  set count = count + 1
  where user_id = v_real_user_id
    and function_name = p_function
    and window_start > v_window;

  return true;
end;
$$;

-- 3. Mise à jour des politiques RLS pour utiliser is_admin()
-- user_profiles
drop policy if exists "User or admin reads profiles" on public.user_profiles;
create policy "User or admin reads profiles" on public.user_profiles
for select to authenticated
using (auth.uid() = user_id or public.is_admin());

-- generated_content
drop policy if exists "User or admin reads content" on public.generated_content;
create policy "User or admin reads content" on public.generated_content
for select to authenticated
using (auth.uid() = user_id or public.is_admin());

-- sources
drop policy if exists "User or admin reads sources" on public.sources;
create policy "User or admin reads sources" on public.sources
for select to authenticated
using (auth.uid() = user_id or public.is_admin());

-- Rate limiting pour les Edge Functions
create table public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  function_name text not null,
  count integer default 1,
  window_start timestamptz default now(),
  created_at timestamptz default now()
);

create index rate_limits_user_fn_idx on public.rate_limits(user_id, function_name);

alter table public.rate_limits enable row level security;

create policy "L'utilisateur voit ses limites"
  on public.rate_limits for select to authenticated
  using (auth.uid() = user_id);

create policy "L'utilisateur crée ses limites"
  on public.rate_limits for insert to authenticated
  with check (auth.uid() = user_id);

create policy "L'utilisateur modifie ses limites"
  on public.rate_limits for update to authenticated
  using (auth.uid() = user_id);

-- Fonction de vérification rate limit
create or replace function check_rate_limit(
  p_user_id uuid,
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
begin
  v_window := now() - (p_window_hours || ' hours')::interval;

  select count into v_count
  from public.rate_limits
  where user_id = p_user_id
    and function_name = p_function
    and window_start > v_window;

  if v_count is null then
    insert into public.rate_limits (user_id, function_name, count, window_start)
    values (p_user_id, p_function, 1, now());
    return true;
  end if;

  if v_count >= p_max_requests then
    return false;
  end if;

  update public.rate_limits
  set count = count + 1
  where user_id = p_user_id
    and function_name = p_function
    and window_start > v_window;

  return true;
end;
$$;

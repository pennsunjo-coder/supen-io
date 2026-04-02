-- Profils utilisateur pour l'onboarding et la personnalisation
create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  first_name text default '',
  platforms text[] default '{}',
  source_platform text default '',
  niche text default '',
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);

create index user_profiles_user_id_idx on public.user_profiles(user_id);

alter table public.user_profiles enable row level security;

create policy "L'utilisateur voit son profil"
  on public.user_profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "L'utilisateur crée son profil"
  on public.user_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "L'utilisateur modifie son profil"
  on public.user_profiles for update
  to authenticated
  using (auth.uid() = user_id);

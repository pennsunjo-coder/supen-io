-- ============================================================
-- Migration : tables sources & conversations pour Supen.io
-- ============================================================

-- 1. Table des sources (PDFs, URLs, notes)
create table if not exists public.sources (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null check (type in ('url', 'note', 'pdf')),
  title      text not null,
  content    text not null default '',
  file_path  text,
  created_at timestamptz not null default now()
);

-- Index pour les requêtes par utilisateur
create index if not exists idx_sources_user_id on public.sources(user_id);

-- RLS : chaque utilisateur ne voit que ses propres sources
alter table public.sources enable row level security;

create policy "Les utilisateurs voient leurs propres sources"
  on public.sources for select
  using (auth.uid() = user_id);

create policy "Les utilisateurs insèrent leurs propres sources"
  on public.sources for insert
  with check (auth.uid() = user_id);

create policy "Les utilisateurs suppriment leurs propres sources"
  on public.sources for delete
  using (auth.uid() = user_id);

create policy "Les utilisateurs modifient leurs propres sources"
  on public.sources for update
  using (auth.uid() = user_id);

-- 2. Table des conversations
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  messages   jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conversations_user_id on public.conversations(user_id);

alter table public.conversations enable row level security;

create policy "Les utilisateurs voient leurs propres conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Les utilisateurs insèrent leurs propres conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Les utilisateurs modifient leurs propres conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Les utilisateurs suppriment leurs propres conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- 3. Bucket de stockage pour les fichiers PDF
insert into storage.buckets (id, name, public)
values ('sources', 'sources', false)
on conflict (id) do nothing;

-- Politique de stockage : upload et lecture par le propriétaire
create policy "Upload fichiers sources"
  on storage.objects for insert
  with check (
    bucket_id = 'sources'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Lecture fichiers sources"
  on storage.objects for select
  using (
    bucket_id = 'sources'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Suppression fichiers sources"
  on storage.objects for delete
  using (
    bucket_id = 'sources'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

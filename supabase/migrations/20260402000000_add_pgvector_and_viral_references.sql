-- Activer l'extension pg_trgm pour la recherche par similarité textuelle
create extension if not exists pg_trgm with schema extensions;

-- Table des modèles viraux
create table public.viral_references (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  platform text not null,
  format text not null,
  created_at timestamptz default now()
);

-- Index GIN trigram pour la recherche textuelle rapide
create index viral_references_content_trgm_idx
  on public.viral_references
  using gin (content extensions.gin_trgm_ops);

-- RLS : lecture publique (les modèles viraux sont partagés)
alter table public.viral_references enable row level security;

create policy "Lecture publique des modèles viraux"
  on public.viral_references for select
  to authenticated
  using (true);

-- Fonction de recherche par similarité textuelle (pg_trgm)
create or replace function match_viral_references(
  query_text text,
  match_count int default 3,
  filter_platform text default null,
  filter_format text default null
)
returns table (
  id uuid,
  content text,
  platform text,
  format text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    vr.id,
    vr.content,
    vr.platform,
    vr.format,
    extensions.similarity(vr.content, query_text)::float as similarity
  from public.viral_references vr
  where
    (filter_platform is null or vr.platform = filter_platform)
    and (filter_format is null or vr.format = filter_format)
    and extensions.similarity(vr.content, query_text) > 0.05
  order by extensions.similarity(vr.content, query_text) desc
  limit match_count;
end;
$$;

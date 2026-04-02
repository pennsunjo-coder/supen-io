-- Activer l'extension pgvector pour le stockage et la recherche de vecteurs
create extension if not exists vector with schema extensions;

-- Table des modèles viraux avec embeddings
create table public.viral_references (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  platform text not null,
  format text not null,
  embedding vector(1024),
  created_at timestamptz default now()
);

-- Index HNSW pour la recherche de similarité rapide
create index on public.viral_references
  using hnsw (embedding vector_cosine_ops);

-- RLS : lecture publique (les modèles viraux sont partagés)
alter table public.viral_references enable row level security;

create policy "Lecture publique des modèles viraux"
  on public.viral_references for select
  to authenticated
  using (true);

-- Fonction de recherche par similarité cosinus
create or replace function match_viral_references(
  query_embedding vector(1024),
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
    1 - (vr.embedding <=> query_embedding) as similarity
  from public.viral_references vr
  where
    (filter_platform is null or vr.platform = filter_platform)
    and (filter_format is null or vr.format = filter_format)
  order by vr.embedding <=> query_embedding
  limit match_count;
end;
$$;

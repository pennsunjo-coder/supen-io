-- Table pour stocker les contenus générés par l'utilisateur
create table public.generated_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null,
  format text not null,
  content text not null,
  source_ids uuid[] default '{}',
  created_at timestamptz default now()
);

create index generated_content_user_id_idx on public.generated_content(user_id);

alter table public.generated_content enable row level security;

create policy "L'utilisateur voit ses contenus générés"
  on public.generated_content for select
  to authenticated
  using (auth.uid() = user_id);

create policy "L'utilisateur crée ses contenus générés"
  on public.generated_content for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "L'utilisateur supprime ses contenus générés"
  on public.generated_content for delete
  to authenticated
  using (auth.uid() = user_id);

-- Index GIN trigram sur la colonne content de sources pour la recherche textuelle
create index if not exists sources_content_trgm_idx
  on public.sources
  using gin (content extensions.gin_trgm_ops);

-- Fonction de recherche dans les sources de l'utilisateur par similarité textuelle
create or replace function search_user_sources(
  query_text text,
  source_ids uuid[],
  match_count int default 3
)
returns table (
  id uuid,
  title text,
  content text,
  type text,
  similarity float
)
language plpgsql
security definer
as $$
begin
  return query
  select
    s.id,
    s.title,
    s.content,
    s.type,
    extensions.similarity(s.content, query_text)::float as similarity
  from public.sources s
  where
    s.id = any(source_ids)
    and s.user_id = auth.uid()
    and length(s.content) > 0
    and extensions.similarity(s.content, query_text) > 0.02
  order by extensions.similarity(s.content, query_text) desc
  limit match_count;
end;
$$;

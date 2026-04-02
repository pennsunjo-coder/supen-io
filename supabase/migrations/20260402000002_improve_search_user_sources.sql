-- Améliore la fonction search_user_sources avec score pondéré
-- 60% similarity + 40% word_similarity pour de meilleurs résultats
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
    left(s.content, 3000) as content,
    s.type,
    (
      0.6 * extensions.similarity(s.content, query_text)::float
      + 0.4 * extensions.word_similarity(query_text, s.content)::float
    ) as similarity
  from public.sources s
  where
    s.id = any(source_ids)
    and s.user_id = auth.uid()
    and length(s.content) > 0
    and (
      extensions.similarity(s.content, query_text) > 0.05
      or extensions.word_similarity(query_text, s.content) > 0.05
    )
  order by (
    0.6 * extensions.similarity(s.content, query_text)::float
    + 0.4 * extensions.word_similarity(query_text, s.content)::float
  ) desc
  limit match_count;
end;
$$;

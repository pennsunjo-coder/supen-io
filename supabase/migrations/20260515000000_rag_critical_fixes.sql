-- RAG critical fixes:
--   1. search_sources_semantic must filter by selected source IDs (was returning matches across all user sources)
--   2. Drop unused English-only FTS index, add accent-insensitive trigram matching for FR/multilingual content
--   3. Tighter, faster source-id filtering on the existing trigram search

-- ── Required extensions ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- ── Fix 1: semantic search now respects source_ids ──────────────────────
DROP FUNCTION IF EXISTS search_sources_semantic(vector, uuid, int, float);

CREATE OR REPLACE FUNCTION search_sources_semantic(
  query_embedding vector(1536),
  user_id_param UUID,
  source_ids UUID[] DEFAULT NULL,
  match_count INT DEFAULT 8,
  match_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  type TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.content,
    s.type,
    (1 - (s.embedding <=> query_embedding))::FLOAT AS similarity
  FROM public.sources s
  WHERE s.user_id = user_id_param
    AND s.embedding IS NOT NULL
    AND (source_ids IS NULL OR s.id = ANY(source_ids))
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ── Fix 3: accent-insensitive trigram search ────────────────────────────
CREATE OR REPLACE FUNCTION search_user_sources(
  query_text TEXT,
  source_ids UUID[],
  match_count INT DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  type TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  q TEXT := extensions.unaccent(query_text);
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    LEFT(s.content, 3000) AS content,
    s.type,
    (
      0.6 * extensions.similarity(extensions.unaccent(s.content), q)::FLOAT
      + 0.4 * extensions.word_similarity(q, extensions.unaccent(s.content))::FLOAT
    ) AS similarity
  FROM public.sources s
  WHERE
    s.id = ANY(source_ids)
    AND s.user_id = auth.uid()
    AND length(s.content) > 0
    AND (
      extensions.similarity(extensions.unaccent(s.content), q) > 0.05
      OR extensions.word_similarity(q, extensions.unaccent(s.content)) > 0.05
    )
  ORDER BY (
    0.6 * extensions.similarity(extensions.unaccent(s.content), q)::FLOAT
    + 0.4 * extensions.word_similarity(q, extensions.unaccent(s.content))::FLOAT
  ) DESC
  LIMIT match_count;
END;
$$;

-- ── Drop the dead English-only FTS index (never queried in code) ────────
DROP INDEX IF EXISTS idx_sources_content_fts;

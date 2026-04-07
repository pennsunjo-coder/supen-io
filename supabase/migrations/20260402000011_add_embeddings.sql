-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to sources
ALTER TABLE public.sources
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create ivfflat index for fast cosine similarity search
-- (will be created once there are enough rows; works without it too)
CREATE INDEX IF NOT EXISTS sources_embedding_idx
ON public.sources
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Semantic search function using cosine similarity
CREATE OR REPLACE FUNCTION search_sources_semantic(
  query_embedding vector(1536),
  user_id_param UUID,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.4
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  type TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
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
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

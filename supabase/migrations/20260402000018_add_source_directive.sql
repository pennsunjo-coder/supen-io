-- Add directive column to sources for RAG focus instructions
ALTER TABLE sources
ADD COLUMN IF NOT EXISTS directive TEXT DEFAULT '';

-- Index for user source lookups
CREATE INDEX IF NOT EXISTS idx_sources_user_date
ON sources(user_id, created_at DESC);

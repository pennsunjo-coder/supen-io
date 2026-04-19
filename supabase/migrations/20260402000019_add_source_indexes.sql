-- Full-text search index on source content
CREATE INDEX IF NOT EXISTS idx_sources_content_fts
ON sources USING gin(to_tsvector('english', content));

-- Index for user source lookups by title
CREATE INDEX IF NOT EXISTS idx_sources_title
ON sources(user_id, title);

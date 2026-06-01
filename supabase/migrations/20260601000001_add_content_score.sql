-- Per-chunk content quality score (0.0 – 1.0).
-- Computed client-side at upload time via heuristic regex scoring.
-- Used by searchUserSources() to filter out boilerplate chunks (Table of
-- Contents, copyright pages, page headers, navigation, bibliographies)
-- and to re-rank surviving chunks as similarity × score, so that high-
-- signal content (specific numbers, named tools, real URLs, quoted
-- prompts) gets injected into Studio generation prompts ahead of low-
-- signal background prose.
--
-- Default is 0.5 (neutral) so existing rows continue to work without
-- a backfill — RAG retrieval treats unscored chunks as average quality,
-- not as boilerplate.

ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS content_score FLOAT DEFAULT 0.5;

COMMENT ON COLUMN public.sources.content_score IS
  'Heuristic 0-1 viral/quality score for the chunk content. Computed at upload via src/lib/content-score.ts. Used to filter boilerplate and re-rank RAG retrievals in searchUserSources.';

-- Light index so we can WHERE / ORDER BY score cheaply if we ever push
-- the filter into the RPC instead of the client.
CREATE INDEX IF NOT EXISTS sources_content_score_idx
  ON public.sources (content_score);

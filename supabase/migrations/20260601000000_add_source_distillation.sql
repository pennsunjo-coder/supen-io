-- Smart source distillation column.
-- When a user uploads a PDF / URL / note / web-search result, an async edge
-- function ("distill-source") runs the raw extracted text through Claude and
-- extracts viral patterns: hooks, named entities (tools/URLs/numbers/people),
-- reusable structures, and one core insight. The result is stored here as a
-- JSONB blob and injected into the generation system prompt by StudioWizard
-- so the model writes content that mirrors the source's viral DNA — not just
-- its raw text.
--
-- Shape of the JSONB (enforced client-side, not in DB):
-- {
--   "core_insight": "<1 sentence>",
--   "viral_hooks": ["<verbatim-or-near sentence>", ...],
--   "named_entities": {
--     "tools": ["NotebookLM", "Gemini", ...],
--     "urls":  ["https://...", ...],
--     "numbers_and_results": ["50k followers in 90 days", "$10k/month", ...],
--     "people": ["Awa K Pen", "MrBeast", ...]
--   },
--   "reusable_structures": [
--     { "name": "historical_analogy", "template": "In [YEAR], [X] killed [Y]. ..." }
--   ],
--   "distilled_at": "2026-06-01T12:00:00Z",
--   "model": "claude-opus-4-8"
-- }

ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS distillation JSONB DEFAULT NULL;

COMMENT ON COLUMN public.sources.distillation IS
  'Viral patterns extracted from this source by the distill-source edge function. Used to enrich generation prompts in StudioWizard.';

-- Light GIN index so we can grep distilled hooks/entities cheaply later
-- (e.g. for the "Reuse this hook" UI we may build, or for waitlist
-- analytics on what tools users research).
CREATE INDEX IF NOT EXISTS sources_distillation_gin
  ON public.sources USING GIN (distillation jsonb_path_ops);

-- Content quality tracking columns + edits table.
--
-- Why these columns:
-- - ai_flavor_score: deterministic 0-100 score from ai-flavor-detector.ts
--   (banned words, parallelisms, hedging, etc.). Persisted so analytics
--   can correlate flavor with engagement and so we can recalibrate the
--   30-point retry threshold from real data.
-- - style_memory_used: BOOLEAN flag indicating whether the user's style
--   memory block was injected at generation time. With ~2 weeks of data
--   we can A/B-measure the memory's impact on viral_score and
--   ai_flavor_score.

ALTER TABLE public.generated_content
  ADD COLUMN IF NOT EXISTS ai_flavor_score INT,
  ADD COLUMN IF NOT EXISTS style_memory_used BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.generated_content.ai_flavor_score IS
  '0-100 AI-flavor score from detectAiFlavor() at generation time. Higher = more AI-flavoured.';
COMMENT ON COLUMN public.generated_content.style_memory_used IS
  'Whether the user style memory block was injected into the system prompt for this generation.';

-- Index used to compute calibration metrics (mean / median flavor by
-- platform, by week) without scanning the whole table.
CREATE INDEX IF NOT EXISTS generated_content_flavor_idx
  ON public.generated_content (platform, created_at DESC, ai_flavor_score);

-- ─── User edits log ───
--
-- Captures every manual edit a user makes to a generated variation.
-- Used to fine-tune the user style memory: if a user consistently
-- rewrites the hook on every variation, the next generation should
-- bias toward their hook style.

CREATE TABLE IF NOT EXISTS public.user_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.generated_content(id) ON DELETE CASCADE,
  platform TEXT,
  before_content TEXT NOT NULL,
  after_content TEXT NOT NULL,
  before_word_count INT,
  after_word_count INT,
  before_flavor_score INT,
  after_flavor_score INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_edits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_edits_select_own" ON public.user_edits;
CREATE POLICY "user_edits_select_own"
  ON public.user_edits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_edits_insert_own" ON public.user_edits;
CREATE POLICY "user_edits_insert_own"
  ON public.user_edits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_edits_user_created_idx
  ON public.user_edits (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_edits_content_idx
  ON public.user_edits (content_id);

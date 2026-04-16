-- Extend user_profiles with personalization fields used by Settings and user-memory
-- Idempotent: safe to re-run
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS content_frequency TEXT DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS content_goals TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_tone TEXT DEFAULT 'educational',
  ADD COLUMN IF NOT EXISTS preferred_length TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS last_topics TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avg_score INTEGER DEFAULT 0;

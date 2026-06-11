-- Fix the generation-quota count that was silently broken since launch.
--
-- The Studio Wizard used to read `content_sessions` to count how many
-- generations a user had run. But `content_sessions` requires a column
-- `format` that the table never had — every insert raised
-- "ERROR 42703: column 'format' does not exist" and was swallowed by a
-- best-effort try/catch. Result: the table stayed empty forever, the
-- count was always 0, and no free user ever hit their 3-lifetime cap.
-- Free users could generate without limit; paying users would never see
-- a real day/month cap either.
--
-- Two-part fix:
--   1. Add the missing `format` column so the (still-useful) session
--      metadata insert finally lands.
--   2. Switch the quota source of truth to `generated_content` via a
--      stable SQL function. Each click on Generate writes one
--      session_id with 1-5 variation rows, so COUNT(DISTINCT session_id)
--      is the right shape — and `generated_content` has 700+ historical
--      rows so the count is correct from day one with no backfill.

ALTER TABLE public.content_sessions
  ADD COLUMN IF NOT EXISTS format TEXT;

CREATE OR REPLACE FUNCTION public.count_generation_sessions(
  p_user_id uuid,
  p_since   timestamptz DEFAULT NULL
) RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT session_id)::int
  FROM public.generated_content
  WHERE user_id = p_user_id
    AND session_id IS NOT NULL
    AND (p_since IS NULL OR created_at >= p_since);
$$;

COMMENT ON FUNCTION public.count_generation_sessions IS
  'Counts distinct Studio Wizard generation clicks for a user since p_since (or lifetime if NULL). One Generate click = one session_id = up to 5 variation rows in generated_content. Used by StudioWizard quota check.';

GRANT EXECUTE ON FUNCTION public.count_generation_sessions(uuid, timestamptz) TO authenticated;

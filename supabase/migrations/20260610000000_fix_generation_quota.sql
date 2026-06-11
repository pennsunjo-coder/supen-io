-- Fix the generation-quota count that was silently broken since launch.
--
-- The Studio Wizard used to read `content_sessions` to count how many
-- generations a user had run. But `content_sessions` was missing the
-- `format` column the Studio insert sent, so every insert raised
-- "ERROR 42703: column 'format' does not exist" and was swallowed by a
-- best-effort try/catch. Result: the table stayed empty forever and the
-- quota check (Plus = 20/day & 100/month, Pro = unlimited) was a no-op
-- because the source count was always 0.
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

-- Table to track per-user function call counts for rate limiting.
-- Used by the generate-gemini-image edge function for monthly image quotas.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text        NOT NULL,
  created_at    timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limits_lookup_idx
  ON public.rate_limits (user_id, function_name, created_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_rate_limits_select" ON public.rate_limits;
CREATE POLICY "users_own_rate_limits_select" ON public.rate_limits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_own_rate_limits_insert" ON public.rate_limits;
CREATE POLICY "users_own_rate_limits_insert" ON public.rate_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Returns TRUE if the user is under the cap (and records the new call).
-- Returns FALSE if the cap is already reached.
-- SECURITY DEFINER so edge functions calling via user-JWT can still write.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id      uuid,
  p_function     text,
  p_max_requests int,
  p_window_hours int
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count        int;
  v_window_start timestamptz;
BEGIN
  v_window_start := now() - (p_window_hours || ' hours')::interval;

  SELECT COUNT(*) INTO v_count
  FROM public.rate_limits
  WHERE user_id       = p_user_id
    AND function_name  = p_function
    AND created_at    >= v_window_start;

  IF v_count < p_max_requests THEN
    INSERT INTO public.rate_limits (user_id, function_name)
    VALUES (p_user_id, p_function);
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, int, int)
  TO authenticated;

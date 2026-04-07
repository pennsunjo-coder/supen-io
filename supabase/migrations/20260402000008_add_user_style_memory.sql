-- User style memory: tracks which content the user copies/saves/likes
-- Used to personalize future generations with the user's preferred style

CREATE TABLE IF NOT EXISTS public.user_style_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  platform TEXT NOT NULL,
  angle TEXT,
  viral_score INTEGER DEFAULT 0,
  interaction_type TEXT NOT NULL, -- 'copied', 'saved', 'liked'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_style_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own style memory"
  ON public.user_style_memory
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_style_memory_lookup
  ON public.user_style_memory(user_id, platform, created_at DESC);

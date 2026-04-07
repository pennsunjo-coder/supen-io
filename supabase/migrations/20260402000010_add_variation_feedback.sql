-- Variation feedback: tracks user like/dislike on generated content
-- Powers the learning loop that personalizes future generations

CREATE TABLE IF NOT EXISTS public.variation_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.generated_content(id) ON DELETE CASCADE,
  content_preview TEXT NOT NULL,
  platform TEXT NOT NULL,
  angle TEXT,
  viral_score INTEGER DEFAULT 0,
  rating TEXT NOT NULL CHECK (rating IN ('liked', 'disliked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.variation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own feedback"
  ON public.variation_feedback
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_variation_feedback_user
  ON public.variation_feedback(user_id, platform, rating);

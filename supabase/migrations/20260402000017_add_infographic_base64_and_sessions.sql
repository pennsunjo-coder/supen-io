-- Ajouter colonnes infographie dans generated_content
ALTER TABLE generated_content
ADD COLUMN IF NOT EXISTS infographic_base64 TEXT,
ADD COLUMN IF NOT EXISTS infographic_mode TEXT,
ADD COLUMN IF NOT EXISTS parent_content TEXT,
ADD COLUMN IF NOT EXISTS session_id UUID;

-- Index pour regrouper par session
CREATE INDEX IF NOT EXISTS idx_generated_content_session_id ON generated_content(session_id);

-- Table session pour grouper contenu + infographie
CREATE TABLE IF NOT EXISTS content_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  platform TEXT NOT NULL,
  format TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own sessions"
  ON content_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Hardening Row Level Security for generated_content
-- Ensures users can only insert or update rows where user_id matches their auth.uid()

-- 1. Enable RLS (just in case)
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can only insert their own content" ON generated_content;
DROP POLICY IF EXISTS "Users can only view their own content" ON generated_content;
DROP POLICY IF EXISTS "Users can only update their own content" ON generated_content;
DROP POLICY IF EXISTS "Users can only delete their own content" ON generated_content;

-- 3. Create strict policies
CREATE POLICY "Users can insert their own content" 
ON generated_content FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own content" 
ON generated_content FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own content" 
ON generated_content FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content" 
ON generated_content FOR DELETE 
USING (auth.uid() = user_id);

-- Apply the same for content_sessions if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'content_sessions') THEN
        ALTER TABLE content_sessions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can manage their own sessions" ON content_sessions;
        CREATE POLICY "Users can manage their own sessions" ON content_sessions
        FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

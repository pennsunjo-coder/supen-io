-- Robust Security Hardening Migration
-- Drops existing policies by checking their existence first to avoid collisions.

DO $$ 
BEGIN
    -- 1. Table generated_content
    ALTER TABLE IF EXISTS generated_content ENABLE ROW LEVEL SECURITY;
    
    -- Clean up all possible policy names (old and new)
    EXECUTE (SELECT 'DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON generated_content' 
             FROM pg_policies WHERE tablename = 'generated_content');

    -- Create new strict policies
    CREATE POLICY "Users can insert their own content" ON generated_content FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can view their own content" ON generated_content FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can update their own content" ON generated_content FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete their own content" ON generated_content FOR DELETE USING (auth.uid() = user_id);

    -- 2. Table content_sessions
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'content_sessions') THEN
        ALTER TABLE content_sessions ENABLE ROW LEVEL SECURITY;
        EXECUTE (SELECT 'DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON content_sessions' 
                 FROM pg_policies WHERE tablename = 'content_sessions');
        CREATE POLICY "Users can manage their own sessions" ON content_sessions FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- 3. Table sources (Harden existing)
    ALTER TABLE IF EXISTS sources ENABLE ROW LEVEL SECURITY;
    EXECUTE (SELECT 'DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON sources' 
             FROM pg_policies WHERE tablename = 'sources');
    CREATE POLICY "Users can manage their own sources" ON sources FOR ALL USING (auth.uid() = user_id);

END $$;

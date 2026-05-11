-- ULTIMATE CLEANUP & REPAIR SCRIPT
-- Run this in Supabase SQL Editor to fix 500/400 errors

DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- 1. DROP ALL POLICIES on critical tables to stop recursion/conflicts
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('generated_content', 'content_sessions', 'sources', 'rate_limits'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;

    -- 2. RESET RLS
    ALTER TABLE IF EXISTS generated_content ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS content_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS sources ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS rate_limits ENABLE ROW LEVEL SECURITY;

    -- 3. CREATE CLEAN, UNIQUE POLICIES
    -- Generated Content
    CREATE POLICY "gc_select_owner" ON generated_content FOR SELECT TO authenticated USING (auth.uid() = user_id);
    CREATE POLICY "gc_insert_owner" ON generated_content FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "gc_update_owner" ON generated_content FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "gc_delete_owner" ON generated_content FOR DELETE TO authenticated USING (auth.uid() = user_id);

    -- Content Sessions
    CREATE POLICY "cs_all_owner" ON content_sessions FOR ALL TO authenticated USING (auth.uid() = user_id);

    -- Sources
    CREATE POLICY "src_all_owner" ON sources FOR ALL TO authenticated USING (auth.uid() = user_id);

    -- Rate Limits
    CREATE POLICY "rl_all_owner" ON rate_limits FOR ALL TO authenticated USING (auth.uid() = user_id);

END $$;

-- Admin RLS policies: allow gamalielkelman@gmail.com to read all data

-- Drop existing select policies to replace them
DROP POLICY IF EXISTS "L'utilisateur voit son profil" ON public.user_profiles;
CREATE POLICY "User or admin reads profiles" ON public.user_profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR auth.jwt() ->> 'email' = 'gamalielkelman@gmail.com'
);

-- generated_content: allow admin to read all
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'generated_content' AND policyname = 'L''utilisateur voit ses contenus'
  ) THEN
    DROP POLICY "L'utilisateur voit ses contenus" ON public.generated_content;
  END IF;
END $$;

CREATE POLICY "User or admin reads content" ON public.generated_content
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR auth.jwt() ->> 'email' = 'gamalielkelman@gmail.com'
);

-- sources: allow admin to read all
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sources' AND policyname = 'L''utilisateur voit ses sources'
  ) THEN
    DROP POLICY "L'utilisateur voit ses sources" ON public.sources;
  END IF;
END $$;

CREATE POLICY "User or admin reads sources" ON public.sources
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR auth.jwt() ->> 'email' = 'gamalielkelman@gmail.com'
);

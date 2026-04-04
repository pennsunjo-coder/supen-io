-- Auto-create user_profile when a new user signs up (email or OAuth)
-- Extracts first name from Google metadata or email prefix

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, first_name, onboarding_completed)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'given_name',
      split_part(new.email, '@', 1)
    ),
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Allow user to delete their own profile (needed for Settings > Delete Account)
CREATE POLICY "L'utilisateur supprime son profil"
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

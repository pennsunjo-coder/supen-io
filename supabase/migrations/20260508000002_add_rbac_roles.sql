-- ============================================================
-- Migration : RBAC (Role Based Access Control) Professionnel
-- ============================================================

-- 1. Ajout de la colonne role aux profils
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- 2. Mise à jour de la fonction is_admin pour utiliser le rôle
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- 3. Nomination de l'admin actuel par son rôle
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'gamalielkelman@gmail.com';

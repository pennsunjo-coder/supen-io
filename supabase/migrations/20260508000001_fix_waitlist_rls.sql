-- ============================================================
-- Migration : Correction critique RLS Waitlist & Sécurisation
-- ============================================================

-- 1. Correction de la politique SELECT sur la waitlist
-- On supprime la politique permissive qui permettait de lire tous les emails
DROP POLICY IF EXISTS "Anyone can read waitlist count" ON public.waitlist;

-- On crée une nouvelle politique qui n'autorise que les admins à voir les données
CREATE POLICY "Admins can read waitlist"
  ON public.waitlist FOR SELECT
  USING (public.is_admin());

-- 2. Ajout d'une politique pour permettre aux utilisateurs de voir leur propre inscription (par email)
-- Note: Nécessite que l'utilisateur soit authentifié avec le même email
CREATE POLICY "Users can see their own waitlist entry"
  ON public.waitlist FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- 3. Sécurisation supplémentaire : Limitation de l'INSERT
-- On pourrait ajouter un rate limit ici plus tard via une fonction de trigger

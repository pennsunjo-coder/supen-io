-- Nettoyage des brouillons (sessions sans infographie) pour tous les comptes
-- Cette migration supprime les contenus générés qui n'ont pas de visuel associé

-- 1. Supprimer les contenus dont la session n'a aucune infographie
DELETE FROM public.generated_content
WHERE session_id IN (
    SELECT session_id
    FROM public.generated_content
    WHERE session_id IS NOT NULL
    GROUP BY session_id
    HAVING COUNT(infographic_base64) FILTER (WHERE infographic_base64 IS NOT NULL) = 0
);

-- 2. Supprimer les contenus orphelins (sans session_id) qui n'ont pas d'infographie
DELETE FROM public.generated_content
WHERE session_id IS NULL AND infographic_base64 IS NULL;

-- 3. Nettoyer les sessions vides dans content_sessions
DELETE FROM public.content_sessions
WHERE id NOT IN (
    SELECT DISTINCT session_id FROM public.generated_content WHERE session_id IS NOT NULL
);

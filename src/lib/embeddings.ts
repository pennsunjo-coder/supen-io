import { supabase } from "@/lib/supabase";

export interface ViralReference {
  id: string;
  content: string;
  platform: string;
  format: string;
  similarity: number;
}

/**
 * Recherche les modèles viraux les plus similaires au texte donné.
 * Utilise pg_trgm directement dans Supabase.
 */
export async function searchViralReferences(
  text: string,
  platform?: string,
  format?: string,
  matchCount: number = 3
): Promise<ViralReference[]> {
  const { data, error } = await supabase.rpc("match_viral_references", {
    query_text: text,
    match_count: matchCount,
    filter_platform: platform ?? null,
    filter_format: format ?? null,
  });

  if (error) {
    throw new Error(`Erreur recherche RAG : ${error.message}`);
  }

  return (data as ViralReference[]) ?? [];
}

/* ─── RAG sur les sources utilisateur ─── */

export interface UserSourceMatch {
  id: string;
  title: string;
  content: string;
  type: string;
  similarity: number;
}

/**
 * Recherche dans les sources de l'utilisateur les contenus les plus
 * pertinents par similarité textuelle (pg_trgm).
 * Filtre par les IDs de sources actives.
 */
export async function searchUserSources(
  query: string,
  activeSourceIds: string[],
  limit: number = 5
): Promise<UserSourceMatch[]> {
  if (activeSourceIds.length === 0) return [];

  const { data, error } = await supabase.rpc("search_user_sources", {
    query_text: query,
    source_ids: activeSourceIds,
    match_count: limit,
  });

  if (error) {
    throw new Error(`Erreur recherche sources : ${error.message}`);
  }

  return (data as UserSourceMatch[]) ?? [];
}

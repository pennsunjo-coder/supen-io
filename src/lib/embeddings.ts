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
 * Utilise pg_trgm (similarité trigram) directement dans Supabase,
 * sans API externe ni embeddings.
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

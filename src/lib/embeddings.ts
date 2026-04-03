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
 */
export async function searchViralReferences(
  text: string,
  platform?: string,
  format?: string,
  matchCount: number = 3
): Promise<ViralReference[]> {
  try {
    const { data, error } = await supabase.rpc("match_viral_references", {
      query_text: text,
      match_count: matchCount,
      filter_platform: platform ?? null,
      filter_format: format ?? null,
    });

    if (error) {
      console.warn("searchViralReferences RPC error:", error.message);
      return [];
    }

    return (data as ViralReference[]) ?? [];
  } catch (err) {
    console.warn("searchViralReferences exception:", err);
    return [];
  }
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
 * Fallback : retourne les sources directement si la fonction RPC n'existe pas.
 */
export async function searchUserSources(
  query: string,
  activeSourceIds: string[],
  limit: number = 5
): Promise<UserSourceMatch[]> {
  if (activeSourceIds.length === 0) return [];

  // Essayer le RPC pg_trgm d'abord
  try {
    const { data, error } = await supabase.rpc("search_user_sources", {
      query_text: query,
      source_ids: activeSourceIds,
      match_count: limit,
    });

    if (!error && data && data.length > 0) {
      console.log("🟢 RAG: found", data.length, "matching chunks via pg_trgm");
      return data as UserSourceMatch[];
    }

    if (error) {
      console.warn("🟡 RAG RPC error (using fallback):", error.message);
    }
  } catch (err) {
    console.warn("🟡 RAG RPC exception (using fallback):", err);
  }

  // Fallback : retourner les sources directement sans scoring
  try {
    const { data: sources, error } = await supabase
      .from("sources")
      .select("id, title, content, type")
      .in("id", activeSourceIds)
      .limit(limit);

    if (error || !sources) {
      console.warn("🔴 RAG fallback error:", error?.message);
      return [];
    }

    console.log("🟢 RAG fallback: loaded", sources.length, "sources directly");
    return sources.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      type: s.type,
      similarity: 1,
    }));
  } catch {
    return [];
  }
}

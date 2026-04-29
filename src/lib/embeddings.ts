/**
 * Semantic search via pgvector embeddings + pg_trgm fallback.
 *
 * Architecture:
 * 1. Try semantic search (pgvector cosine similarity)
 * 2. Fallback to trigram search (pg_trgm)
 * 3. Ultimate fallback: load sources directly
 *
 * Embedding generation via Edge Function (OpenAI text-embedding-3-small).
 * If the Edge Function is not deployed, the system degrades gracefully
 * to trigram matching without any user-visible error.
 */

import { supabase } from "@/lib/supabase";

// ─── Viral references (unchanged) ───

export interface ViralReference {
  id: string;
  content: string;
  platform: string;
  format: string;
  similarity: number;
}

export async function searchViralReferences(
  text: string,
  platform?: string,
  format?: string,
  matchCount: number = 3,
): Promise<ViralReference[]> {
  try {
    const { data, error } = await supabase.rpc("match_viral_references", {
      query_text: text,
      match_count: matchCount,
      filter_platform: platform ?? null,
      filter_format: format ?? null,
    });
    if (error) return [];
    return (data as ViralReference[]) ?? [];
  } catch {
    return [];
  }
}

// ─── Embedding generation ───

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-embedding", {
      body: { text: text.slice(0, 8000) },
    });
    if (error || !data?.embedding) return null;
    return data.embedding as number[];
  } catch {
    return null;
  }
}

// ─── Semantic search on user sources ───

export interface UserSourceMatch {
  id: string;
  title: string;
  content: string;
  type: string;
  similarity: number;
}

/**
 * Search user sources using the best available method:
 * 1. Semantic search via pgvector (if embeddings exist)
 * 2. Trigram search via pg_trgm (if RPC available)
 * 3. Direct source loading (ultimate fallback)
 */
export async function searchUserSources(
  query: string,
  activeSourceIds: string[],
  limit: number = 8,
): Promise<UserSourceMatch[]> {
  if (activeSourceIds.length === 0) return [];

  console.log("[RAG] Searching", activeSourceIds.length, "sources, limit:", limit);

  // ── Strategy 1: Semantic search via pgvector ──
  try {
    const queryEmbedding = await generateEmbedding(query);
    if (queryEmbedding) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.rpc("search_sources_semantic", {
          query_embedding: JSON.stringify(queryEmbedding),
          user_id_param: user.id,
          match_count: limit,
          match_threshold: 0.35,
        });
        if (!error && data && data.length > 0) {
          console.log("[RAG] Vector search hit:", data.length, "results");
          return data as UserSourceMatch[];
        }
      }
    }
  } catch {
    // Semantic search unavailable — fall through
  }

  // ── Strategy 2: Trigram search via pg_trgm ──
  try {
    const { data, error } = await supabase.rpc("search_user_sources", {
      query_text: query,
      source_ids: activeSourceIds,
      match_count: limit,
    });
    if (!error && data && data.length > 0) {
      console.log("[RAG] Trigram search hit:", data.length, "results");
      return data as UserSourceMatch[];
    }
  } catch {
    // Trigram search unavailable — fall through
  }

  // ── Strategy 3: Direct source loading (no ranking) ──
  try {
    const { data: sources } = await supabase
      .from("sources")
      .select("id, title, content, type")
      .in("id", activeSourceIds)
      .limit(limit);

    if (sources) {
      console.log("[RAG] Direct load:", sources.length, "sources");
      return sources.map((s) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        type: s.type,
        similarity: 1,
      }));
    }
  } catch {
    // Nothing works
  }

  console.warn("[RAG] All strategies failed");
  return [];
}

// ─── Embed a source (fire and forget) ───

/**
 * Generate and store the embedding for a source.
 * Call this after inserting a new source. Non-blocking.
 */
export async function embedSource(sourceId: string, content: string): Promise<void> {
  try {
    const embedding = await generateEmbedding(content.slice(0, 8000));
    if (!embedding) return;

    await supabase
      .from("sources")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", sourceId);
  } catch {
    // Non-critical — source works without embedding
  }
}

// ─── Batch embed existing sources ───

/**
 * Embed all sources that don't have embeddings yet.
 * Useful for migrating existing data. Rate-limited to avoid API abuse.
 */
export async function embedAllExistingSources(userId: string): Promise<number> {
  try {
    const { data: sources } = await supabase
      .from("sources")
      .select("id, content")
      .eq("user_id", userId)
      .is("embedding", null)
      .not("content", "is", null)
      .limit(20);

    if (!sources || sources.length === 0) return 0;

    let count = 0;
    for (const source of sources) {
      if (source.content && source.content.length > 50) {
        await embedSource(source.id, source.content);
        count++;
        // Rate limit: 200ms between requests
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    return count;
  } catch {
    return 0;
  }
}

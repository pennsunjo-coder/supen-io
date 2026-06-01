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
  /** Heuristic 0-1 quality score from src/lib/content-score.ts. */
  content_score?: number;
}

// ─── Relevance filtering ───

/**
 * Minimum trigram score worth keeping — cuts common-word noise ("the", "how",
 * "you") that scrapes past the SQL floor (0.05) without being topically
 * relevant. Tightened from 0.08 → 0.12 after audit: keyword-only matches
 * around 0.08-0.10 were diluting Studio prompts with chunks that shared
 * vocabulary but no real topical overlap.
 */
export const TRIGRAM_RELEVANCE_FLOOR = 0.12;

/**
 * Drop chunks below this content_score from retrieval entirely. They're
 * Table-of-Contents / copyright / navigation pages — never useful as
 * source material. See src/lib/content-score.ts for the heuristic.
 */
const CONTENT_SCORE_FLOOR = 0.3;

/**
 * Drop weakly-related chunks so the generation prompt isn't diluted with
 * off-topic source text. `results` must arrive score-ordered (best first).
 *
 * Filtering is RELATIVE to the best match (scale-invariant). This is the key
 * design choice: short keyword queries make even a perfectly relevant chunk
 * score low, so an absolute cutoff would starve retrieval and push the model
 * back toward generic output. A relative cutoff instead keeps everything when
 * scores are uniformly low, and only trims the long tail when one chunk
 * clearly dominates. The optional absolute floor removes near-zero noise.
 *
 * Safety: never returns empty when given input — keeps the single best match
 * so the user's selected sources are always represented.
 */
export function filterByRelevance<T extends { similarity: number }>(
  results: T[],
  ratio = 0.5,
  absoluteFloor = 0,
): T[] {
  if (results.length <= 1) return results;
  const top = results[0]?.similarity ?? 0;
  const floor = Math.max(absoluteFloor, top * ratio);
  const kept = results.filter((r) => (r.similarity ?? 0) >= floor);
  return kept.length > 0 ? kept : results.slice(0, 1);
}

/**
 * Hydrate retrieved chunks with their content_score, drop boilerplate
 * (score < CONTENT_SCORE_FLOOR), and re-rank by similarity × content_score.
 *
 * The SQL RPCs return chunks ranked purely by topical similarity. That's
 * great for relevance but agnostic to QUALITY — a TOC page that happens
 * to share keywords with the query ranks the same as a viral-pattern-rich
 * paragraph. This step does the quality gate client-side:
 * 1. Fetch content_score for every returned chunk in a single query.
 * 2. Drop chunks below the floor (boilerplate).
 * 3. Re-rank by similarity × content_score so high-signal chunks bubble up.
 * 4. Slice back down to the caller's requested limit.
 *
 * Falls back gracefully if the column doesn't exist yet — pre-migration
 * rows just keep their similarity ranking unchanged.
 */
async function gateAndRankByQuality<T extends UserSourceMatch>(
  results: T[],
  limit: number,
): Promise<T[]> {
  if (results.length === 0) return results;

  // Fetch scores in one shot
  let scoreMap = new Map<string, number>();
  try {
    const ids = results.map((r) => r.id);
    const { data } = await supabase
      .from("sources")
      .select("id, content_score")
      .in("id", ids);
    if (data) {
      for (const row of data as Array<{ id: string; content_score: number | null }>) {
        if (row.content_score !== null && row.content_score !== undefined) {
          scoreMap.set(row.id, row.content_score);
        }
      }
    }
  } catch {
    // Column missing or DB error — degrade to similarity-only ranking
    scoreMap = new Map();
  }

  // Attach scores, drop boilerplate, re-rank
  const scored = results
    .map((r) => ({
      ...r,
      content_score: scoreMap.get(r.id) ?? 0.5,
    }))
    .filter((r) => (r.content_score ?? 0.5) >= CONTENT_SCORE_FLOOR);

  scored.sort((a, b) => {
    const aRank = a.similarity * (a.content_score ?? 0.5);
    const bRank = b.similarity * (b.content_score ?? 0.5);
    return bRank - aRank;
  });

  // Safety: if the quality gate stripped everything, return the original
  // top result so the user's sources are still represented.
  if (scored.length === 0 && results.length > 0) return results.slice(0, 1);

  return scored.slice(0, limit) as T[];
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

  // Over-fetch so the post-retrieval quality gate has headroom: if half
  // the topical matches turn out to be boilerplate (TOC, copyright,
  // navigation), we still have enough high-signal chunks left to fill
  // the caller's requested `limit`.
  const fetchCount = limit * 2;

  // ── Strategy 1: Semantic search via pgvector ──
  try {
    const queryEmbedding = await generateEmbedding(query);
    if (queryEmbedding) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.rpc("search_sources_semantic", {
          query_embedding: JSON.stringify(queryEmbedding),
          user_id_param: user.id,
          source_ids: activeSourceIds,
          match_count: fetchCount,
          match_threshold: 0.3,
        });
        if (!error && data && data.length > 0) {
          const relevant = filterByRelevance(data as UserSourceMatch[]);
          const gated = await gateAndRankByQuality(relevant, limit);
          console.log("[RAG] Vector:", data.length, "hits →", relevant.length, "relevant →", gated.length, "quality-gated");
          return gated;
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
      match_count: fetchCount,
    });
    if (!error && data && data.length > 0) {
      const relevant = filterByRelevance(data as UserSourceMatch[], 0.5, TRIGRAM_RELEVANCE_FLOOR);
      const gated = await gateAndRankByQuality(relevant, limit);
      console.log("[RAG] Trigram:", data.length, "hits →", relevant.length, "relevant →", gated.length, "quality-gated");
      return gated;
    }
  } catch {
    // Trigram search unavailable — fall through
  }

  // ── Strategy 3: Direct source loading (no ranking) ──
  // No similarity to rank by, but still drop boilerplate via content_score.
  try {
    const { data: sources } = await supabase
      .from("sources")
      .select("id, title, content, type, content_score")
      .in("id", activeSourceIds)
      .gte("content_score", CONTENT_SCORE_FLOOR)
      .order("content_score", { ascending: false })
      .limit(limit);

    if (sources && sources.length > 0) {
      console.log("[RAG] Direct load (quality-gated):", sources.length, "sources");
      return sources.map((s) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        type: s.type,
        similarity: 1,
        content_score: (s as { content_score?: number }).content_score ?? 0.5,
      }));
    }

    // Last resort: ignore quality gate so the user's sources are still
    // represented when all their chunks happen to score below the floor
    // (very small corpora, or pre-migration rows with NULL scores that
    // weren't backfilled).
    const { data: fallback } = await supabase
      .from("sources")
      .select("id, title, content, type")
      .in("id", activeSourceIds)
      .limit(limit);

    if (fallback) {
      console.log("[RAG] Direct load (fallback, no quality gate):", fallback.length, "sources");
      return fallback.map((s) => ({
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
      .limit(50);

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

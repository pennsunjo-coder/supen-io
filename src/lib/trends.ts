/**
 * Real-time trends via Tavily web search.
 * Detects what's buzzing in the user's niche.
 */

import { supabase } from "./supabase";

export interface Trend {
  title: string;
  url: string;
  snippet: string;
  score: number; // relevance 0-100
  source: string;
}

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
  snippet?: string;
}

const NICHE_QUERIES: Record<string, string> = {
  business: "entrepreneur business trends news 2026",
  marketing: "digital marketing trends viral content 2026",
  tech: "artificial intelligence technology trends 2026",
  finance: "finance investment trends 2026",
  fitness: "fitness health sports trends 2026",
  education: "education learning trends 2026",
  lifestyle: "personal development lifestyle trends 2026",
};

function buildTrendQuery(niche: string): string {
  if (!niche) return "social media trends 2026";
  const n = niche.toLowerCase();
  for (const [key, query] of Object.entries(NICHE_QUERIES)) {
    if (n.includes(key)) return query;
  }
  return `${niche} trends news 2026`;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url || "source";
  }
}

export async function fetchTrends(niche: string, maxResults: number = 8): Promise<Trend[]> {
  try {
    const query = buildTrendQuery(niche);
    const { data, error } = await supabase.functions.invoke("search-web", {
      body: { query, max_results: maxResults },
    });

    if (error) throw new Error(error.message);
    if (!data?.results || !Array.isArray(data.results)) return [];

    return (data.results as TavilyResult[]).map((r, i) => ({
      title: (r.title || "").slice(0, 200),
      url: r.url || "",
      snippet: (r.content || r.snippet || "").slice(0, 240),
      score: Math.max(0, 100 - i * 10),
      source: extractDomain(r.url || ""),
    })).filter((t) => t.title.length > 5);
  } catch {
    return [];
  }
}

// ─── localStorage cache for daily background fetch ───

interface CachedTrends {
  date: string; // YYYY-MM-DD
  niche: string;
  trends: Trend[];
}

const CACHE_KEY = "supen_trends_cache";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getCachedTrends(niche: string): Trend[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedTrends;
    if (cached.date !== todayKey() || cached.niche !== niche) return null;
    return cached.trends;
  } catch {
    return null;
  }
}

export function setCachedTrends(niche: string, trends: Trend[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ date: todayKey(), niche, trends }));
  } catch { /* quota exceeded — ignore */ }
}

/**
 * Background fetch — checks cache first, fetches only once per day per niche.
 */
export async function fetchTrendsDaily(niche: string): Promise<Trend[]> {
  const cached = getCachedTrends(niche);
  if (cached) return cached;

  const fresh = await fetchTrends(niche);
  if (fresh.length > 0) setCachedTrends(niche, fresh);
  return fresh;
}

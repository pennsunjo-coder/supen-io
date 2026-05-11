import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface GeneratedItem {
  id: string;
  platform: string;
  format: string;
  content: string;
  source_ids: string[];
  created_at: string;
  viral_score?: number;
  session_id?: string;
  infographic_base64?: string | null;
  infographic_html?: string | null;
  hasInfographic?: boolean;
  sessionInfographicBase64?: string | null;
}

export interface HistoryGroup {
  label: string;
  items: GeneratedItem[];
}

export interface HistorySession {
  sessionId: string;
  itemIds: string[];
  topic: string;
  platform: string;
  format: string;
  createdAt: string;
  variationCount: number;
  bestScore: number;
  infographic: string | null;
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= weekAgo) return "This week";
  return "Older";
}

function groupByDate(items: GeneratedItem[]): HistoryGroup[] {
  const groups = new Map<string, GeneratedItem[]>();
  const order = ["Today", "Yesterday", "This week", "Older"];

  for (const item of items) {
    const label = getDateLabel(item.created_at);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }

  return order
    .filter((label) => groups.has(label))
    .map((label) => ({ label, items: groups.get(label)! }));
}

// Lightweight columns — NO content field (too heavy for list view)
const LIST_COLS = "id, session_id, platform, format, content, viral_score, infographic_base64, created_at";
const LIST_COLS_FALLBACK = "id, platform, format, content, viral_score, created_at";

function processItems(data: any[]): GeneratedItem[] {
  const allItems = data as GeneratedItem[];

  const sessionInfographics = new Map<string, string>();
  for (const item of allItems) {
    if (!item.session_id) continue;
    if (item.format === "Infographic" && item.infographic_base64) {
      sessionInfographics.set(item.session_id, item.infographic_base64);
    }
    if (item.infographic_base64 && item.format !== "Infographic") {
      sessionInfographics.set(item.session_id, item.infographic_base64);
    }
  }

  return allItems
    .filter((i) => i.format !== "Infographic")
    .filter((i) => i.content && i.content.trim().length >= 20)
    .map((item) => {
      const infraBase64 = item.session_id ? sessionInfographics.get(item.session_id) : null;
      return {
        ...item,
        hasInfographic: !!infraBase64 || !!item.infographic_base64,
        sessionInfographicBase64: infraBase64 || item.infographic_base64 || null,
      };
    });
}

export function useHistory() {
  const { user } = useAuth();
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const cacheKey = user ? `supenli_history_${user.id}` : "";

  // Fetch from Supabase and update state + cache
  const fetchFromSupabase = useCallback(async () => {
    if (!user || fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      let { data, error } = await supabase
        .from("generated_content")
        .select(LIST_COLS)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        const fallback = await supabase
          .from("generated_content")
          .select(LIST_COLS_FALLBACK)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);
        data = fallback.data;
      }

      if (data) {
        const posts = processItems(data);
        setItems(posts);
        // Save to localStorage
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ data: posts, ts: Date.now() }));
        } catch { /* quota */ }
      }
    } catch { /* network */ }

    setLoading(false);
    fetchingRef.current = false;
  }, [user, cacheKey]);

  // On mount: load cache first, then fetch in background
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    // Step 1: instant load from localStorage
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const { data } = JSON.parse(raw);
        if (data?.length > 0) {
          setItems(data);
          setLoading(false);
        }
      }
    } catch { /* corrupt cache */ }

    // Step 2: fetch from Supabase (updates state + refreshes cache)
    fetchFromSupabase();
  }, [user, cacheKey, fetchFromSupabase]);

  const grouped = groupByDate(items);

  const sessions: HistorySession[] = (() => {
    const map = new Map<string, { items: GeneratedItem[]; infographic: string | null }>();
    for (const item of items) {
      const key = item.session_id || item.id;
      if (!map.has(key)) {
        map.set(key, { items: [], infographic: null });
      }
      const entry = map.get(key)!;
      entry.items.push(item);
      if (item.sessionInfographicBase64 && !entry.infographic) {
        entry.infographic = item.sessionInfographicBase64;
      }
    }
    return Array.from(map.entries())
      .map(([key, { items: sessionItems, infographic }]) => {
        const first = sessionItems[0];
        const bestScore = Math.max(...sessionItems.map((i) => i.viral_score || 0));
        return {
          sessionId: key,
          itemIds: sessionItems.map((i) => i.id),
          topic: first.content?.split(/\s+/).slice(0, 12).join(" ") || "Content",
          platform: first.platform,
          format: first.format,
          createdAt: first.created_at,
          variationCount: sessionItems.length,
          bestScore,
          infographic,
        };
      })
      .filter((s) => !!s.infographic) // Only show sessions that have a completed visual
      .sort((a, b) => {
        // Sort strictly by date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  })();

  return { items, grouped, sessions, loading, refetch: fetchFromSupabase };
}

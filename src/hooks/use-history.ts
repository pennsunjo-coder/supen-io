import { useState, useEffect, useCallback } from "react";
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

  if (date >= today) return "Aujourd'hui";
  if (date >= yesterday) return "Hier";
  if (date >= weekAgo) return "Cette semaine";
  return "Plus ancien";
}

function groupByDate(items: GeneratedItem[]): HistoryGroup[] {
  const groups = new Map<string, GeneratedItem[]>();
  const order = ["Aujourd'hui", "Hier", "Cette semaine", "Plus ancien"];

  for (const item of items) {
    const label = getDateLabel(item.created_at);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }

  return order
    .filter((label) => groups.has(label))
    .map((label) => ({ label, items: groups.get(label)! }));
}

const CACHE_KEY_PREFIX = "history_v2_";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Lightweight select for list view — NO content field (too heavy)
const LIST_COLUMNS = "id, platform, format, viral_score, session_id, infographic_base64, created_at";

export function useHistory() {
  const { user } = useAuth();
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const processItems = useCallback((data: any[]): GeneratedItem[] => {
    const allItems = data as GeneratedItem[];

    // Build session → infographic map
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
      .map((item) => {
        const infraBase64 = item.session_id ? sessionInfographics.get(item.session_id) : null;
        return {
          ...item,
          content: item.content || "",
          hasInfographic: !!infraBase64 || !!item.infographic_base64,
          sessionInfographicBase64: infraBase64 || item.infographic_base64 || null,
        };
      });
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // Check localStorage cache first
    const cacheKey = CACHE_KEY_PREFIX + user.id;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const { data, timestamp } = JSON.parse(raw);
        if (Date.now() - timestamp < CACHE_TTL) {
          setItems(data);
          setLoading(false);
          // Refresh in background
          refreshInBackground(cacheKey);
          return;
        }
      }
    } catch { /* corrupt cache */ }

    try {
      let { data, error } = await supabase
        .from("generated_content")
        .select(LIST_COLUMNS)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        // Fallback: minimal columns
        const fallback = await supabase
          .from("generated_content")
          .select("id, platform, format, viral_score, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);
        data = fallback.data;
      }

      if (data) {
        const posts = processItems(data);
        setItems(posts);
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ data: posts, timestamp: Date.now() }));
        } catch { /* quota */ }
      }
    } catch { /* network */ }
    setLoading(false);
  }, [user, processItems]);

  async function refreshInBackground(cacheKey: string) {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("generated_content")
        .select(LIST_COLUMNS)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        const posts = processItems(data);
        setItems(posts);
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ data: posts, timestamp: Date.now() }));
        } catch { /* quota */ }
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  })();

  return { items, grouped, sessions, loading, refetch: fetchHistory };
}

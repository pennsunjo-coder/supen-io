import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getCache, setCache } from "@/lib/cache";

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
  // Enriched fields (computed, not from DB)
  hasInfographic?: boolean;
  sessionInfographicBase64?: string | null;
}

export interface HistoryGroup {
  label: string;
  items: GeneratedItem[];
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

export function useHistory() {
  const { user } = useAuth();
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const cacheKey = `history:${user.id}`;
    const cached = getCache<GeneratedItem[]>(cacheKey);
    if (cached) { setItems(cached); setLoading(false); return; }

    try {
      // Fetch ALL items including infographics to cross-reference
      const { data, error } = await supabase
        .from("generated_content")
        .select("id, platform, format, content, source_ids, created_at, viral_score, session_id, infographic_base64, infographic_html")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(300);

      if (!error && data) {
        const allItems = data as GeneratedItem[];

        // Build a map: session_id → infographic base64
        const sessionInfographics = new Map<string, string>();
        for (const item of allItems) {
          if (!item.session_id) continue;
          // Check if this item IS an infographic
          if (item.format === "Infographic" && item.infographic_base64) {
            sessionInfographics.set(item.session_id, item.infographic_base64);
          }
          // Check if this post variation HAS an attached infographic
          if (item.infographic_base64 && item.format !== "Infographic") {
            sessionInfographics.set(item.session_id, item.infographic_base64);
          }
        }

        // Filter to only post variations (not infographic rows), enrich with infographic info
        const posts = allItems
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

        setItems(posts);
        setCache(cacheKey, posts);
      }
    } catch { /* réseau */ }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const grouped = groupByDate(items);

  return { items, grouped, loading, refetch: fetchHistory };
}

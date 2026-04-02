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
      const { data, error } = await supabase
        .from("generated_content")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && data) {
        const typed = data as GeneratedItem[];
        setItems(typed);
        setCache(cacheKey, typed);
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

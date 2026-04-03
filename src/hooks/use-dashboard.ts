import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface DashboardContent {
  id: string;
  platform: string;
  format: string;
  content: string;
  viral_score: number;
  image_prompt: string;
  created_at: string;
}

export interface ContentSession {
  id: string;
  platform: string;
  format: string;
  variations: DashboardContent[];
  bestScore: number;
  createdAt: string;
  preview: string;
}

function groupIntoSessions(items: DashboardContent[]): ContentSession[] {
  if (items.length === 0) return [];
  const sessions: ContentSession[] = [];
  let current: DashboardContent[] = [items[0]];

  for (let i = 1; i < items.length; i++) {
    const prev = current[current.length - 1];
    const curr = items[i];
    const timeDiff = Math.abs(new Date(prev.created_at).getTime() - new Date(curr.created_at).getTime());
    if (curr.platform === prev.platform && curr.format === prev.format && timeDiff < 120000) {
      current.push(curr);
    } else {
      sessions.push(buildSession(current));
      current = [curr];
    }
  }
  sessions.push(buildSession(current));
  return sessions;
}

function buildSession(items: DashboardContent[]): ContentSession {
  const best = items.reduce((max, i) => ((i.viral_score || 0) > max ? (i.viral_score || 0) : max), 0);
  const preview = items[0].content.split(/\s+/).slice(0, 15).join(" ");
  return {
    id: items[0].id,
    platform: items[0].platform,
    format: items[0].format,
    variations: items,
    bestScore: best,
    createdAt: items[0].created_at,
    preview,
  };
}

export interface WeeklyStats {
  contentCount: number;
  platforms: string[];
  streak: number;
  creatorScore: number;
}

function startOfWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const unique = [...new Set(dates.map((d) => new Date(d).toDateString()))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  // Le streak doit inclure aujourd'hui ou hier
  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]).getTime();
    const curr = new Date(unique[i]).getTime();
    if (prev - curr <= 86400000 + 1000) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function useDashboard() {
  const { user } = useAuth();
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    contentCount: 0,
    platforms: [],
    streak: 0,
    creatorScore: 0,
  });
  const [topContent, setTopContent] = useState<DashboardContent[]>([]);
  const [sessions, setSessions] = useState<ContentSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    try {
      // Stats de la semaine
      const weekStart = startOfWeek();
      const { data: weekData } = await supabase
        .from("generated_content")
        .select("platform, created_at")
        .eq("user_id", user.id)
        .gte("created_at", weekStart);

      const contentCount = weekData?.length ?? 0;
      const platforms = [...new Set((weekData ?? []).map((r) => r.platform))];

      // Streak (30 derniers jours)
      const { data: streakData } = await supabase
        .from("generated_content")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
        .order("created_at", { ascending: false });

      const streak = calculateStreak((streakData ?? []).map((r) => r.created_at));

      const creatorScore = Math.min(
        Math.round((contentCount * 10) + (platforms.length * 20) + (streak * 5)),
        100
      );

      setWeeklyStats({ contentCount, platforms, streak, creatorScore });

      // Top 5 contenus les plus récents
      // Essayer avec toutes les colonnes, fallback si viral_score/image_prompt n'existent pas
      let topData: DashboardContent[] | null = null;
      const { data: td1, error: topErr1 } = await supabase
        .from("generated_content")
        .select("id, platform, format, content, viral_score, image_prompt, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25);

      if (topErr1) {
        console.warn("🔴 useDashboard topContent full query error:", topErr1.message);
        // Fallback : essayer sans viral_score et image_prompt (colonnes peut-être absentes)
        const { data: td2, error: topErr2 } = await supabase
          .from("generated_content")
          .select("id, platform, format, content, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(25);
        if (topErr2) {
          console.warn("🔴 useDashboard fallback query error:", topErr2.message);
        } else if (td2) {
          topData = td2.map((r) => ({ ...r, viral_score: 0, image_prompt: "" })) as DashboardContent[];
        }
      } else {
        topData = td1 as DashboardContent[];
      }

      if (topData && topData.length > 0) {
        console.log("🟢 useDashboard: fetched", topData.length, "top contents");
        setTopContent(topData);
        setSessions(groupIntoSessions(topData).slice(0, 4));
      } else {
        console.log("🟡 useDashboard: no content found for user", user.id);
        setTopContent([]);
        setSessions([]);
      }
    } catch (err) {
      console.warn("useDashboard error:", err);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateImagePrompt = useCallback(
    async (id: string, imagePrompt: string) => {
      try {
        await supabase
          .from("generated_content")
          .update({ image_prompt: imagePrompt })
          .eq("id", id);
        setTopContent((prev) =>
          prev.map((c) => (c.id === id ? { ...c, image_prompt: imagePrompt } : c))
        );
      } catch { /* silencieux */ }
    },
    []
  );

  return { weeklyStats, topContent, sessions, loading, refetch: fetchAll, updateImagePrompt };
}

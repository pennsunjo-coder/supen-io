import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
  label: string; // "3 avril"
}

export interface PlatformStat {
  name: string;
  count: number;
  percent: number;
}

export interface ActivityInsights {
  favoriteFormat: string;
  bestDay: string;
  dominantPlatform: string;
  trend: "up" | "down" | "stable";
  thisWeekCount: number;
  lastWeekCount: number;
}

export interface ActivityData {
  thisWeek: number;
  thisMonth: number;
  total: number;
  streak: number;
  bestStreak: number;
  heatmap: HeatmapDay[];
  platforms: PlatformStat[];
  insights: ActivityInsights;
  loading: boolean;
}

const DAYS_FR = ["D", "L", "M", "M", "J", "V", "S"];
const DAYS_FULL_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function formatDateLabel(d: Date): string {
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function calculateStreakFromDates(dateCounts: Map<string, number>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Streak doit inclure aujourd'hui ou hier
  if (!dateCounts.has(toDateKey(today)) && !dateCounts.has(toDateKey(yesterday))) return 0;

  let streak = 0;
  const start = dateCounts.has(toDateKey(today)) ? today : yesterday;
  const d = new Date(start);

  while (dateCounts.has(toDateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function calculateBestStreakFromDates(dateCounts: Map<string, number>): number {
  if (dateCounts.size === 0) return 0;
  const sorted = [...dateCounts.keys()].sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }
  return best;
}

export function useActivity() {
  const { user } = useAuth();
  const [data, setData] = useState<ActivityData>({
    thisWeek: 0, thisMonth: 0, total: 0,
    streak: 0, bestStreak: 0,
    heatmap: [], platforms: [],
    insights: { favoriteFormat: "", bestDay: "", dominantPlatform: "", trend: "stable", thisWeekCount: 0, lastWeekCount: 0 },
    loading: true,
  });

  const fetch = useCallback(async () => {
    if (!user) { setData((p) => ({ ...p, loading: false })); return; }

    try {
      // Tout l'historique
      const { data: allData } = await supabase
        .from("generated_content")
        .select("platform, format, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1000);

      const rows = allData ?? [];
      const total = rows.length;

      if (total === 0) {
        setData((p) => ({ ...p, total: 0, loading: false }));
        return;
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Dates
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let thisWeek = 0;
      let lastWeek = 0;
      let thisMonth = 0;

      // Groupements
      const dateCounts = new Map<string, number>();
      const platformCounts = new Map<string, number>();
      const formatCounts = new Map<string, number>();
      const dayCounts = new Array(7).fill(0);

      for (const r of rows) {
        const d = new Date(r.created_at);
        const key = toDateKey(d);
        dateCounts.set(key, (dateCounts.get(key) || 0) + 1);
        platformCounts.set(r.platform, (platformCounts.get(r.platform) || 0) + 1);
        formatCounts.set(r.format, (formatCounts.get(r.format) || 0) + 1);
        dayCounts[d.getDay()]++;

        if (d >= startOfWeek) thisWeek++;
        if (d >= startOfLastWeek && d < startOfWeek) lastWeek++;
        if (d >= startOfMonth) thisMonth++;
      }

      // Streak
      const streak = calculateStreakFromDates(dateCounts);
      const bestStreak = calculateBestStreakFromDates(dateCounts);

      // Heatmap (28 jours)
      const heatmap: HeatmapDay[] = [];
      for (let i = 27; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = toDateKey(d);
        heatmap.push({
          date: key,
          count: dateCounts.get(key) || 0,
          label: formatDateLabel(d),
        });
      }

      // Platforms
      const platformEntries = [...platformCounts.entries()].sort((a, b) => b[1] - a[1]);
      const platforms: PlatformStat[] = platformEntries.map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
      }));

      // Insights
      const favoriteFormat = [...formatCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
      const bestDayIdx = dayCounts.indexOf(Math.max(...dayCounts));
      const bestDay = DAYS_FULL_FR[bestDayIdx] || "";
      const dominantPlatform = platformEntries[0]?.[0] || "";
      const trend = thisWeek > lastWeek ? "up" : thisWeek < lastWeek ? "down" : "stable";

      setData({
        thisWeek, thisMonth, total,
        streak, bestStreak,
        heatmap, platforms,
        insights: { favoriteFormat, bestDay, dominantPlatform, trend, thisWeekCount: thisWeek, lastWeekCount: lastWeek },
        loading: false,
      });
    } catch (err) {
      console.warn("useActivity error:", err);
      setData((p) => ({ ...p, loading: false }));
    }
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...data, refetch: fetch, DAYS_FR };
}

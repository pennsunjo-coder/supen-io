import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/* ─── Types ─── */

export interface AdminUser {
  user_id: string;
  first_name: string;
  niche: string;
  platforms: string[];
  onboarding_completed: boolean;
  created_at: string;
  content_count: number;
}

export interface AdminContent {
  id: string;
  user_id: string;
  platform: string;
  format: string;
  viral_score: number | null;
  content: string;
  created_at: string;
}

export interface DayCount {
  date: string;
  count: number;
}

export interface DistributionItem {
  name: string;
  count: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalContent: number;
  todayContent: number;
  monthContent: number;
  avgViral: number;
  nicheDistribution: DistributionItem[];
  platformDistribution: DistributionItem[];
  formatDistribution: DistributionItem[];
  dailyCounts: DayCount[];
  recentUsers: AdminUser[];
  recentContent: AdminContent[];
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();

      // ── 1. Total users ──
      const { count: totalUsers, error: e1 } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true });
      if (e1) console.error("Admin stats error (totalUsers):", e1);

      // ── 2. Active users (7 days) ──
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: activeData, error: e2 } = await supabase
        .from("generated_content")
        .select("user_id")
        .gte("created_at", sevenDaysAgo.toISOString());
      if (e2) console.error("Admin stats error (activeUsers):", e2);
      const activeUsers = new Set(activeData?.map((r) => r.user_id)).size;

      // ── 3. Total content ──
      const { count: totalContent, error: e3 } = await supabase
        .from("generated_content")
        .select("*", { count: "exact", head: true });
      if (e3) console.error("Admin stats error (totalContent):", e3);

      // ── 4. Today content ──
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const { count: todayContent, error: e4 } = await supabase
        .from("generated_content")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString());
      if (e4) console.error("Admin stats error (todayContent):", e4);

      // ── 5. This month content ──
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const { count: monthContent, error: e5 } = await supabase
        .from("generated_content")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString());
      if (e5) console.error("Admin stats error (monthContent):", e5);

      // ── 6. Niche distribution ──
      const { data: nicheRaw, error: e6 } = await supabase
        .from("user_profiles")
        .select("niche");
      if (e6) console.error("Admin stats error (nicheRaw):", e6);
      const nicheMap = new Map<string, number>();
      nicheRaw?.forEach((r) => {
        const n = r.niche || "Non défini";
        nicheMap.set(n, (nicheMap.get(n) || 0) + 1);
      });
      const nicheDistribution = Array.from(nicheMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // ── 7. Last 30 days content for charts ──
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: recentAll, error: e7 } = await supabase
        .from("generated_content")
        .select("platform, format, viral_score, created_at")
        .gte("created_at", thirtyDaysAgo.toISOString());
      if (e7) console.error("Admin stats error (recentAll):", e7);

      // Daily counts
      const dayMap = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dayMap.set(d.toISOString().slice(0, 10), 0);
      }
      recentAll?.forEach((c) => {
        const day = c.created_at?.slice(0, 10);
        if (day && dayMap.has(day)) dayMap.set(day, (dayMap.get(day) || 0) + 1);
      });
      const dailyCounts = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));

      // Platform distribution
      const platMap = new Map<string, number>();
      recentAll?.forEach((c) => {
        if (c.platform) platMap.set(c.platform, (platMap.get(c.platform) || 0) + 1);
      });
      const platformDistribution = Array.from(platMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Format distribution
      const fmtMap = new Map<string, number>();
      recentAll?.forEach((c) => {
        if (c.format) fmtMap.set(c.format, (fmtMap.get(c.format) || 0) + 1);
      });
      const formatDistribution = Array.from(fmtMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Avg viral score
      const scores = recentAll?.filter((c) => c.viral_score != null).map((c) => c.viral_score as number) || [];
      const avgViral = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      // ── 8. Recent users (10) ──
      const { data: recentUsersRaw, error: e8 } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, niche, platforms, onboarding_completed, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (e8) console.error("Admin stats error (recentUsersRaw):", e8);
      const recentUsers: AdminUser[] = (recentUsersRaw || []).map((p) => ({
        user_id: p.user_id,
        first_name: p.first_name || "",
        niche: p.niche || "",
        platforms: p.platforms || [],
        onboarding_completed: p.onboarding_completed,
        created_at: p.created_at,
        content_count: 0,
      }));

      // ── 9. Recent content (10) ──
      const { data: recentContentRaw, error: e9 } = await supabase
        .from("generated_content")
        .select("id, user_id, platform, format, viral_score, content, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (e9) console.error("Admin stats error (recentContentRaw):", e9);
      const recentContent: AdminContent[] = (recentContentRaw || []).map((c) => ({
        id: c.id,
        user_id: c.user_id,
        platform: c.platform || "",
        format: c.format || "",
        viral_score: c.viral_score,
        content: c.content || "",
        created_at: c.created_at,
      }));

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers,
        totalContent: totalContent || 0,
        todayContent: todayContent || 0,
        monthContent: monthContent || 0,
        avgViral,
        nicheDistribution,
        platformDistribution,
        formatDistribution,
        dailyCounts,
        recentUsers,
        recentContent,
      });
    } catch (err) {
      console.error("Unexpected error in fetchStats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

/* ─── Paginated content fetch ─── */

export function useAdminContent() {
  const [contents, setContents] = useState<AdminContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 25;

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const from = p * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("generated_content")
        .select("id, user_id, platform, format, viral_score, content, created_at")
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) console.error("Admin stats error (fetchPage):", error);

      if (data) {
        setContents(data.map((c) => ({
          id: c.id,
          user_id: c.user_id,
          platform: c.platform || "",
          format: c.format || "",
          viral_score: c.viral_score,
          content: c.content || "",
          created_at: c.created_at,
        })));
        setHasMore(data.length === PAGE_SIZE);
      }
      setPage(p);
    } catch (err) {
      console.error("Unexpected error in fetchPage:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(0); }, [fetchPage]);

  return { contents, loading, page, hasMore, fetchPage };
}

/* ─── All users fetch with content counts ─── */

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles, error: e1 } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (e1) console.error("Admin stats error (fetchUsers profiles):", e1);

      if (profiles) {
        // Batch: get all content grouped by user
        const { data: allContent, error: e2 } = await supabase
          .from("generated_content")
          .select("user_id");
        if (e2) console.error("Admin stats error (fetchUsers content):", e2);

        const countMap = new Map<string, number>();
        allContent?.forEach((c) => {
          countMap.set(c.user_id, (countMap.get(c.user_id) || 0) + 1);
        });

        setUsers(profiles.map((p) => ({
          user_id: p.user_id,
          first_name: p.first_name || "",
          niche: p.niche || "",
          platforms: p.platforms || [],
          onboarding_completed: p.onboarding_completed,
          created_at: p.created_at,
          content_count: countMap.get(p.user_id) || 0,
        })));
      }
    } catch (err) {
      console.error("Unexpected error in fetchUsers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return { users, loading, refetch: fetchUsers };
}

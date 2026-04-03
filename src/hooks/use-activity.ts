import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface HeatmapDay {
  date: string;
  count: number;
  label: string;
}

export interface ActivityData {
  thisWeek: number;
  thisMonth: number;
  total: number;
  streak: number;
  heatmap: HeatmapDay[];
  loading: boolean;
}

export function useActivity() {
  const { user } = useAuth();
  const [data, setData] = useState<ActivityData>({
    thisWeek: 0, thisMonth: 0, total: 0, streak: 0, heatmap: [], loading: true,
  });

  const fetchData = useCallback(async () => {
    if (!user) { setData((p) => ({ ...p, loading: false })); return; }

    try {
      const { data: rows } = await supabase
        .from("generated_content")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1000);

      const all = rows ?? [];
      const total = all.length;

      if (total === 0) {
        setData({ thisWeek: 0, thisMonth: 0, total: 0, streak: 0, heatmap: [], loading: false });
        return;
      }

      const now = new Date();

      // Monday UTC
      const monday = new Date(now);
      monday.setUTCHours(0, 0, 0, 0);
      monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));

      // First of month UTC
      const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

      const thisWeek = all.filter((c) => new Date(c.created_at) >= monday).length;
      const thisMonth = all.filter((c) => new Date(c.created_at) >= firstOfMonth).length;

      console.log("🔵 Activity:", { total, thisWeek, thisMonth, monday: monday.toISOString(), firstOfMonth: firstOfMonth.toISOString() });

      // Heatmap 28 days UTC
      const heatmap: HeatmapDay[] = Array.from({ length: 28 }, (_, i) => {
        const d = new Date(now);
        d.setUTCHours(0, 0, 0, 0);
        d.setUTCDate(d.getUTCDate() - (27 - i));
        const next = new Date(d);
        next.setUTCDate(d.getUTCDate() + 1);
        const count = all.filter((c) => {
          const cd = new Date(c.created_at);
          return cd >= d && cd < next;
        }).length;
        return {
          date: d.toISOString().split("T")[0],
          label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
          count,
        };
      });

      // Streak UTC
      let streak = 0;
      const today = new Date(now);
      today.setUTCHours(0, 0, 0, 0);
      for (let i = 0; i < 365; i++) {
        const day = new Date(today);
        day.setUTCDate(today.getUTCDate() - i);
        const next = new Date(day);
        next.setUTCDate(day.getUTCDate() + 1);
        const has = all.some((c) => {
          const cd = new Date(c.created_at);
          return cd >= day && cd < next;
        });
        if (has) streak++;
        else break;
      }

      setData({ thisWeek, thisMonth, total, streak, heatmap, loading: false });
    } catch (err) {
      console.warn("useActivity error:", err);
      setData((p) => ({ ...p, loading: false }));
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { ...data, refetch: fetchData, DAYS_FR: ["D", "L", "M", "M", "J", "V", "S"] };
}

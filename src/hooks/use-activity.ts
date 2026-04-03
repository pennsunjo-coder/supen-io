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

      // Monday of current week
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);

      // First of month
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const thisWeek = all.filter((c) => new Date(c.created_at) >= monday).length;
      const thisMonth = all.filter((c) => new Date(c.created_at) >= firstOfMonth).length;

      // Heatmap 28 days
      const heatmap: HeatmapDay[] = Array.from({ length: 28 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (27 - i));
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(d.getDate() + 1);
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

      // Streak
      let streak = 0;
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < 365; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);
        const next = new Date(day);
        next.setDate(day.getDate() + 1);
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

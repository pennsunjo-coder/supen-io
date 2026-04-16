import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const IS_DEV = import.meta.env.DEV;

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

      // Monday 00:00:00 UTC
      const daysFromMonday = (now.getUTCDay() + 6) % 7;
      const monday = new Date(now);
      monday.setUTCDate(now.getUTCDate() - daysFromMonday);
      monday.setUTCHours(0, 0, 0, 0);

      // First of month 00:00:00 UTC
      const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

      // Compare ISO strings (Supabase returns ISO timestamps)
      const mondayISO = monday.toISOString();
      const firstOfMonthISO = firstOfMonth.toISOString();

      const thisWeek = all.filter((c) => c.created_at >= mondayISO).length;
      const thisMonth = all.filter((c) => c.created_at >= firstOfMonthISO).length;


      // Heatmap 28 days
      const heatmap: HeatmapDay[] = Array.from({ length: 28 }, (_, i) => {
        const dayStart = new Date(now);
        dayStart.setUTCDate(now.getUTCDate() - (27 - i));
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayStart.getUTCDate() + 1);

        const startISO = dayStart.toISOString();
        const endISO = dayEnd.toISOString();

        const count = all.filter((c) => c.created_at >= startISO && c.created_at < endISO).length;

        return {
          date: startISO.split("T")[0],
          label: dayStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
          count,
        };
      });

      // Streak
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const dayStart = new Date(now);
        dayStart.setUTCDate(now.getUTCDate() - i);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayStart.getUTCDate() + 1);

        const startISO = dayStart.toISOString();
        const endISO = dayEnd.toISOString();

        if (all.some((c) => c.created_at >= startISO && c.created_at < endISO)) streak++;
        else break;
      }

      setData({ thisWeek, thisMonth, total, streak, heatmap, loading: false });
    } catch (err) {
      if (IS_DEV) console.warn("useActivity error:", err);
      setData((p) => ({ ...p, loading: false }));
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { ...data, refetch: fetchData, DAYS_FR: ["D", "L", "M", "M", "J", "V", "S"] };
}

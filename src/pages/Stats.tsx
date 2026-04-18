import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, FileText, Image as ImageIcon,
  TrendingUp, Zap, Calendar,
  BarChart3, Target, Award, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsData {
  totalContent: number;
  totalSessions: number;
  totalInfographics: number;
  avgViralScore: number;
  topPlatform: string;
  contentThisWeek: number;
  contentThisMonth: number;
  bestScore: number;
  platformBreakdown: { platform: string; count: number }[];
  recentActivity: { date: string; count: number }[];
}

export default function Stats() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      const { data } = await supabase
        .from("generated_content")
        .select("id, platform, format, viral_score, session_id, created_at, infographic_base64")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (!data) { setLoading(false); return; }

      const posts = data.filter((d) => d.format !== "Infographic");
      const infographics = data.filter((d) => d.format === "Infographic" || d.infographic_base64);
      const sessions = new Set(data.map((d) => d.session_id || d.id));

      const scores = posts.map((d) => d.viral_score || 0).filter((s) => s > 0);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

      const platformCounts: Record<string, number> = {};
      posts.forEach((d) => { if (d.platform) platformCounts[d.platform] = (platformCounts[d.platform] || 0) + 1; });
      const topPlatform = Object.entries(platformCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "—";
      const platformBreakdown = Object.entries(platformCounts).sort(([, a], [, b]) => b - a).map(([platform, count]) => ({ platform, count }));

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const monthAgo = new Date(now.getTime() - 30 * 86400000);
      const contentThisWeek = posts.filter((d) => new Date(d.created_at) > weekAgo).length;
      const contentThisMonth = posts.filter((d) => new Date(d.created_at) > monthAgo).length;

      const activityMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        activityMap[d.toLocaleDateString("en-US", { weekday: "short" })] = 0;
      }
      posts.forEach((d) => {
        if (new Date(d.created_at) > weekAgo) {
          const key = new Date(d.created_at).toLocaleDateString("en-US", { weekday: "short" });
          if (key in activityMap) activityMap[key]++;
        }
      });

      setStats({
        totalContent: posts.length,
        totalSessions: sessions.size,
        totalInfographics: infographics.length,
        avgViralScore: avgScore,
        topPlatform,
        contentThisWeek,
        contentThisMonth,
        bestScore,
        platformBreakdown,
        recentActivity: Object.entries(activityMap).map(([date, count]) => ({ date, count })),
      });
      setLoading(false);
    }

    fetchStats();
  }, [user]);

  const statCards = stats ? [
    { label: "Total Posts", value: stats.totalContent, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Sessions", value: stats.totalSessions, icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { label: "Infographics", value: stats.totalInfographics, icon: ImageIcon, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Avg Score", value: `${stats.avgViralScore}%`, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { label: "Best Score", value: `${stats.bestScore}%`, icon: Award, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { label: "This Week", value: stats.contentThisWeek, icon: Calendar, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
    { label: "This Month", value: stats.contentThisMonth, icon: BarChart3, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    { label: "Top Platform", value: stats.topPlatform, icon: Target, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  ] : [];

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/20 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")} className="h-9 gap-2 font-semibold bg-accent hover:bg-accent/80 border border-border/40">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Button>
          <div className="flex-1">
            <h1 className="text-sm font-bold">My Statistics</h1>
            <p className="text-xs text-muted-foreground">Your content performance overview</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full" />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Stat cards */}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {statCards.map((card, i) => (
                    <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={cn("rounded-xl border p-4", card.border, card.bg)}>
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", card.bg)}>
                        <card.icon className={cn("w-4 h-4", card.color)} />
                      </div>
                      <p className="text-2xl font-bold mb-1">{card.value}</p>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Activity chart */}
              {stats && stats.recentActivity.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">Activity — Last 7 Days</h2>
                  <div className="rounded-xl border border-border/20 p-5 bg-accent/[0.02]">
                    <div className="flex items-end gap-3 h-24">
                      {stats.recentActivity.map((day, i) => {
                        const maxCount = Math.max(...stats.recentActivity.map((d) => d.count), 1);
                        const height = Math.max((day.count / maxCount) * 100, 4);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex items-end justify-center" style={{ height: "72px" }}>
                              <motion.div initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ delay: i * 0.05, duration: 0.4 }} className={cn("w-full rounded-t-md min-h-[4px]", day.count > 0 ? "bg-primary/60" : "bg-accent/40")} />
                            </div>
                            <span className="text-[10px] text-muted-foreground/60">{day.date}</span>
                            {day.count > 0 && <span className="text-[10px] font-bold text-primary">{day.count}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Platform breakdown */}
              {stats && stats.platformBreakdown.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-4">By Platform</h2>
                  <div className="rounded-xl border border-border/20 overflow-hidden">
                    {stats.platformBreakdown.map((p, i) => {
                      const maxCount = stats.platformBreakdown[0].count;
                      const pct = Math.round((p.count / stats.totalContent) * 100);
                      return (
                        <div key={p.platform} className={cn("flex items-center gap-4 px-5 py-3.5", i !== 0 && "border-t border-border/10")}>
                          <span className="text-sm font-medium w-24 shrink-0">{p.platform}</span>
                          <div className="flex-1 bg-accent/20 rounded-full h-2 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(p.count / maxCount) * 100}%` }} transition={{ delay: i * 0.05, duration: 0.5 }} className="h-full bg-primary/60 rounded-full" />
                          </div>
                          <span className="text-sm font-bold w-12 text-right shrink-0">{p.count}</span>
                          <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="rounded-xl border border-border/20 p-6 text-center bg-accent/[0.02]">
                <p className="text-sm font-semibold mb-1">Ready to create more?</p>
                <p className="text-xs text-muted-foreground mb-4">Keep the momentum going.</p>
                <Button onClick={() => navigate("/dashboard/studio")} className="gap-2 font-bold">
                  <Sparkles className="w-4 h-4" /> Create New Content
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

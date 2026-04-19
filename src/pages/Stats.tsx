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
  BarChart3, Target, Award, Plus,
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
        totalContent: posts.length, totalSessions: sessions.size, totalInfographics: infographics.length,
        avgViralScore: avgScore, topPlatform, contentThisWeek, contentThisMonth, bestScore,
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
          <Button variant="secondary" onClick={() => navigate("/dashboard")} className="h-10 gap-2 text-sm font-bold px-5 bg-accent hover:bg-accent/80 border border-border/40">
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
          ) : stats && (
            <div className="h-full flex flex-col gap-6">
              {/* Stat cards — full width */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {statCards.map((card, i) => (
                  <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={cn("rounded-2xl border p-4 flex flex-col", card.border, card.bg)}>
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-3", card.bg)}>
                      <card.icon className={cn("w-4 h-4", card.color)} />
                    </div>
                    <p className="text-2xl font-bold mb-0.5">{card.value}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{card.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Charts side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Activity */}
                <div className="rounded-2xl border border-border/20 p-5 bg-accent/[0.02] flex flex-col">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-5">Activity — Last 7 Days</h2>
                  <div className="flex-1 flex items-end gap-2">
                    {stats.recentActivity.map((day, i) => {
                      const maxCount = Math.max(...stats.recentActivity.map((d) => d.count), 1);
                      const height = Math.max((day.count / maxCount) * 100, 4);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full flex items-end justify-center h-32">
                            <motion.div initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ delay: i * 0.06, duration: 0.5 }} className={cn("w-full rounded-t-lg min-h-[4px]", day.count > 0 ? "bg-primary" : "bg-accent/40")} />
                          </div>
                          <span className="text-[10px] text-muted-foreground/60 font-medium">{day.date}</span>
                          <span className={cn("text-[10px] font-bold", day.count > 0 ? "text-primary" : "text-transparent")}>{day.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Platforms */}
                <div className="rounded-2xl border border-border/20 p-5 bg-accent/[0.02] flex flex-col">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-5">By Platform</h2>
                  <div className="flex-1 space-y-3">
                    {stats.platformBreakdown.map((p, i) => {
                      const maxCount = stats.platformBreakdown[0]?.count || 1;
                      const pct = Math.round((p.count / stats.totalContent) * 100);
                      return (
                        <div key={p.platform}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium">{p.platform}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">{p.count}</span>
                              <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-accent/30 rounded-full h-2.5 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(p.count / maxCount) * 100}%` }} transition={{ delay: i * 0.08, duration: 0.6 }} className="h-full bg-primary rounded-full" />
                          </div>
                        </div>
                      );
                    })}
                    {stats.platformBreakdown.length === 0 && (
                      <div className="flex items-center justify-center h-full text-muted-foreground/40 text-sm">No data yet</div>
                    )}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="rounded-2xl border border-border/20 p-6 bg-gradient-to-r from-primary/5 to-primary/10 flex items-center justify-between">
                <div>
                  <p className="font-bold text-base mb-1">Keep the momentum going</p>
                  <p className="text-sm text-muted-foreground">You've generated {stats.totalContent} posts. Create more to grow faster.</p>
                </div>
                <Button onClick={() => navigate("/dashboard/studio")} className="gap-2 font-bold h-11 px-6 shrink-0 ml-4">
                  <Plus className="w-5 h-5" /> Create Content
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

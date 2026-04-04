import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, LayoutDashboard, Users, FileText, Database,
  BarChart3, Settings, Loader2, TrendingUp, Calendar,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

/* ─── Types ─── */

interface AdminUser {
  user_id: string;
  email: string;
  first_name: string;
  niche: string;
  platforms: string[];
  onboarding_completed: boolean;
  created_at: string;
  content_count: number;
}

interface AdminContent {
  id: string;
  user_email: string;
  platform: string;
  format: string;
  viral_score: number | null;
  content: string;
  created_at: string;
}

interface DayCount {
  date: string;
  count: number;
}

interface PlatformCount {
  platform: string;
  count: number;
}

type Section = "overview" | "users" | "contents" | "analytics";

const NAV_ITEMS: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "contents", label: "Contenus générés", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

/* ─── Component ─── */

export default function Admin() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("overview");
  const [loading, setLoading] = useState(true);

  // Overview stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [contentsToday, setContentsToday] = useState(0);
  const [contentsMonth, setContentsMonth] = useState(0);
  const [contentsTotal, setContentsTotal] = useState(0);

  // Users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Contents
  const [contents, setContents] = useState<AdminContent[]>([]);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [contentPage, setContentPage] = useState(0);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const PAGE_SIZE = 25;

  // Analytics
  const [dailyCounts, setDailyCounts] = useState<DayCount[]>([]);
  const [topPlatforms, setTopPlatforms] = useState<PlatformCount[]>([]);
  const [topFormats, setTopFormats] = useState<PlatformCount[]>([]);
  const [avgViral, setAvgViral] = useState(0);

  // ═══ Fetch overview stats ═══
  const fetchOverview = useCallback(async () => {
    setLoading(true);

    // Total users
    const { count: userCount } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true });
    setTotalUsers(userCount || 0);

    // Contents total
    const { count: totalCount } = await supabase
      .from("generated_content")
      .select("*", { count: "exact", head: true });
    setContentsTotal(totalCount || 0);

    // Contents today
    const todayISO = new Date().toISOString().slice(0, 10);
    const { count: todayCount } = await supabase
      .from("generated_content")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayISO);
    setContentsToday(todayCount || 0);

    // Contents this month
    const monthISO = new Date().toISOString().slice(0, 7) + "-01";
    const { count: monthCount } = await supabase
      .from("generated_content")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthISO);
    setContentsMonth(monthCount || 0);

    setLoading(false);
  }, []);

  // ═══ Fetch users ═══
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);

    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profiles) {
      // Count content per user
      const usersWithCount: AdminUser[] = [];
      for (const p of profiles) {
        const { count } = await supabase
          .from("generated_content")
          .select("*", { count: "exact", head: true })
          .eq("user_id", p.user_id);

        usersWithCount.push({
          user_id: p.user_id,
          email: "", // filled below
          first_name: p.first_name || "",
          niche: p.niche || "",
          platforms: p.platforms || [],
          onboarding_completed: p.onboarding_completed,
          created_at: p.created_at,
          content_count: count || 0,
        });
      }
      setUsers(usersWithCount);
    }

    setUsersLoading(false);
  }, []);

  // ═══ Fetch contents ═══
  const fetchContents = useCallback(async (page: number) => {
    setContentsLoading(true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data } = await supabase
      .from("generated_content")
      .select("id, user_id, platform, format, viral_score, content, created_at")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data) {
      const mapped: AdminContent[] = data.map((c) => ({
        id: c.id,
        user_email: c.user_id?.slice(0, 8) + "...",
        platform: c.platform || "",
        format: c.format || "",
        viral_score: c.viral_score,
        content: c.content || "",
        created_at: c.created_at,
      }));
      setContents(mapped);
      setHasMoreContent(data.length === PAGE_SIZE);
    }

    setContentsLoading(false);
  }, []);

  // ═══ Fetch analytics ═══
  const fetchAnalytics = useCallback(async () => {
    // Daily counts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().slice(0, 10);

    const { data: allContent } = await supabase
      .from("generated_content")
      .select("platform, format, viral_score, created_at")
      .gte("created_at", fromDate)
      .order("created_at", { ascending: false });

    if (allContent) {
      // Daily
      const dayMap = new Map<string, number>();
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dayMap.set(d.toISOString().slice(0, 10), 0);
      }
      allContent.forEach((c) => {
        const day = c.created_at?.slice(0, 10);
        if (day && dayMap.has(day)) dayMap.set(day, (dayMap.get(day) || 0) + 1);
      });
      setDailyCounts(
        Array.from(dayMap.entries())
          .map(([date, count]) => ({ date, count }))
          .reverse()
      );

      // Top platforms
      const platMap = new Map<string, number>();
      allContent.forEach((c) => {
        if (c.platform) platMap.set(c.platform, (platMap.get(c.platform) || 0) + 1);
      });
      setTopPlatforms(
        Array.from(platMap.entries())
          .map(([platform, count]) => ({ platform, count }))
          .sort((a, b) => b.count - a.count)
      );

      // Top formats
      const fmtMap = new Map<string, number>();
      allContent.forEach((c) => {
        if (c.format) fmtMap.set(c.format, (fmtMap.get(c.format) || 0) + 1);
      });
      setTopFormats(
        Array.from(fmtMap.entries())
          .map(([platform, count]) => ({ platform, count }))
          .sort((a, b) => b.count - a.count)
      );

      // Avg viral score
      const scores = allContent.filter((c) => c.viral_score != null).map((c) => c.viral_score as number);
      setAvgViral(scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0);
    }
  }, []);

  // ═══ Load data on section change ═══
  useEffect(() => {
    if (section === "overview") fetchOverview();
    if (section === "users") fetchUsers();
    if (section === "contents") { setContentPage(0); fetchContents(0); }
    if (section === "analytics") fetchAnalytics();
  }, [section, fetchOverview, fetchUsers, fetchContents, fetchAnalytics]);

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="h-12 border-b border-border/20 flex items-center px-4 shrink-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-mono bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">ADMIN</span>
          <h1 className="text-sm font-semibold">Administration</h1>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto py-6 px-4 gap-6">
        {/* Sidebar */}
        <nav className="w-48 shrink-0 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                section === item.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ═══ OVERVIEW ═══ */}
          {section === "overview" && (
            <>
              <h2 className="text-lg font-bold">Vue d'ensemble</h2>

              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Stats cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Utilisateurs" value={totalUsers} icon={Users} />
                    <StatCard label="Contenus aujourd'hui" value={contentsToday} icon={Calendar} />
                    <StatCard label="Contenus ce mois" value={contentsMonth} icon={TrendingUp} />
                    <StatCard label="Total contenus" value={contentsTotal} icon={FileText} />
                  </div>

                  {/* Recent users */}
                  <div className="bg-card border border-border/30 rounded-xl p-5">
                    <h3 className="text-sm font-semibold mb-3">Derniers utilisateurs</h3>
                    {users.length === 0 ? (
                      <button
                        onClick={fetchUsers}
                        className="text-xs text-primary hover:underline"
                      >
                        Charger les utilisateurs
                      </button>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground border-b border-border/20">
                              <th className="text-left py-2 pr-3 font-medium">Prénom</th>
                              <th className="text-left py-2 pr-3 font-medium">Niche</th>
                              <th className="text-left py-2 pr-3 font-medium">Plateformes</th>
                              <th className="text-left py-2 pr-3 font-medium">Date</th>
                              <th className="text-left py-2 font-medium">Onboarding</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.slice(0, 10).map((u) => (
                              <tr key={u.user_id} className="border-b border-border/10">
                                <td className="py-2 pr-3 font-medium">{u.first_name || "—"}</td>
                                <td className="py-2 pr-3 text-muted-foreground">{u.niche || "—"}</td>
                                <td className="py-2 pr-3 text-muted-foreground">{u.platforms?.join(", ") || "—"}</td>
                                <td className="py-2 pr-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                                <td className="py-2">
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                    u.onboarding_completed ? "bg-green-500/15 text-green-400" : "bg-orange-500/15 text-orange-400",
                                  )}>
                                    {u.onboarding_completed ? "Complété" : "En cours"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ═══ USERS ═══ */}
          {section === "users" && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Utilisateurs ({users.length})</h2>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={fetchUsers} disabled={usersLoading}>
                  {usersLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Rafraîchir"}
                </Button>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="bg-card border border-border/30 rounded-xl p-5 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/20">
                        <th className="text-left py-2 pr-3 font-medium">User ID</th>
                        <th className="text-left py-2 pr-3 font-medium">Prénom</th>
                        <th className="text-left py-2 pr-3 font-medium">Niche</th>
                        <th className="text-left py-2 pr-3 font-medium">Plateformes</th>
                        <th className="text-left py-2 pr-3 font-medium">Onboarding</th>
                        <th className="text-left py-2 pr-3 font-medium">Contenus</th>
                        <th className="text-left py-2 font-medium">Inscription</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.user_id} className="border-b border-border/10">
                          <td className="py-2 pr-3 font-mono text-muted-foreground">{u.user_id.slice(0, 8)}...</td>
                          <td className="py-2 pr-3 font-medium">{u.first_name || "—"}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{u.niche || "—"}</td>
                          <td className="py-2 pr-3 text-muted-foreground max-w-[200px] truncate">{u.platforms?.join(", ") || "—"}</td>
                          <td className="py-2 pr-3">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-medium",
                              u.onboarding_completed ? "bg-green-500/15 text-green-400" : "bg-orange-500/15 text-orange-400",
                            )}>
                              {u.onboarding_completed ? "Oui" : "Non"}
                            </span>
                          </td>
                          <td className="py-2 pr-3 font-medium">{u.content_count}</td>
                          <td className="py-2 text-muted-foreground">{formatDate(u.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <p className="text-center text-muted-foreground text-xs py-8">Aucun utilisateur</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ═══ CONTENTS ═══ */}
          {section === "contents" && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Contenus générés</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm" className="h-8 w-8 p-0"
                    disabled={contentPage === 0}
                    onClick={() => { const p = contentPage - 1; setContentPage(p); fetchContents(p); }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground">Page {contentPage + 1}</span>
                  <Button
                    variant="outline" size="sm" className="h-8 w-8 p-0"
                    disabled={!hasMoreContent}
                    onClick={() => { const p = contentPage + 1; setContentPage(p); fetchContents(p); }}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {contentsLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="bg-card border border-border/30 rounded-xl p-5 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/20">
                        <th className="text-left py-2 pr-3 font-medium">User</th>
                        <th className="text-left py-2 pr-3 font-medium">Plateforme</th>
                        <th className="text-left py-2 pr-3 font-medium">Format</th>
                        <th className="text-left py-2 pr-3 font-medium">Score</th>
                        <th className="text-left py-2 pr-3 font-medium">Aperçu</th>
                        <th className="text-left py-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contents.map((c) => (
                        <tr key={c.id} className="border-b border-border/10">
                          <td className="py-2 pr-3 font-mono text-muted-foreground">{c.user_email}</td>
                          <td className="py-2 pr-3">{c.platform}</td>
                          <td className="py-2 pr-3 text-muted-foreground">{c.format}</td>
                          <td className="py-2 pr-3">
                            {c.viral_score != null ? (
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                c.viral_score >= 80 ? "bg-green-500/15 text-green-400" :
                                c.viral_score >= 50 ? "bg-yellow-500/15 text-yellow-400" :
                                "bg-red-500/15 text-red-400",
                              )}>
                                {c.viral_score}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground max-w-[250px] truncate">{c.content.slice(0, 50)}</td>
                          <td className="py-2 text-muted-foreground">{formatDate(c.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {contents.length === 0 && (
                    <p className="text-center text-muted-foreground text-xs py-8">Aucun contenu</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ═══ ANALYTICS ═══ */}
          {section === "analytics" && (
            <>
              <h2 className="text-lg font-bold">Analytics (30 derniers jours)</h2>

              {/* Daily chart (bar chart with divs) */}
              <div className="bg-card border border-border/30 rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-4">Contenus par jour</h3>
                {dailyCounts.length > 0 ? (
                  <div className="flex items-end gap-[3px] h-32">
                    {dailyCounts.map((d) => {
                      const maxCount = Math.max(...dailyCounts.map((x) => x.count), 1);
                      const h = Math.max((d.count / maxCount) * 100, 2);
                      return (
                        <div key={d.date} className="flex-1 group relative">
                          <div
                            className="w-full bg-primary/60 rounded-t-sm hover:bg-primary transition-colors"
                            style={{ height: `${h}%` }}
                          />
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border border-border/30 rounded px-2 py-1 text-[10px] whitespace-nowrap shadow-lg z-10">
                            {d.date.slice(5)} : {d.count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Chargement...</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Top platforms */}
                <div className="bg-card border border-border/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3">Top plateformes</h3>
                  <div className="space-y-2">
                    {topPlatforms.map((p) => (
                      <div key={p.platform} className="flex items-center justify-between text-xs">
                        <span>{p.platform}</span>
                        <span className="font-medium text-primary">{p.count}</span>
                      </div>
                    ))}
                    {topPlatforms.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
                  </div>
                </div>

                {/* Top formats */}
                <div className="bg-card border border-border/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3">Top formats</h3>
                  <div className="space-y-2">
                    {topFormats.map((f) => (
                      <div key={f.platform} className="flex items-center justify-between text-xs">
                        <span>{f.platform}</span>
                        <span className="font-medium text-primary">{f.count}</span>
                      </div>
                    ))}
                    {topFormats.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
                  </div>
                </div>

                {/* Avg viral score */}
                <div className="bg-card border border-border/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3">Score viral moyen</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-primary">{avgViral}</span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Stat card ─── */

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <div className="bg-card border border-border/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-2xl font-bold">{value.toLocaleString("fr-FR")}</p>
    </div>
  );
}

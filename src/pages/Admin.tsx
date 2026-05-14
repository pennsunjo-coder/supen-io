import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, LayoutDashboard, Users, FileText,
  BarChart3, CreditCard, Loader2, TrendingUp, Calendar,
  ChevronLeft, ChevronRight, Zap, DollarSign, Crown,
  Search, RefreshCw, Download, Mail,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useAdminStats, useAdminContent, useAdminUsers } from "@/hooks/use-admin-stats";
import type { DistributionItem } from "@/hooks/use-admin-stats";

/* ─── Types ─── */

type Section = "overview" | "users" | "contents" | "analytics" | "revenue" | "waitlist";

const NAV_ITEMS: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "contents", label: "Generated Content", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "revenue", label: "Revenue", icon: CreditCard },
  // ⛔ GUARDRAIL: DO NOT REMOVE. Critical for waitlist management.
  { id: "waitlist", label: "Waitlist", icon: Mail },
];

/* ─── Waitlist types ─── */

interface WaitlistEntry {
  id: string;
  email: string;
  first_name: string;
  plan: string;
  paid: boolean;
  notified: boolean;
  created_at: string;
}

function useWaitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) console.error("Admin stats error (waitlist):", error);
      setEntries((data as WaitlistEntry[]) ?? []);
    } catch (err) {
      console.error("Unexpected error in useWaitlist:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { entries, loading, refetch: fetch };
}

/* ─── Helpers ─── */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatShortDate(iso: string): string {
  return iso.slice(5); // "MM-DD"
}

const NICHE_COLORS = [
  "hsl(174, 65%, 40%)", "hsl(220, 70%, 55%)", "hsl(340, 65%, 55%)",
  "hsl(45, 80%, 50%)", "hsl(270, 60%, 55%)", "hsl(130, 50%, 45%)",
  "hsl(15, 70%, 55%)", "hsl(200, 60%, 50%)", "hsl(0, 0%, 50%)",
];

/* ─── Component ─── */

export default function Admin() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("overview");

  const { stats, loading: statsLoading, refetch: refetchStats } = useAdminStats();
  const { users, loading: usersLoading, refetch: refetchUsers } = useAdminUsers();
  const { contents, loading: contentsLoading, page, hasMore, fetchPage } = useAdminContent();

  const { entries: waitlistEntries, loading: waitlistLoading, refetch: refetchWaitlist } = useWaitlist();
  const [waitlistFilter, setWaitlistFilter] = useState<"all" | "free" | "plus" | "pro">("all");
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter((u) =>
      u.first_name.toLowerCase().includes(q) ||
      u.niche.toLowerCase().includes(q) ||
      u.user_id.includes(q)
    );
  }, [users, userSearch]);

  const filteredWaitlist = useMemo(() => {
    if (waitlistFilter === "all") return waitlistEntries;
    return waitlistEntries.filter((e) => e.plan === waitlistFilter);
  }, [waitlistEntries, waitlistFilter]);

  const waitlistStats = useMemo(() => ({
    total: waitlistEntries.length,
    free: waitlistEntries.filter((e) => e.plan === "free").length,
    plus: waitlistEntries.filter((e) => e.plan === "plus").length,
    pro: waitlistEntries.filter((e) => e.plan === "pro").length,
  }), [waitlistEntries]);

  function exportWaitlistCsv() {
    if (filteredWaitlist.length === 0) {
      toast.error("No entries to export");
      return;
    }
    const header = "Email,First Name,Plan,Paid,Notified,Joined At\n";
    const rows = filteredWaitlist.map((e) =>
      `"${e.email}","${e.first_name}","${e.plan}",${e.paid},${e.notified},"${e.created_at}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredWaitlist.length} entries`);
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
          Back to dashboard
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

          {/* ═══════════════════════════════════════════════ */}
          {/* ═══ OVERVIEW ═══ */}
          {/* ═══════════════════════════════════════════════ */}
          {section === "overview" && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Overview</h2>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={refetchStats} disabled={statsLoading}>
                  <RefreshCw className={cn("w-3 h-3", statsLoading && "animate-spin")} /> Refresh
                </Button>
              </div>

              {statsLoading && !stats ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : stats && (
                <>
                  {/* Row 1 — Main stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard icon={Users} label="Registered" value={stats.totalUsers} />
                    <StatCard icon={Zap} label="Active (7d)" value={stats.activeUsers} accent />
                    <StatCard icon={FileText} label="Total Content" value={stats.totalContent} />
                    <StatCard icon={Calendar} label="This Month" value={stats.monthContent} />
                  </div>

                  {/* Row 2 — Revenue + extras */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard icon={DollarSign} label="Total Revenue" value={0} suffix="$" muted />
                    <StatCard icon={Crown} label="Premium Subscribers" value={0} muted />
                    <StatCard icon={TrendingUp} label="Content Today" value={stats.todayContent} accent />
                    <StatCard icon={BarChart3} label="Avg Viral Score" value={stats.avgViral} suffix="/100" />
                  </div>

                  {/* 30-day chart */}
                  <div className="bg-card border border-border/20 rounded-xl p-5">
                    <h3 className="text-sm font-semibold mb-4">Activity — Last 30 Days</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={stats.dailyCounts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatShortDate}
                          tick={{ fontSize: 10, fill: "hsl(215 12% 50%)" }}
                          interval={4}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "hsl(215 12% 50%)" }}
                          allowDecimals={false}
                          width={30}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(220 18% 10%)",
                            border: "1px solid hsl(220 14% 18%)",
                            borderRadius: 8,
                            fontSize: 11,
                          }}
                          labelFormatter={(v) => `Date: ${v}`}
                        />
                        <Bar dataKey="count" name="Content" fill="hsl(174 65% 40%)" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Niche distribution */}
                    <div className="bg-card border border-border/20 rounded-xl p-5">
                      <h3 className="text-sm font-semibold mb-3">Distribution by Niche</h3>
                      <DistributionList items={stats.nicheDistribution} total={stats.totalUsers} colors={NICHE_COLORS} />
                    </div>

                    {/* Platform distribution */}
                    <div className="bg-card border border-border/20 rounded-xl p-5">
                      <h3 className="text-sm font-semibold mb-3">Distribution by Platform</h3>
                      <DistributionList items={stats.platformDistribution} total={stats.totalContent} colors={NICHE_COLORS} />
                    </div>
                  </div>

                  {/* Recent users table */}
                  <div className="bg-card border border-border/20 rounded-xl p-5">
                    <h3 className="text-sm font-semibold mb-3">Latest Signups</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border/20">
                            <th className="text-left py-2 pr-3 font-medium">Name</th>
                            <th className="text-left py-2 pr-3 font-medium">Niche</th>
                            <th className="text-left py-2 pr-3 font-medium">Platforms</th>
                            <th className="text-left py-2 pr-3 font-medium">Onboarding</th>
                            <th className="text-left py-2 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentUsers.map((u) => (
                            <tr key={u.user_id} className="border-b border-border/10 hover:bg-accent/20 transition-colors">
                              <td className="py-2.5 pr-3 font-medium">{u.first_name || "—"}</td>
                              <td className="py-2.5 pr-3 text-muted-foreground">{u.niche || "—"}</td>
                              <td className="py-2.5 pr-3 text-muted-foreground">{u.platforms?.join(", ") || "—"}</td>
                              <td className="py-2.5 pr-3">
                                <Badge ok={u.onboarding_completed} />
                              </td>
                              <td className="py-2.5 text-muted-foreground">{formatDate(u.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent content table */}
                  <div className="bg-card border border-border/20 rounded-xl p-5">
                    <h3 className="text-sm font-semibold mb-3">Latest Content</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border/20">
                            <th className="text-left py-2 pr-3 font-medium">Platform</th>
                            <th className="text-left py-2 pr-3 font-medium">Format</th>
                            <th className="text-left py-2 pr-3 font-medium">Score</th>
                            <th className="text-left py-2 pr-3 font-medium">Preview</th>
                            <th className="text-left py-2 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentContent.map((c) => (
                            <tr key={c.id} className="border-b border-border/10 hover:bg-accent/20 transition-colors">
                              <td className="py-2.5 pr-3 font-medium">{c.platform}</td>
                              <td className="py-2.5 pr-3 text-muted-foreground">{c.format}</td>
                              <td className="py-2.5 pr-3"><ViralBadge score={c.viral_score} /></td>
                              <td className="py-2.5 pr-3 text-muted-foreground max-w-[250px] truncate">{c.content.slice(0, 50)}</td>
                              <td className="py-2.5 text-muted-foreground">{formatDate(c.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ═══ USERS ═══ */}
          {/* ═══════════════════════════════════════════════ */}
          {section === "users" && (
            <>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold shrink-0">Users ({filteredUsers.length})</h2>
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by name, niche, ID..."
                      className="h-8 text-xs pl-8"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={refetchUsers} disabled={usersLoading}>
                    {usersLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              {usersLoading && users.length === 0 ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="bg-card border border-border/20 rounded-xl p-5 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/20">
                        <th className="text-left py-2 pr-3 font-medium">User ID</th>
                        <th className="text-left py-2 pr-3 font-medium">Name</th>
                        <th className="text-left py-2 pr-3 font-medium">Niche</th>
                        <th className="text-left py-2 pr-3 font-medium">Platforms</th>
                        <th className="text-left py-2 pr-3 font-medium">Onboarding</th>
                        <th className="text-left py-2 pr-3 font-medium">Content</th>
                        <th className="text-left py-2 font-medium">Signup</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.user_id} className="border-b border-border/10 hover:bg-accent/20 transition-colors">
                          <td className="py-2.5 pr-3 font-mono text-muted-foreground">{u.user_id.slice(0, 8)}...</td>
                          <td className="py-2.5 pr-3 font-medium">{u.first_name || "—"}</td>
                          <td className="py-2.5 pr-3 text-muted-foreground">{u.niche || "—"}</td>
                          <td className="py-2.5 pr-3 text-muted-foreground max-w-[200px] truncate">{u.platforms?.join(", ") || "—"}</td>
                          <td className="py-2.5 pr-3"><Badge ok={u.onboarding_completed} /></td>
                          <td className="py-2.5 pr-3 font-medium">{u.content_count}</td>
                          <td className="py-2.5 text-muted-foreground">{formatDate(u.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-muted-foreground text-xs py-8">
                      {userSearch ? "No results" : "No users"}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ═══ CONTENTS ═══ */}
          {/* ═══════════════════════════════════════════════ */}
          {section === "contents" && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Generated Content</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm" className="h-8 w-8 p-0"
                    disabled={page === 0}
                    onClick={() => fetchPage(page - 1)}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground min-w-[60px] text-center">Page {page + 1}</span>
                  <Button
                    variant="outline" size="sm" className="h-8 w-8 p-0"
                    disabled={!hasMore}
                    onClick={() => fetchPage(page + 1)}
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
                <div className="bg-card border border-border/20 rounded-xl p-5 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/20">
                        <th className="text-left py-2 pr-3 font-medium">User</th>
                        <th className="text-left py-2 pr-3 font-medium">Platform</th>
                        <th className="text-left py-2 pr-3 font-medium">Format</th>
                        <th className="text-left py-2 pr-3 font-medium">Score</th>
                        <th className="text-left py-2 pr-3 font-medium">Preview</th>
                        <th className="text-left py-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contents.map((c) => (
                        <tr key={c.id} className="border-b border-border/10 hover:bg-accent/20 transition-colors">
                          <td className="py-2.5 pr-3 font-mono text-muted-foreground">{c.user_id.slice(0, 8)}...</td>
                          <td className="py-2.5 pr-3 font-medium">{c.platform}</td>
                          <td className="py-2.5 pr-3 text-muted-foreground">{c.format}</td>
                          <td className="py-2.5 pr-3"><ViralBadge score={c.viral_score} /></td>
                          <td className="py-2.5 pr-3 text-muted-foreground max-w-[250px] truncate">{c.content.slice(0, 50)}</td>
                          <td className="py-2.5 text-muted-foreground">{formatDate(c.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {contents.length === 0 && (
                    <p className="text-center text-muted-foreground text-xs py-8">No content</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ═══ ANALYTICS ═══ */}
          {/* ═══════════════════════════════════════════════ */}
          {section === "analytics" && (
            <>
              <h2 className="text-lg font-bold">Analytics (Last 30 Days)</h2>

              {statsLoading && !stats ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : stats && (
                <>
                  {/* BarChart */}
                  <div className="bg-card border border-border/20 rounded-xl p-5">
                    <h3 className="text-sm font-semibold mb-4">Content per Day</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={stats.dailyCounts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatShortDate}
                          tick={{ fontSize: 10, fill: "hsl(215 12% 50%)" }}
                          interval={4}
                        />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(215 12% 50%)" }} allowDecimals={false} width={30} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(220 18% 10%)",
                            border: "1px solid hsl(220 14% 18%)",
                            borderRadius: 8,
                            fontSize: 11,
                          }}
                          labelFormatter={(v) => `Date: ${v}`}
                        />
                        <Bar dataKey="count" name="Content" fill="hsl(174 65% 40%)" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Top platforms */}
                    <div className="bg-card border border-border/20 rounded-xl p-5">
                      <h3 className="text-sm font-semibold mb-3">Top Platforms</h3>
                      <DistributionBars items={stats.platformDistribution} />
                    </div>

                    {/* Top formats */}
                    <div className="bg-card border border-border/20 rounded-xl p-5">
                      <h3 className="text-sm font-semibold mb-3">Top Formats</h3>
                      <DistributionBars items={stats.formatDistribution} />
                    </div>

                    {/* Avg viral score */}
                    <div className="bg-card border border-border/20 rounded-xl p-5">
                      <h3 className="text-sm font-semibold mb-3">Average Viral Score</h3>
                      <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-4xl font-bold text-primary">{stats.avgViral}</span>
                        <span className="text-sm text-muted-foreground">/ 100</span>
                      </div>
                      <div className="mt-3 h-2 bg-accent/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${stats.avgViral}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ═══ REVENUE ═══ */}
          {/* ═══════════════════════════════════════════════ */}
          {section === "revenue" && (
            <>
              <h2 className="text-lg font-bold">Revenue</h2>

              <div className="bg-card border border-border/20 rounded-xl p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">Stripe Integration Coming Soon</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-6">
                  Connect Stripe to view your revenue, Premium and Business subscribers in real time.
                  Free, Pro ($10/mo) and Business ($29/mo) plans will be tracked here.
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-6">
                  <div className="bg-accent/30 rounded-lg p-3">
                    <p className="text-xl font-bold text-muted-foreground">$0</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">MRR</p>
                  </div>
                  <div className="bg-accent/30 rounded-lg p-3">
                    <p className="text-xl font-bold text-muted-foreground">0</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Pro Subscribers</p>
                  </div>
                  <div className="bg-accent/30 rounded-lg p-3">
                    <p className="text-xl font-bold text-muted-foreground">0</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Business Subscribers</p>
                  </div>
                </div>
                <Button className="h-10 gap-2 text-sm" disabled>
                  <Crown className="w-4 h-4" /> Configure Stripe
                </Button>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ═══ WAITLIST ═══ */}
          {/* ═══════════════════════════════════════════════ */}
          {section === "waitlist" && (
            <>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold shrink-0">Waitlist ({waitlistStats.total})</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={exportWaitlistCsv}>
                    <Download className="w-3 h-3" /> Export CSV
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={refetchWaitlist} disabled={waitlistLoading}>
                    {waitlistLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={Users} label="Total Waitlist" value={waitlistStats.total} accent />
                <StatCard icon={Mail} label="Free" value={waitlistStats.free} />
                <StatCard icon={Zap} label="Plus ($10)" value={waitlistStats.plus} />
                <StatCard icon={Crown} label="Pro ($29)" value={waitlistStats.pro} />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-1.5">
                {(["all", "free", "plus", "pro"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setWaitlistFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                      waitlistFilter === f
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-muted-foreground border border-border/20 hover:border-border/40 hover:text-foreground",
                    )}
                  >
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Add to Waitlist */}
              <div className="bg-card border border-border/20 rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-3">Add to Waitlist (Grant Access)</h3>
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
                    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
                    const email = emailInput.value.trim();
                    const name = nameInput.value.trim();
                    if (!email) return;

                    try {
                      const { error } = await supabase.from("waitlist").insert({ 
                        email, 
                        first_name: name,
                        plan: "pro",
                        notified: true // Default to granted access
                      });
                      if (error) throw error;
                      toast.success(`Added ${email} and granted access`);
                      form.reset();
                      refetchWaitlist();
                    } catch (err) {
                      toast.error("Failed to add user");
                    }
                  }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <Input name="name" placeholder="First Name" className="h-9 text-xs" />
                  <Input name="email" type="email" placeholder="Email Address" required className="h-9 text-xs" />
                  <Button type="submit" size="sm" className="h-9 px-6 text-xs font-bold">
                    Add & Grant Access
                  </Button>
                </form>
              </div>

              {/* Send launch email — placeholder */}
              <div className="bg-card border border-border/20 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Send Launch Email</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Notify all {waitlistStats.total} waitlist members when you launch.
                  </p>
                </div>
                <Button size="sm" className="h-8 text-xs gap-1.5" disabled>
                  <Mail className="w-3 h-3" /> Send to All (Coming Soon)
                </Button>
              </div>

              {/* Table */}
              {waitlistLoading && waitlistEntries.length === 0 ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="bg-card border border-border/20 rounded-xl p-5 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/20">
                        <th className="text-left py-2 pr-3 font-medium">Email</th>
                        <th className="text-left py-2 pr-3 font-medium">Name</th>
                        <th className="text-left py-2 pr-3 font-medium">Plan</th>
                        <th className="text-left py-2 pr-3 font-medium">Paid</th>
                        <th className="text-left py-2 pr-3 font-medium">Notified</th>
                        <th className="text-left py-2 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWaitlist.map((e) => (
                        <tr key={e.id} className="border-b border-border/10 hover:bg-accent/20 transition-colors">
                          <td className="py-2.5 pr-3 font-medium">{e.email}</td>
                          <td className="py-2.5 pr-3 text-muted-foreground">{e.first_name || "—"}</td>
                          <td className="py-2.5 pr-3">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-medium",
                              e.plan === "pro" ? "bg-purple-500/15 text-purple-400" :
                              e.plan === "plus" ? "bg-primary/15 text-primary" :
                              "bg-accent/40 text-muted-foreground",
                            )}>
                              {e.plan.charAt(0).toUpperCase() + e.plan.slice(1)}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3"><Badge ok={e.paid} /></td>
                          <td className="py-2.5 pr-3">
                            <button
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from("waitlist")
                                    .update({ notified: !e.notified })
                                    .eq("id", e.id);
                                  if (error) throw error;
                                  refetchWaitlist();
                                  toast.success(`Access ${!e.notified ? "granted" : "revoked"} for ${e.email}`);
                                } catch (err) {
                                  toast.error("Failed to update access");
                                }
                              }}
                              className="focus:outline-none"
                            >
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                e.notified ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400",
                              )}>
                                {e.notified ? "Has Access" : "No Access"}
                              </span>
                            </button>
                          </td>
                          <td className="py-2.5 text-muted-foreground">{formatDate(e.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredWaitlist.length === 0 && (
                    <p className="text-center text-muted-foreground text-xs py-8">
                      {waitlistFilter !== "all" ? `No ${waitlistFilter} entries` : "No waitlist entries yet"}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

/* ═══ Sub-components ═══ */

function StatCard({ icon: Icon, label, value, suffix, accent, muted }: {
  icon: typeof Users;
  label: string;
  value: number;
  suffix?: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={cn(
      "bg-card border rounded-xl p-4",
      muted ? "border-border/10 opacity-60" : "border-border/20",
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <p className={cn("text-2xl font-bold", accent && "text-primary")}>
        {suffix === "$" && "$"}{value.toLocaleString("en-US")}{suffix && suffix !== "$" && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
      </p>
      {muted && <p className="text-[10px] text-muted-foreground mt-1">Coming Soon</p>}
    </div>
  );
}

function Badge({ ok }: { ok: boolean }) {
  return (
    <span className={cn(
      "px-1.5 py-0.5 rounded text-[10px] font-medium",
      ok ? "bg-green-500/15 text-green-400" : "bg-orange-500/15 text-orange-400",
    )}>
      {ok ? "Completed" : "In Progress"}
    </span>
  );
}

function ViralBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={cn(
      "px-1.5 py-0.5 rounded text-[10px] font-medium",
      score >= 80 ? "bg-green-500/15 text-green-400" :
      score >= 50 ? "bg-yellow-500/15 text-yellow-400" :
      "bg-red-500/15 text-red-400",
    )}>
      {score}
    </span>
  );
}

function DistributionList({ items, total, colors }: { items: DistributionItem[]; total: number; colors: string[] }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">No data</p>;
  return (
    <div className="space-y-2.5">
      {items.slice(0, 8).map((item, i) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <div key={item.name}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="truncate mr-2">{item.name}</span>
              <span className="text-muted-foreground shrink-0">{item.count} ({pct}%)</span>
            </div>
            <div className="h-1.5 bg-accent/30 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DistributionBars({ items }: { items: DistributionItem[] }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">No data</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-2.5">
      {items.slice(0, 6).map((item) => (
        <div key={item.name}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span>{item.name}</span>
            <span className="font-medium text-primary">{item.count}</span>
          </div>
          <div className="h-1.5 bg-accent/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

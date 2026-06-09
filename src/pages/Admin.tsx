import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, LayoutDashboard, Users, FileText,
  BarChart3, CreditCard, Loader2, TrendingUp, Calendar,
  ChevronLeft, ChevronRight, Zap, DollarSign, Crown,
  Search, RefreshCw, Download, Mail, Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
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
  const [userPlanFilter, setUserPlanFilter] = useState<"all" | "free" | "plus" | "pro">("all");
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [reminderPreview, setReminderPreview] = useState<{ count: number; emails: string[] } | null>(null);

  // Preview which users would receive a re-engagement reminder
  // (dry-run on the send-reminders edge function — no email is sent).
  async function previewReminders() {
    setIsSendingReminders(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-reminders", {
        body: { dryRun: true },
      });
      if (error) throw error;
      const candidates = (data?.candidates as { email: string }[] | undefined) ?? [];
      setReminderPreview({
        count: data?.candidateCount ?? 0,
        emails: candidates.map((c) => c.email).slice(0, 100),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not preview reminders");
    } finally {
      setIsSendingReminders(false);
    }
  }

  async function sendReminders() {
    if (!reminderPreview || reminderPreview.count === 0) {
      toast.error("Run preview first or no inactive users to remind.");
      return;
    }
    if (!confirm(`Send re-engagement emails to ${reminderPreview.count} inactive users?`)) return;
    setIsSendingReminders(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-reminders", { body: {} });
      if (error) throw error;
      const sent = data?.sent ?? 0;
      const failed = data?.failed ?? 0;
      if (sent > 0) toast.success(`Sent ${sent} reminder${sent === 1 ? "" : "s"}.`);
      if (failed > 0) toast.error(`${failed} failed.`);
      setReminderPreview(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reminders");
    } finally {
      setIsSendingReminders(false);
    }
  }

  const filteredUsers = useMemo(() => {
    // Plan filter is applied first, then the search box narrows from there.
    let base = users;
    if (userPlanFilter !== "all") {
      base = base.filter((u) => (u.plan || "free") === userPlanFilter);
    }
    if (!userSearch.trim()) return base;
    const q = userSearch.toLowerCase();
    return base.filter((u) =>
      u.first_name.toLowerCase().includes(q) ||
      u.niche.toLowerCase().includes(q) ||
      u.user_id.includes(q) ||
      (u.email?.toLowerCase().includes(q) ?? false)
    );
  }, [users, userSearch, userPlanFilter]);

  const userPlanStats = useMemo(() => ({
    total: users.length,
    free: users.filter((u) => (u.plan || "free") === "free").length,
    plus: users.filter((u) => u.plan === "plus").length,
    pro: users.filter((u) => u.plan === "pro").length,
  }), [users]);

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

  // Revenue from active subscribers in user_profiles. Stripe is the source of
  // truth, but for an at-a-glance MRR we trust the plan flag we set when the
  // stripe-webhook fires checkout.session.completed.
  const revenueStats = useMemo(() => {
    const plusCount = users.filter((u) => u.plan === "plus").length;
    const proCount = users.filter((u) => u.plan === "pro").length;
    const totalSubs = plusCount + proCount;
    const mrr = plusCount * 10 + proCount * 30;
    const conversionRate = users.length > 0
      ? Math.round((totalSubs / users.length) * 100)
      : 0;
    return { plusCount, proCount, totalSubs, mrr, conversionRate };
  }, [users]);

  // Per-row "Send" loading state (id of the entry currently being sent),
  // and multi-select state for batch send. Both share the same underlying
  // sender function so the email logic stays in one place.
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [selectedWaitlistIds, setSelectedWaitlistIds] = useState<Set<string>>(new Set());

  // Core sender — shared by per-row, send-selected, and send-to-all paths.
  async function sendLaunchEmailsTo(
    entries: WaitlistEntry[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    for (const entry of entries) {
      try {
        const { error } = await supabase.functions.invoke("send-email", {
          body: {
            to: entry.email,
            subject: "We are LIVE! 🚀 - Supenli.ai",
            type: "launch",
            data: { name: entry.first_name || "there" },
          },
        });
        if (error) throw error;
        success++;
      } catch (err) {
        console.error(`Email fail (${entry.email}):`, err);
        failed++;
      }
    }
    return { success, failed };
  }

  async function handleSendOne(entry: WaitlistEntry) {
    setSendingTo(entry.id);
    const { success, failed } = await sendLaunchEmailsTo([entry]);
    setSendingTo(null);
    if (success > 0) toast.success(`Sent to ${entry.email}`);
    if (failed > 0) toast.error(`Failed to send to ${entry.email}`);
  }

  async function handleSendSelected() {
    const targets = filteredWaitlist.filter((e) => selectedWaitlistIds.has(e.id));
    if (targets.length === 0) {
      toast.error("Select at least one entry first.");
      return;
    }
    if (!confirm(`Send the launch email to ${targets.length} selected ${targets.length === 1 ? "person" : "people"}?`)) return;
    setIsSendingEmails(true);
    const { success, failed } = await sendLaunchEmailsTo(targets);
    setIsSendingEmails(false);
    if (success > 0) toast.success(`Sent ${success} launch ${success === 1 ? "email" : "emails"}!`);
    if (failed > 0) toast.error(`${failed} ${failed === 1 ? "email" : "emails"} failed.`);
    setSelectedWaitlistIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedWaitlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    if (filteredWaitlist.every((e) => selectedWaitlistIds.has(e.id))) {
      // Everything visible is already selected → deselect those (keep
      // anything selected outside the current filter, just in case).
      setSelectedWaitlistIds((prev) => {
        const next = new Set(prev);
        filteredWaitlist.forEach((e) => next.delete(e.id));
        return next;
      });
    } else {
      setSelectedWaitlistIds((prev) => {
        const next = new Set(prev);
        filteredWaitlist.forEach((e) => next.add(e.id));
        return next;
      });
    }
  }

  async function handleSendLaunchEmail() {
    if (waitlistEntries.length === 0) {
      toast.error("No waitlist entries found");
      return;
    }
    if (!confirm(`Are you sure you want to send the launch email to ALL ${waitlistEntries.length} members?`)) return;

    setIsSendingEmails(true);
    const { success, failed } = await sendLaunchEmailsTo(waitlistEntries);
    setIsSendingEmails(false);
    if (success > 0) toast.success(`Sent ${success} launch emails!`);
    if (failed > 0) toast.error(`${failed} emails failed to send.`);
  }

  // Delete a user account (auth + all related rows) via the delete-user edge fn.
  // Two-step: click the trash button opens a styled confirmation modal; only
  // confirmDeleteUser() actually calls the edge function.
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<{ userId: string; label: string } | null>(null);
  function openDeleteModal(userId: string, label: string) {
    setDeleteCandidate({ userId, label });
  }
  async function confirmDeleteUser() {
    if (!deleteCandidate) return;
    const { userId } = deleteCandidate;
    setDeletingUserId(userId);
    setDeleteCandidate(null);
    try {
      const { error } = await supabase.functions.invoke("delete-user", { body: { userId } });
      if (error) {
        const ctx = (error as { context?: Response }).context;
        let msg = error.message;
        if (ctx && typeof ctx.json === "function") {
          try {
            const body = await ctx.json();
            if (body?.error) msg = body.error;
          } catch { /* ignore */ }
        }
        throw new Error(msg);
      }
      toast.success("User deleted");
      refetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete user");
    } finally {
      setDeletingUserId(null);
    }
  }

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
                <h2 className="text-lg font-bold shrink-0">Users ({filteredUsers.length}/{userPlanStats.total})</h2>
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

              {/* Plan filter pills — click to scope the users table to a
                  specific plan tier. "All" is the default; the count next to
                  each label is live and updates when refetch fires. */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {([
                  { id: "all" as const, label: "All", count: userPlanStats.total },
                  { id: "free" as const, label: "Free", count: userPlanStats.free },
                  { id: "plus" as const, label: "Plus ($10)", count: userPlanStats.plus },
                  { id: "pro" as const, label: "Pro ($30)", count: userPlanStats.pro },
                ]).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setUserPlanFilter(f.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap",
                      userPlanFilter === f.id
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-muted-foreground border border-border/20 hover:border-border/40 hover:text-foreground",
                    )}
                  >
                    {f.label} · {f.count}
                  </button>
                ))}
              </div>

              {/* Re-engagement reminders — emails inactive users who signed up but
                  haven't created any content. Preview first, then confirm to send. */}
              <div className="bg-card border border-border/20 rounded-xl p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold">Re-engagement reminders</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Email signups who haven't generated content (3+ days old, 7+ days inactive, no active plan).
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline" size="sm" className="h-8 text-xs gap-1.5"
                      onClick={previewReminders}
                      disabled={isSendingReminders}
                    >
                      {isSendingReminders ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                      Preview
                    </Button>
                    <Button
                      size="sm" className="h-8 text-xs gap-1.5"
                      onClick={sendReminders}
                      disabled={isSendingReminders || !reminderPreview || reminderPreview.count === 0}
                    >
                      <Mail className="w-3 h-3" />
                      {reminderPreview ? `Send (${reminderPreview.count})` : "Send"}
                    </Button>
                  </div>
                </div>
                {reminderPreview && (
                  <div className="mt-3 pt-3 border-t border-border/10">
                    <p className="text-[11px] text-muted-foreground mb-2">
                      <strong className="text-foreground">{reminderPreview.count}</strong> user{reminderPreview.count === 1 ? "" : "s"} matched
                      {reminderPreview.emails.length < reminderPreview.count && ` (showing first ${reminderPreview.emails.length})`}
                    </p>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      {reminderPreview.emails.map((email) => (
                        <span key={email} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/30 text-muted-foreground font-mono">
                          {email}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
                        <th className="text-left py-2 pr-3 font-medium">Email</th>
                        <th className="text-left py-2 pr-3 font-medium">Name</th>
                        <th className="text-left py-2 pr-3 font-medium">Plan</th>
                        <th className="text-left py-2 pr-3 font-medium">Niche</th>
                        <th className="text-left py-2 pr-3 font-medium">Platforms</th>
                        <th className="text-left py-2 pr-3 font-medium">Onboarding</th>
                        <th className="text-left py-2 pr-3 font-medium">Content</th>
                        <th className="text-left py-2 pr-3 font-medium">Signup</th>
                        <th className="text-right py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const planValue = (u.plan || "free").toLowerCase();
                        const planClass = planValue === "pro"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : planValue === "plus"
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-muted/30 text-muted-foreground border-border/30";
                        return (
                        <tr key={u.user_id} className="border-b border-border/10 hover:bg-accent/20 transition-colors">
                          <td className="py-2.5 pr-3 font-medium max-w-[260px] truncate" title={u.email}>{u.email || "—"}</td>
                          <td className="py-2.5 pr-3 font-medium">{u.first_name || "—"}</td>
                          <td className="py-2.5 pr-3">
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide", planClass)}>
                              {planValue}
                            </span>
                            {u.plan_expires_at && planValue !== "free" && (
                              <span className="ml-1.5 text-[10px] text-muted-foreground" title={`Expires ${u.plan_expires_at}`}>
                                {formatDate(u.plan_expires_at)}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 pr-3 text-muted-foreground">{u.niche || "—"}</td>
                          <td className="py-2.5 pr-3 text-muted-foreground max-w-[200px] truncate">{u.platforms?.join(", ") || "—"}</td>
                          <td className="py-2.5 pr-3"><Badge ok={u.onboarding_completed} /></td>
                          <td className="py-2.5 pr-3 font-medium">{u.content_count}</td>
                          <td className="py-2.5 pr-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                          <td className="py-2.5 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={deletingUserId === u.user_id}
                              onClick={() => openDeleteModal(u.user_id, u.first_name || u.email || "this user")}
                              className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete user permanently"
                            >
                              {deletingUserId === u.user_id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </td>
                        </tr>
                        );
                      })}
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Revenue</h2>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={refetchUsers} disabled={usersLoading}>
                  <RefreshCw className={cn("w-3 h-3", usersLoading && "animate-spin")} /> Refresh
                </Button>
              </div>

              {usersLoading && users.length === 0 ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Headline cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard icon={DollarSign} label="MRR" value={revenueStats.mrr} suffix="$" accent />
                    <StatCard icon={Crown} label="Total Subscribers" value={revenueStats.totalSubs} />
                    <StatCard icon={Zap} label="Plus ($10)" value={revenueStats.plusCount} />
                    <StatCard icon={Crown} label="Pro ($30)" value={revenueStats.proCount} />
                  </div>

                  {/* Plan split visualization */}
                  <div className="bg-card border border-border/20 rounded-xl p-5">
                    <h3 className="text-sm font-semibold mb-4">Plan distribution</h3>
                    {revenueStats.totalSubs === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        No subscribers yet. Numbers update automatically when the Stripe webhook fires <code className="text-[10px] bg-accent/30 px-1 py-0.5 rounded">checkout.session.completed</code>.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-medium">Plus — $10/mo</span>
                            <span className="text-muted-foreground">
                              {revenueStats.plusCount} ({Math.round((revenueStats.plusCount / revenueStats.totalSubs) * 100)}%)
                              <span className="ml-2 text-primary font-semibold">${revenueStats.plusCount * 10}</span>
                            </span>
                          </div>
                          <div className="h-2 bg-accent/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(revenueStats.plusCount / revenueStats.totalSubs) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-medium">Pro — $30/mo</span>
                            <span className="text-muted-foreground">
                              {revenueStats.proCount} ({Math.round((revenueStats.proCount / revenueStats.totalSubs) * 100)}%)
                              <span className="ml-2 text-primary font-semibold">${revenueStats.proCount * 30}</span>
                            </span>
                          </div>
                          <div className="h-2 bg-accent/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-400 rounded-full"
                              style={{ width: `${(revenueStats.proCount / revenueStats.totalSubs) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Conversion + Stripe link */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border/20 rounded-xl p-5">
                      <h3 className="text-sm font-semibold mb-3">Conversion to paid</h3>
                      <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-4xl font-bold text-primary">{revenueStats.conversionRate}</span>
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        {revenueStats.totalSubs} of {users.length} accounts are paying
                      </p>
                      <div className="mt-3 h-2 bg-accent/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${revenueStats.conversionRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-card border border-border/20 rounded-xl p-5">
                      <h3 className="text-sm font-semibold mb-3">Stripe Dashboard</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        For live charges, refunds and customer details, go directly to Stripe — this view shows what our DB has recorded via webhook.
                      </p>
                      <a
                        href="https://dashboard.stripe.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        Open Stripe Dashboard →
                      </a>
                    </div>
                  </div>

                  {/* Paying users table */}
                  <div className="bg-card border border-border/20 rounded-xl p-5 overflow-x-auto">
                    <h3 className="text-sm font-semibold mb-3">Paying users</h3>
                    {revenueStats.totalSubs === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No paying users yet.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border/20">
                            <th className="text-left py-2 pr-3 font-medium">Email</th>
                            <th className="text-left py-2 pr-3 font-medium">Name</th>
                            <th className="text-left py-2 pr-3 font-medium">Plan</th>
                            <th className="text-left py-2 pr-3 font-medium">Content</th>
                            <th className="text-left py-2 font-medium">Signup</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users
                            .filter((u) => u.plan === "plus" || u.plan === "pro")
                            .map((u) => (
                              <tr key={u.user_id} className="border-b border-border/10 hover:bg-accent/20 transition-colors">
                                <td className="py-2.5 pr-3 font-medium max-w-[260px] truncate" title={u.email}>{u.email || "—"}</td>
                                <td className="py-2.5 pr-3 font-medium">{u.first_name || "—"}</td>
                                <td className="py-2.5 pr-3">
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                    u.plan === "pro" ? "bg-purple-500/15 text-purple-400" : "bg-primary/15 text-primary",
                                  )}>
                                    {u.plan === "pro" ? "Pro ($30)" : "Plus ($10)"}
                                  </span>
                                </td>
                                <td className="py-2.5 pr-3 font-medium">{u.content_count}</td>
                                <td className="py-2.5 text-muted-foreground">{formatDate(u.created_at)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
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

              {/* Send launch email — three paths now:
                  - per-row Send button (test one address at a time)
                  - "Send to selected" using the row checkboxes
                  - "Send to all" for the full broadcast */}
              <div className="bg-card border border-border/20 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">Send Launch Email</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Test one email at a time with the Send button on each row, pick
                      a subset with the checkboxes, or blast the full {waitlistStats.total}-member waitlist.
                    </p>
                    {selectedWaitlistIds.size > 0 && (
                      <p className="text-[11px] text-primary mt-2 font-medium">
                        {selectedWaitlistIds.size} selected
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={handleSendSelected}
                      disabled={isSendingEmails || waitlistLoading || selectedWaitlistIds.size === 0}
                    >
                      {isSendingEmails && selectedWaitlistIds.size > 0
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Mail className="w-3 h-3" />}
                      Send to selected ({selectedWaitlistIds.size})
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      onClick={handleSendLaunchEmail}
                      disabled={isSendingEmails || waitlistLoading || waitlistEntries.length === 0}
                    >
                      {isSendingEmails && selectedWaitlistIds.size === 0
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Mail className="w-3 h-3" />}
                      Send to all ({waitlistStats.total})
                    </Button>
                  </div>
                </div>
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
                        <th className="text-left py-2 pr-3 w-6">
                          <input
                            type="checkbox"
                            aria-label="Select all visible"
                            checked={filteredWaitlist.length > 0 && filteredWaitlist.every((e) => selectedWaitlistIds.has(e.id))}
                            onChange={toggleSelectAllVisible}
                            className="accent-primary cursor-pointer"
                          />
                        </th>
                        <th className="text-left py-2 pr-3 font-medium">Email</th>
                        <th className="text-left py-2 pr-3 font-medium">Name</th>
                        <th className="text-left py-2 pr-3 font-medium">Plan</th>
                        <th className="text-left py-2 pr-3 font-medium">Paid</th>
                        <th className="text-left py-2 pr-3 font-medium">Notified</th>
                        <th className="text-left py-2 pr-3 font-medium">Joined</th>
                        <th className="text-right py-2 font-medium">Send</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWaitlist.map((e) => (
                        <tr key={e.id} className="border-b border-border/10 hover:bg-accent/20 transition-colors">
                          <td className="py-2.5 pr-3">
                            <input
                              type="checkbox"
                              aria-label={`Select ${e.email}`}
                              checked={selectedWaitlistIds.has(e.id)}
                              onChange={() => toggleSelect(e.id)}
                              className="accent-primary cursor-pointer"
                            />
                          </td>
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
                          <td className="py-2.5 pr-3 text-muted-foreground">{formatDate(e.created_at)}</td>
                          <td className="py-2.5 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={sendingTo === e.id || isSendingEmails}
                              onClick={() => handleSendOne(e)}
                              className="h-7 px-2 gap-1.5 text-[10px]"
                              title={`Send launch email to ${e.email}`}
                            >
                              {sendingTo === e.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Mail className="w-3 h-3" />
                              )}
                              Send
                            </Button>
                          </td>
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

      {/* Confirmation modal for permanent user deletion */}
      <AlertDialog open={deleteCandidate !== null} onOpenChange={(open) => { if (!open) setDeleteCandidate(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong className="text-foreground">{deleteCandidate?.label}</strong> and every row attached to that account (profile, generated content, sources, coach conversations, sessions). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import SourcePanel from "@/components/SourcePanel";
import ChatPanel from "@/components/ChatPanel";
import { useHistory } from "@/hooks/use-history";
import { useSources } from "@/hooks/use-sources";
import { useConversation } from "@/hooks/use-conversation";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { invalidateCache } from "@/lib/cache";
import {
  Plus, Search, FileText, Sparkles, Trash2,
  Loader2, BookOpen, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ErrorBoundary from "@/components/ErrorBoundary";
import OnboardingTour from "@/components/OnboardingTour";

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type MobileTab = "sources" | "content" | "coach";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();

  // Sources
  const {
    sources, grouped: groupedSources, loading: sourcesLoading,
    addUrl, addNote, addPdf, searchWeb, removeGrouped,
  } = useSources();
  const [activeSourceIds, setActiveSourceIds] = useState<Set<string>>(new Set());

  // Coach
  const {
    messages, setMessages, loading: conversationLoading, clearConversation,
  } = useConversation();

  // Content grid
  const { sessions: hookSessions, loading: historyLoading, refetch: refetchHistory } = useHistory();
  const [localDeleted, setLocalDeleted] = useState<Set<string>>(new Set());
  const sessions = useMemo(() => hookSessions.filter((s) => !localDeleted.has(s.sessionId)), [hookSessions, localDeleted]);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("content");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function deleteSession(sessionId: string) {
    if (!user) return;
    setDeleting(true);
    try {
      const session = sessions.find((s) => s.sessionId === sessionId);
      let ids = session?.itemIds || [];

      if (ids.length === 0) {
        const { data } = await supabase
          .from("generated_content")
          .select("id")
          .eq("user_id", user.id)
          .or(`session_id.eq.${sessionId},id.eq.${sessionId}`);
        ids = (data || []).map((i) => i.id);
      }

      if (ids.length === 0) {
        toast.error("No items found for this session.");
        return;
      }

      const { error } = await supabase
        .from("generated_content")
        .delete()
        .in("id", ids)
        .eq("user_id", user.id);

      if (error) {
        toast.error(`Delete failed: ${error.message}`);
        return;
      }

      setLocalDeleted((prev) => new Set(prev).add(sessionId));
      setDeletingId(null);
      toast.success("Content deleted!");
      invalidateCache("history:");
      refetchHistory();
    } catch {
      toast.error("Delete failed. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  // Stripe redirect
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      const plan = searchParams.get("plan") || "Pro";
      toast.success(`Welcome to ${plan.charAt(0).toUpperCase() + plan.slice(1)}! Your account has been updated.`);
      searchParams.delete("upgraded");
      searchParams.delete("plan");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleToggleGroup = useCallback((ids: string[]) => {
    setActiveSourceIds((prev) => {
      const next = new Set(prev);
      const allActive = ids.every((id) => next.has(id));
      if (allActive) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  // Platform filter chips
  const availablePlatforms = useMemo(() => {
    const set = new Set(sessions.map((s) => s.platform));
    return Array.from(set).sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    let result = sessions;
    if (platformFilter) {
      result = result.filter((s) => s.platform === platformFilter);
    }
    if (search.trim()) {
      result = result.filter((s) =>
        s.topic.toLowerCase().includes(search.toLowerCase()) ||
        s.platform.toLowerCase().includes(search.toLowerCase()),
      );
    }
    return result;
  }, [sessions, search, platformFilter]);

  const hasContent = sessions.length > 0;
  const greeting = profile?.first_name ? `Hey ${profile.first_name}!` : "Welcome";

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">

        {/* MOBILE BOTTOM NAV */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border/30 flex items-center justify-around px-2 py-1.5 pb-[max(env(safe-area-inset-bottom),0.375rem)]">
          <button onClick={() => setMobileTab("sources")} className={cn("flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-all relative", mobileTab === "sources" ? "text-primary" : "text-muted-foreground/60")}>
            <BookOpen className="w-5 h-5" />
            <span className="text-[9px] font-medium">Sources</span>
            {groupedSources.length > 0 && <span className="absolute top-0 right-2 w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>
          <button onClick={() => setMobileTab("content")} className={cn("flex flex-col items-center gap-0.5 py-1.5 px-5 rounded-2xl transition-all", mobileTab === "content" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground/60")}>
            <Sparkles className="w-5 h-5" />
            <span className="text-[9px] font-medium">Content</span>
          </button>
          <button onClick={() => setMobileTab("coach")} className={cn("flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-all relative", mobileTab === "coach" ? "text-primary" : "text-muted-foreground/60")}>
            <Bot className="w-5 h-5" />
            <span className="text-[9px] font-medium">Coach</span>
            {messages.length > 0 && <span className="absolute top-0 right-2 w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>
        </nav>

        {/* 3 COLUMNS */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* LEFT — SOURCES (200px) */}
          <div data-tour="sources" className={cn(
            "shrink-0 border-r border-border/20 bg-accent/[0.02] md:w-[200px] md:flex md:flex-col",
            mobileTab === "sources" ? "flex flex-col w-full" : "hidden md:flex",
          )}>
            <SourcePanel
              groupedSources={groupedSources}
              loading={sourcesLoading}
              activeSourceIds={activeSourceIds}
              onToggleGroup={handleToggleGroup}
              onAddUrl={addUrl}
              onAddNote={addNote}
              onAddPdf={async (file) => {
                const result = await addPdf(file);
                if (!result.error && result.insertedIds?.length) {
                  setActiveSourceIds((prev) => {
                    const next = new Set(prev);
                    result.insertedIds!.forEach((id) => next.add(id));
                    return next;
                  });
                }
                return result;
              }}
              onSearchWeb={searchWeb}
              onRemoveGroup={removeGrouped}
            />
          </div>

          {/* CENTER — MY CONTENT */}
          <div className={cn(
            "flex-1 flex flex-col overflow-hidden min-w-0 md:pl-3 lg:pl-4 lg:pr-3",
            mobileTab !== "content" ? "hidden md:flex" : "flex",
          )}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-border/10 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-base font-bold">{hasContent ? "My Content" : greeting}</h1>
                  {hasContent && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <Button data-tour="create-btn" onClick={() => navigate("/dashboard/studio")} className="gap-2 h-9 text-sm font-bold px-4 shrink-0">
                  <Plus className="w-4 h-4" /> Create Content
                </Button>
              </div>
            </div>

            {/* Search + filters */}
            {hasContent && (
              <div className="px-5 py-3 border-b border-border/10 space-y-2.5 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search content..."
                    className="pl-9 h-8 bg-accent/10 border-border/10 text-xs"
                  />
                </div>
                {availablePlatforms.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    <button
                      onClick={() => setPlatformFilter(null)}
                      className={cn(
                        "text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap transition-all shrink-0 border font-medium",
                        !platformFilter
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/20 text-muted-foreground hover:border-border/40",
                      )}
                    >
                      All
                    </button>
                    {availablePlatforms.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPlatformFilter(platformFilter === p ? null : p)}
                        className={cn(
                          "text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap transition-all shrink-0 border font-medium",
                          platformFilter === p
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border/20 text-muted-foreground hover:border-border/40",
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
              {historyLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/30" />
                </div>
              ) : !hasContent ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 border border-primary/20 mx-auto">
                      <Sparkles className="w-11 h-11 text-primary/70" />
                    </div>
                    <h2 className="text-xl font-bold mb-3">Create your first content</h2>
                    <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
                      Generate viral posts for LinkedIn, Instagram, TikTok and more — with AI-powered visuals.
                    </p>
                    <Button size="lg" onClick={() => navigate("/dashboard/studio")} className="gap-3 font-bold px-10 h-14 text-lg shadow-md">
                      <Plus className="w-5 h-5" /> Create New Content
                    </Button>
                    <p className="text-xs text-muted-foreground/50 mt-4">Your content will appear here</p>
                  </motion.div>
                </div>
              ) : (
                /* Content grid — premium minimal cards */
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {/* + New card */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-xl border-2 border-dashed border-border/15 hover:border-primary/25 hover:bg-primary/[0.03] transition-all duration-200 cursor-pointer flex flex-col items-center justify-center aspect-[4/5] group"
                      onClick={() => navigate("/dashboard/studio")}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/[0.08] flex items-center justify-center mb-2.5 group-hover:bg-primary/15 transition-colors duration-200">
                        <Plus className="w-5 h-5 text-primary/70" />
                      </div>
                      <p className="text-[12px] font-semibold text-muted-foreground/60 group-hover:text-foreground/80 transition-colors">
                        New Content
                      </p>
                    </motion.div>

                    {/* Session cards */}
                    {filtered.map((s, i) => {
                      const hasVisual = !!s.infographic;
                      return (
                        <motion.div
                          key={s.sessionId}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.03, 0.4) }}
                          className="group relative cursor-pointer"
                          onClick={() => navigate(`/editor/${s.sessionId}`)}
                        >
                          <div className="rounded-xl overflow-hidden border border-border/10 bg-card hover:border-border/25 hover:shadow-xl hover:shadow-black/15 transition-all duration-300">
                            {/* Visual zone */}
                            <div className="relative overflow-hidden aspect-[4/5] bg-accent/[0.08]">
                              {hasVisual ? (
                                <img
                                  src={`data:image/png;base64,${s.infographic}`}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                                  alt=""
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-accent/5">
                                  <FileText className="w-8 h-8 text-muted-foreground/15" />
                                </div>
                              )}

                              {/* Badges grouped — top right */}
                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                                {hasVisual && (
                                  <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white/95">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Visual
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15">
                                  <span className="text-[10px] font-semibold text-white/95">{s.platform}</span>
                                </span>
                                <button
                                  className="w-7 h-7 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/80"
                                  onClick={(e) => { e.stopPropagation(); setDeletingId(s.sessionId); }}
                                  title="Delete session"
                                >
                                  <Trash2 className="w-3 h-3 text-white" />
                                </button>
                              </div>

                              {/* Generate visual hint — center on hover (no visual) */}
                              {!hasVisual && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/10">
                                  <span className="text-[11px] px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-medium flex items-center gap-1.5 shadow-lg">
                                    <Sparkles className="w-3 h-3" />
                                    Generate visual
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Title */}
                            <div className="px-3.5 pt-3 pb-1.5">
                              <p className="text-[15px] font-bold leading-snug line-clamp-2 text-foreground tracking-tight">
                                {s.topic || "Untitled session"}
                              </p>
                            </div>

                            {/* Metadata footer */}
                            <div className="px-3.5 py-2.5 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className={cn("w-1.5 h-1.5 rounded-full", hasVisual ? "bg-emerald-400" : "bg-amber-400")} />
                                <span className="text-[11px] text-muted-foreground/70 font-medium">
                                  {hasVisual ? "Complete" : "In progress"}
                                </span>
                              </div>
                              <span className="text-[11px] text-muted-foreground/60">
                                {timeAgo(s.createdAt)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {filtered.length === 0 && search && (
                      <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                        <Search className="w-8 h-8 text-muted-foreground/20 mb-3" />
                        <p className="text-sm font-medium">No results</p>
                        <p className="text-xs text-muted-foreground mt-1">Try different keywords</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — COACH (320px) */}
          <div data-tour="coach" className={cn(
            "shrink-0 border-l border-border/20 bg-accent/[0.02] lg:w-[320px] lg:flex lg:flex-col",
            mobileTab === "coach" ? "flex flex-col w-full" : "hidden lg:flex",
          )}>
            <ErrorBoundary fallback={<div className="flex-1 flex items-center justify-center p-4"><p className="text-xs text-muted-foreground text-center">The Coach encountered an error. Reload the page.</p></div>}>
              <ChatPanel
                sources={sources}
                messages={messages}
                onMessagesChange={setMessages}
                conversationLoading={conversationLoading}
                onClearConversation={clearConversation}
                profile={profile}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
      <OnboardingTour />

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setDeletingId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-base font-bold mb-2">Delete this content?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                This will permanently delete all variations and the infographic. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => setDeletingId(null)} disabled={deleting}>
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1 h-9 text-sm gap-2" disabled={deleting} onClick={() => deleteSession(deletingId)}>
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default Dashboard;

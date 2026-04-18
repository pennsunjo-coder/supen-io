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
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Plus, Search, FileText, Sparkles,
  Clock, Check, Loader2, BookOpen, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ErrorBoundary from "@/components/ErrorBoundary";

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
  const { sessions, loading: historyLoading } = useHistory();
  const [search, setSearch] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("content");

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

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    return sessions.filter((s) =>
      s.topic.toLowerCase().includes(search.toLowerCase()) ||
      s.platform.toLowerCase().includes(search.toLowerCase()),
    );
  }, [sessions, search]);

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

          {/* LEFT — SOURCES */}
          <div className={cn(
            "shrink-0 border-r border-border/20 bg-accent/[0.02] md:w-auto md:flex md:flex-col",
            mobileTab === "sources" ? "flex flex-col w-full" : "hidden md:flex",
          )}>
            <SourcePanel
              groupedSources={groupedSources}
              loading={sourcesLoading}
              activeSourceIds={activeSourceIds}
              onToggleGroup={handleToggleGroup}
              onAddUrl={addUrl}
              onAddNote={addNote}
              onAddPdf={addPdf}
              onSearchWeb={searchWeb}
              onRemoveGroup={removeGrouped}
            />
          </div>

          {/* CENTER — MY CONTENT */}
          <div className={cn(
            "flex-1 flex flex-col overflow-hidden min-w-0",
            mobileTab !== "content" ? "hidden md:flex" : "flex",
          )}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-border/10 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-base font-bold">{greeting}</h1>
                  {hasContent && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sessions.length} session{sessions.length !== 1 ? "s" : ""} generated
                    </p>
                  )}
                </div>
                <Button onClick={() => navigate("/dashboard/studio")} className="gap-2 h-9 text-sm font-semibold shrink-0">
                  <Plus className="w-4 h-4" /> Create Content
                </Button>
              </div>
              {hasContent && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search content..."
                    className="pl-9 h-8 bg-accent/20 border-border/20 text-xs"
                  />
                </div>
              )}
            </div>

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
                    <Button size="lg" onClick={() => navigate("/dashboard/studio")} className="gap-2 font-semibold px-8">
                      <Plus className="w-5 h-5" /> Create New Content
                    </Button>
                    <p className="text-xs text-muted-foreground/50 mt-4">Your content will appear here</p>
                  </motion.div>
                </div>
              ) : (
                /* Content grid */
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {/* + New card */}
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="rounded-2xl border-2 border-dashed border-border/25 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer flex flex-col items-center justify-center aspect-[4/5] p-3 group"
                      onClick={() => navigate("/dashboard/studio")}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-xs font-semibold">Create Content</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5 text-center">Posts + Visual</p>
                    </motion.div>

                    {/* Session cards */}
                    {filtered.map((s, i) => (
                      <motion.div
                        key={s.sessionId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.4) }}
                        whileHover={{ y: -3 }}
                        className="rounded-2xl border border-border/20 overflow-hidden hover:border-border/40 hover:shadow-xl hover:shadow-black/10 transition-all cursor-pointer group flex flex-col aspect-[4/5]"
                        onClick={() => navigate(`/editor/${s.sessionId}`)}
                      >
                        <div className="relative flex-1 overflow-hidden bg-accent/10 min-h-0">
                          {s.infographic ? (
                            <>
                              <img src={`data:image/png;base64,${s.infographic}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                              <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/90 text-white font-semibold flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> Visual
                              </span>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center relative">
                              <FileText className="w-8 h-8 text-muted-foreground/15 mb-1" />
                              <p className="text-[10px] text-muted-foreground/25">No visual</p>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-medium flex items-center gap-1.5">
                                  <Sparkles className="w-3 h-3" /> Add visual
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-2.5 bg-card shrink-0">
                          <p className="text-[10px] font-medium line-clamp-2 leading-relaxed mb-1.5 min-h-[2rem]">
                            {s.topic || "Untitled"}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/40 text-muted-foreground font-medium truncate max-w-[60%]">
                              {s.platform || "—"}
                            </span>
                            <span className="text-[10px] text-muted-foreground/40 flex items-center gap-0.5 shrink-0">
                              <Clock className="w-2.5 h-2.5" />
                              {timeAgo(s.createdAt)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}

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

          {/* RIGHT — COACH */}
          <div className={cn(
            "shrink-0 border-l border-border/20 bg-accent/[0.02] lg:w-[300px] lg:flex lg:flex-col",
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
    </DashboardLayout>
  );
};

export default Dashboard;

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
  Plus, Search, Sparkles, Trash2,
  Loader2, BookOpen, Bot, ChevronLeft, ChevronRight, X
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

type SidePanel = "sources" | "coach" | null;

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
  const [activePanel, setActivePanel] = useState<SidePanel>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function deleteSession(sessionId: string) {
    if (!user) return;
    setDeleting(true);
    try {
      const session = sessions.find((s) => s.sessionId === sessionId);
      let ids = session?.itemIds || [];
      if (ids.length === 0) {
        const { data } = await supabase.from("generated_content").select("id").eq("user_id", user.id).or(`session_id.eq.${sessionId},id.eq.${sessionId}`);
        ids = (data || []).map((i) => i.id);
      }
      const { error } = await supabase.from("generated_content").delete().in("id", ids).eq("user_id", user.id);
      if (error) throw error;

      setLocalDeleted((prev) => new Set(prev).add(sessionId));
      setDeletingId(null);
      toast.success("Deleted");
      invalidateCache("history:");
      refetchHistory();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  // Stripe redirect
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      const plan = searchParams.get("plan") || "Pro";
      toast.success(`Welcome to ${plan.charAt(0).toUpperCase() + plan.slice(1)}!`);
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

  const availablePlatforms = useMemo(() => {
    const set = new Set(sessions.map((s) => s.platform));
    return Array.from(set).sort();
  }, [sessions]);

  const filtered = useMemo(() => {
    let result = sessions;
    if (platformFilter) result = result.filter((s) => s.platform === platformFilter);
    if (search.trim()) {
      result = result.filter((s) =>
        s.topic.toLowerCase().includes(search.toLowerCase()) ||
        s.platform.toLowerCase().includes(search.toLowerCase()),
      );
    }
    return result;
  }, [sessions, search, platformFilter]);

  const hasContent = sessions.length > 0;
  const greeting = profile?.first_name ? `Hey ${profile.first_name}` : "Welcome back";

  return (
    <DashboardLayout>
      <div className="flex-1 flex overflow-hidden bg-background relative">
        
        {/* LEFT SIDEBAR — Sources (Permanent on desktop) */}
        <div className={cn(
          "w-72 border-r border-border/40 flex flex-col transition-all duration-500 bg-card/10 backdrop-blur-xl shrink-0 z-20",
          activePanel !== "sources" && "hidden lg:flex"
        )}>
          <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/20">
            <span className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-primary" /> Sources</span>
            {activePanel === "sources" && (
              <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)} className="h-8 w-8 lg:hidden"><X className="w-4 h-4" /></Button>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
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
        </div>

        {/* MAIN CONTENT AREA — The Focus */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto no-scrollbar pt-8 px-6 lg:px-10">
          <div className="max-w-5xl mx-auto w-full">
          
          {/* Dashboard Header */}
          <header className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h1 className="text-4xl font-black tracking-tight mb-2 text-gradient">{hasContent ? "Creative Library" : greeting}</h1>
                <p className="text-sm font-medium text-muted-foreground/60 max-w-lg">
                  {hasContent ? `Manage and refine your ${sessions.length} assets.` : "The ultimate studio to transform your knowledge into viral content."}
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => navigate("/dashboard/studio")}
                className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-sm gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95 group"
              >
                <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" /> Create Content
              </Button>
            </div>

            {/* Quick Actions & Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 group w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search library..."
                  className="pl-12 h-12 glass border-border/40 rounded-xl text-sm focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setActivePanel(activePanel === "sources" ? null : "sources")}
                  className={cn("h-12 px-5 flex-1 sm:flex-none lg:hidden rounded-xl gap-2 text-xs font-black uppercase tracking-widest border-border/40 hover:bg-card transition-all", activePanel === "sources" && "bg-primary/10 border-primary/20 text-primary")}
                >
                  <BookOpen className="w-4 h-4" />
                  Sources
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActivePanel(activePanel === "coach" ? null : "coach")}
                  className={cn("h-12 px-5 flex-1 sm:flex-none rounded-xl gap-2 text-xs font-black uppercase tracking-widest border-border/40 hover:bg-card transition-all", activePanel === "coach" && "bg-primary/10 border-primary/20 text-primary")}
                >
                  <Bot className="w-4 h-4" />
                  Coach
                </Button>
              </div>
            </div>

            {/* Platform Filter Chips */}
            {availablePlatforms.length > 1 && (
              <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setPlatformFilter(null)}
                  className={cn(
                    "px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                    !platformFilter ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-card/50 border-border/40 text-muted-foreground hover:bg-card"
                  )}
                >
                  All
                </button>
                {availablePlatforms.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatformFilter(platformFilter === p ? null : p)}
                    className={cn(
                      "px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                      platformFilter === p ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-card/50 border-border/40 text-muted-foreground hover:bg-card"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </header>

          {/* GRID AREA */}
          <div className="pb-32">
            {historyLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-primary animate-pulse" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 animate-pulse">Organizing Space...</p>
              </div>
            ) : !hasContent ? (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center glass-card p-12 border-dashed border-border/40">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-black mb-3">Your studio is ready</h2>
                <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto mb-8 font-medium">Add a source to start creating viral content.</p>
                <Button size="lg" onClick={() => navigate("/dashboard/studio")} className="h-14 px-10 rounded-xl bg-primary font-black text-base shadow-xl shadow-primary/20 transition-all active:scale-95">Get Started</Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((s, i) => (
                  <motion.div
                    key={s.sessionId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="group relative"
                    onClick={() => navigate(`/editor/${s.sessionId}`)}
                  >
                    <div className="glass-card overflow-hidden h-full flex flex-col group cursor-pointer border-border/30 hover:border-primary/40">
                      <div className="aspect-square relative overflow-hidden bg-card/50">
                        {s.infographic ? (
                          <img src={`data:image/png;base64,${s.infographic}`} className="w-full h-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-110" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
                            <div className="w-16 h-16 rounded-full glass border-border/40 flex items-center justify-center">
                              <Sparkles className="w-8 h-8 text-primary/30" />
                            </div>
                          </div>
                        )}
                        
                        {/* Overlay Status Badges */}
                        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5">
                          <span className="px-3 py-1 rounded-lg glass text-[9px] font-black uppercase tracking-widest text-foreground/80">{s.platform}</span>
                          {s.infographic && (
                            <span className="px-3 py-1 rounded-lg bg-primary/10 backdrop-blur-md border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary">Visual Ready</span>
                          )}
                        </div>

                        {/* Hover Quick Actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-2 px-6">
                           <Button className="flex-1 h-10 rounded-lg font-black text-xs bg-white text-black hover:bg-white/90 shadow-2xl transition-all translate-y-2 group-hover:translate-y-0 duration-500">Open Studio</Button>
                           <Button size="icon" variant="destructive" className="h-10 w-10 rounded-lg shadow-2xl transition-all translate-y-2 group-hover:translate-y-0 duration-500 delay-75" onClick={(e) => { e.stopPropagation(); setDeletingId(s.sessionId); }}>
                             <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-sm font-black leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors duration-300">{s.topic || "Untitled Session"}</h3>
                        <div className="mt-auto pt-3 border-t border-border/20 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-primary glow-sm" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">{timeAgo(s.createdAt)}</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR — Coach (Permanent on desktop) */}
        <div className={cn(
          "w-80 border-l border-border/40 flex flex-col transition-all duration-500 bg-card/10 backdrop-blur-xl shrink-0 z-20",
          activePanel !== "coach" && "hidden lg:flex"
        )}>
          <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/20">
            <span className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-foreground"><Bot className="w-3.5 h-3.5 text-primary" /> AI Creative Coach</span>
            <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)} className="h-8 w-8 lg:hidden"><X className="w-4 h-4" /></Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              sources={sources}
              messages={messages}
              onMessagesChange={setMessages}
              conversationLoading={conversationLoading}
              onClearConversation={clearConversation}
              profile={profile}
            />
          </div>
        </div>

      </div>

      <OnboardingTour />
      
      {/* DELETE MODAL */}
      <AnimatePresence>
        {deletingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass max-w-sm w-full p-10 rounded-[3rem] text-center border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
               <div className="w-20 h-20 rounded-[1.5rem] bg-red-500/10 flex items-center justify-center mx-auto mb-8">
                 <Trash2 className="w-10 h-10 text-red-500" />
               </div>
               <h3 className="text-2xl font-black mb-3 text-foreground">Delete Asset?</h3>
               <p className="text-base text-muted-foreground mb-10 font-medium">This is permanent. Your viral content and visuals will vanish forever.</p>
               <div className="flex flex-col gap-3">
                 <Button variant="destructive" className="w-full rounded-2xl font-black h-14 text-lg shadow-2xl shadow-red-500/20" onClick={() => deleteSession(deletingId)} disabled={deleting}>
                   {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete Permanently"}
                 </Button>
                 <Button variant="ghost" className="w-full rounded-2xl font-bold h-12 text-muted-foreground hover:text-white" onClick={() => setDeletingId(null)}>Keep Content</Button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default Dashboard;

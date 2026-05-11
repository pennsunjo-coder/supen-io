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
        
        {/* LEFT PANEL — Sources (Floating Drawer style) */}
        <AnimatePresence>
          {activePanel === "sources" && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setActivePanel(null)}
                className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
              />
              <motion.div 
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute left-0 top-0 bottom-0 z-40 w-80 glass border-r border-white/5 flex flex-col shadow-2xl"
              >
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <span className="text-sm font-bold flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Sources</span>
                  <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)} className="h-8 w-8 rounded-lg hover:bg-white/5"><X className="w-4 h-4" /></Button>
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
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT AREA — The Focus */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto no-scrollbar pt-12 px-6 lg:px-20 xl:px-32">
          
          {/* Dashboard Header */}
          <header className="mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <h1 className="text-5xl font-black tracking-tight mb-3 text-gradient">{hasContent ? "Creative Library" : greeting}</h1>
                <p className="text-base font-medium text-muted-foreground/70 max-w-lg">
                  {hasContent ? `Your hub for high-performing content. Manage and refine your ${sessions.length} assets.` : "The ultimate studio to transform your knowledge into viral content."}
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => navigate("/dashboard/studio")}
                className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg gap-3 shadow-[0_10px_40px_-10px_rgba(20,184,166,0.5)] transition-all active:scale-95 group"
              >
                <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" /> Create Content
              </Button>
            </div>

            {/* Quick Actions & Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 group w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your library..."
                  className="pl-14 h-14 glass border-white/5 rounded-2xl text-base focus:ring-primary/20 focus:bg-white/[0.05] transition-all"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setActivePanel(activePanel === "sources" ? null : "sources")}
                  className={cn("h-14 px-6 flex-1 sm:flex-none rounded-2xl gap-2 font-bold border-white/5 hover:bg-white/5 transition-all", activePanel === "sources" && "bg-primary/10 border-primary/20 text-primary")}
                >
                  <BookOpen className="w-5 h-5" />
                  Sources
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActivePanel(activePanel === "coach" ? null : "coach")}
                  className={cn("h-14 px-6 flex-1 sm:flex-none rounded-2xl gap-2 font-bold border-white/5 hover:bg-white/5 transition-all", activePanel === "coach" && "bg-primary/10 border-primary/20 text-primary")}
                >
                  <Bot className="w-5 h-5" />
                  Coach
                </Button>
              </div>
            </div>

            {/* Platform Filter Chips */}
            {availablePlatforms.length > 1 && (
              <div className="flex gap-2 mt-8 overflow-x-auto no-scrollbar pb-2">
                <button
                  onClick={() => setPlatformFilter(null)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border",
                    !platformFilter ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                  )}
                >
                  All
                </button>
                {availablePlatforms.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatformFilter(platformFilter === p ? null : p)}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border",
                      platformFilter === p ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </header>

          {/* GRID AREA */}
          <div className="pb-40">
            {historyLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-t-2 border-primary animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground animate-pulse">Organizing your creative space...</p>
              </div>
            ) : !hasContent ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 text-center glass rounded-[3.5rem] p-16 border-dashed border-white/10">
                <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center mb-8 shadow-inner">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-3xl font-black mb-4">Your studio is ready</h2>
                <p className="text-lg text-muted-foreground max-w-sm mx-auto mb-10 font-medium leading-relaxed">Let's create something extraordinary. Add a source to start.</p>
                <Button size="lg" onClick={() => navigate("/dashboard/studio")} className="h-16 px-14 rounded-2xl bg-primary font-black text-xl shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">Get Started</Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-12">
                {filtered.map((s, i) => (
                  <motion.div
                    key={s.sessionId}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="group relative"
                    onClick={() => navigate(`/editor/${s.sessionId}`)}
                  >
                    <div className="glass-card overflow-hidden h-full flex flex-col group cursor-pointer">
                      <div className="aspect-[4/5] relative overflow-hidden bg-black/20">
                        {s.infographic ? (
                          <img src={`data:image/png;base64,${s.infographic}`} className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-transparent to-white/[0.02]">
                            <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center backdrop-blur-md border border-white/5">
                              <Sparkles className="w-10 h-10 text-primary/40" />
                            </div>
                          </div>
                        )}
                        
                        {/* Overlay Status Badges */}
                        <div className="absolute top-5 left-5 z-10 flex flex-wrap gap-2">
                          <span className="px-4 py-1.5 rounded-full glass text-[10px] font-black uppercase tracking-widest text-white">{s.platform}</span>
                          {s.infographic && (
                            <span className="px-4 py-1.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-[10px] font-black uppercase tracking-widest text-primary">Visual Ready</span>
                          )}
                        </div>

                        {/* Hover Quick Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-3 px-8">
                           <Button className="flex-1 h-12 rounded-xl font-black bg-white text-black hover:bg-white/90 shadow-2xl transition-all translate-y-4 group-hover:translate-y-0 duration-500">View Asset</Button>
                           <Button size="icon" variant="destructive" className="h-12 w-12 rounded-xl shadow-2xl transition-all translate-y-4 group-hover:translate-y-0 duration-500 delay-75" onClick={(e) => { e.stopPropagation(); setDeletingId(s.sessionId); }}>
                             <Trash2 className="w-5 h-5" />
                           </Button>
                        </div>
                      </div>

                      <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-xl font-black leading-tight line-clamp-2 mb-4 group-hover:text-primary transition-colors duration-300">{s.topic || "Untitled Session"}</h3>
                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{timeAgo(s.createdAt)}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Coach (Floating Drawer style) */}
        <AnimatePresence>
          {activePanel === "coach" && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setActivePanel(null)}
                className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
              />
              <motion.div 
                initial={{ x: 350, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 350, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 z-40 w-96 glass border-l border-white/5 flex flex-col shadow-2xl"
              >
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <span className="text-sm font-bold flex items-center gap-2"><Bot className="w-4 h-4 text-primary" /> AI Creative Coach</span>
                  <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)} className="h-8 w-8 rounded-lg hover:bg-white/5"><X className="w-4 h-4" /></Button>
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
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
               <h3 className="text-2xl font-black mb-3 text-white">Delete Asset?</h3>
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

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useHistory } from "@/hooks/use-history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Loader2, Search, Filter, FileText, Check, Sparkles, Download,
  Image as ImageIcon, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const platformFilters = ["All", "Instagram", "TikTok", "LinkedIn", "Facebook", "X (Twitter)", "YouTube"];

function formatRelativeTime(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const History = () => {
  const navigate = useNavigate();
  const { sessions, loading } = useHistory();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [viewingInfographic, setViewingInfographic] = useState<string | null>(null);

  const filtered = useMemo(
    () => sessions.filter((s) => {
      if (filter !== "All" && s.platform !== filter) return false;
      if (search.trim() && !s.topic.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
    [sessions, filter, search],
  );

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold">My Content</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loading ? "Loading..." : `${sessions.length} session${sessions.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <Button
              onClick={() => navigate("/dashboard")}
              className="h-9 gap-2 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> New Content
            </Button>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search content..."
                className="pl-9 h-9 text-sm bg-accent/20 border-border/20"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <Filter className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              {platformFilters.map((p) => (
                <button
                  key={p}
                  onClick={() => setFilter(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all",
                    filter === p
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "text-muted-foreground border border-border/20 hover:border-border/40 hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 && sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-primary/60" />
              </div>
              <p className="text-sm font-semibold mb-1">No content yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Generate your first posts in the Studio.
              </p>
              <Button onClick={() => navigate("/dashboard")} className="gap-2 text-xs">
                <Plus className="w-3.5 h-3.5" /> Create Content
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* New Content card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border-2 border-dashed border-border/30 hover:border-primary/40 hover:bg-primary/[0.03] transition-all cursor-pointer flex flex-col items-center justify-center aspect-[4/5] p-6 group"
                onClick={() => navigate("/dashboard")}
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-all">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold">New Content</p>
                <p className="text-xs text-muted-foreground mt-1">Generate posts + visual</p>
              </motion.div>

              {/* Session cards */}
              {filtered.map((session, i) => (
                <motion.div
                  key={session.sessionId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="rounded-2xl border border-border/20 overflow-hidden hover:border-border/40 hover:shadow-lg transition-all cursor-pointer group flex flex-col"
                  onClick={() => navigate(`/content/${session.sessionId}`)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video overflow-hidden bg-accent/10 relative">
                    {session.infographic ? (
                      <>
                        <img
                          src={`data:image/png;base64,${session.infographic}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          alt="Visual"
                        />
                        <div className="absolute top-2 right-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/90 text-white font-medium">
                            ✓ Visual
                          </span>
                        </div>
                        {/* Quick view button */}
                        <button
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingInfographic(session.infographic!);
                          }}
                        >
                          <span className="text-[10px] bg-black/60 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                            Quick view
                          </span>
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center opacity-30">
                          <FileText className="w-6 h-6 mx-auto mb-1" />
                          <p className="text-[10px]">No visual</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex-1 flex flex-col">
                    <p className="text-xs font-medium line-clamp-2 mb-2 flex-1 leading-relaxed">
                      {session.topic || "Untitled"}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/40 text-muted-foreground">
                          {session.platform}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50">
                          {session.variationCount} post{session.variationCount > 1 ? "s" : ""}
                        </span>
                      </div>
                      {session.bestScore > 0 && (
                        <span className={cn(
                          "text-[10px] font-semibold",
                          session.bestScore >= 80 ? "text-emerald-400" :
                          session.bestScore >= 60 ? "text-amber-400" :
                          "text-muted-foreground/50",
                        )}>
                          {session.bestScore}%
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground/40 mt-1.5">
                      {formatRelativeTime(session.createdAt)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {filtered.length === 0 && sessions.length > 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No results for this filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ INFOGRAPHIC VIEWER MODAL ═══ */}
      <AnimatePresence>
        {viewingInfographic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setViewingInfographic(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute -top-10 right-0 text-white/70 hover:text-white flex items-center gap-1.5 text-sm"
                onClick={() => setViewingInfographic(null)}
              >
                <X className="w-4 h-4" /> Close
              </button>
              <img
                src={`data:image/png;base64,${viewingInfographic}`}
                alt="Infographic"
                className="w-full h-auto rounded-xl"
              />
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `data:image/png;base64,${viewingInfographic}`;
                    link.download = `supen-infographic-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("PNG downloaded!");
                  }}
                >
                  <Download className="w-3 h-3 mr-1.5" /> PNG
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `data:image/jpeg;base64,${viewingInfographic}`;
                    link.download = `supen-infographic-${Date.now()}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("JPEG downloaded!");
                  }}
                >
                  <Download className="w-3 h-3 mr-1.5" /> JPEG
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default History;

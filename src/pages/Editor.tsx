import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, Copy, Check, Download, Trash2,
  Sparkles, ChevronDown, Share2,
  Loader2, ZoomIn, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import InfographicModal from "@/components/InfographicModal";

export default function Editor() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [variations, setVariations] = useState<any[]>([]);
  const [infographic, setInfographic] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("");
  const [loading, setLoading] = useState(true);

  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mobileView, setMobileView] = useState<"posts" | "visual">("posts");

  const fetchData = useCallback(async () => {
    if (!user || !sessionId) return;
    const { data } = await supabase
      .from("generated_content")
      .select("*")
      .eq("user_id", user.id)
      .or(`session_id.eq.${sessionId},id.eq.${sessionId}`)
      .order("viral_score", { ascending: false });

    if (data && data.length > 0) {
      const posts = data.filter((r) => r.format !== "Infographic");
      const inf = data.find((r) => r.format === "Infographic");
      const attached = posts.find((r) => r.infographic_base64);
      setVariations(posts);
      setInfographic(inf?.infographic_base64 || attached?.infographic_base64 || null);
      setTopic(posts[0]?.content?.split(/\s+/).slice(0, 10).join(" ") || "Untitled");
      setPlatform(posts[0]?.platform || "");
      if (posts.length > 0) setExpanded(posts[0].id);
    }
    setLoading(false);
  }, [user, sessionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete() {
    if (!user || !sessionId) return;
    setDeleting(true);
    try {
      const { data: items } = await supabase
        .from("generated_content")
        .select("id")
        .eq("user_id", user.id)
        .or(`session_id.eq.${sessionId},id.eq.${sessionId}`);
      const ids = (items || []).map((i) => i.id);
      if (ids.length === 0) ids.push(sessionId);

      await supabase.from("generated_content").delete().in("id", ids).eq("user_id", user.id);
      toast.success("Content deleted.");
      navigate("/dashboard");
    } catch {
      toast.error("Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 2000);
  }

  function downloadInfographic(fmt: "png" | "jpeg") {
    if (!infographic) return;
    const a = document.createElement("a");
    a.href = `data:image/${fmt};base64,${infographic}`;
    a.download = `supen-visual-${Date.now()}.${fmt === "jpeg" ? "jpg" : "png"}`;
    a.click();
    toast.success(`${fmt.toUpperCase()} downloaded!`);
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
    </div>
  );

  if (variations.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center bg-background gap-3">
      <p className="text-sm text-muted-foreground">Content not found</p>
      <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")} className="gap-1.5 text-xs">
        <ArrowLeft className="w-3 h-3" /> My Content
      </Button>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 px-4 h-13 border-b border-border/20 shrink-0 bg-background/95 backdrop-blur-sm z-20">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">My Content</span>
        </Button>
        <div className="w-px h-4 bg-border/30 hidden sm:block shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{topic}</p>
          <p className="text-[10px] text-muted-foreground/60 hidden sm:block">
            {platform}
            {infographic && <span className="text-emerald-400 ml-2">✓ Visual saved</span>}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}>
            <Share2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ── MOBILE TABS ── */}
      <div className="flex md:hidden border-b border-border/20 shrink-0">
        {[
          { id: "posts" as const, label: `Posts (${variations.length})` },
          { id: "visual" as const, label: infographic ? "✓ Visual" : "Visual" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setMobileView(tab.id)} className={cn("flex-1 py-2.5 text-xs font-medium transition-colors", mobileView === tab.id ? "text-foreground border-b-2 border-primary" : "text-muted-foreground")}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 2 COLUMNS ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT — VISUAL */}
        <div className={cn("w-80 border-r border-border/20 flex flex-col shrink-0", mobileView !== "visual" ? "hidden md:flex" : "flex w-full")}>
          <div className="px-4 py-3 border-b border-border/10 shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Visual</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {infographic ? (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border border-border/20 cursor-zoom-in group relative" onClick={() => setLightbox(true)}>
                  <img src={`data:image/png;base64,${infographic}`} alt="Infographic" className="w-full h-auto" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/40 text-center">Click to view full screen</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" onClick={() => downloadInfographic("png")}><Download className="w-3 h-3" /> PNG</Button>
                  <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" onClick={() => downloadInfographic("jpeg")}><Download className="w-3 h-3" /> JPEG</Button>
                </div>
                <Button size="sm" variant="ghost" className="w-full h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => setShowModal(true)}>
                  <Sparkles className="w-3 h-3" /> Regenerate
                </Button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                  <Sparkles className="w-7 h-7 text-primary/60" />
                </div>
                <p className="text-sm font-semibold mb-1">No visual yet</p>
                <p className="text-xs text-muted-foreground mb-5 leading-relaxed max-w-[180px]">
                  Turn your best post into a shareable infographic
                </p>
                <div className="flex flex-wrap gap-1.5 mb-5 justify-center">
                  {["Whiteboard", "Notebook", "Funnel"].map((s) => (
                    <span key={s} className="text-[10px] px-2.5 py-1 rounded-full border border-border/30 text-muted-foreground">{s}</span>
                  ))}
                </div>
                <Button className="gap-2 w-full max-w-[200px] font-semibold" onClick={() => setShowModal(true)}>
                  <Sparkles className="w-3.5 h-3.5" /> Generate Visual
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — VARIATIONS */}
        <div className={cn("flex-1 flex flex-col overflow-hidden min-w-0", mobileView !== "posts" ? "hidden md:flex" : "flex")}>
          <div className="px-5 py-3 border-b border-border/10 flex items-center justify-between shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Generated Posts</p>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-muted-foreground px-2" onClick={() => {
              const all = variations.map((v, i) => `--- #${i + 1} ---\n${v.content}`).join("\n\n");
              navigator.clipboard.writeText(all);
              toast.success("All copied!");
            }}>
              <Copy className="w-3 h-3" /> Copy all
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-3 max-w-2xl mx-auto">
              {variations.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn("rounded-xl border transition-all overflow-hidden", expanded === v.id ? "border-primary/30 bg-primary/[0.02]" : "border-border/20 hover:border-border/40")}
                >
                  <div className="flex items-center gap-2 p-3.5 cursor-pointer select-none" onClick={() => setExpanded(expanded === v.id ? null : v.id)}>
                    {i === 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold shrink-0">🔥 Top</span>}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/40 text-muted-foreground shrink-0 truncate max-w-[120px]">{v.angle || `Variation ${i + 1}`}</span>
                    {v.viral_score > 0 && (
                      <span className={cn("text-[10px] font-bold ml-auto shrink-0", v.viral_score >= 80 ? "text-emerald-400" : v.viral_score >= 60 ? "text-amber-400" : "text-muted-foreground/50")}>
                        {v.viral_score}%
                      </span>
                    )}
                    <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground/30 transition-transform shrink-0", !v.viral_score && "ml-auto", expanded === v.id && "rotate-180")} />
                  </div>
                  <AnimatePresence>
                    {expanded === v.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-4">
                          <div className="bg-background/80 rounded-lg p-4 mb-3 border border-border/10">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{v.content}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={() => copyText(v.content, v.id)}>
                            {copied === v.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copied === v.id ? "Copied!" : "Copy"}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightbox && infographic && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
            <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white" onClick={() => setLightbox(false)}>
              <X className="w-4 h-4" />
            </button>
            <motion.img initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} src={`data:image/png;base64,${infographic}`} alt="Infographic fullscreen" className="max-w-2xl w-full max-h-[90vh] object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
            <div className="absolute bottom-6 flex gap-3">
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => downloadInfographic("png")}><Download className="w-3 h-3 mr-1.5" /> PNG</Button>
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => downloadInfographic("jpeg")}><Download className="w-3 h-3 mr-1.5" /> JPEG</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border/30 rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-base font-bold mb-2">Delete this content?</h3>
              <p className="text-sm text-muted-foreground mb-6">All variations and the visual will be permanently deleted.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-9" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button variant="destructive" className="flex-1 h-9 gap-2" disabled={deleting} onClick={handleDelete}>
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INFOGRAPHIC MODAL ── */}
      <InfographicModal
        open={showModal}
        onClose={() => { setShowModal(false); fetchData(); }}
        content={variations[0]?.content || ""}
        platform={platform}
        sessionId={sessionId}
      />
    </div>
  );
}

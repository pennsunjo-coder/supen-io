import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, Copy, Check, Download, Trash2, Plus, ChevronRight,
  Sparkles, Share2, Loader2, ZoomIn, X, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import InfographicModal from "@/components/InfographicModal";
import { detectAiFlavor } from "@/lib/ai-flavor-detector";
import { scoreVariationHeuristic } from "@/lib/viral-scorer";

export default function Editor() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [variations, setVariations] = useState<any[]>([]);
  const [infographic, setInfographic] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(true);

  const [copied, setCopied] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mobileView, setMobileView] = useState<"posts" | "visual">("posts");
  // Inline-edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user || !sessionId) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("generated_content")
        .select("*")
        .eq("user_id", user.id)
        .or(`session_id.eq.${sessionId},id.eq.${sessionId}`)
        .order("viral_score", { ascending: false });

      if (error) {
        console.error("[Editor] Fetch error:", error);
        toast.error("Error loading content: " + error.message);
      } else if (data && data.length > 0) {
        const posts = data.filter((r) => r.format !== "Infographic");
        const inf = data.find((r) => r.format === "Infographic" && r.infographic_base64);
        const infFallback = data.find((r) => r.format === "Infographic");
        const attached = posts.find((r) => r.infographic_base64);
        
        setVariations(posts);
        setInfographic(inf?.infographic_base64 || attached?.infographic_base64 || infFallback?.infographic_base64 || null);
        setTopic(posts[0]?.content?.split(/\s+/).slice(0, 10).join(" ") || "Untitled");
        setPlatform(posts[0]?.platform || "");
        setCreatedAt(posts[0]?.created_at || "");
      } else {
        console.warn("[Editor] No content found for session:", sessionId);
      }
    } catch (err) {
      console.error("[Editor] Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, sessionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete() {
    if (!user || !sessionId) return;
    setDeleting(true);
    try {
      const { data: items } = await supabase.from("generated_content").select("id").eq("user_id", user.id).or(`session_id.eq.${sessionId},id.eq.${sessionId}`);
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

  function startEdit(v: { id: string; content: string }) {
    setEditingId(v.id);
    setEditText(v.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  // Save the edit:
  //  1. Compute new viral_score (heuristic) and ai_flavor_score so DB
  //     reflects the user's final version, not the initial AI draft.
  //  2. Update generated_content for this row.
  //  3. Insert a row in user_edits capturing before/after with both
  //     flavor scores. This becomes the training signal for the style
  //     memory: every manual edit teaches us how the user actually
  //     wants their content to read.
  async function saveEdit(v: { id: string; content: string; platform?: string }) {
    if (!user || !editText.trim()) return;
    if (editText === v.content) {
      cancelEdit();
      return;
    }
    setSaving(true);
    try {
      const before = v.content;
      const after = editText;
      const beforeFlavor = detectAiFlavor(before).score;
      const afterFlavor = detectAiFlavor(after).score;
      const newScore = scoreVariationHeuristic(after, v.platform || "").total;

      // 1+2. Try update with quality columns; gracefully fall back if
      // the migration hasn't been applied (older deployments).
      const fullUpdate = await supabase
        .from("generated_content")
        .update({ content: after, viral_score: newScore, ai_flavor_score: afterFlavor })
        .eq("id", v.id)
        .eq("user_id", user.id);
      if (fullUpdate.error) {
        await supabase
          .from("generated_content")
          .update({ content: after, viral_score: newScore })
          .eq("id", v.id)
          .eq("user_id", user.id);
      }

      // 3. Best-effort capture in user_edits. Silent fail if the table
      // isn't there yet (older deployments).
      try {
        await supabase.from("user_edits").insert({
          user_id: user.id,
          content_id: v.id,
          platform: v.platform || null,
          before_content: before,
          after_content: after,
          before_word_count: before.trim().split(/\s+/).length,
          after_word_count: after.trim().split(/\s+/).length,
          before_flavor_score: beforeFlavor,
          after_flavor_score: afterFlavor,
        });
      } catch { /* user_edits table missing — ignore */ }

      setVariations((prev) =>
        prev.map((row) =>
          row.id === v.id ? { ...row, content: after, viral_score: newScore, ai_flavor_score: afterFlavor } : row
        )
      );
      toast.success("Edit saved");
      cancelEdit();
    } catch {
      toast.error("Couldn't save the edit. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function copyAll() {
    const all = variations.map((v, i) => `--- Variation ${i + 1} (${v.angle || ""}) ---\n${v.content}`).join("\n\n");
    navigator.clipboard.writeText(all);
    toast.success("All variations copied!");
  }

  function downloadInfographic(fmt: "png" | "jpeg") {
    if (!infographic) return;
    const a = document.createElement("a");
    a.href = `data:image/${fmt};base64,${infographic}`;
    a.download = `supen-visual-${Date.now()}.${fmt === "jpeg" ? "jpg" : "png"}`;
    a.click();
    toast.success(`${fmt.toUpperCase()} downloaded!`);
  }

  const avgScore = variations.length > 0
    ? Math.round(variations.reduce((s, v) => s + (v.viral_score || 0), 0) / variations.length)
    : 0;

  const contentFormat = variations[0]?.format || "";
  const isScript = /script|reel|video/i.test(contentFormat);

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
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/20 shrink-0 bg-background z-20">
        <Button variant="secondary" onClick={() => navigate("/dashboard")} className="h-10 gap-2 text-sm font-bold px-5 bg-accent hover:bg-accent/80 border border-border/40 shrink-0">
          <ArrowLeft className="w-4 h-4" /> My Content
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{topic || "Content"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/50 text-muted-foreground font-medium">{platform}</span>
            {infographic && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Visual saved
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-medium border-border/40 hidden sm:flex" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-medium border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* ── BREADCRUMB ── */}
      <div className="flex items-center gap-1.5 px-5 py-2 bg-accent/[0.03] border-b border-border/10 shrink-0">
        <button onClick={() => navigate("/dashboard")} className="text-[11px] text-primary hover:underline font-medium cursor-pointer">My Content</button>
        <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
        <span className="text-[11px] text-muted-foreground truncate max-w-[250px]">{topic || "Content"}</span>
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

      {/* ── 2 COLUMNS (max-width container) ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="max-w-[1440px] mx-auto w-full h-full flex">

          {/* LEFT — VARIATIONS GRID */}
          <div className={cn("flex-1 flex flex-col overflow-hidden min-w-0", mobileView !== "posts" ? "hidden md:flex" : "flex")}>
            <div className="px-5 py-3 border-b border-border/10 flex items-center justify-between shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {variations.length} Variations
              </p>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-muted-foreground px-2" onClick={copyAll}>
                <Copy className="w-3 h-3" /> Copy all
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {variations.map((v, i) => (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex flex-col rounded-2xl border border-border/20 bg-card hover:border-border/40 hover:shadow-lg transition-all border-l-2 overflow-hidden"
                      style={{
                        borderLeftColor: v.viral_score >= 80
                          ? '#10b981'
                          : v.viral_score >= 60
                            ? '#f59e0b'
                            : '#6b7280',
                      }}
                    >
                      {/* Card header */}
                      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                        {i === 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold">
                            🔥 Top
                          </span>
                        )}
                        <span className="text-xs font-medium text-muted-foreground flex-1 truncate">
                          {v.angle || `Variation ${i + 1}`}
                        </span>
                        {v.viral_score > 0 && (
                          <div className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                            v.viral_score >= 80
                              ? "bg-emerald-500/15 text-emerald-400"
                              : v.viral_score >= 60
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-accent/30 text-muted-foreground",
                          )}>
                            {v.viral_score}%
                          </div>
                        )}
                      </div>

                      {/* Content with generous line-height — editable in place */}
                      <div className="flex-1 px-4 pb-3 overflow-y-auto max-h-64">
                        {editingId === v.id ? (
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full text-sm leading-[1.7] whitespace-pre-wrap text-foreground bg-background border border-border/30 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-y min-h-[160px] font-[inherit]"
                            placeholder="Edit this variation..."
                            disabled={saving}
                          />
                        ) : (
                          <p className="text-sm leading-[1.7] whitespace-pre-wrap text-foreground/90">
                            {v.content}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="px-4 py-3 border-t border-border/10 flex items-center gap-2">
                        {editingId === v.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1.5 flex-1 border-border/30"
                              onClick={cancelEdit}
                              disabled={saving}
                            >
                              <X className="w-3 h-3" /> Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1.5 flex-1"
                              onClick={() => saveEdit(v)}
                              disabled={saving || !editText.trim() || editText === v.content}
                            >
                              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              {saving ? "Saving..." : "Save"}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1.5 flex-1 border-border/30"
                              onClick={() => copyText(v.content, v.id)}
                            >
                              {copied === v.id
                                ? <Check className="w-3 h-3 text-emerald-400" />
                                : <Copy className="w-3 h-3" />
                              }
                              {copied === v.id ? "Copied!" : "Copy"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1.5 px-3 text-muted-foreground hover:text-foreground"
                              onClick={() => startEdit(v)}
                              title="Edit this variation"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </Button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — VISUAL + DETAILS (380px) */}
          <div className={cn(
            "w-[380px] border-l border-border/20 flex flex-col shrink-0 bg-accent/[0.02]",
            mobileView !== "visual" ? "hidden md:flex" : "flex w-full",
          )}>
            <div className="px-4 py-3 border-b border-border/10 shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Visual</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Infographic or generate — hidden for script formats */}
              {isScript ? (
                <div className="rounded-xl border border-border/20 p-4 text-center bg-accent/[0.02]">
                  <p className="text-xs text-muted-foreground">
                    Visuals are not available for scripts. Switch to Post or Thread format to generate infographics.
                  </p>
                </div>
              ) : infographic ? (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border border-border/20 cursor-zoom-in group relative" onClick={() => setLightbox(true)}>
                    <img src={`data:image/png;base64,${infographic}`} alt="Infographic" className="w-full h-auto" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5 border-border/30" onClick={() => downloadInfographic("png")}>
                      <Download className="w-3 h-3" /> PNG
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5 border-border/30" onClick={() => downloadInfographic("jpeg")}>
                      <Download className="w-3 h-3" /> JPEG
                    </Button>
                  </div>
                  <Button className="w-full gap-2 font-bold h-11 bg-violet-600 hover:bg-violet-700 text-white border-0" onClick={() => setShowModal(true)}>
                    <Sparkles className="w-4 h-4" /> Regenerate Visual
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-border/20 p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 mx-auto">
                    <Sparkles className="w-6 h-6 text-primary/60" />
                  </div>
                  <p className="text-sm font-semibold mb-1">No visual yet</p>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Turn your best post into a shareable infographic</p>
                  <Button className="gap-2 w-full font-bold text-base h-12 shadow-sm" onClick={() => setShowModal(true)}>
                    <Sparkles className="w-5 h-5" /> Generate Visual
                  </Button>
                </div>
              )}

              {/* Separator */}
              <div className="border-t border-border/10" />

              {/* Details with badges */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Details</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-accent/40 text-xs font-medium">{platform}</span>
                  <span className="px-2.5 py-1 rounded-full bg-accent/40 text-xs font-medium">{variations.length} variations</span>
                  {avgScore > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-accent/40 text-xs font-medium">Avg {avgScore}%</span>
                  )}
                  {infographic && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium">✓ Visual ready</span>
                  )}
                  {createdAt && (
                    <span className="px-2.5 py-1 rounded-full bg-accent/40 text-xs font-medium">
                      {new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-2" onClick={copyAll}>
                <Copy className="w-3.5 h-3.5" /> Copy All Variations
              </Button>
              <Button variant="ghost" size="sm" className="w-full h-9 text-xs gap-2 text-muted-foreground" onClick={() => navigate("/dashboard/studio")}>
                <Plus className="w-3.5 h-3.5" /> Create New Content
              </Button>
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
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4"><Trash2 className="w-6 h-6 text-red-400" /></div>
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

      {/* ── MOBILE FLOATING BACK ── */}
      <div className="fixed bottom-6 left-6 z-30 md:hidden">
        <Button onClick={() => navigate("/dashboard")} size="sm" variant="outline" className="h-10 gap-2 shadow-lg bg-background/95 backdrop-blur-sm border-border/40">
          <ArrowLeft className="w-4 h-4" /> My Content
        </Button>
      </div>

      {/* ── INFOGRAPHIC MODAL ── */}
      <InfographicModal open={showModal} onClose={() => { setShowModal(false); fetchData(); }} content={variations[0]?.content || ""} platform={platform} sessionId={sessionId} />
    </div>
  );
}

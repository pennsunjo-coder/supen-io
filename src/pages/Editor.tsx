import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, Copy, Check, Download, Plus,
  Sparkles, ChevronDown, Share2,
  FileText, Loader2, ZoomIn, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import InfographicModal from "@/components/InfographicModal";

interface Variation {
  id: string;
  content: string;
  angle: string;
  viral_score: number;
  format: string;
  platform: string;
}

interface EditorData {
  topic: string;
  platform: string;
  format: string;
  createdAt: string;
  variations: Variation[];
  infographic: string | null;
}

type MobileTab = "visual" | "posts" | "info";

export default function Editor() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<EditorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const [showInfographicModal, setShowInfographicModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("posts");

  const fetchData = useCallback(async () => {
    if (!user || !sessionId) return;
    const { data: rows } = await supabase
      .from("generated_content")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .order("viral_score", { ascending: false });

    if (!rows || rows.length === 0) { setLoading(false); return; }

    const posts = rows.filter((r) => r.format !== "Infographic");
    const infRow = rows.find((r) => r.format === "Infographic");
    const attachedInfra = posts.find((r) => r.infographic_base64);

    setData({
      topic: posts[0]?.content?.split(/\s+/).slice(0, 12).join(" ") || "Untitled",
      platform: posts[0]?.platform || "",
      format: posts[0]?.format || "",
      createdAt: posts[0]?.created_at || "",
      variations: posts,
      infographic: infRow?.infographic_base64 || attachedInfra?.infographic_base64 || null,
    });

    if (posts.length > 0) setExpanded(posts[0].id);
    setLoading(false);
  }, [user, sessionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const avgScore = useMemo(() => {
    if (!data || data.variations.length === 0) return 0;
    const scores = data.variations.filter((v) => v.viral_score > 0).map((v) => v.viral_score);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [data]);

  const totalWords = useMemo(() => {
    if (!data) return 0;
    return data.variations.reduce((sum, v) => sum + v.content.split(/\s+/).length, 0);
  }, [data]);

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 2000);
  }

  function copyAll() {
    if (!data) return;
    const all = data.variations.map((v, i) => `--- Variation ${i + 1} (${v.angle || ""}) ---\n${v.content}`).join("\n\n");
    navigator.clipboard.writeText(all);
    toast.success("All variations copied!");
  }

  function downloadInfographic(fmt: "png" | "jpeg") {
    if (!data?.infographic) return;
    const a = document.createElement("a");
    a.href = `data:image/${fmt === "jpeg" ? "jpeg" : "png"};base64,${data.infographic}`;
    a.download = `supen-visual-${Date.now()}.${fmt === "jpeg" ? "jpg" : "png"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`${fmt.toUpperCase()} downloaded!`);
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/40" />
    </div>
  );

  if (!data) return (
    <div className="h-screen flex flex-col items-center justify-center bg-background gap-3">
      <p className="text-sm font-medium text-muted-foreground">Content not found</p>
      <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/history")} className="gap-1.5 text-xs">
        <ArrowLeft className="w-3 h-3" /> Back to My Content
      </Button>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">

      {/* ══════════ STICKY HEADER ══════════ */}
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 px-4 h-14 border-b border-border/20 shrink-0 bg-background/95 backdrop-blur-sm z-20"
      >
        <Button
          variant="ghost" size="sm"
          onClick={() => navigate("/dashboard/history")}
          className="h-8 gap-1.5 text-xs shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">My Content</span>
        </Button>

        <div className="w-px h-4 bg-border/30 hidden sm:block" />

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">{data.topic}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/30 text-muted-foreground hidden sm:inline">
              {data.platform}
            </span>
            {data.format && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-muted-foreground/70 hidden sm:inline">
                {data.format}
              </span>
            )}
            {avgScore > 0 && (
              <span className={cn(
                "text-[10px] font-bold hidden sm:inline",
                avgScore >= 80 ? "text-emerald-400" : avgScore >= 60 ? "text-amber-400" : "text-muted-foreground/50",
              )}>
                avg {avgScore}%
              </span>
            )}
            {data.infographic && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 hidden sm:inline-flex">
                <Check className="w-2.5 h-2.5" /> Visual
              </span>
            )}
          </div>
        </div>

        <Button
          variant="ghost" size="sm"
          className="h-8 gap-1.5 text-xs shrink-0"
          onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </motion.header>

      {/* ══════════ MOBILE TABS ══════════ */}
      <div className="flex lg:hidden border-b border-border/20 shrink-0">
        {([
          { id: "visual" as const, label: data.infographic ? "✓ Visual" : "Visual" },
          { id: "posts" as const, label: `Posts (${data.variations.length})` },
          { id: "info" as const, label: "Info" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium transition-colors",
              mobileTab === tab.id ? "text-foreground border-b-2 border-primary" : "text-muted-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════ 3-COLUMN LAYOUT ══════════ */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT: VISUAL STUDIO (320px) ── */}
        <motion.div
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "w-80 border-r border-border/20 flex flex-col bg-accent/[0.02] shrink-0",
            mobileTab !== "visual" ? "hidden lg:flex" : "flex w-full",
          )}
        >
          <div className="px-4 py-3 border-b border-border/10 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Visual Studio
            </p>
            {data.infographic && (
              <span className="text-[9px] text-emerald-400 font-medium flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" /> Ready
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {data.infographic ? (
              <div className="p-4 space-y-3">
                <div
                  className="rounded-xl overflow-hidden border border-border/20 cursor-pointer group relative"
                  onClick={() => setLightbox(true)}
                >
                  <img src={`data:image/png;base64,${data.infographic}`} alt="Infographic" className="w-full h-auto" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/50 text-center">Click to view full screen</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" onClick={() => downloadInfographic("png")}>
                    <Download className="w-3 h-3" /> PNG
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" onClick={() => downloadInfographic("jpeg")}>
                    <Download className="w-3 h-3" /> JPEG
                  </Button>
                </div>
                <Button
                  size="sm" variant="ghost"
                  className="w-full h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowInfographicModal(true)}
                >
                  <Sparkles className="w-3 h-3" /> Regenerate
                </Button>
              </div>
            ) : (
              <div className="relative h-full flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                {/* Background blur text */}
                <div className="absolute inset-0 p-6 overflow-hidden opacity-[0.04] select-none pointer-events-none text-[10px] leading-relaxed">
                  {data.variations[0]?.content}
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 border border-primary/20">
                    <Sparkles className="w-9 h-9 text-primary/70" />
                  </div>
                  <h3 className="font-semibold text-sm mb-2">Create your visual</h3>
                  <p className="text-xs text-muted-foreground mb-5 leading-relaxed max-w-[180px]">
                    Turn your best post into a shareable infographic
                  </p>
                  <div className="flex gap-2 mb-5 flex-wrap justify-center">
                    {["Whiteboard", "Notebook", "Comparison"].map((style) => (
                      <span key={style} className="text-[10px] px-2.5 py-1 rounded-full border border-border/30 text-muted-foreground hover:border-primary/40 hover:text-foreground cursor-pointer transition-colors">
                        {style}
                      </span>
                    ))}
                  </div>
                  <Button className="gap-2 w-full max-w-[200px] font-semibold" onClick={() => setShowInfographicModal(true)}>
                    <Sparkles className="w-4 h-4" /> Generate Visual
                  </Button>
                  <p className="text-[10px] text-muted-foreground/50 mt-3">Powered by Gemini AI</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── CENTER: VARIATIONS (flex-1) ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className={cn(
            "flex-1 flex flex-col overflow-hidden min-w-0",
            mobileTab !== "posts" ? "hidden lg:flex" : "flex",
          )}
        >
          <div className="px-5 py-3 border-b border-border/10 flex items-center justify-between shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Generated Posts
            </p>
            <span className="text-[10px] text-muted-foreground/50">
              {data.variations.length} variations · {totalWords} words
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="py-4 px-5 space-y-3 max-w-2xl mx-auto">
              {data.variations.map((v, i) => {
                const words = v.content.split(/\s+/).length;
                return (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      "rounded-xl border transition-all overflow-hidden",
                      expanded === v.id ? "border-primary/30 bg-primary/[0.03]" : "border-border/20 hover:border-border/40",
                    )}
                  >
                    <div
                      className="flex items-center gap-2 p-3.5 cursor-pointer select-none"
                      onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                    >
                      {i === 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold shrink-0">
                          🔥 Top
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/40 text-muted-foreground shrink-0">
                        {v.angle || `#${i + 1}`}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40 hidden sm:inline">{words}w</span>
                      {v.viral_score > 0 && (
                        <span className={cn(
                          "text-[10px] font-bold ml-auto shrink-0",
                          v.viral_score >= 80 ? "text-emerald-400" : v.viral_score >= 60 ? "text-amber-400" : "text-muted-foreground/50",
                        )}>
                          {v.viral_score}%
                        </span>
                      )}
                      <ChevronDown className={cn(
                        "w-3.5 h-3.5 text-muted-foreground/40 transition-transform shrink-0",
                        expanded === v.id && "rotate-180",
                        !v.viral_score && "ml-auto",
                      )} />
                    </div>

                    <AnimatePresence>
                      {expanded === v.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4">
                            <div className="bg-background/60 rounded-lg p-4 mb-3 border border-border/10">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{v.content}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={() => copyText(v.content, v.id)}>
                                {copied === v.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {copied === v.id ? "Copied!" : "Copy"}
                              </Button>
                              <span className="text-[10px] text-muted-foreground/40 ml-auto">{words} words</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT: INFO & SOURCES (260px) ── */}
        <motion.div
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "w-[260px] border-l border-border/20 flex flex-col bg-accent/[0.02] shrink-0",
            mobileTab !== "info" ? "hidden lg:flex" : "flex w-full",
          )}
        >
          <div className="px-4 py-3 border-b border-border/10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Details
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Metadata card */}
            <div className="rounded-xl border border-border/20 p-4 bg-accent/[0.03] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Platform</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-accent/40">{data.platform}</span>
              </div>
              {data.format && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Format</span>
                  <span className="text-xs font-medium">{data.format}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Variations</span>
                <span className="text-xs font-medium">{data.variations.length}</span>
              </div>
              {avgScore > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Avg score</span>
                  <span className={cn("text-xs font-bold",
                    avgScore >= 80 ? "text-emerald-400" : avgScore >= 60 ? "text-amber-400" : "text-muted-foreground",
                  )}>{avgScore}%</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total words</span>
                <span className="text-xs font-medium">{totalWords}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Visual</span>
                <span className={cn("text-xs font-medium",
                  data.infographic ? "text-emerald-400" : "text-muted-foreground/50",
                )}>
                  {data.infographic ? "✓ Ready" : "Not generated"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Created</span>
                <span className="text-xs text-muted-foreground/70">
                  {new Date(data.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Sources */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
                Sources
              </p>
              <div className="rounded-xl border border-dashed border-border/20 p-4 text-center">
                <FileText className="w-5 h-5 text-muted-foreground/20 mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground/50">No sources linked</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                variant="outline" size="sm"
                className="w-full h-9 text-xs gap-2"
                onClick={copyAll}
              >
                <Copy className="w-3.5 h-3.5" /> Copy All Variations
              </Button>
              <Button
                variant="ghost" size="sm"
                className="w-full h-9 text-xs gap-2 text-muted-foreground"
                onClick={() => navigate("/dashboard")}
              >
                <Plus className="w-3.5 h-3.5" /> Generate New Content
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══════════ LIGHTBOX ══════════ */}
      <AnimatePresence>
        {lightbox && data.infographic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={() => setLightbox(false)}
            >
              <X className="w-4 h-4" />
            </button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={`data:image/png;base64,${data.infographic}`}
              alt="Infographic fullscreen"
              className="max-w-2xl w-full max-h-[90vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ INFOGRAPHIC MODAL ══════════ */}
      <InfographicModal
        open={showInfographicModal}
        onClose={() => { setShowInfographicModal(false); fetchData(); }}
        content={data.variations[0]?.content || ""}
        platform={data.platform}
        sessionId={sessionId}
      />
    </div>
  );
}

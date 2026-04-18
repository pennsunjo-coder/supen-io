import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, Copy, Check, Download,
  Sparkles, ChevronDown, Share2,
  FileText, Link, StickyNote, Loader2,
  ZoomIn, X,
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
  createdAt: string;
  variations: Variation[];
  infographic: string | null;
}

type MobileTab = "sources" | "posts" | "visual";

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
    // Also check if any post has infographic_base64 attached
    const attachedInfra = posts.find((r) => r.infographic_base64);

    setData({
      topic: posts[0]?.content?.split(/\s+/).slice(0, 12).join(" ") || "Untitled",
      platform: posts[0]?.platform || "",
      createdAt: posts[0]?.created_at || "",
      variations: posts,
      infographic: infRow?.infographic_base64 || attachedInfra?.infographic_base64 || null,
    });

    if (posts.length > 0) setExpanded(posts[0].id);
    setLoading(false);
  }, [user, sessionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 2000);
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

      {/* ── STICKY HEADER ── */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 px-4 h-14 border-b border-border/20 shrink-0 bg-background/95 backdrop-blur-sm z-20"
      >
        <Button
          variant="ghost"
          size="sm"
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
            <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
              {data.variations.length} variations
            </span>
            {data.infographic && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 hidden sm:inline-flex">
                <Check className="w-2.5 h-2.5" /> Visual ready
              </span>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs shrink-0"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied!");
          }}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </motion.div>

      {/* ── MOBILE TABS ── */}
      <div className="flex md:hidden border-b border-border/20 shrink-0">
        {([
          { id: "sources" as const, label: "Sources" },
          { id: "posts" as const, label: `Posts (${data.variations.length})` },
          { id: "visual" as const, label: data.infographic ? "✓ Visual" : "Visual" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium transition-colors",
              mobileTab === tab.id
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 3 COLUMNS ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT — SOURCES */}
        <motion.div
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "w-64 border-r border-border/20 flex flex-col bg-accent/[0.02] shrink-0",
            mobileTab !== "sources" ? "hidden md:flex" : "flex w-full",
          )}
        >
          <div className="px-4 py-3 border-b border-border/10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Sources
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
              <FileText className="w-6 h-6 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No sources linked</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                Sources will appear here when used during generation.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CENTER — VARIATIONS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className={cn(
            "flex-1 flex flex-col overflow-hidden min-w-0",
            mobileTab !== "posts" ? "hidden md:flex" : "flex",
          )}
        >
          <div className="px-5 py-3 border-b border-border/10 flex items-center justify-between shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Generated Posts
            </p>
            <span className="text-[10px] text-muted-foreground/50">
              {data.variations.length} variations
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="py-4 px-5 space-y-3 max-w-2xl mx-auto">
              {data.variations.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn(
                    "rounded-xl border transition-all overflow-hidden",
                    expanded === v.id
                      ? "border-primary/30 bg-primary/[0.03]"
                      : "border-border/20 hover:border-border/40",
                  )}
                >
                  {/* Card header */}
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
                    {v.viral_score > 0 && (
                      <span className={cn(
                        "text-[10px] font-bold ml-auto shrink-0",
                        v.viral_score >= 80 ? "text-emerald-400" :
                        v.viral_score >= 60 ? "text-amber-400" :
                        "text-muted-foreground/50",
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

                  {/* Expanded content */}
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
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1.5"
                            onClick={() => copyText(v.content, v.id)}
                          >
                            {copied === v.id
                              ? <Check className="w-3 h-3 text-emerald-400" />
                              : <Copy className="w-3 h-3" />}
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
        </motion.div>

        {/* RIGHT — VISUAL STUDIO */}
        <motion.div
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "w-80 border-l border-border/20 flex flex-col bg-accent/[0.02] shrink-0",
            mobileTab !== "visual" ? "hidden md:flex" : "flex w-full",
          )}
        >
          <div className="px-4 py-3 border-b border-border/10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Visual Studio
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {data.infographic ? (
              <div className="space-y-3">
                <div
                  className="rounded-xl overflow-hidden border border-border/20 cursor-pointer group relative"
                  onClick={() => setLightbox(true)}
                >
                  <img
                    src={`data:image/png;base64,${data.infographic}`}
                    alt="Infographic"
                    className="w-full h-auto"
                  />
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
                  size="sm"
                  variant="ghost"
                  className="w-full h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowInfographicModal(true)}
                >
                  <Sparkles className="w-3 h-3" /> Regenerate
                </Button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary/50" />
                </div>
                <p className="text-sm font-semibold mb-1">No visual yet</p>
                <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                  Turn your best post into a shareable infographic.
                </p>
                <Button className="gap-2 text-xs" onClick={() => setShowInfographicModal(true)}>
                  <Sparkles className="w-3.5 h-3.5" /> Generate Visual
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* LIGHTBOX */}
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

      {/* INFOGRAPHIC MODAL */}
      <InfographicModal
        open={showInfographicModal}
        onClose={() => {
          setShowInfographicModal(false);
          fetchData();
        }}
        content={data.variations[0]?.content || ""}
        platform={data.platform}
        sessionId={sessionId}
      />
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Copy, Check, ImagePlus, RefreshCw, ChevronDown,
  LayoutGrid, X, Layers, ArrowRight, Trash2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { DashboardContent, ContentSession } from "@/hooks/use-dashboard";
import InfographicModal from "@/components/InfographicModal";

/* ─── Helpers ─── */

function isInfographicHtml(content: string): boolean {
  return (
    content.startsWith("<!DOCTYPE html>") ||
    content.startsWith("<html") ||
    (content.includes("<style>") && content.includes("font-family"))
  );
}

/* ─── Platform icons ─── */

const platformIcons: Record<string, React.FC<{ className?: string }>> = {
  "Instagram": ({ className }) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z"/></svg>,
  "TikTok": ({ className }) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  "LinkedIn": ({ className }) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  "YouTube": ({ className }) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/></svg>,
  "Facebook": ({ className }) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  "X (Twitter)": ({ className }) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
};

type PanelMode = null | "image" | "infographic";

/* ─── Top Content Card ─── */

function TopContentCard({
  item,
  onUpdateImagePrompt,
}: {
  item: DashboardContent;
  onUpdateImagePrompt: (id: string, prompt: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [panel, setPanel] = useState<PanelMode>(null);
  const [generating, setGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState(item.image_prompt || "");
  const [infographic, setInfographic] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  const [infraCopied, setInfraCopied] = useState(false);
  const [infographicModalOpen, setInfographicModalOpen] = useState(false);

  const Icon = platformIcons[item.platform];
  const score = item.viral_score || 0;
  const preview = item.content.split(/\s+/).slice(0, 15).join(" ");

  function handleCopy() {
    navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyText(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  async function handleGenerateImage() {
    setPanel("image");
    if (imagePrompt) return;
    setGenerating(true);
    try {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 300,
        messages: [
          { role: "system", content: `You are an expert in image generation prompts. Generate a prompt in English, optimized for ${item.platform}, that visually illustrates this content. Format: photographic style + subject + mood + colors + composition. Max 100 words. Respond ONLY with the prompt.` },
          { role: "user", content: item.content.slice(0, 600) },
        ],
      });
      const text = response.choices[0]?.message?.content || "";
      setImagePrompt(text);
      onUpdateImagePrompt(item.id, text);
    } catch (err) {
      console.error("[DashboardWidgets] Image prompt error:", err);
      toast.error("Erreur lors de la génération du prompt image");
    }
    setGenerating(false);
  }

  async function handleGenerateInfographic() {
    setPanel("infographic");
    if (infographic) return;
    setGenerating(true);
    try {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 400,
        messages: [
          { role: "system", content: `You are an expert in viral infographic design. Create an infographic structure for this ${item.platform} content. Exact format:\nTITLE: [catchy title, max 8 words]\nPOINT 1: [short text]\nPOINT 2: [short text]\nPOINT 3: [short text]\nPOINT 4: [short text, optional]\nPOINT 5: [short text, optional]\nCTA: [call to action]\nIn English. Respond ONLY with the structure.` },
          { role: "user", content: item.content.slice(0, 600) },
        ],
      });
      const text = response.choices[0]?.message?.content || "";
      setInfographic(text);
    } catch { /* silent */ }
    setGenerating(false);
  }

  async function handleRegenerateImage() {
    setImagePrompt("");
    setGenerating(true);
    try {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 300,
        messages: [
          { role: "system", content: `You are an expert in image generation prompts. Generate a prompt in English, optimized for ${item.platform}, that visually illustrates this content. Format: photographic style + subject + mood + colors + composition. Max 100 words. Respond ONLY with the prompt.` },
          { role: "user", content: item.content.slice(0, 600) },
        ],
      });
      const text = response.choices[0]?.message?.content || "";
      setImagePrompt(text);
      onUpdateImagePrompt(item.id, text);
    } catch { /* silent */ }
    setGenerating(false);
  }

  return (
    <div className={cn("rounded-lg border transition-all", expanded ? "border-border/40 bg-card" : "border-border/15 hover:border-border/30")}>
      {/* Header */}
      <div onClick={() => { setExpanded(!expanded); if (expanded) setPanel(null); }} className="flex items-center gap-2 p-3 cursor-pointer">
        {Icon && (
          <div className="w-6 h-6 rounded-md bg-accent/40 flex items-center justify-center shrink-0">
            <Icon className="w-3 h-3" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground/70 truncate">{preview}...</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {score > 0 && <span className="text-[10px] text-emerald-400/80 font-medium">{score}%</span>}
          <ChevronDown className={cn("w-3 h-3 text-muted-foreground/40 transition-transform", expanded && "rotate-180")} />
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-3 pb-3 pt-0">
              <div className="pt-2 border-t border-border/15">
                {isInfographicHtml(item.content) ? (
                  <div className="relative w-full rounded-lg overflow-hidden bg-white mb-3" style={{ height: "200px" }}>
                    <iframe srcDoc={item.content} className="absolute top-0 left-0 origin-top-left pointer-events-none" style={{ width: "1080px", height: "1350px", transform: "scale(0.185)", border: "none" }} sandbox="allow-same-origin" title="Infographie" />
                    <div className="absolute inset-0 flex items-end p-2"><span className="text-[10px] bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">Infographie</span></div>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground/85 mb-3">{item.content}</p>
                )}

                {/* 3 buttons */}
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1.5 px-2.5 text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleCopy(); }}>
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="ghost" size="sm" className={cn("h-7 text-[10px] gap-1.5 px-2.5", panel === "image" ? "text-primary" : "text-muted-foreground")} onClick={(e) => { e.stopPropagation(); handleGenerateImage(); }}>
                    <ImagePlus className="w-3 h-3" /> Image
                  </Button>
                  <Button variant="ghost" size="sm" className={cn("h-7 text-[10px] gap-1.5 px-2.5", infographicModalOpen ? "text-primary" : item.infographic_html ? "text-emerald-400" : "text-muted-foreground")} onClick={(e) => { e.stopPropagation(); setInfographicModalOpen(true); }}>
                    <LayoutGrid className="w-3 h-3" /> {item.infographic_html ? "Voir infographie" : "Infographic"}
                  </Button>
                </div>
              </div>

              {/* Panel Image */}
              <AnimatePresence>
                {panel === "image" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}>
                    <div className="mt-2 p-3 rounded-lg bg-accent/20 border border-border/15 relative">
                      <button onClick={(e) => { e.stopPropagation(); setPanel(null); }} className="absolute top-2 right-2 text-muted-foreground/40 hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-[10px] font-medium text-muted-foreground/70 mb-2">Image prompt</p>
                      {generating ? (
                        <div className="flex items-center gap-2 py-3">
                          <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Generating...</span>
                        </div>
                      ) : (
                        <>
                          <Textarea
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            className="bg-background/50 border-border/20 text-[11px] min-h-[60px] resize-none mb-2"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2 text-muted-foreground" onClick={(e) => { e.stopPropagation(); copyText(imagePrompt, setPromptCopied); }}>
                              {promptCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                              {promptCopied ? "Copied" : "Copy prompt"}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2 text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleRegenerateImage(); }}>
                              <RefreshCw className="w-2.5 h-2.5" /> Regenerate
                            </Button>
                          </div>
                          <p className="text-[9px] text-muted-foreground/40 mt-1.5">Paste this prompt in Midjourney, DALL-E or Nano Banana</p>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InfographicModal
        open={infographicModalOpen}
        onClose={() => setInfographicModalOpen(false)}
        content={item.content}
        platform={item.platform}
        contentId={item.id}
        existingHtml={item.infographic_html || undefined}
      />
    </div>
  );
}

/* ─── Top Content Widget ─── */

export function TopContentWidget({
  items,
  onUpdateImagePrompt,
}: {
  items: DashboardContent[];
  onUpdateImagePrompt: (id: string, prompt: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="px-5 py-3 border-b border-border/10">
      <p className="text-[10px] font-medium text-muted-foreground/60 mb-2">Your latest content</p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <TopContentCard key={item.id} item={item} onUpdateImagePrompt={onUpdateImagePrompt} />
        ))}
      </div>
    </div>
  );
}

/* ─── Relative time ─── */

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

/* ─── Angle colors ─── */

const angleColors: Record<string, string> = {
  "Éducatif": "bg-blue-500/15 text-blue-400",
  "Storytelling": "bg-purple-500/15 text-purple-400",
  "Provocation": "bg-red-500/15 text-red-400",
  "Pratique": "bg-emerald-500/15 text-emerald-400",
  "Débat": "bg-amber-500/15 text-amber-400",
};
const angleLabels = ["Éducatif", "Storytelling", "Provocation", "Pratique", "Débat"];

/* ─── Session Variation Card (with Image + Infographic panels) ─── */

function SessionVariationCard({
  item,
  angle,
  platform,
  onUpdateImagePrompt,
}: {
  item: DashboardContent;
  angle: string;
  platform: string;
  onUpdateImagePrompt: (id: string, prompt: string) => void;
}) {
  const [copiedV, setCopiedV] = useState(false);
  const [panel, setPanel] = useState<"image" | "infographic" | null>(null);
  const [generating, setGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState(item.image_prompt || "");
  const [promptCopied, setPromptCopied] = useState(false);
  const [infographicModalOpen, setInfographicModalOpen] = useState(false);

  const color = angleColors[angle] || "bg-accent/40 text-muted-foreground";

  function copy(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  async function genImage() {
    setPanel("image");
    if (imagePrompt) return;
    setGenerating(true);
    try {
      const r = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 300,
        messages: [
          { role: "system", content: `You are an expert in image generation prompts. Generate a prompt in English, optimized for ${platform}, that visually illustrates this content. Format: photographic style + subject + mood + colors + composition. Max 100 words. Respond ONLY with the prompt.` },
          { role: "user", content: item.content.slice(0, 600) },
        ],
      });
      const t = r.choices[0]?.message?.content || "";
      setImagePrompt(t);
      onUpdateImagePrompt(item.id, t);
    } catch (err) {
      console.error("[SessionCard] Image prompt error:", err);
      toast.error("Erreur lors de la génération du prompt image");
    }
    setGenerating(false);
  }

  async function regenImage() {
    setImagePrompt("");
    setGenerating(true);
    try {
      const r = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 300,
        messages: [
          { role: "system", content: `You are an expert in image generation prompts. Generate a prompt in English, optimized for ${platform}, that visually illustrates this content. Format: photographic style + subject + mood + colors + composition. Max 100 words. Respond ONLY with the prompt.` },
          { role: "user", content: item.content.slice(0, 600) },
        ],
      });
      const t = r.choices[0]?.message?.content || "";
      setImagePrompt(t);
      onUpdateImagePrompt(item.id, t);
    } catch (err) {
      console.error("[SessionCard] Image regen error:", err);
      toast.error("Erreur lors de la régénération");
    }
    setGenerating(false);
  }

  return (
    <div className="rounded-lg border border-border/15 p-3">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full", color)}>{angle}</span>
        {(item.viral_score || 0) > 0 && (
          <span className="text-[9px] text-emerald-400/70 ml-auto">{item.viral_score}%</span>
        )}
      </div>

      {/* Content */}
      {isInfographicHtml(item.content) ? (
        <div className="relative w-full rounded-lg overflow-hidden bg-white mb-2" style={{ height: "160px" }}>
          <iframe srcDoc={item.content} className="absolute top-0 left-0 origin-top-left pointer-events-none" style={{ width: "1080px", height: "1350px", transform: "scale(0.148)", border: "none" }} sandbox="allow-same-origin" title="Infographie" />
          <div className="absolute inset-0 flex items-end p-2"><span className="text-[10px] bg-black/40 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">Infographie</span></div>
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-foreground/85 whitespace-pre-wrap mb-2">{item.content}</p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1">
        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2 text-muted-foreground" onClick={(e) => { e.stopPropagation(); copy(item.content, setCopiedV); toast.success("Copied!"); }}>
          {copiedV ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
          {copiedV ? "Copied" : "Copy"}
        </Button>
        <Button variant="ghost" size="sm" className={cn("h-6 text-[10px] gap-1 px-2", panel === "image" ? "text-primary" : "text-muted-foreground")} onClick={(e) => { e.stopPropagation(); genImage(); }}>
          <ImagePlus className="w-2.5 h-2.5" /> {imagePrompt ? "Image" : "Image"}
        </Button>
        <Button variant="ghost" size="sm" className={cn("h-6 text-[10px] gap-1 px-2", infographicModalOpen ? "text-primary" : item.infographic_html ? "text-emerald-400" : "text-muted-foreground")} onClick={(e) => { e.stopPropagation(); setInfographicModalOpen(true); }}>
          <LayoutGrid className="w-2.5 h-2.5" /> {item.infographic_html ? "Voir" : "Infographic"}
        </Button>
      </div>

      {/* Image panel */}
      <AnimatePresence>
        {panel === "image" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}>
            <div className="mt-2 p-2.5 rounded-lg bg-accent/20 border border-border/15">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-medium text-muted-foreground/70">Image prompt</p>
                <button onClick={(e) => { e.stopPropagation(); setPanel(null); }} className="text-muted-foreground/40 hover:text-foreground"><X className="w-3 h-3" /></button>
              </div>
              {generating ? (
                <div className="flex items-center gap-2 py-2"><RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" /><span className="text-[9px] text-muted-foreground">Generating...</span></div>
              ) : (
                <>
                  <Textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} onClick={(e) => e.stopPropagation()} className="bg-background/50 border-border/20 text-[10px] min-h-[45px] resize-none mb-1.5" />
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-5 text-[9px] gap-1 px-1.5 text-muted-foreground" onClick={(e) => { e.stopPropagation(); copy(imagePrompt, setPromptCopied); toast.success("Prompt copied!"); }}>
                      {promptCopied ? <Check className="w-2 h-2 text-emerald-400" /> : <Copy className="w-2 h-2" />} Copy
                    </Button>
                    <Button variant="ghost" size="sm" className="h-5 text-[9px] gap-1 px-1.5 text-muted-foreground" onClick={(e) => { e.stopPropagation(); regenImage(); }}>
                      <RefreshCw className="w-2 h-2" /> Regenerate
                    </Button>
                  </div>
                  <p className="text-[8px] text-muted-foreground/40 mt-1">Paste in Midjourney, DALL-E or Nano Banana</p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InfographicModal
        open={infographicModalOpen}
        onClose={() => setInfographicModalOpen(false)}
        content={item.content}
        platform={platform}
        contentId={item.id}
        existingHtml={item.infographic_html || undefined}
      />
    </div>
  );
}

/* ─── Content Session Grid ─── */

export function ContentSessionGrid({
  sessions,
  onUpdateImagePrompt,
  onDelete,
}: {
  sessions: ContentSession[];
  onUpdateImagePrompt: (id: string, prompt: string) => void;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [localSessions, setLocalSessions] = useState(sessions);

  // Sync with parent
  if (sessions !== localSessions && !deleting) setLocalSessions(sessions);

  if (localSessions.length === 0) return null;

  async function handleDelete(session: ContentSession) {
    setDeleting(session.id);
    setConfirming(null);
    try {
      const ids = session.variations.map((v) => v.id);
      await supabase.from("generated_content").delete().in("id", ids);
      setLocalSessions((prev) => prev.filter((s) => s.id !== session.id));
      toast.success("Content deleted");
      if (onDelete) onDelete();
    } catch {
      toast.error("Error deleting content");
    }
    setDeleting(null);
  }

  return (
    <div className="px-5 py-3 border-b border-border/10">
      <p className="text-[10px] font-medium text-muted-foreground/60 mb-3">Your latest creations</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <AnimatePresence>
        {localSessions.map((session, si) => {
          const Icon = platformIcons[session.platform];
          const isExpanded = expanded === session.id;
          const isConfirming = confirming === session.id;
          const isDeleting = deleting === session.id;
          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: si * 0.08 }}
              layout
            >
              {/* Card */}
              <div
                onClick={() => { if (!isConfirming) setExpanded(isExpanded ? null : session.id); }}
                className={cn(
                  "group relative h-[130px] rounded-xl border p-3.5 cursor-pointer transition-all flex flex-col justify-between overflow-hidden",
                  isExpanded
                    ? "border-primary/40 bg-primary/[0.03]"
                    : "border-border/20 hover:border-primary/30 hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_0px] hover:shadow-primary/10",
                )}
              >
                {/* Delete overlay */}
                {isConfirming && (
                  <div className="absolute inset-0 z-10 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2 rounded-xl">
                    <p className="text-[11px] text-foreground/80">Delete {session.variations.length} variation{session.variations.length > 1 ? "s" : ""}?</p>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] px-3" onClick={(e) => { e.stopPropagation(); setConfirming(null); }}>Cancel</Button>
                      <Button variant="destructive" size="sm" className="h-7 text-[10px] px-3" onClick={(e) => { e.stopPropagation(); handleDelete(session); }}>Delete</Button>
                    </div>
                  </div>
                )}

                {/* Deleting spinner */}
                {isDeleting && (
                  <div className="absolute inset-0 z-10 bg-background/90 flex items-center justify-center rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Trash button — top right, visible on hover */}
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirming(session.id); }}
                  className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive z-10"
                >
                  <Trash2 className="w-3 h-3" />
                </button>

                {/* Top */}
                <div className="flex items-center gap-1.5">
                  {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />}
                  <span className="text-[11px] text-muted-foreground/70">{session.platform}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{session.format}</span>
                  <div className="ml-auto mr-4">
                    {session.bestScore > 0 && (
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">{session.bestScore}%</span>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <p className="text-[13px] leading-snug text-foreground/90 line-clamp-2 my-1.5">{session.preview}...</p>

                {/* Bottom */}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
                  <Layers className="w-2.5 h-2.5" />
                  <span>{session.variations.length} variation{session.variations.length > 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>{relativeTime(session.createdAt)}</span>
                  <span className="ml-auto text-primary/60 flex items-center gap-0.5">View <ArrowRight className="w-2.5 h-2.5" /></span>
                </div>
              </div>

              {/* Expanded panel */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mt-1 rounded-xl border border-border/20 bg-card p-3 space-y-2 max-h-[400px] overflow-y-auto">
                      {session.variations.map((v, vi) => (
                        <SessionVariationCard
                          key={v.id}
                          item={v}
                          angle={angleLabels[vi % angleLabels.length]}
                          platform={session.platform}
                          onUpdateImagePrompt={onUpdateImagePrompt}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    </div>
  );
}

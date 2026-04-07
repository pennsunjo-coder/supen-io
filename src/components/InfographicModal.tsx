import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  X, RefreshCw, Download, Sparkles, Check,
  ExternalLink, Save, Loader2, Copy, Maximize2, FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import {
  buildInfographicPrompt,
  buildGeminiImagePrompt,
  analyzeContent,
  getFormatDimensions,
  selectBestTemplate,
  resetRegenerationCounter,
  postProcessHtml,
  scoreInfographic,
  type QualityScore,
} from "@/lib/infographic-style";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const FONT_LINK = '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">';

function injectFontsInHtml(html: string): string {
  if (html.includes("fonts.googleapis.com")) return html;
  return html.replace("</head>", FONT_LINK + "</head>");
}

const LOADING_MESSAGES = [
  "Analyzing your content...",
  "Detecting content type...",
  "Selecting optimal layout...",
  "Crafting viral title...",
  "Building sections...",
  "Adding visual elements...",
  "Finalizing your infographic...",
];

// ─── Types ───

interface Props {
  open: boolean;
  onClose: () => void;
  content: string;
  platform: string;
}

type ResultMode = "gemini" | "claude" | null;
type Step = "ready" | "generating" | "result";

// ─── Component ───

export default function InfographicModal({ open, onClose, content, platform }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("ready");
  const [resultMode, setResultMode] = useState<ResultMode>(null);
  const [imageBase64, setImageBase64] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset state when modal opens or content changes
  useEffect(() => {
    if (open) {
      setStep("ready");
      setHtmlCode("");
      setImageBase64("");
      setResultMode(null);
      setSaved(false);
      setCustomPrompt("");
      setShowPrompt(false);
      setShowZoom(false);
      setShowConfetti(false);
      setQualityScore(null);
      resetRegenerationCounter();
    }
  }, [open, content]);

  // Rotate loading messages every 2s
  useEffect(() => {
    if (step !== "generating") return;
    setLoadingMsgIndex(0);
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [step]);

  // Show confetti when result arrives
  useEffect(() => {
    if (step === "result" && (imageBase64 || htmlCode)) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 1500);
      return () => clearTimeout(t);
    }
  }, [step, imageBase64, htmlCode]);

  // ─── Auto-analysis ───

  const analysis = analyzeContent(content, platform);
  const dims = getFormatDimensions(analysis.format);
  const templateSelection = selectBestTemplate(content, platform);
  const aspectRatio = dims.height / dims.width;
  // Scale infographic to fit ~480px wide modal content area
  const previewWidth = 480;
  const iframeScale = previewWidth / dims.width;

  // ─── Generation ───

  async function generateWithGemini(): Promise<string | null> {
    if (!GEMINI_API_KEY) return null;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildGeminiImagePrompt(content, platform, customPrompt || undefined) }] }],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
              responseMimeType: "image/png",
            },
          }),
        },
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts
        ?.find((p: { inlineData?: { data: string } }) => p.inlineData)
        ?.inlineData?.data || null;
    } catch {
      return null;
    }
  }

  async function generateWithClaude(): Promise<string> {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: buildInfographicPrompt(content, platform, customPrompt || undefined),
      }],
    });
    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
      || text.match(/<html[\s\S]*<\/html>/i)
      || text.match(/<div[\s\S]*<\/div>/);
    return htmlMatch ? htmlMatch[0] : text;
  }

  async function handleGenerate() {
    setStep("generating");
    setImageBase64("");
    setHtmlCode("");
    setResultMode(null);
    setSaved(false);

    try {
      const base64 = await generateWithGemini();
      if (base64) {
        setImageBase64(base64);
        setResultMode("gemini");
        setStep("result");
        return;
      }
      const rawHtml = await generateWithClaude();
      const html = postProcessHtml(rawHtml);
      setHtmlCode(html);
      setResultMode("claude");
      setQualityScore(scoreInfographic(html, dims));
    } catch {
      setHtmlCode("<div style='padding:40px;color:#999;font-family:sans-serif;text-align:center'>Generation error. Please try again.</div>");
      setResultMode("claude");
    }
    setStep("result");
  }

  // ─── Downloads ───

  async function handleDownloadPng() {
    if (resultMode === "gemini" && imageBase64) {
      const link = document.createElement("a");
      link.download = `supen-infographic-${Date.now()}.png`;
      link.href = `data:image/png;base64,${imageBase64}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PNG downloaded!");
      return;
    }

    if (!htmlCode) return;
    setDownloading(true);

    try {
      const container = document.createElement("div");
      container.style.cssText = `
        position: fixed; top: -9999px; left: -9999px;
        width: ${dims.width}px; height: ${dims.height}px; overflow: hidden; z-index: -1;
      `;
      const styleMatch = htmlCode.match(/<style[\s\S]*?<\/style>/i);
      const bodyMatch = htmlCode.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      container.innerHTML = (styleMatch ? styleMatch[0] : "") + (bodyMatch ? bodyMatch[1] : htmlCode);

      const bodyStyleMatch = htmlCode.match(/<body[^>]*style="([^"]*)"/i);
      if (bodyStyleMatch) container.style.cssText += bodyStyleMatch[1];
      container.style.width = `${dims.width}px`;
      container.style.height = `${dims.height}px`;
      container.style.overflow = "hidden";
      container.style.fontFamily = "'Poppins', sans-serif";
      container.style.background = "#FFF8F0";
      container.style.padding = "48px";
      container.style.boxSizing = "border-box";

      document.body.appendChild(container);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(container, {
        width: dims.width,
        height: dims.height,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FFF8F0",
        logging: false,
      });

      document.body.removeChild(container);

      const link = document.createElement("a");
      link.download = `supen-infographic-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`PNG downloaded! (${dims.width}x${dims.height}px)`);
    } catch (err) {
      console.error("PNG download error:", err);
      handleDownloadHtml();
      toast.info("PNG failed — HTML downloaded instead.");
    }
    setDownloading(false);
  }

  function handleDownloadHtml() {
    if (!htmlCode) return;
    const blob = new Blob([htmlCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `supen-infographic-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("HTML file downloaded!");
  }

  async function handleCopyImage() {
    try {
      if (resultMode === "gemini" && imageBase64) {
        const res = await fetch(`data:image/png;base64,${imageBase64}`);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        toast.success("Image copied to clipboard!");
        return;
      }
      if (!htmlCode) return;
      setDownloading(true);

      const container = document.createElement("div");
      container.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${dims.width}px;height:${dims.height}px;overflow:hidden;z-index:-1;`;
      const styleMatch = htmlCode.match(/<style[\s\S]*?<\/style>/i);
      const bodyMatch = htmlCode.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      container.innerHTML = (styleMatch ? styleMatch[0] : "") + (bodyMatch ? bodyMatch[1] : htmlCode);
      container.style.fontFamily = "'Poppins', sans-serif";
      container.style.background = "#FFF8F0";
      container.style.padding = "48px";
      container.style.boxSizing = "border-box";
      document.body.appendChild(container);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(container, { width: dims.width, height: dims.height, scale: 1, useCORS: true, backgroundColor: "#FFF8F0", logging: false });
      document.body.removeChild(container);

      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          toast.success("Image copied to clipboard!");
        }
      }, "image/png");
      setDownloading(false);
    } catch {
      toast.error("Copy failed — your browser may not support this.");
      setDownloading(false);
    }
  }

  // ─── Save ───

  async function handleSave() {
    if (!user || saved) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("generated_content").insert({
        user_id: user.id,
        platform,
        format: "Infographic",
        content: resultMode === "gemini"
          ? `[Gemini Image] ${content.slice(0, 200)}`
          : htmlCode.slice(0, 5000),
        viral_score: 85,
        image_prompt: resultMode === "gemini" ? "Gemini generated image" : "HTML infographic",
      });

      if (error) {
        toast.error("Error saving infographic");
      } else {
        setSaved(true);
        toast.success("Infographic saved to history!");
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  // ─── Reset ───

  function handleReset() {
    setStep("ready");
    setImageBase64("");
    setHtmlCode("");
    setResultMode(null);
    setCustomPrompt("");
    setShowPrompt(false);
    setSaved(false);
    setShowZoom(false);
  }

  if (!open) return null;

  // ─── Content preview ───
  const contentPreview = content.split(/\s+/).slice(0, 30).join(" ") + (content.split(/\s+/).length > 30 ? "..." : "");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border/30 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ═══ Header ═══ */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/20">
            <div>
              <h3 className="text-lg font-bold">
                {step === "ready" && "Create your infographic"}
                {step === "generating" && "Generating..."}
                {step === "result" && "Your infographic"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step === "ready" && "AI will analyze your content and design automatically"}
                {step === "generating" && "This may take 10-20 seconds"}
                {step === "result" && (
                  <>
                    {platform} — {dims.width}x{dims.height}
                    {resultMode === "gemini" && <span className="ml-2 text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">Gemini</span>}
                    {resultMode === "claude" && <span className="ml-2 text-[9px] bg-orange-500/15 text-orange-400 px-1.5 py-0.5 rounded-full">Claude</span>}
                  </>
                )}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {/* ═══ State 1: Ready ═══ */}
            {step === "ready" && (
              <div className="text-center space-y-6">
                {/* AI analysis preview */}
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Our AI will automatically detect:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        { label: `Template: ${templateSelection.templateId}`, color: "bg-blue-500/10 text-blue-400" },
                        { label: `Theme: ${analysis.colorTheme}`, color: "bg-green-500/10 text-green-400" },
                        { label: `${dims.width}x${dims.height}`, color: "bg-orange-500/10 text-orange-400" },
                      ].map((tag) => (
                        <span key={tag.label} className={cn("text-[10px] px-2 py-1 rounded-full font-medium", tag.color)}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Content preview */}
                <div className="bg-accent/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground italic leading-relaxed">{contentPreview}</p>
                </div>

                {/* Generate button */}
                <Button
                  className="w-full h-14 text-base font-bold gap-3"
                  onClick={handleGenerate}
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Infographic
                </Button>
              </div>
            )}

            {/* ═══ State 2: Generating ═══ */}
            {step === "generating" && (
              <div className="space-y-4">
                <div
                  className="rounded-xl overflow-hidden border border-border/30 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-primary/5 dark:to-accent/5 relative"
                  style={{ paddingBottom: `${aspectRatio * 100}%` }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={loadingMsgIndex}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.3 }}
                          className="text-sm font-semibold"
                        >
                          {LOADING_MESSAGES[loadingMsgIndex]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                    <div className="w-48 space-y-2">
                      <div className="h-3 rounded-full bg-border/40 animate-pulse" />
                      <div className="h-3 rounded-full bg-border/30 animate-pulse w-3/4" />
                      <div className="h-3 rounded-full bg-border/20 animate-pulse w-1/2" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ State 3: Result ═══ */}
            {step === "result" && (
              <div>
                {/* Confetti + success */}
                <AnimatePresence>
                  {showConfetti && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-center mb-3"
                    >
                      <p className="text-sm font-semibold">
                        Your infographic is ready! <span className="text-lg">🎉</span>
                      </p>
                      <div className="flex justify-center gap-1 mt-1 text-lg">
                        {["✨", "⭐", "✨", "⭐"].map((s, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0, y: -20 }}
                            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0], y: [0, -10, 20] }}
                            transition={{ duration: 1.2, delay: i * 0.15 }}
                          >
                            {s}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Preview */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="rounded-xl overflow-hidden border border-border/30 bg-white mb-4 relative group"
                >
                  {resultMode === "gemini" && imageBase64 ? (
                    <img
                      src={`data:image/png;base64,${imageBase64}`}
                      alt="Generated infographic"
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="relative w-full" style={{ paddingBottom: `${aspectRatio * 100}%` }}>
                      <iframe
                        ref={iframeRef}
                        srcDoc={injectFontsInHtml(htmlCode)}
                        className="absolute inset-0 w-full h-full"
                        style={{
                          border: "none",
                          transform: `scale(${iframeScale})`,
                          transformOrigin: "top left",
                          width: `${100 / iframeScale}%`,
                          height: `${100 / iframeScale}%`,
                        }}
                        sandbox="allow-same-origin allow-scripts"
                        title="Infographic preview"
                      />
                    </div>
                  )}

                  {/* Zoom overlay */}
                  <button
                    onClick={() => setShowZoom(true)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Full screen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </motion.div>

                {/* Primary actions */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Button
                    size="sm"
                    className="h-10 gap-2 text-sm font-semibold"
                    onClick={handleDownloadPng}
                    disabled={downloading}
                  >
                    {downloading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                      : <><Download className="w-4 h-4" /> Download PNG</>
                    }
                  </Button>

                  <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={handleCopyImage} disabled={downloading}>
                    <Copy className="w-3.5 h-3.5" /> Copy Image
                  </Button>

                  {resultMode === "claude" && (
                    <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={handleDownloadHtml}>
                      <FileCode className="w-3.5 h-3.5" /> HTML
                    </Button>
                  )}
                </div>

                {/* Secondary actions */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={handleGenerate}>
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </Button>

                  {resultMode === "claude" && (
                    <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={() => {
                      const blob = new Blob([htmlCode], { type: "text/html" });
                      window.open(URL.createObjectURL(blob), "_blank");
                    }}>
                      <ExternalLink className="w-3.5 h-3.5" /> Open in tab
                    </Button>
                  )}

                  <Button
                    variant={saved ? "ghost" : "outline"}
                    size="sm"
                    className={cn("h-9 gap-2 text-xs", saved && "text-green-400")}
                    onClick={handleSave}
                    disabled={saved || saving}
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                     saved ? <Check className="w-3.5 h-3.5" /> :
                     <Save className="w-3.5 h-3.5" />}
                    {saved ? "Saved" : "Save"}
                  </Button>
                </div>

                {/* Quality score */}
                {qualityScore && resultMode === "claude" && (
                  <div className="mb-3 p-3 rounded-lg bg-accent/20 border border-border/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">Quality Score</span>
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        qualityScore.score >= 80 ? "bg-green-500/15 text-green-400" :
                        qualityScore.score >= 60 ? "bg-yellow-500/15 text-yellow-400" :
                        "bg-red-500/15 text-red-400",
                      )}>
                        {qualityScore.score}/100
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {qualityScore.checks.map((c) => (
                        <span key={c.label} className={cn("text-[9px] px-1.5 py-0.5 rounded", c.pass ? "text-green-400/80" : "text-red-400/80 bg-red-500/10")}>
                          {c.pass ? "✓" : "✗"} {c.label}
                        </span>
                      ))}
                    </div>
                    {qualityScore.score < 70 && (
                      <button onClick={handleGenerate} className="mt-2 text-[10px] text-primary hover:underline">
                        Score low — click to regenerate
                      </button>
                    )}
                  </div>
                )}

                {/* History link */}
                {saved && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3">
                    <button
                      onClick={() => { onClose(); navigate("/dashboard/history"); }}
                      className="text-xs text-primary hover:underline"
                    >
                      View in History →
                    </button>
                  </motion.div>
                )}

                {/* Custom prompt (collapsed) */}
                <button onClick={() => setShowPrompt(!showPrompt)} className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
                  {showPrompt ? "Hide custom instructions" : "Custom instructions"}
                </button>
                {showPrompt && (
                  <div className="space-y-2">
                    <Textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="E.g. use dark theme, change the title, add more sections..."
                      className="text-xs min-h-[60px] resize-none"
                    />
                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleGenerate}>
                      <Sparkles className="w-3 h-3" /> Regenerate
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══ Zoom modal ═══ */}
        <AnimatePresence>
          {showZoom && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
              onClick={() => setShowZoom(false)}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="max-w-[95vw] max-h-[95vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {resultMode === "gemini" && imageBase64 ? (
                  <img
                    src={`data:image/png;base64,${imageBase64}`}
                    alt="Infographic full view"
                    className="max-w-full max-h-[95vh] object-contain"
                  />
                ) : (
                  <iframe
                    srcDoc={injectFontsInHtml(htmlCode)}
                    style={{ width: dims.width, height: dims.height, border: "none", background: "#FFF8F0" }}
                    sandbox="allow-same-origin allow-scripts"
                    title="Infographic full view"
                  />
                )}
              </motion.div>
              <button
                onClick={() => setShowZoom(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

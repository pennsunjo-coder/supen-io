import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  X, RefreshCw, Download, Sparkles, Check,
  ExternalLink, Save, Loader2, Copy, Maximize2, FileCode,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import {
  buildInfographicPrompt,
  FORMATS, TEMPLATES, ACCENT_COLORS,
  type FormatConfig, type InfographicOptions,
} from "@/lib/infographic-style";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ─── Types ───

interface Props {
  open: boolean;
  onClose: () => void;
  content: string;
  platform: string;
}

type ResultMode = "gemini" | "claude" | null;
type Step = "template" | "customize" | "result";

// ─── Component ───

export default function InfographicModal({ open, onClose, content, platform }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Flow state
  const [step, setStep] = useState<Step>("template");
  const [selectedTemplate, setSelectedTemplate] = useState("howto");
  const [selectedFormat, setSelectedFormat] = useState<FormatConfig>(FORMATS[0]);
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0].hex);
  const [brandName, setBrandName] = useState("");
  const [sectionCount, setSectionCount] = useState(5);
  const [showFrame, setShowFrame] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);

  // Result state
  const [generating, setGenerating] = useState(false);
  const [resultMode, setResultMode] = useState<ResultMode>(null);
  const [imageBase64, setImageBase64] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Show confetti when result arrives
  useEffect(() => {
    if (step === "result" && !generating && (imageBase64 || htmlCode)) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 1500);
      return () => clearTimeout(t);
    }
  }, [step, generating, imageBase64, htmlCode]);

  // ─── Build options ───

  function getOptions(): InfographicOptions {
    return {
      format: selectedFormat,
      template: selectedTemplate,
      accentColor,
      brandName,
      sectionCount,
      showFrame,
      customInstructions: customPrompt || undefined,
    };
  }

  // ─── Gemini prompt ───

  function buildGeminiPrompt(): string {
    const opts = getOptions();
    const extra = customPrompt ? `\nAdditional instructions: ${customPrompt}` : "";
    const tpl = TEMPLATES.find((t) => t.id === selectedTemplate);

    return `Create a professional infographic in the style of a handwritten sketchnote/whiteboard.
Template: ${tpl?.label || "How-To Guide"}
Platform: ${platform}
Format: ${opts.format.width}x${opts.format.height}px
Content to visualize:
${content.slice(0, 2000)}

Requirements:
- Background: #FFF8F0 (warm cream)
- Bold title at top (48px, heavy weight)
${opts.showFrame ? "- Wood-colored border frame (#5D3A1A)" : "- No border frame"}
- Dominant accent color: ${accentColor}
- Numbered sections with colored circles
- Hand-drawn style, Patrick Hand font
- Arrow symbols (→) for sub-points
- Footer: "${opts.brandName ? `Follow ${opts.brandName} for more | Repost 🔄` : "Follow @awakpenn for more | Repost 🔄"}"
- Max ${sectionCount} sections
- Format: ${opts.format.width}x${opts.format.height}px${extra}`;
  }

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
            contents: [{ parts: [{ text: buildGeminiPrompt() }] }],
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
        content: buildInfographicPrompt(content, platform, getOptions()),
      }],
    });

    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
      || text.match(/<html[\s\S]*<\/html>/i)
      || text.match(/<div[\s\S]*<\/div>/);
    return htmlMatch ? htmlMatch[0] : text;
  }

  async function handleGenerate() {
    setGenerating(true);
    setStep("result");
    setImageBase64("");
    setHtmlCode("");
    setResultMode(null);
    setSaved(false);

    try {
      const base64 = await generateWithGemini();
      if (base64) {
        setImageBase64(base64);
        setResultMode("gemini");
        setGenerating(false);
        return;
      }
      const html = await generateWithClaude();
      setHtmlCode(html);
      setResultMode("claude");
    } catch {
      setHtmlCode("<div style='padding:40px;color:#999;font-family:sans-serif;text-align:center'>Generation error. Please try again.</div>");
      setResultMode("claude");
    }
    setGenerating(false);
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
      const f = selectedFormat;
      container.style.cssText = `
        position: fixed; top: -9999px; left: -9999px;
        width: ${f.width}px; height: ${f.height}px; overflow: hidden; z-index: -1;
      `;
      const styleMatch = htmlCode.match(/<style[\s\S]*?<\/style>/i);
      const bodyMatch = htmlCode.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      container.innerHTML = (styleMatch ? styleMatch[0] : "") + (bodyMatch ? bodyMatch[1] : htmlCode);

      const bodyStyleMatch = htmlCode.match(/<body[^>]*style="([^"]*)"/i);
      if (bodyStyleMatch) container.style.cssText += bodyStyleMatch[1];
      container.style.width = `${f.width}px`;
      container.style.height = `${f.height}px`;
      container.style.overflow = "hidden";
      container.style.fontFamily = "'Patrick Hand', cursive";
      container.style.background = "#FFF8F0";
      if (showFrame) container.style.border = "8px solid #5D3A1A";
      container.style.padding = f.id === "landscape" ? "32px 40px" : "48px";
      container.style.boxSizing = "border-box";

      document.body.appendChild(container);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(container, {
        width: f.width,
        height: f.height,
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
      toast.success(`PNG downloaded! (${f.width}x${f.height}px)`);
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
      // For Claude HTML — render and copy
      setDownloading(true);
      const f = selectedFormat;
      const container = document.createElement("div");
      container.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${f.width}px;height:${f.height}px;overflow:hidden;z-index:-1;`;
      const styleMatch = htmlCode.match(/<style[\s\S]*?<\/style>/i);
      const bodyMatch = htmlCode.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      container.innerHTML = (styleMatch ? styleMatch[0] : "") + (bodyMatch ? bodyMatch[1] : htmlCode);
      container.style.fontFamily = "'Patrick Hand', cursive";
      container.style.background = "#FFF8F0";
      if (showFrame) container.style.border = "8px solid #5D3A1A";
      container.style.padding = f.id === "landscape" ? "32px 40px" : "48px";
      container.style.boxSizing = "border-box";
      document.body.appendChild(container);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(container, { width: f.width, height: f.height, scale: 1, useCORS: true, backgroundColor: "#FFF8F0", logging: false });
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
        console.warn("Save infographic error:", error.message);
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
    setStep("template");
    setSelectedTemplate("howto");
    setSelectedFormat(FORMATS[0]);
    setAccentColor(ACCENT_COLORS[0].hex);
    setBrandName("");
    setSectionCount(5);
    setShowFrame(true);
    setImageBase64("");
    setHtmlCode("");
    setResultMode(null);
    setCustomPrompt("");
    setShowPrompt(false);
    setSaved(false);
    setShowZoom(false);
  }

  if (!open) return null;

  // ─── Computed ───

  const aspectRatio = selectedFormat.height / selectedFormat.width;
  const iframeScale = 0.42;

  // ─── Render ───

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
            <div className="flex items-center gap-3">
              {step !== "template" && (
                <button
                  onClick={() => {
                    if (step === "customize") setStep("template");
                    else if (step === "result") setStep("customize");
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <h3 className="text-lg font-bold">
                  {step === "template" && "Choose a template"}
                  {step === "customize" && "Customize"}
                  {step === "result" && "Your infographic"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step === "template" && "Pick the layout that fits your content"}
                  {step === "customize" && "Format, colors, and options"}
                  {step === "result" && (
                    <>
                      {platform} — {selectedFormat.size}
                      {resultMode === "gemini" && <span className="ml-2 text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">Gemini</span>}
                      {resultMode === "claude" && <span className="ml-2 text-[9px] bg-orange-500/15 text-orange-400 px-1.5 py-0.5 rounded-full">Claude</span>}
                    </>
                  )}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {/* ═══ Step 1: Template ═══ */}
            {step === "template" && (
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTemplate(t.id); setStep("customize"); }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                      selectedTemplate === t.id
                        ? "border-primary bg-primary/[0.05]"
                        : "border-border/30 hover:border-primary/40 hover:bg-primary/[0.02]",
                    )}
                  >
                    <span className="text-3xl">{t.emoji}</span>
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{t.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* ═══ Step 2: Customize ═══ */}
            {step === "customize" && (
              <div className="space-y-5">
                {/* Format */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {FORMATS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFormat(f)}
                        className={cn(
                          "p-3 rounded-xl border text-center transition-all",
                          selectedFormat.id === f.id
                            ? "border-primary bg-primary/[0.05]"
                            : "border-border/30 hover:border-primary/40",
                        )}
                      >
                        <span className="text-lg">{f.icon}</span>
                        <p className="text-xs font-semibold mt-1">{f.label}</p>
                        <p className="text-[10px] text-muted-foreground">{f.size}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent color */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Accent color</label>
                  <div className="flex gap-2 flex-wrap">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setAccentColor(c.hex)}
                        className={cn(
                          "w-9 h-9 rounded-full border-2 transition-all",
                          accentColor === c.hex ? "border-foreground scale-110" : "border-transparent hover:scale-105",
                        )}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      >
                        {accentColor === c.hex && <Check className="w-4 h-4 text-white mx-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand name */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Your name / brand (footer)</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="@awakpenn"
                    className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>

                {/* Section count */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Sections: {sectionCount}
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={6}
                    value={sectionCount}
                    onChange={(e) => setSectionCount(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>3</span><span>4</span><span>5</span><span>6</span>
                  </div>
                </div>

                {/* Frame toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wood frame border</label>
                  <button
                    onClick={() => setShowFrame(!showFrame)}
                    className={cn(
                      "w-11 h-6 rounded-full transition-all relative",
                      showFrame ? "bg-primary" : "bg-border",
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all",
                      showFrame ? "left-[22px]" : "left-0.5",
                    )} />
                  </button>
                </div>

                {/* Generate button */}
                <Button
                  className="w-full h-12 text-sm font-bold gap-2"
                  onClick={handleGenerate}
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Infographic
                </Button>
              </div>
            )}

            {/* ═══ Step 3: Result ═══ */}
            {step === "result" && (
              <div>
                {generating ? (
                  /* Skeleton loader */
                  <div className="space-y-4">
                    <div
                      className="rounded-xl overflow-hidden border border-border/30 bg-gradient-to-br from-amber-50/50 to-orange-50/30 relative"
                      style={{ paddingBottom: `${aspectRatio * 100}%` }}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                          <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold">Creating your infographic...</p>
                          <p className="text-xs text-muted-foreground mt-1">This may take 10-20 seconds</p>
                        </div>
                        {/* Skeleton bars */}
                        <div className="w-48 space-y-2 mt-2">
                          <div className="h-3 rounded-full bg-border/40 animate-pulse" />
                          <div className="h-3 rounded-full bg-border/30 animate-pulse w-3/4" />
                          <div className="h-3 rounded-full bg-border/20 animate-pulse w-1/2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Confetti + success message */}
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
                            srcDoc={htmlCode}
                            className="absolute inset-0 w-full h-full"
                            style={{
                              border: "none",
                              transform: `scale(${iframeScale})`,
                              transformOrigin: "top left",
                              width: `${100 / iframeScale}%`,
                              height: `${100 / iframeScale}%`,
                            }}
                            sandbox="allow-same-origin"
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

                    {/* Export buttons — 3 options */}
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

                      {resultMode === "claude" && (
                        <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={handleDownloadHtml}>
                          <FileCode className="w-3.5 h-3.5" /> Download HTML
                        </Button>
                      )}

                      <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={handleCopyImage} disabled={downloading}>
                        <Copy className="w-3.5 h-3.5" /> Copy Image
                      </Button>
                    </div>

                    {/* Action row 2 */}
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

                    {/* View in history link */}
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

                    {/* Custom prompt */}
                    <button onClick={() => setShowPrompt(!showPrompt)} className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
                      {showPrompt ? "Hide instructions" : "Edit instructions"}
                    </button>
                    {showPrompt && (
                      <div className="space-y-2">
                        <Textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="E.g. use red, add a QR code, change the title..."
                          className="text-xs min-h-[60px] resize-none"
                        />
                        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleGenerate}>
                          <Sparkles className="w-3 h-3" /> Regenerate with instructions
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══ Zoom modal (fullscreen) ═══ */}
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
                    srcDoc={htmlCode}
                    style={{ width: selectedFormat.width, height: selectedFormat.height, border: "none", background: "#FFF8F0" }}
                    sandbox="allow-same-origin"
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

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  X, RefreshCw, Download, Sparkles, Check,
  Loader2, Copy, Maximize2, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import GenerationProgress, { INFOGRAPHIC_STEPS } from "@/components/GenerationProgress";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import {
  buildInfographicPrompt,
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
import { assertOnline, withTimeout, sanitizeInfographicHtml, friendlyError } from "@/lib/resilience";

const FONT_LINK = '<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet">';

function injectFontsInHtml(html: string): string {
  if (html.includes("fonts.googleapis.com")) return html;
  return html.replace("</head>", FONT_LINK + "</head>");
}

// Loading messages moved to GenerationProgress component

// ─── Types ───

interface Props {
  open: boolean;
  onClose: () => void;
  content: string;
  platform: string;
  contentId?: string;        // ID of the parent variation row in generated_content
  existingHtml?: string;     // Pre-generated infographic HTML (skip generation)
  onGenerated?: (html: string) => void; // Callback after successful generation
}

type ResultMode = "claude" | null;
type Step = "ready" | "generating" | "result";
type StyleChoice = "auto" | "AWA_CLASSIC" | "UI_CARDS" | "WHITEBOARD" | "FUNNEL" | "DATA_GRID";

// Tiny inline SVG previews — schematic mini-mockups (60×40 viewBox).
const STYLE_PREVIEWS: Record<StyleChoice, JSX.Element> = {
  auto: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="2" y="2" width="56" height="36" rx="4" fill="url(#auto-grad)" />
      <defs>
        <linearGradient id="auto-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#24A89B" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path d="M30 12 L32 18 L38 18 L33 22 L35 28 L30 24 L25 28 L27 22 L22 18 L28 18 Z" fill="#24A89B" />
    </svg>
  ),
  AWA_CLASSIC: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="2" y="2" width="56" height="36" rx="3" fill="#FFFFF5" stroke="#5D3A1A" strokeWidth="1.5" />
      <rect x="6" y="5" width="20" height="3" rx="1" fill="#1A1A1A" />
      <rect x="6" y="12" width="48" height="2.5" rx="0.8" fill="#E53E3E" />
      <rect x="6" y="17" width="48" height="2.5" rx="0.8" fill="#3182CE" />
      <rect x="6" y="22" width="48" height="2.5" rx="0.8" fill="#38A169" />
      <rect x="6" y="27" width="48" height="2.5" rx="0.8" fill="#DD6B20" />
      <rect x="6" y="32" width="48" height="2.5" rx="0.8" fill="#9B59B6" />
    </svg>
  ),
  UI_CARDS: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="0" y="0" width="60" height="40" fill="#FFFFFF" />
      {/* Header (20%) */}
      <rect x="6" y="2.5" width="34" height="3" rx="0.4" fill="#1F2937" />
      <rect x="42" y="2.7" width="12" height="2.5" rx="1" fill="#EBF5FB" />
      {/* Body — 3 cards (70%) */}
      <rect x="4" y="9.5" width="52" height="7" rx="1.5" fill="#FFB3B3" />
      <rect x="4" y="18.5" width="52" height="7" rx="1.5" fill="#FFD4A3" />
      <rect x="4" y="27.5" width="52" height="7" rx="1.5" fill="#B3FFD1" />
      {/* Footer (10%) */}
      <rect x="0" y="36" width="60" height="4" fill="#F8F9FA" />
      <line x1="0" y1="36" x2="60" y2="36" stroke="#E5E7EB" strokeWidth="0.4" />
      <rect x="22" y="37.5" width="16" height="1.2" rx="0.3" fill="#24A89B" />
    </svg>
  ),
  WHITEBOARD: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="0" y="0" width="60" height="40" fill="#FFFFFF" />
      {/* Header (20%) */}
      <rect x="6" y="2.5" width="34" height="3" rx="0.4" fill="#1F2937" />
      <rect x="42" y="2.7" width="12" height="2.5" rx="1" fill="#EBF5FB" />
      {/* Dot grid pattern in body */}
      <circle cx="8" cy="11" r="0.3" fill="#E8EAED" />
      <circle cx="14" cy="11" r="0.3" fill="#E8EAED" />
      <circle cx="20" cy="11" r="0.3" fill="#E8EAED" />
      <circle cx="26" cy="11" r="0.3" fill="#E8EAED" />
      <circle cx="32" cy="11" r="0.3" fill="#E8EAED" />
      <circle cx="38" cy="11" r="0.3" fill="#E8EAED" />
      <circle cx="44" cy="11" r="0.3" fill="#E8EAED" />
      <circle cx="50" cy="11" r="0.3" fill="#E8EAED" />
      {/* Body — 3 cards (70%) */}
      <rect x="4" y="9.5" width="52" height="7" rx="1.5" fill="#AEC6CF" />
      <rect x="4" y="18.5" width="52" height="7" rx="1.5" fill="#FFD4A3" />
      <rect x="4" y="27.5" width="52" height="7" rx="1.5" fill="#B3FFD1" />
      {/* Footer (10%) */}
      <rect x="0" y="36" width="60" height="4" fill="#F8F9FA" />
      <line x1="0" y1="36" x2="60" y2="36" stroke="#E5E7EB" strokeWidth="0.4" />
      <rect x="22" y="37.5" width="16" height="1.2" rx="0.3" fill="#24A89B" />
    </svg>
  ),
  FUNNEL: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="0" y="0" width="60" height="40" fill="#FFFFFF" />
      {/* Header (20%) */}
      <rect x="6" y="2.5" width="34" height="3" rx="0.4" fill="#1F2937" />
      <rect x="42" y="2.7" width="12" height="2.5" rx="1" fill="#EBF5FB" />
      {/* Body — 3 numbered cards (70%) */}
      <rect x="4" y="9.5" width="52" height="7" rx="1.5" fill="#FFB3B3" />
      <circle cx="8" cy="13" r="1.6" fill="#FFFFFF" />
      <text x="8" y="14" fontSize="2.3" fill="#1F2937" textAnchor="middle" fontWeight="900">1</text>
      <rect x="4" y="18.5" width="52" height="7" rx="1.5" fill="#FFD4A3" />
      <circle cx="8" cy="22" r="1.6" fill="#FFFFFF" />
      <text x="8" y="23" fontSize="2.3" fill="#1F2937" textAnchor="middle" fontWeight="900">2</text>
      <rect x="4" y="27.5" width="52" height="7" rx="1.5" fill="#B3FFD1" />
      <circle cx="8" cy="31" r="1.6" fill="#FFFFFF" />
      <text x="8" y="32" fontSize="2.3" fill="#1F2937" textAnchor="middle" fontWeight="900">3</text>
      {/* Footer (10%) */}
      <rect x="0" y="36" width="60" height="4" fill="#F8F9FA" />
      <line x1="0" y1="36" x2="60" y2="36" stroke="#E5E7EB" strokeWidth="0.4" />
      <rect x="22" y="37.5" width="16" height="1.2" rx="0.3" fill="#24A89B" />
    </svg>
  ),
  DATA_GRID: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="0" y="0" width="60" height="40" fill="#FFFFFF" />
      {/* Header (20%) */}
      <rect x="6" y="2.5" width="34" height="3" rx="0.4" fill="#1F2937" />
      <rect x="42" y="2.7" width="12" height="2.5" rx="1" fill="#EBF5FB" />
      {/* Body — 3 cards with dots (70%) */}
      <rect x="4" y="9.5" width="52" height="7" rx="1.5" fill="#AEC6CF" />
      <circle cx="8" cy="13" r="0.9" fill="#1F2937" />
      <rect x="4" y="18.5" width="52" height="7" rx="1.5" fill="#D4B3FF" />
      <circle cx="8" cy="22" r="0.9" fill="#1F2937" />
      <rect x="4" y="27.5" width="52" height="7" rx="1.5" fill="#B3FFD1" />
      <circle cx="8" cy="31" r="0.9" fill="#1F2937" />
      {/* Footer (10%) */}
      <rect x="0" y="36" width="60" height="4" fill="#F8F9FA" />
      <line x1="0" y1="36" x2="60" y2="36" stroke="#E5E7EB" strokeWidth="0.4" />
      <rect x="22" y="37.5" width="16" height="1.2" rx="0.3" fill="#24A89B" />
    </svg>
  ),
};

const STYLE_OPTIONS: { id: StyleChoice; label: string; desc: string }[] = [
  { id: "auto", label: "Auto", desc: "AI picks" },
  { id: "AWA_CLASSIC", label: "Awa Classic", desc: "Dense viral" },
  { id: "UI_CARDS", label: "UI Cards", desc: "3 levels" },
  { id: "WHITEBOARD", label: "Whiteboard", desc: "Whiteboard" },
  { id: "FUNNEL", label: "Funnel", desc: "Funnel" },
  { id: "DATA_GRID", label: "Data Grid", desc: "Framework table" },
];

// ─── Component ───

export default function InfographicModal({ open, onClose, content, platform, contentId, existingHtml, onGenerated }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("ready");
  const [resultMode, setResultMode] = useState<ResultMode>(null);
  const [htmlCode, setHtmlCode] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
  const [styleChoice, setStyleChoice] = useState<StyleChoice>("auto");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const retryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup retry interval on unmount
  useEffect(() => {
    return () => { if (retryIntervalRef.current) clearInterval(retryIntervalRef.current); };
  }, []);

  // Reset state when modal opens or content changes
  useEffect(() => {
    if (open) {
      setCustomPrompt("");
      setShowPrompt(false);
      setShowZoom(false);
      setShowConfetti(false);
      setQualityScore(null);
      setStyleChoice("auto");
      setGenerationError(null);
      setRetryCountdown(0);
      if (retryIntervalRef.current) { clearInterval(retryIntervalRef.current); retryIntervalRef.current = null; }
      resetRegenerationCounter();

      if (existingHtml) {
        // Pre-existing infographic — show directly, no generation, no save
        setStep("result");
        setHtmlCode(existingHtml);
        setResultMode("claude");
        setSaved(true);
      } else {
        setStep("ready");
        setHtmlCode("");
        setResultMode(null);
        setSaved(false);
      }
    }
  }, [open, content, existingHtml]);

  // Hard guard against duplicate saves: ref is mutated synchronously,
  // so even React StrictMode double-fires can't slip a second insert through.
  // handleSave is now called EXPLICITLY from handleGenerate after a verified
  // success — no useEffect-based auto-save (which used to fire on every state
  // change including the error-fallback path that polluted the database).
  const savedRef = useRef(false);

  // Visual confetti only — save is handled explicitly in handleGenerate
  useEffect(() => {
    if (step === "result" && htmlCode) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 1500);
      return () => clearTimeout(t);
    }
  }, [step, htmlCode]);

  // Reset save guard when the modal opens fresh
  useEffect(() => {
    if (open) savedRef.current = false;
  }, [open]);

  // ─── Auto-analysis ───

  const forcedTemplate = styleChoice === "auto" ? undefined : styleChoice;
  const analysis = analyzeContent(content, platform);
  const dims = getFormatDimensions(analysis.format);
  const templateSelection = selectBestTemplate(content, platform, forcedTemplate);
  const aspectRatio = dims.height / dims.width;
  // Scale infographic to fit ~480px wide modal content area
  const previewWidth = 480;
  const iframeScale = previewWidth / dims.width;

  // ─── Generation (Claude HTML only — Gemini disabled) ───

  async function handleGenerate() {
    setStep("generating");
    setHtmlCode("");
    setResultMode(null);
    setSaved(false);
    setQualityScore(null);
    setGenerationError(null);
    setRetryCountdown(0);
    if (retryIntervalRef.current) { clearInterval(retryIntervalRef.current); retryIntervalRef.current = null; }
    savedRef.current = false;

    try {
      assertOnline();
      const response = await withTimeout(
        anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 4096,
          messages: [{
            role: "user",
            content: buildInfographicPrompt(content, platform, customPrompt || undefined, forcedTemplate),
          }],
        }),
        60_000,
      );

      const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
        || text.match(/<html[\s\S]*<\/html>/i)
        || text.match(/<div[\s\S]*<\/div>/);
      const rawHtml = htmlMatch ? htmlMatch[0] : text;
      const html = sanitizeInfographicHtml(postProcessHtml(rawHtml));

      if (!html || html.trim().length < 100) {
        throw new Error("Generated content is empty or too short. Try again.");
      }

      setHtmlCode(html);
      setResultMode("claude");
      setQualityScore(scoreInfographic(html, dims));
      setStep("result");

      await handleSave({ html, mode: "claude" });
    } catch (err) {
      console.error("[InfographicModal] Generation failed:", err);
      const fallbackMsg = err instanceof Error ? err.message : "Generation failed";
      const msg = friendlyError(err) || fallbackMsg;
      setStep("ready");
      setGenerationError(msg);
      toast.error(msg);
    }
  }

  // ─── Retry on 529 / overloaded ───

  function handleRetryWithDelay() {
    if (retryIntervalRef.current) { clearInterval(retryIntervalRef.current); retryIntervalRef.current = null; }
    setRetryCountdown(30);
    retryIntervalRef.current = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          if (retryIntervalRef.current) { clearInterval(retryIntervalRef.current); retryIntervalRef.current = null; }
          handleGenerate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ─── Downloads (PNG + JPEG + PDF from HTML via html2canvas) ───

  async function renderHtmlToCanvas(): Promise<HTMLCanvasElement> {
    const iframe = iframeRef.current;
    if (!iframe) throw new Error("Iframe not available");

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc?.body) throw new Error("Cannot access iframe content");

    // Wait for fonts to load inside the iframe
    try { await iframe.contentWindow?.document.fonts.ready; } catch {}
    await new Promise((r) => setTimeout(r, 1500));

    const html2canvas = (await import("html2canvas")).default;
    const rootEl = iframeDoc.body;

    const canvas = await html2canvas(rootEl, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#f8f9f7",
      scale: 2,
      logging: false,
      foreignObjectRendering: false,
      imageTimeout: 5000,
      onclone: (clonedDoc: Document) => {
        try {
          clonedDoc.querySelectorAll("*").forEach((el) => {
            const htmlEl = el as HTMLElement;
            try {
              const computed = window.getComputedStyle(htmlEl);
              const bg = computed.backgroundColor;
              if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
                htmlEl.style.backgroundColor = bg;
              }
              if (computed.color) htmlEl.style.color = computed.color;
              if (computed.fontFamily) htmlEl.style.fontFamily = computed.fontFamily;
              if (computed.fontWeight) htmlEl.style.fontWeight = computed.fontWeight;
              if (computed.fontSize) htmlEl.style.fontSize = computed.fontSize;
              if (computed.borderLeftColor) htmlEl.style.borderLeftColor = computed.borderLeftColor;
              if (computed.borderColor) htmlEl.style.borderColor = computed.borderColor;
            } catch {}
          });
        } catch {}
      },
    });

    return canvas;
  }

  async function handleDownload(format: "png" | "jpeg") {
    if (downloading || !htmlCode) return;
    setDownloading(true);

    try {
      const canvas = await renderHtmlToCanvas();
      const link = document.createElement("a");
      link.style.display = "none";
      if (format === "jpeg") {
        link.href = canvas.toDataURL("image/jpeg", 0.95);
        link.download = `supen-infographic-${Date.now()}.jpg`;
      } else {
        link.href = canvas.toDataURL("image/png");
        link.download = `supen-infographic-${Date.now()}.png`;
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${format.toUpperCase()} downloaded!`);
    } catch (err) {
      console.error("[InfographicModal] Download error:", err);
      // Fallback: open HTML in new tab
      try {
        const blob = new Blob([htmlCode], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        toast.info("Opened in new tab — right-click image to save");
      } catch {
        toast.error("Download failed — try again");
      }
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopyImage() {
    if (!htmlCode) return;
    setDownloading(true);
    try {
      const canvas = await renderHtmlToCanvas();
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          toast.success("Image copied!");
        }
        setDownloading(false);
      }, "image/png");
    } catch {
      toast.error("Copy failed — your browser may not support this.");
      setDownloading(false);
    }
  }

  async function handleDownloadPDF() {
    if (downloading || !htmlCode) return;
    setDownloading(true);

    try {
      const canvas = await renderHtmlToCanvas();
      const imgData = canvas.toDataURL("image/png");
      const imgW = canvas.width / 2;
      const imgH = canvas.height / 2;
      const ratio = imgH / imgW;

      // Try jsPDF first
      try {
        const { jsPDF } = await import("jspdf");
        const pdfW = 210;
        const pdfH = Math.round(pdfW * ratio);
        const pdf = new jsPDF({
          orientation: ratio > 1 ? "portrait" : "landscape",
          unit: "mm",
          format: [pdfW, pdfH],
          compress: true,
        });
        pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH, "", "FAST");
        pdf.save(`supen-infographic-${Date.now()}.pdf`);
        toast.success("PDF downloaded!");
      } catch (pdfErr) {
        console.warn("jsPDF failed, using print fallback:", pdfErr);
        // Fallback: print dialog
        const printWin = window.open("", "_blank", "width=1200,height=800");
        if (!printWin) {
          // Last fallback: save as PNG
          const link = document.createElement("a");
          link.href = imgData;
          link.download = `supen-infographic-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.info("Saved as PNG (popups blocked for PDF)");
          setDownloading(false);
          return;
        }
        const isPortrait = ratio > 1;
        printWin.document.write(`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{background:white}img{width:100%;height:auto;display:block;page-break-inside:avoid}@page{margin:0;size:${isPortrait ? "portrait" : "landscape"}}@media print{body{margin:0}img{width:100%}}</style></head><body><img src="${imgData}"/><script>window.onload=function(){setTimeout(function(){window.print();setTimeout(function(){window.close()},1000)},800)};<\/script></body></html>`);
        printWin.document.close();
        toast.success("Print dialog → Save as PDF");
      }
    } catch (err) {
      console.error("[InfographicModal] PDF error:", err);
      toast.error("PDF failed — use PNG instead");
    }
    setDownloading(false);
  }

  // ─── Save ───
  // Called EXPLICITLY from handleGenerate after a verified success.
  // Accepts fresh data via opts to avoid stale React state closures.
  // savedRef provides synchronous duplicate protection.

  async function handleSave(opts?: { html?: string; mode?: "claude" }) {
    if (!user) return;
    if (savedRef.current) return;

    const html = opts?.html ?? htmlCode;
    if (!html) {
      console.warn("[InfographicModal] handleSave bailed — no html");
      return;
    }

    savedRef.current = true;
    setSaving(true);

    try {
      let error: { message: string; details?: string; hint?: string } | null = null;

      if (contentId) {
        // UPDATE the parent variation row — no new row created
        const res = await supabase
          .from("generated_content")
          .update({
            infographic_html: html,
            infographic_generated_at: new Date().toISOString(),
          })
          .eq("id", contentId);
        error = res.error;
      } else {
        // Legacy INSERT fallback (no parent variation to link to)
        const res = await supabase.from("generated_content").insert({
          user_id: user.id,
          platform,
          format: "Infographic",
          content: html,
          viral_score: 85,
          image_prompt: "HTML infographic",
        });
        error = res.error;
      }

      if (error) {
        console.error("[InfographicModal] Supabase save error:", error.message, error.details, error.hint);
        toast.error(`Save error: ${error.message}`);
        savedRef.current = false;
      } else {
        setSaved(true);
        toast.success("Infographic saved!");
        if (onGenerated && infographicHtml) onGenerated(infographicHtml);
      }
    } catch (err) {
      console.error("[InfographicModal] Network/unexpected error:", err);
      toast.error("Network error while saving");
      savedRef.current = false;
    }
    setSaving(false);
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
                {step === "ready" && "AI analyzes your content and designs automatically"}
                {step === "generating" && "This may take 30-60 seconds — don't close this window"}
                {step === "result" && `${platform} — ${dims.width}x${dims.height}`}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {/* ═══ State 1: Ready ═══ */}
            {step === "ready" && (
              <div className="space-y-5">
                {/* AI analysis preview */}
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Our AI will generate:</p>
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

                {/* Style selector with visual previews */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Choose a style</p>
                  <div className="grid grid-cols-3 gap-2">
                    {STYLE_OPTIONS.map((opt) => {
                      const active = styleChoice === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setStyleChoice(opt.id)}
                          className={cn(
                            "group rounded-xl border p-2 transition-all flex flex-col gap-1.5",
                            active
                              ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                              : "border-border/40 bg-accent/20 hover:border-border/70 hover:bg-accent/40",
                          )}
                        >
                          <div className="aspect-[3/2] w-full rounded-md overflow-hidden bg-white/80 border border-border/30 flex items-center justify-center">
                            {STYLE_PREVIEWS[opt.id]}
                          </div>
                          <div className="flex items-center gap-1 px-0.5">
                            <span className={cn("text-[11px] font-bold leading-tight", active && "text-primary")}>{opt.label}</span>
                            {active && <Check className="w-3 h-3 text-primary flex-shrink-0" />}
                          </div>
                          <p className="text-[9px] text-muted-foreground leading-tight px-0.5">{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Error banner + retry */}
                {generationError && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 space-y-2">
                    <p className="text-xs text-destructive font-medium">{generationError}</p>
                    {(generationError.includes("overloaded") || generationError.includes("529")) && (
                      retryCountdown > 0 ? (
                        <p className="text-xs text-muted-foreground font-mono">
                          Auto-retry in {retryCountdown}s...
                        </p>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 gap-2 text-xs" onClick={handleRetryWithDelay}>
                          <RefreshCw className="w-3.5 h-3.5" />
                          Retry in 30s
                        </Button>
                      )
                    )}
                  </div>
                )}

                {/* Content preview */}
                <div className="bg-accent/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">{contentPreview}</p>
                </div>

                {/* Generate button */}
                <Button
                  className="w-full h-14 text-base font-bold gap-3"
                  onClick={handleGenerate}
                  disabled={retryCountdown > 0}
                >
                  <Sparkles className="w-5 h-5" />
                  {retryCountdown > 0 ? `Retry in ${retryCountdown}s...` : "Generate infographic"}
                </Button>
              </div>
            )}

            {/* ═══ State 2: Generating ═══ */}
            {step === "generating" && (
              <div className="space-y-4">
                <div
                  className="rounded-xl overflow-hidden border border-border/30 bg-gradient-to-br from-primary/[0.03] to-accent/[0.03] relative"
                  style={{ paddingBottom: `${aspectRatio * 100}%` }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-10">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                      <Sparkles className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="w-full max-w-xs">
                      <GenerationProgress isActive={step === "generating"} steps={INFOGRAPHIC_STEPS} estimatedSeconds={50} />
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

                  {/* Zoom overlay */}
                  <button
                    onClick={() => setShowZoom(true)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Full screen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </motion.div>

                {/* Saved status banner */}
                {saved && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Infographic saved
                  </motion.div>
                )}
                {!saved && saving && (
                  <div className="mb-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent/30 text-muted-foreground text-xs font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </div>
                )}

                {/* Download status */}
                {downloading && (
                  <p className="text-xs text-muted-foreground text-center animate-pulse mb-2">
                    Preparing download... (may take a few seconds)
                  </p>
                )}

                {/* Primary actions — PNG + JPEG + PDF download */}
                <div className="flex gap-2 mb-3">
                  <Button
                    onClick={() => handleDownload("png")}
                    variant="outline"
                    className="flex-1 gap-1.5 h-9 text-xs font-semibold"
                    disabled={downloading}
                  >
                    {downloading
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> ...</>
                      : <><Download className="w-3 h-3" /> PNG</>
                    }
                  </Button>
                  <Button
                    onClick={() => handleDownload("jpeg")}
                    variant="outline"
                    className="flex-1 gap-1.5 h-9 text-xs font-semibold"
                    disabled={downloading}
                  >
                    {downloading
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> ...</>
                      : <><Download className="w-3 h-3" /> JPEG</>
                    }
                  </Button>
                  <Button
                    onClick={handleDownloadPDF}
                    variant="outline"
                    className="flex-1 gap-1.5 h-9 text-xs font-semibold"
                    disabled={downloading}
                  >
                    {downloading
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> ...</>
                      : <><FileText className="w-3 h-3" /> PDF</>
                    }
                  </Button>
                </div>

                {/* Secondary actions */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={handleGenerate} disabled={downloading}>
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </Button>

                  <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={handleCopyImage} disabled={downloading}>
                    <Copy className="w-3.5 h-3.5" /> Copy
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
                <iframe
                  srcDoc={injectFontsInHtml(htmlCode)}
                  style={{ width: dims.width, height: dims.height, border: "none", background: "#FDFDF9" }}
                  sandbox="allow-same-origin"
                  title="Infographic full view"
                />
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

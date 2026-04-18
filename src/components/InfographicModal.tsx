import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  X, RefreshCw, Download, Sparkles, Check,
  Loader2, Copy, Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import GenerationProgress, { INFOGRAPHIC_STEPS } from "@/components/GenerationProgress";
import {
  buildGeminiImagePrompt,
  buildGeminiRetryPrompt,
  analyzeContent,
  getFormatDimensions,
  selectBestTemplate,
  resetRegenerationCounter,
} from "@/lib/infographic-style";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { assertOnline, friendlyError } from "@/lib/resilience";

const IS_DEV = import.meta.env.DEV;

const FONT_LINK = '<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet">';

function injectFontsInHtml(html: string): string {
  if (html.includes("fonts.googleapis.com")) return html;
  return html.replace("</head>", FONT_LINK + "</head>");
}

// ─── Gemini Image Generation via gemini-2.0-flash-preview-image-generation ───

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-image";

async function generateWithGemini(
  prompt: string,
  _dims: { width: number; height: number },
): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000); // 2 minutes

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      if (IS_DEV) console.error("[InfographicModal] Gemini HTTP", response.status, errorText);
      throw new Error(`Gemini API error (${response.status}). Please try again.`);
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts
      ?.find((p: { inlineData?: { mimeType?: string; data?: string } }) =>
        p.inlineData?.mimeType?.startsWith("image/"));
    const base64 = imagePart?.inlineData?.data;

    if (!base64) {
      if (IS_DEV) console.error("[InfographicModal] Gemini returned no image data:", JSON.stringify(data).slice(0, 500));
      throw new Error("Gemini did not return an image. Please try again.");
    }

    return base64;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Image generation timed out (2 min). Please try again with simpler content.");
    }
    throw err;
  }
}

function wrapBase64AsHtml(base64: string, dims: { width: number; height: number }): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{width:${dims.width}px;height:${dims.height}px;overflow:hidden}</style></head>
<body><img src="data:image/png;base64,${base64}" width="${dims.width}" height="${dims.height}" style="display:block;width:${dims.width}px;height:${dims.height}px;object-fit:contain;" /></body></html>`;
}

// Loading messages moved to GenerationProgress component

// ─── Types ───

interface Props {
  open: boolean;
  onClose: () => void;
  content: string;
  platform: string;
  contentId?: string;        // ID of the parent variation row in generated_content
  sessionId?: string;        // Session ID to link infographic to same generation batch
  existingHtml?: string;     // Pre-generated infographic HTML (skip generation)
  onGenerated?: (html: string) => void; // Callback after successful generation
}

type ResultMode = "claude" | "gemini" | null;
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

export default function InfographicModal({ open, onClose, content, platform, contentId, sessionId, existingHtml, onGenerated }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("ready");
  const [resultMode, setResultMode] = useState<ResultMode>(null);
  const [htmlCode, setHtmlCode] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
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
      setStyleChoice("auto");
      setGenerationError(null);
      setRetryCountdown(0);
      setImageBase64("");
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
    if (step === "result" && (htmlCode || imageBase64)) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 1500);
      return () => clearTimeout(t);
    }
  }, [step, htmlCode, imageBase64]);

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

  // ─── Generation (Gemini Image ONLY — auto-retry with correction prompt) ───

  async function handleGenerate() {
    setStep("generating");
    setHtmlCode("");
    setImageBase64("");
    setResultMode(null);
    setSaved(false);
    setGenerationError(null);
    setRetryCountdown(0);
    if (retryIntervalRef.current) { clearInterval(retryIntervalRef.current); retryIntervalRef.current = null; }
    savedRef.current = false;

    try {
      assertOnline();

      const geminiPrompt = buildGeminiImagePrompt(content, platform, customPrompt || undefined, forcedTemplate);

      // Attempt 1: standard prompt
      if (IS_DEV) console.log("[InfographicModal] Attempt 1 — generating with Gemini...");
      let base64: string | null = null;
      try {
        base64 = await generateWithGemini(geminiPrompt, dims);
      } catch (firstErr) {
        if (IS_DEV) console.warn("[InfographicModal] Attempt 1 failed:", firstErr);

        // Attempt 2: retry with correction prompt
        if (IS_DEV) console.log("[InfographicModal] Attempt 2 — retrying with correction prompt...");
        try {
          const retryPrompt = buildGeminiRetryPrompt(geminiPrompt, 2);
          base64 = await generateWithGemini(retryPrompt, dims);
        } catch (secondErr) {
          if (IS_DEV) console.error("[InfographicModal] Attempt 2 also failed:", secondErr);
          throw secondErr; // propagate the final error
        }
      }

      if (!base64) {
        throw new Error("Image generation failed. Please try again.");
      }

      // Store the raw base64 for direct downloads
      setImageBase64(base64);

      // Also wrap in HTML for iframe preview (backward-compatible display)
      const html = wrapBase64AsHtml(base64, dims);
      setHtmlCode(html);
      setResultMode("gemini");
      setStep("result");

      // Save to Supabase
      await handleSave({ html, image: base64, mode: "gemini" });
    } catch (err) {
      if (IS_DEV) console.error("[InfographicModal] Generation failed:", err);
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

  // ─── Downloads (direct base64 for Gemini images) ───

  function base64ToBlob(b64: string, type: string): Blob {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type });
  }

  async function handleDownload(format: "png" | "jpeg") {
    if (downloading) return;
    setDownloading(true);

    try {
      if (imageBase64) {
        // ── Gemini image path: base64 → direct or canvas conversion ──
        if (format === "png") {
          const link = document.createElement("a");
          link.style.display = "none";
          link.href = `data:image/png;base64,${imageBase64}`;
          link.download = `supen-infographic-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success("PNG downloaded!");
        } else {
          // JPEG: composite over white to avoid transparent-black artifacts
          const img = new Image();
          img.src = `data:image/png;base64,${imageBase64}`;
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load image"));
          });
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas not supported");
          ctx.fillStyle = "#f8f9f7";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const link = document.createElement("a");
          link.style.display = "none";
          link.href = canvas.toDataURL("image/jpeg", 0.95);
          link.download = `supen-infographic-${Date.now()}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success("JPEG downloaded!");
        }
      } else if (htmlCode) {
        // ── HTML fallback path: capture iframe via html2canvas ──
        await new Promise((r) => setTimeout(r, 1500));
        const iframe = iframeRef.current;
        if (!iframe) throw new Error("Iframe not available");
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) throw new Error("Cannot access iframe content");

        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(iframeDoc.documentElement, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#f8f9f7",
          scale: 2,
          logging: false,
        });

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
      } else {
        toast.error("Nothing to download yet");
      }
    } catch (err) {
      if (IS_DEV) console.error("[InfographicModal] Download error:", err);
      toast.error("Download failed — try again");
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopyImage() {
    if (!imageBase64) return;
    setDownloading(true);
    try {
      const blob = base64ToBlob(imageBase64, "image/png");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Image copied!");
    } catch {
      toast.error("Copy failed — your browser may not support this.");
    }
    setDownloading(false);
  }

  // ─── Save ───
  // Called EXPLICITLY from handleGenerate after a verified success.
  // Accepts fresh data via opts to avoid stale React state closures.
  // savedRef provides synchronous duplicate protection.

  async function handleSave(opts?: { html?: string; image?: string; mode?: "claude" | "gemini" }) {
    if (!user) return;
    if (savedRef.current) return;

    const html = opts?.html ?? htmlCode;
    const image = opts?.image ?? imageBase64;
    const mode = opts?.mode ?? resultMode ?? "gemini";
    if (!html && !image) {
      if (IS_DEV) console.warn("[InfographicModal] handleSave bailed — no html/image");
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
            infographic_base64: image || null,
            infographic_mode: mode,
            infographic_generated_at: new Date().toISOString(),
          })
          .eq("id", contentId);
        error = res.error;
      } else {
        // INSERT as a separate infographic row linked to the same session
        const res = await supabase.from("generated_content").insert({
          user_id: user.id,
          platform,
          format: "Infographic",
          content: `[INFOGRAPHIC] ${content.slice(0, 200)}`,
          viral_score: 85,
          image_prompt: "Generated infographic",
          infographic_html: html,
          infographic_base64: image || null,
          infographic_mode: mode,
          parent_content: content,
          session_id: sessionId || null,
        });
        error = res.error;
      }

      if (error) {
        if (IS_DEV) console.error("[InfographicModal] Supabase save error:", error.message, error.details, error.hint);
        toast.error(`Save error: ${error.message}`);
        savedRef.current = false;
      } else {
        setSaved(true);
        toast.success("Infographic saved!");
        if (onGenerated && html) onGenerated(html);
      }
    } catch (err) {
      if (IS_DEV) console.error("[InfographicModal] Network/unexpected error:", err);
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
                {step === "generating" && "This may take up to 2 minutes — don't close this window"}
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
                  {retryCountdown > 0 ? `Retry in ${retryCountdown}s...` : `Generate ${styleChoice === "auto" ? templateSelection.templateId : styleChoice} infographic →`}
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
                      <GenerationProgress isActive={step === "generating"} steps={INFOGRAPHIC_STEPS} estimatedSeconds={100} />
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
                    Preparing download...
                  </p>
                )}

                {/* Primary actions — PNG + JPEG download */}
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

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
  buildDallEPrompt,
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

// ─── Platform-specific image sizes ───

interface ImageSizeConfig {
  size: "1024x1024" | "1024x1792" | "1792x1024";
  label: string;
  description: string;
}

function getImageSize(platform: string): ImageSizeConfig {
  const p = platform?.toLowerCase() || "";

  if (p.includes("linkedin")) {
    return { size: "1024x1792", label: "A4 Portrait", description: "Optimized for LinkedIn — more content space" };
  }
  if (p.includes("facebook")) {
    return { size: "1024x1024", label: "Square", description: "Optimized for Facebook feed" };
  }
  if (p.includes("instagram")) {
    return { size: "1024x1792", label: "Portrait 4:5", description: "Optimized for Instagram" };
  }
  if (p.includes("tiktok")) {
    return { size: "1024x1792", label: "Vertical 9:16", description: "Optimized for TikTok" };
  }
  if (p.includes("twitter") || p.includes("x (")) {
    return { size: "1792x1024", label: "Landscape", description: "Optimized for X/Twitter" };
  }
  return { size: "1024x1792", label: "Portrait", description: "Standard portrait format" };
}

// ─── DALL-E 3 Image Generation via Edge Function (avoids CORS) ───

async function generateWithOpenAI(
  prompt: string,
  imageSize: ImageSizeConfig,
): Promise<string> {
  console.log("[Infographic] Calling DALL-E 3 via Edge Function...");
  console.log("[Infographic] Size:", imageSize.size, imageSize.label);
  console.log("[Infographic] Prompt length:", prompt.length);

  const { data, error } = await supabase.functions.invoke("generate-image", {
    body: { prompt, size: imageSize.size, quality: "high" },
  });

  if (error) {
    console.error("[Infographic] Edge Function error:", error);
    throw new Error(error.message || "Image generation failed. Please try again.");
  }

  if (data?.error) {
    console.error("[Infographic] API error:", data.error);
    throw new Error(data.error);
  }

  const base64 = data?.image;
  if (!base64) {
    throw new Error("No image returned from DALL-E 3. Please try again.");
  }

  console.log("[Infographic] Generated! Size:", base64.length);
  return base64;
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
  onGenerated?: (html: string, base64?: string) => void; // Callback after successful generation
}

type ResultMode = "claude" | "openai" | null;
type Step = "ready" | "generating" | "result";
type StyleChoice = "auto" | "AWA_CLASSIC" | "UI_CARDS" | "WHITEBOARD" | "FUNNEL" | "DATA_GRID" | "PROCESS_STEPS" | "COMMAND_CENTER" | "ICON_GRID" | "EDITORIAL_LIST" | "CTA_VISUAL";

// Tiny inline SVG previews — schematic mini-mockups (60×40 viewBox).
const STYLE_PREVIEWS: Record<StyleChoice, JSX.Element> = {
  auto: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="2" y="2" width="56" height="36" rx="4" fill="url(#auto-grad)" />
      <defs>
        <linearGradient id="auto-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF7A59" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path d="M30 12 L32 18 L38 18 L33 22 L35 28 L30 24 L25 28 L27 22 L22 18 L28 18 Z" fill="#FF7A59" />
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
      <rect x="6" y="2.5" width="34" height="3" rx="0.4" fill="#1F2937" />
      <rect x="42" y="2.7" width="12" height="2.5" rx="1" fill="#EBF5FB" />
      <rect x="4" y="9.5" width="52" height="7" rx="1.5" fill="#FFB3B3" />
      <rect x="4" y="18.5" width="52" height="7" rx="1.5" fill="#FFD4A3" />
      <rect x="4" y="27.5" width="52" height="7" rx="1.5" fill="#B3FFD1" />
      <rect x="0" y="36" width="60" height="4" fill="#F8F9FA" />
      <rect x="22" y="37.5" width="16" height="1.2" rx="0.3" fill="#FF7A59" />
    </svg>
  ),
  WHITEBOARD: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="0" y="0" width="60" height="40" fill="#f8f9f7" />
      <rect x="6" y="2.5" width="34" height="3" rx="0.4" fill="#1F2937" />
      <rect x="4" y="9.5" width="52" height="7" rx="1.5" fill="#AEC6CF" />
      <rect x="4" y="18.5" width="52" height="7" rx="1.5" fill="#FFD4A3" />
      <rect x="4" y="27.5" width="52" height="7" rx="1.5" fill="#B3FFD1" />
      <rect x="2" y="2" width="3" height="5" rx="0.5" fill="#aaa" />
      <rect x="55" y="2" width="3" height="5" rx="0.5" fill="#aaa" />
      <rect x="2" y="33" width="3" height="5" rx="0.5" fill="#aaa" />
      <rect x="55" y="33" width="3" height="5" rx="0.5" fill="#aaa" />
    </svg>
  ),
  FUNNEL: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="0" y="0" width="60" height="40" fill="#FFFFFF" />
      <rect x="6" y="2.5" width="34" height="3" rx="0.4" fill="#1F2937" />
      <polygon points="5,10 55,10 45,20 15,20" fill="#FFB3B3" />
      <polygon points="15,21 45,21 40,30 20,30" fill="#FFD4A3" />
      <polygon points="20,31 40,31 35,38 25,38" fill="#B3FFD1" />
    </svg>
  ),
  DATA_GRID: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="0" y="0" width="60" height="40" fill="#FFFFFF" />
      <rect x="6" y="2.5" width="34" height="3" rx="0.4" fill="#1F2937" />
      <rect x="4" y="9.5" width="52" height="7" rx="1.5" fill="#AEC6CF" />
      <circle cx="8" cy="13" r="0.9" fill="#1F2937" />
      <rect x="4" y="18.5" width="52" height="7" rx="1.5" fill="#D4B3FF" />
      <circle cx="8" cy="22" r="0.9" fill="#1F2937" />
      <rect x="4" y="27.5" width="52" height="7" rx="1.5" fill="#B3FFD1" />
      <circle cx="8" cy="31" r="0.9" fill="#1F2937" />
    </svg>
  ),
  // ── New SaaS templates ──
  PROCESS_STEPS: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="0" y="0" width="60" height="40" fill="#F7F3F0" />
      <rect x="6" y="2" width="28" height="3" rx="0.5" fill="#1A1A1B" />
      <rect x="4" y="8" width="24" height="7" rx="2" fill="#FF7A59" />
      <rect x="32" y="8" width="24" height="7" rx="2" fill="#FF7A59" opacity="0.7" />
      <path d="M29 11.5 L31 11.5" stroke="#FF7A59" strokeWidth="1" />
      <rect x="4" y="18" width="24" height="7" rx="2" fill="#FF7A59" opacity="0.5" />
      <rect x="32" y="18" width="24" height="7" rx="2" fill="#FF7A59" opacity="0.3" />
      <path d="M29 21.5 L31 21.5" stroke="#FF7A59" strokeWidth="1" />
      <rect x="4" y="28" width="52" height="7" rx="2" fill="#1A1A1B" opacity="0.1" />
      <circle cx="8" cy="11.5" r="2" fill="#fff" />
      <text x="8" y="12.5" fontSize="2.5" fill="#FF7A59" textAnchor="middle" fontWeight="900">1</text>
    </svg>
  ),
  COMMAND_CENTER: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="0" y="0" width="60" height="40" fill="#FFFFFF" />
      <rect x="6" y="2" width="30" height="3" rx="0.5" fill="#1A1A1B" />
      <rect x="4" y="8" width="8" height="4" rx="1.5" fill="#FF7A59" />
      <rect x="14" y="9" width="40" height="2" rx="0.5" fill="#E5E7EB" />
      <rect x="4" y="15" width="8" height="4" rx="1.5" fill="#FF7A59" />
      <rect x="14" y="16" width="36" height="2" rx="0.5" fill="#E5E7EB" />
      <rect x="4" y="22" width="8" height="4" rx="1.5" fill="#FF7A59" />
      <rect x="14" y="23" width="42" height="2" rx="0.5" fill="#E5E7EB" />
      <rect x="4" y="29" width="8" height="4" rx="1.5" fill="#FF7A59" />
      <rect x="14" y="30" width="32" height="2" rx="0.5" fill="#E5E7EB" />
    </svg>
  ),
  ICON_GRID: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="0" y="0" width="60" height="40" fill="#FFFFFF" />
      <rect x="12" y="1" width="36" height="3" rx="0.5" fill="#1A1A1B" />
      <rect x="3" y="7" width="17" height="14" rx="2" fill="#FFF0EB" stroke="#FF7A59" strokeWidth="0.3" />
      <circle cx="11.5" cy="11" r="2" fill="#FF7A59" />
      <rect x="21.5" y="7" width="17" height="14" rx="2" fill="#FFF0EB" stroke="#FF7A59" strokeWidth="0.3" />
      <circle cx="30" cy="11" r="2" fill="#FF7A59" />
      <rect x="40" y="7" width="17" height="14" rx="2" fill="#FFF0EB" stroke="#FF7A59" strokeWidth="0.3" />
      <circle cx="48.5" cy="11" r="2" fill="#FF7A59" />
      <rect x="3" y="23" width="17" height="14" rx="2" fill="#FFF0EB" stroke="#FF7A59" strokeWidth="0.3" />
      <circle cx="11.5" cy="27" r="2" fill="#FF7A59" />
      <rect x="21.5" y="23" width="17" height="14" rx="2" fill="#FFF0EB" stroke="#FF7A59" strokeWidth="0.3" />
      <circle cx="30" cy="27" r="2" fill="#FF7A59" />
      <rect x="40" y="23" width="17" height="14" rx="2" fill="#FFF0EB" stroke="#FF7A59" strokeWidth="0.3" />
      <circle cx="48.5" cy="27" r="2" fill="#FF7A59" />
    </svg>
  ),
  EDITORIAL_LIST: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="0" y="0" width="60" height="40" fill="#F7F3F0" />
      <rect x="6" y="2" width="30" height="3" rx="0.5" fill="#1A1A1B" />
      <text x="6" y="13" fontSize="5" fill="#FF7A59" fontWeight="900">01</text>
      <rect x="16" y="10" width="38" height="2" rx="0.4" fill="#1A1A1B" opacity="0.6" />
      <line x1="4" y1="16" x2="56" y2="16" stroke="#E5E7EB" strokeWidth="0.3" />
      <text x="6" y="23" fontSize="5" fill="#FF7A59" fontWeight="900">02</text>
      <rect x="16" y="20" width="34" height="2" rx="0.4" fill="#1A1A1B" opacity="0.6" />
      <line x1="4" y1="26" x2="56" y2="26" stroke="#E5E7EB" strokeWidth="0.3" />
      <text x="6" y="33" fontSize="5" fill="#FF7A59" fontWeight="900">03</text>
      <rect x="16" y="30" width="40" height="2" rx="0.4" fill="#1A1A1B" opacity="0.6" />
    </svg>
  ),
  CTA_VISUAL: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="0" y="0" width="60" height="40" fill="#F0F0F0" />
      {/* Grid lines */}
      <line x1="0" y1="10" x2="60" y2="10" stroke="#ddd" strokeWidth="0.2" />
      <line x1="0" y1="20" x2="60" y2="20" stroke="#ddd" strokeWidth="0.2" />
      <line x1="0" y1="30" x2="60" y2="30" stroke="#ddd" strokeWidth="0.2" />
      <line x1="15" y1="0" x2="15" y2="40" stroke="#ddd" strokeWidth="0.2" />
      <line x1="30" y1="0" x2="30" y2="40" stroke="#ddd" strokeWidth="0.2" />
      <line x1="45" y1="0" x2="45" y2="40" stroke="#ddd" strokeWidth="0.2" />
      <rect x="8" y="2" width="44" height="4" rx="0.5" fill="#1A1A1B" />
      <circle cx="30" cy="20" r="5" fill="#FF7A59" />
      <text x="30" y="21.5" fontSize="4" fill="#fff" textAnchor="middle" fontWeight="900">*</text>
      <rect x="6" y="12" width="14" height="5" rx="1.5" fill="#4A90D9" opacity="0.7" />
      <rect x="40" y="12" width="14" height="5" rx="1.5" fill="#4A90D9" opacity="0.7" />
      <rect x="6" y="27" width="14" height="5" rx="1.5" fill="#4A90D9" opacity="0.7" />
      <rect x="40" y="27" width="14" height="5" rx="1.5" fill="#4A90D9" opacity="0.7" />
      <line x1="20" y1="14.5" x2="25" y2="18" stroke="#999" strokeWidth="0.3" strokeDasharray="1" />
      <line x1="40" y1="14.5" x2="35" y2="18" stroke="#999" strokeWidth="0.3" strokeDasharray="1" />
      <line x1="20" y1="29.5" x2="25" y2="22" stroke="#999" strokeWidth="0.3" strokeDasharray="1" />
      <line x1="40" y1="29.5" x2="35" y2="22" stroke="#999" strokeWidth="0.3" strokeDasharray="1" />
    </svg>
  ),
};

const STYLE_OPTIONS: { id: StyleChoice; label: string; desc: string }[] = [
  { id: "auto", label: "Auto", desc: "AI picks" },
  { id: "PROCESS_STEPS", label: "Process", desc: "Step-by-step" },
  { id: "COMMAND_CENTER", label: "Command", desc: "Terminal style" },
  { id: "ICON_GRID", label: "Icon Grid", desc: "Bento grid" },
  { id: "EDITORIAL_LIST", label: "Editorial", desc: "Magazine list" },
  { id: "CTA_VISUAL", label: "CTA Visual", desc: "Indie hacker" },
  { id: "WHITEBOARD", label: "Whiteboard", desc: "Hand-drawn" },
  { id: "NOTEBOOK", label: "Notebook", desc: "Spiral notes" },
  { id: "COMPARISON", label: "Comparison", desc: "Dark table" },
  { id: "FUNNEL", label: "Funnel", desc: "Process flow" },
  { id: "DATA_GRID", label: "Data Grid", desc: "Framework" },
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
  const imageConfig = getImageSize(platform);
  const aspectRatio = dims.height / dims.width;
  // Scale infographic to fit ~480px wide modal content area
  const previewWidth = 480;
  const iframeScale = previewWidth / dims.width;

  // ─── Generation (DALL-E 3 via Edge Function — with retry) ───

  // Key is server-side (Edge Function secret), no client-side check needed
  const hasOpenAIKey = true;

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

      const dallePrompt = buildDallEPrompt(content, platform, forcedTemplate);

      if (IS_DEV) {
        console.log("=== DALL-E PROMPT ===");
        console.log(dallePrompt.slice(0, 500));
        console.log("=== END PROMPT ===");
      }

      // Attempt 1
      if (IS_DEV) console.log("[InfographicModal] Attempt 1 — generating with DALL-E 3...");
      let base64: string | null = null;
      try {
        base64 = await generateWithOpenAI(dallePrompt, imageConfig);
      } catch (firstErr) {
        if (IS_DEV) console.warn("[InfographicModal] Attempt 1 failed:", firstErr);

        // Attempt 2: retry with simplified prompt
        if (IS_DEV) console.log("[InfographicModal] Attempt 2 — retrying...");
        try {
          base64 = await generateWithOpenAI(dallePrompt + "\n\nIMPORTANT: Generate a clean, readable infographic. All text in English. No footer or watermark.", imageConfig);
        } catch (secondErr) {
          if (IS_DEV) console.error("[InfographicModal] Attempt 2 also failed:", secondErr);
          throw secondErr;
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
      setResultMode("openai");
      setStep("result");

      // Save to Supabase
      await handleSave({ html, image: base64, mode: "openai" });
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

  // ─── Downloads (direct base64 for DALL-E images) ───

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
        // ── DALL-E image path: base64 → direct or canvas conversion ──
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

  async function handleSave(opts?: { html?: string; image?: string; mode?: "claude" | "openai" }) {
    if (!user) return;
    if (savedRef.current) return;

    const html = opts?.html ?? htmlCode;
    const image = opts?.image ?? imageBase64;
    const mode = opts?.mode ?? resultMode ?? "openai";
    if (!html && !image) {
      if (IS_DEV) console.warn("[InfographicModal] handleSave bailed — no html/image");
      return;
    }

    savedRef.current = true;
    setSaving(true);

    try {
      let error: { message: string; details?: string; hint?: string } | null = null;

      if (contentId) {
        // UPDATE the parent variation row — try with new columns first
        let res = await supabase
          .from("generated_content")
          .update({
            infographic_html: html,
            infographic_base64: image || null,
            infographic_mode: mode,
            infographic_generated_at: new Date().toISOString(),
          })
          .eq("id", contentId);

        // Fallback 1: keep infographic_base64, drop mode
        if (res.error) {
          res = await supabase
            .from("generated_content")
            .update({
              infographic_html: html,
              infographic_base64: image || null,
              infographic_generated_at: new Date().toISOString(),
            })
            .eq("id", contentId);
        }

        // Fallback 2: only HTML
        if (res.error) {
          res = await supabase
            .from("generated_content")
            .update({
              infographic_html: html,
              infographic_generated_at: new Date().toISOString(),
            })
            .eq("id", contentId);
        }
        error = res.error;
      } else {
        // INSERT as a separate infographic row — try with all columns
        let res = await supabase.from("generated_content").insert({
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

        // Fallback 1: keep session_id + infographic_base64, drop other new cols
        if (res.error) {
          res = await supabase.from("generated_content").insert({
            user_id: user.id,
            platform,
            format: "Infographic",
            content: `[INFOGRAPHIC] ${content.slice(0, 200)}`,
            viral_score: 85,
            image_prompt: "Generated infographic",
            infographic_base64: image || null,
            session_id: sessionId || null,
          });
        }

        // Fallback 2: keep session_id only
        if (res.error) {
          res = await supabase.from("generated_content").insert({
            user_id: user.id,
            platform,
            format: "Infographic",
            content: html,
            viral_score: 85,
            image_prompt: "Generated infographic",
            session_id: sessionId || null,
          });
        }

        // Fallback 3: bare minimum
        if (res.error) {
          res = await supabase.from("generated_content").insert({
            user_id: user.id,
            platform,
            format: "Infographic",
            content: html,
            viral_score: 85,
            image_prompt: "Generated infographic",
          });
        }
        error = res.error;
      }

      if (error) {
        if (IS_DEV) console.error("[InfographicModal] Supabase save error:", error.message, error.details, error.hint);
        toast.error(`Save error: ${error.message}`);
        savedRef.current = false;
      } else {
        setSaved(true);
        toast.success("Infographic saved!");
        if (onGenerated && html) onGenerated(html, image || undefined);
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

                {/* Platform format indicator */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Format:</span>
                  <span className="px-2 py-0.5 rounded-full bg-accent/30 font-medium">{imageConfig.label}</span>
                  <span className="text-muted-foreground/60">{imageConfig.description}</span>
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

                {/* API key warning — only shown if server-side key missing (will show after failed generation) */}

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

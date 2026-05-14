import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  X, RefreshCw, Download, Sparkles, Check,
  Loader2, Copy, Maximize2, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import GenerationProgress, { INFOGRAPHIC_STEPS } from "@/components/GenerationProgress";
import {
  buildDallEPrompt,
  analyzeContent,
  getFormatDimensions,
  resetRegenerationCounter,
  distillInfographicContent,
  buildInfographicPrompt,
} from "@/lib/infographic-style";
import { callClaude } from "@/lib/anthropic";
import { sanitizeForPlatform } from "@/lib/output-sanitizer";
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
  size: "1024x1024" | "1536x1024" | "1024x1536";
  label: string;
  description: string;
}

function getImageSize(platform: string): ImageSizeConfig {
  const p = platform?.toLowerCase() || "";

  if (p.includes("twitter") || p.includes("x (")) {
    return { size: "1536x1024", label: "Landscape", description: "Optimized for X/Twitter" };
  }
  if (p.includes("facebook")) {
    return { size: "1024x1024", label: "Square", description: "Optimized for Facebook" };
  }
  // LinkedIn, Instagram, TikTok, default → portrait 4:5
  return { size: "1024x1344", label: "Portrait", description: `Optimized for ${platform || "social media"}` };
}

// ─── Image Generation via Edge Function ───

async function generateInfographic(prompt: string, size: string = "1024x1024"): Promise<string> {
  if (IS_DEV) console.log("[Infographic] Calling Gemini Nano Banana Edge Function with size:", size);
  if (IS_DEV) console.log("[Infographic] Prompt length:", prompt.length);

  const { data, error } = await supabase.functions.invoke("generate-gemini-image", {
    body: { prompt, size, isRawContent: true },
  });

  if (error) {
    console.error("[Infographic] Edge Function error object:", error);
    
    // Supabase error objects often contain the response body in the message
    let msg = "Image generation failed. Please try again.";
    try {
      // If it's a stringified JSON error from our function
      if (typeof error.message === 'string' && (error.message.includes('{') || error.message.includes('code'))) {
        msg = error.message;
      }
    } catch {
      msg = error.message || msg;
    }
    
    throw new Error(msg);
  }

  if (data?.error) {
    console.error("[Infographic] API error in data:", data.error);
    throw new Error(data.error);
  }

  // Support both HTML and direct image responses
  if (data?.html) {
    if (IS_DEV) console.log("[Infographic] Got HTML, length:", data.html.length);
    return data.html; // Caller handles HTML→image conversion if needed
  }

  const base64 = data?.image;
  if (!base64) {
    throw new Error("No image returned. Please try again.");
  }

  if (IS_DEV) console.log("[Infographic] Generated! Size:", base64.length);
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
type StyleChoice = "auto" | "AWA_CLASSIC" | "UI_CARDS" | "WHITEBOARD" | "FUNNEL" | "DATA_GRID" | "PROCESS_STEPS" | "COMMAND_CENTER" | "ICON_GRID" | "EDITORIAL_LIST" | "CTA_VISUAL" | "NOTEBOOK" | "COMPARISON";

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
  NOTEBOOK: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="0" y="0" width="60" height="40" fill="#FFFEF8" />
      {[...Array(11)].map((_, i) => (
        <circle key={i} cx={5 + i * 5} cy="3" r="1.4" fill="#a39581" />
      ))}
      <line x1="9" y1="6" x2="9" y2="40" stroke="#E63946" strokeWidth="0.4" />
      <line x1="0" y1="11" x2="60" y2="11" stroke="#dde8f0" strokeWidth="0.2" />
      <line x1="0" y1="17" x2="60" y2="17" stroke="#dde8f0" strokeWidth="0.2" />
      <line x1="0" y1="23" x2="60" y2="23" stroke="#dde8f0" strokeWidth="0.2" />
      <line x1="0" y1="29" x2="60" y2="29" stroke="#dde8f0" strokeWidth="0.2" />
      <line x1="0" y1="35" x2="60" y2="35" stroke="#dde8f0" strokeWidth="0.2" />
      <text x="12" y="14" fontSize="3.2" fontWeight="700" fill="#4A8B35">9</text>
      <text x="17" y="14" fontSize="3.2" fontWeight="700" fill="#C0392B">FREE</text>
      <text x="29" y="14" fontSize="3.2" fontWeight="700" fill="#1a3d7c">COURSES</text>
      <rect x="11" y="20" width="44" height="2" rx="0.4" fill="#2563EB" opacity="0.7" />
      <rect x="11" y="26" width="44" height="2" rx="0.4" fill="#4A8B35" opacity="0.7" />
      <rect x="11" y="32" width="44" height="2" rx="0.4" fill="#C0392B" opacity="0.7" />
    </svg>
  ),
  COMPARISON: (
    <svg viewBox="0 0 60 40" className="w-full h-full">
      <rect x="0" y="0" width="60" height="40" fill="#F5F5F0" />
      <rect x="3" y="2" width="54" height="3.5" rx="0.4" fill="#1A1A1B" />
      <line x1="22" y1="7" x2="22" y2="38" stroke="#cccccc" strokeWidth="0.3" />
      <line x1="40" y1="7" x2="40" y2="38" stroke="#cccccc" strokeWidth="0.3" />
      <rect x="5" y="9" width="15" height="2" rx="0.3" fill="#2563EB" />
      <rect x="24" y="9" width="14" height="2" rx="0.3" fill="#4A8B35" />
      <rect x="42" y="9" width="14" height="2" rx="0.3" fill="#C0392B" />
      <rect x="5" y="13" width="15" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
      <rect x="5" y="16" width="15" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
      <rect x="5" y="19" width="13" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
      <rect x="5" y="24" width="15" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
      <rect x="5" y="27" width="14" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
      <rect x="24" y="13" width="14" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
      <rect x="24" y="16" width="14" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
      <rect x="24" y="19" width="12" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
      <rect x="24" y="24" width="14" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
      <rect x="24" y="27" width="13" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
      <rect x="42" y="13" width="14" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
      <rect x="42" y="16" width="14" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
      <rect x="42" y="19" width="12" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
      <rect x="42" y="24" width="14" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
      <rect x="42" y="27" width="13" height="1.4" rx="0.2" fill="#1A1A1B" opacity="0.4" />
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
  const [userName, setUserName] = useState("");
  const [showCustomGen, setShowCustomGen] = useState(false);
  const [customGenPrompt, setCustomGenPrompt] = useState("");
  const [customGenImage, setCustomGenImage] = useState<string | null>(null);
  const [customGenLoading, setCustomGenLoading] = useState(false);

  // Get user name for infographic footer
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUserName(u?.user_metadata?.full_name || u?.user_metadata?.name || u?.email?.split("@")[0] || "");
    }).catch(() => {});
  }, []);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [generationCount, setGenerationCount] = useState(0);
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

  const analysis = analyzeContent(content, platform);
  const dims = getFormatDimensions(analysis.format);
  // Force WHITEBOARD style always — no template switching
  const templateSelection = { templateId: "WHITEBOARD" as const, reason: "Forced whiteboard style" };
  const imageConfig = getImageSize(platform);
  const aspectRatio = dims.height / dims.width;
  // Scale infographic to fit ~480px wide modal content area
  const previewWidth = 480;
  const iframeScale = previewWidth / dims.width;

  // ─── Generation (Edge Function — with retry) ───
  // Key is server-side (Gemini Nano Banana secret), no client-side check needed.

  async function handleGenerate() {
    setStep("generating");
    setHtmlCode("");
    setImageBase64("");
    setResultMode(null);
    setSaved(false);
    setGenerationError(null);
    setRetryCountdown(0);
    setGenerationCount(prev => prev + 1);
    if (retryIntervalRef.current) { clearInterval(retryIntervalRef.current); retryIntervalRef.current = null; }
    savedRef.current = false;

    try {
      assertOnline();

      if (IS_DEV) console.log("[Infographic] Content length:", content.length);
      const template = styleChoice === "auto" ? templateSelection.templateId : styleChoice;

      // STEP 1: EXTRACT content (simple extraction, no hallucination)
      const distilled = await distillInfographicContent(content, platform || "LinkedIn", callClaude);

      // STEP 2: BUILD PROMPT (with content, direct to image model)
      const cleanContent = sanitizeForPlatform(content, platform || "", "Post");
      const imagePrompt = buildDallEPrompt(cleanContent, platform, template, userName, distilled);

      // STEP 3: GENERATE IMAGE (direct — no Architect middle-layer)
      if (IS_DEV) console.log("[Infographic] Generating infographic image...");
      
      const base64 = await generateInfographic(imagePrompt, imageConfig.size);
      setImageBase64(base64);

      // Wrap image as HTML for storage/display
      const html = wrapBase64AsHtml(base64, dims);
      setHtmlCode(html);

      // Show image result
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

  // ─── Downloads (resized to exact platform dimensions) ───

  function base64ToBlob(b64: string, type: string): Blob {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type });
  }

  function getDownloadDims(): { w: number; h: number; label: string } {
    const pl = platform?.toLowerCase() || "";
    if (pl.includes("facebook")) return { w: 1024, h: 1024, label: "facebook-square" };
    if (pl.includes("twitter") || pl.includes("x (")) return { w: 1792, h: 1024, label: "x-landscape" };
    return { w: 1024, h: 1344, label: "linkedin-portrait" };
  }

  async function handleDownload(format: "png" | "jpeg") {
    if (downloading) return;
    setDownloading(true);

    try {
      if (imageBase64) {
        const { w, h, label } = getDownloadDims();
        const img = new Image();
        img.src = `data:image/png;base64,${imageBase64}`;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
        });

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported");

        if (format === "jpeg") {
          ctx.fillStyle = "#FAF9F6";
          ctx.fillRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);

        const link = document.createElement("a");
        link.style.display = "none";
        if (format === "png") {
          link.href = canvas.toDataURL("image/png", 1.0);
          link.download = `supenli-${label}-${Date.now()}.png`;
        } else {
          link.href = canvas.toDataURL("image/jpeg", 0.95);
          link.download = `supenli-${label}-${Date.now()}.jpg`;
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`${format.toUpperCase()} downloaded!`);
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
          const { label: dlLabel } = getDownloadDims();
          link.href = canvas.toDataURL("image/jpeg", 0.95);
          link.download = `supenli-${dlLabel}-${Date.now()}.jpg`;
        } else {
          const { label: dlLabel } = getDownloadDims();
          link.href = canvas.toDataURL("image/png");
          link.download = `supenli-${dlLabel}-${Date.now()}.png`;
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

  // ─── Custom Image Generation ───

  async function generateCustomImage() {
    if (!customGenPrompt.trim()) return;
    setCustomGenLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-gemini-image", {
        body: { prompt: customGenPrompt.trim(), size: "1024x1024", isRawContent: false },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.image) {
        setCustomGenImage(data.image);
        toast.success("Image generated!");
      }
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setCustomGenLoading(false);
    }
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
                    <div className="w-full max-w-xs text-center">
                      <p className="text-[10px] uppercase tracking-widest text-primary/60 font-bold mb-4 animate-pulse">
                        Architect: Pushing the thinking...
                      </p>
                      <GenerationProgress isActive={step === "generating"} steps={INFOGRAPHIC_STEPS} estimatedSeconds={100} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ State 3: Result ═══ */}
            {step === "result" && (
              <div className="space-y-4">
                {/* View Mode Toggle */}
                <div className="flex justify-center">
                  <div className="inline-flex p-1 bg-accent/30 rounded-xl border border-border/20">
                    <button
                      onClick={() => setResultMode("openai")}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                        resultMode === "openai" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Creative (AI Image)
                    </button>
                    <button
                      onClick={() => setResultMode("claude")}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                        resultMode === "claude" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Perfect (AI Text)
                    </button>
                  </div>
                </div>

                {/* Infographic Preview Area */}
                <div className="relative group">
                  <div
                    className={cn(
                      "rounded-xl overflow-hidden border border-border/30 bg-white transition-all shadow-lg relative",
                      showZoom && "fixed inset-10 z-[60] bg-white flex items-center justify-center p-8 overflow-auto"
                    )}
                    style={!showZoom ? { paddingBottom: `${aspectRatio * 100}%` } : {}}
                  >
                    <div className={cn(!showZoom && "absolute inset-0")}>
                      {resultMode === "openai" ? (
                        imageBase64 ? (
                          <img
                            src={`data:image/png;base64,${imageBase64}`}
                            className="w-full h-full object-contain"
                            alt="Generated infographic"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground bg-accent/10 p-10 text-center">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-xs">Image loading... If it takes too long, switch to Perfect mode.</p>
                          </div>
                        )
                      ) : (
                        <iframe
                          ref={iframeRef}
                          srcDoc={htmlCode}
                          className="w-full h-full border-0"
                          style={showZoom ? { width: dims.width, height: dims.height, maxWidth: '100%', maxHeight: '100%' } : { transform: `scale(${iframeScale})`, transformOrigin: "top left", width: dims.width, height: dims.height }}
                          title="Infographic Preview"
                          sandbox="allow-popups allow-scripts allow-same-origin"
                        />
                      )}
                    </div>
                  </div>

                  {/* Zoom overlay */}
                  <button
                    onClick={() => setShowZoom(!showZoom)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title={showZoom ? "Close zoom" : "Full screen"}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* ═══ Custom Image Generator (Repositioned for high visibility) ═══ */}
                {!showCustomGen ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-primary/[0.03] border border-primary/10 backdrop-blur-md mb-4 group hover:bg-primary/[0.06] transition-all cursor-pointer"
                    onClick={() => setShowCustomGen(true)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Not satisfied with the result?</p>
                          <p className="text-[11px] text-muted-foreground">Describe your own vision and regenerate in seconds.</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4 p-5 rounded-2xl bg-accent/20 border border-primary/20 mb-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <p className="text-sm font-bold">Custom Magic Prompt</p>
                      </div>
                      <button 
                        onClick={() => setShowCustomGen(false)}
                        className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    <div className="relative">
                      <textarea
                        value={customGenPrompt}
                        onChange={(e) => setCustomGenPrompt(e.target.value)}
                        placeholder="E.g., A minimalist black and white version with bold typography and technical diagrams..."
                        className="w-full h-24 p-4 text-sm bg-background/50 border border-border/30 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-muted-foreground/30 transition-all"
                      />
                      <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground/50">
                        {customGenPrompt.length} chars
                      </div>
                    </div>

                    <Button 
                      className="w-full h-11 text-sm font-bold gap-2 shadow-lg shadow-primary/10" 
                      onClick={generateCustomImage} 
                      disabled={customGenLoading || !customGenPrompt.trim()}
                    >
                      {customGenLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Transmuting your vision...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Generate Custom Visual</>
                      )}
                    </Button>

                    {customGenImage && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 pt-2 border-t border-border/20"
                      >
                        <div className="relative group rounded-xl overflow-hidden border border-border/30">
                          <img src={`data:image/png;base64,${customGenImage}`} alt="Custom" className="w-full h-auto" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <p className="text-white text-xs font-bold">Custom Result ✨</p>
                          </div>
                        </div>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="w-full h-10 text-xs gap-2 font-bold bg-white/10 hover:bg-white/20 border-white/5" 
                          onClick={async () => {
                            const { w, h, label } = getDownloadDims();
                            const img = new Image();
                            img.src = `data:image/png;base64,${customGenImage}`;
                            await new Promise<void>((resolve) => { img.onload = () => resolve(); });
                            const canvas = document.createElement("canvas");
                            canvas.width = w;
                            canvas.height = h;
                            const ctx = canvas.getContext("2d");
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, w, h);
                              const link = document.createElement("a");
                              link.download = `supenli-custom-${label}-${Date.now()}.png`;
                              link.href = canvas.toDataURL("image/png", 1.0);
                              link.click();
                            }
                            toast.success("Custom design downloaded!");
                          }}
                        >
                          <Download className="w-4 h-4" /> Download This Custom Version
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

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
                  {generationCount < 2 ? (
                    <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={handleGenerate} disabled={downloading}>
                      <RefreshCw className="w-3.5 h-3.5" /> Regenerate ({2 - generationCount} left)
                    </Button>
                  ) : (
                    <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      Automatic credits exhausted. Use custom prompt below.
                    </div>
                  )}

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

                {/* Custom prompt (collapsed or forced open) */}
                <button 
                  onClick={() => setShowPrompt(!showPrompt)} 
                  className={cn(
                    "text-xs transition-colors mb-2",
                    generationCount >= 2 ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {showPrompt ? "Hide custom instructions" : "Custom instructions"}
                  {generationCount >= 2 && !showPrompt && " (Required for further changes)"}
                </button>
                {(showPrompt || generationCount >= 2) && (
                  <div className="space-y-2">
                    <Textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="E.g. use dark theme, change the title, add more sections..."
                      className="text-xs min-h-[60px] resize-none border-primary/20"
                    />
                    <Button size="sm" className="h-8 text-xs gap-1.5 w-full md:w-auto" onClick={handleGenerate}>
                      <Sparkles className="w-3 h-3" /> Generate with custom instructions
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
                  sandbox="allow-popups"
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

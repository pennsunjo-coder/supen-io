import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Copy, Check, RefreshCw, ChevronLeft, ArrowRight,
  FileText, Lightbulb, Hash, ImagePlus, Wand2, Download, Loader2,
  Shield, Layers, Globe, ClipboardList, Save, ExternalLink, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { callClaude } from "@/lib/anthropic";
import { sanitizeInput } from "@/lib/security";
import { toast } from "sonner";
import { searchViralReferences, ViralReference, searchUserSources } from "@/lib/embeddings";
import { invalidateCache } from "@/lib/cache";
import { supabase } from "@/lib/supabase";
import { assertOnline, withRetry, withTimeout, friendlyError } from "@/lib/resilience";
import GenerationProgress, { CONTENT_STEPS } from "@/components/GenerationProgress";
import { scoreAllVariations, scoreColor, scoreBarColor, scoreBadge, scoreVariationHeuristic, type ScoreDetails } from "@/lib/viral-scorer";
import { saveInteraction, getUserStyleMemory, hasStyleMemory } from "@/lib/user-memory";
import { getHooks, detectNiche, getDailyHook, type Hook } from "@/lib/viral-hooks";
import { buildThreadPlaybook } from "@/lib/thread-playbook";
import { buildReelPlaybook } from "@/lib/reel-playbook";
import { buildYoutubePlaybook } from "@/lib/youtube-playbook";
import { buildLinkedinPlaybook } from "@/lib/linkedin-playbook";
import { buildTiktokPlaybook } from "@/lib/tiktok-playbook";
import { buildXPlaybook } from "@/lib/x-playbook";
import { buildFacebookPostPlaybook, buildFacebookThreadPlaybook } from "@/lib/facebook-playbook";
import { buildInstagramPlaybook } from "@/lib/instagram-playbook";
import { buildAntiAiRules } from "@/lib/anti-ai-rules";
import { sanitizeForPlatform } from "@/lib/output-sanitizer";
import { detectAiFlavor, passesDetectorEstimate } from "@/lib/ai-flavor-detector";
import { fetchTrends, type Trend } from "@/lib/trends";
import type { Source } from "@/types/database";
import type { UserProfile } from "@/hooks/use-profile";
import type { ContentSession } from "@/hooks/use-dashboard";
import type { ActivityData } from "@/hooks/use-activity";
import { ContentSessionGrid } from "@/components/DashboardWidgets";
import { ActivityWidget } from "@/components/ActivityWidget";
import InfographicModal from "@/components/InfographicModal";
import { StickyNote, Globe as GlobeIcon, Brain, ThumbsUp, ThumbsDown, TrendingUp, ChevronDown, CalendarDays } from "lucide-react";
import { useCalendar } from "@/hooks/use-calendar";

const IS_DEV = import.meta.env.DEV;

/* ─── Platform icons ─── */

const IconX = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const IconInstagram = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const IconLinkedIn = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);
const IconYouTube = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const IconFacebook = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const IconTikTok = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
);

/* ─── Data ─── */

interface Platform {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  formats: string[];
}

const platforms: Platform[] = [
  { id: "instagram", name: "Instagram", icon: IconInstagram, formats: ["Post", "Reel (script)"] },
  { id: "tiktok", name: "TikTok", icon: IconTikTok, formats: ["Caption", "Video script"] },
  { id: "linkedin", name: "LinkedIn", icon: IconLinkedIn, formats: ["Post"] },
  { id: "facebook", name: "Facebook", icon: IconFacebook, formats: ["Post", "Thread"] },
  { id: "x", name: "X (Twitter)", icon: IconX, formats: ["Tweet", "Thread"] },
  { id: "youtube", name: "YouTube", icon: IconYouTube, formats: ["Script long", "Script Shorts"] },
];

type SourceMode = "document" | "idea" | "keyword" | "websearch";

const sourceModes: { id: SourceMode; label: string; placeholder: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "document", label: "Document", placeholder: "Paste the text from your article, PDF or web page...", icon: FileText },
  { id: "idea", label: "Idea", placeholder: "Describe your idea, what you want to convey...", icon: Lightbulb },
  { id: "keyword", label: "Keyword", placeholder: "E.g.: productivity, AI, digital marketing...", icon: Hash },
  { id: "websearch", label: "Web Search", placeholder: "Search the web for fresh data, trends, stats...", icon: GlobeIcon },
];

/* ─── Angles & scores ─── */

const ANGLE_LABELS = ["Failure Story", "Contrarian Take", "Case Study", "Process Breakdown", "Provocative Opinion"] as const;
const ANGLE_COLORS: Record<string, string> = {
  "Failure Story": "bg-red-500/15 text-red-400",
  "Contrarian Take": "bg-amber-500/15 text-amber-400",
  "Case Study": "bg-blue-500/15 text-blue-400",
  "Process Breakdown": "bg-emerald-500/15 text-emerald-400",
  "Provocative Opinion": "bg-purple-500/15 text-purple-400",
  "Generated Post": "bg-accent/40 text-muted-foreground",
};

function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

interface ParsedVariation {
  angle: string;
  content: string;
  words: number;
  score: number;
  dbId?: string; // ID from generated_content after save
  scoreDetails?: ScoreDetails;
  scoring?: boolean;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    // Keep thread separators (▸ ─────) and triple newlines for breathing room
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function parseVariations(raw: string): ParsedVariation[] {
  const ANGLES = [
    "Failure Story",
    "Contrarian Take",
    "Case Study",
    "Process Breakdown",
    "Provocative Opinion",
  ];

  // Method 1: Tagged format [VARIATION_N_START/END]
  const tagged = raw.match(
    /\[VARIATION_\d+_START\]([\s\S]*?)\[VARIATION_\d+_END\]/g
  );

  if (tagged && tagged.length >= 3) {
    if (IS_DEV) console.log("[Parser] Tagged format:", tagged.length, "variations");
    return tagged.map((block, i) => {
      const content = block
        .replace(/\[VARIATION_\d+_START\]/, '')
        .replace(/\[VARIATION_\d+_END\]/, '')
        .trim();
      return {
        content: stripMarkdown(content),
        words: wordCount(content),
        angle: ANGLES[i] || `Variation ${i + 1}`,
        score: Math.floor(Math.random() * 25) + 65,
        scoring: false,
      };
    }).filter(v => v.content.length > 50);
  }

  // Method 2: Dash separators ---
  const dashes = raw
    .split(/---(?:VARIATION\s*\d+)?---/i)
    .map(v => v.trim())
    .filter(v => v.length > 50);

  if (dashes.length >= 3) {
    if (IS_DEV) console.log("[Parser] Dash format:", dashes.length, "variations");
    return dashes.slice(0, 5).map((content, i) => ({
      content: stripMarkdown(content),
      words: wordCount(content),
      angle: ANGLES[i] || `Variation ${i + 1}`,
      score: Math.floor(Math.random() * 25) + 65,
      scoring: false,
    }));
  }

  // Method 3: Triple newline blocks
  const blocks = raw
    .split(/\n{3,}/)
    .map(v => v.trim())
    .filter(v => v.length > 100);

  if (blocks.length >= 2) {
    if (IS_DEV) console.log("[Parser] Newline format:", blocks.length, "variations");
    return blocks.slice(0, 5).map((content, i) => ({
      content: stripMarkdown(content),
      words: wordCount(content),
      angle: ANGLES[i] || `Variation ${i + 1}`,
      score: Math.floor(Math.random() * 25) + 65,
      scoring: false,
    }));
  }

  // Fallback: entire response as single variation
  if (raw.trim().length > 50) {
    if (IS_DEV) console.warn("[Parser] Could not split — returning as single variation");
    return [{
      content: stripMarkdown(raw.trim()),
      words: wordCount(raw),
      angle: "Generated Post",
      score: 70,
      scoring: false,
    }];
  }

  return [];
}

/* ─── Component ─── */

const sourceTypeIcons: Record<string, React.FC<{ className?: string }>> = {
  pdf: FileText,
  url: GlobeIcon,
  note: StickyNote,
};

interface StudioWizardProps {
  activeSourceIds?: string[];
  sources?: Source[];
  profile?: UserProfile | null;
  sessions?: ContentSession[];
  onUpdateImagePrompt?: (id: string, prompt: string) => void;
  activityData?: ActivityData & { DAYS: string[]; refetch: () => void };
  onContentGenerated?: (content: string) => void;
  onGenerationComplete?: () => void;
}

const StudioWizard = ({ activeSourceIds = [], sources = [], profile, sessions = [], onUpdateImagePrompt, activityData, onContentGenerated, onGenerationComplete }: StudioWizardProps) => {
  const navigate = useNavigate();
  const [started, setStarted] = useState(true);
  const [step, setStep] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode>("keyword");
  const [sourceText, setSourceText] = useState("");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [sourceDirectives, setSourceDirectives] = useState<Record<string, string>>({});
  const [webSearchResults, setWebSearchResults] = useState<string>("");
  const [webSearching, setWebSearching] = useState(false);

  const [variations, setVariations] = useState<ParsedVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const retryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showInfographic, setShowInfographic] = useState(false);
  const [infographics, setInfographics] = useState<Record<number, string>>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [generatedInfographicBase64, setGeneratedInfographicBase64] = useState<string | null>(null);
  const [styleMemoryActive, setStyleMemoryActive] = useState(false);
  // Whether the most recent generation actually had a non-empty style
  // memory block injected. Persisted with each variation so we can
  // A/B-measure the memory's impact on engagement and flavor.
  const [lastStyleMemoryUsed, setLastStyleMemoryUsed] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, "liked" | "disliked" | null>>({});
  const { schedulePost } = useCalendar();
  const [scheduleIdx, setScheduleIdx] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduling, setScheduling] = useState(false);

  async function handleSchedule() {
    if (scheduleIdx === null || !selectedPlatform) return;
    const variation = variations[scheduleIdx];
    if (!variation) return;
    setScheduling(true);
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
      const { error } = await schedulePost({
        content: variation.content,
        platform: selectedPlatform.name,
        scheduled_at: scheduledAt,
      });
      if (error) {
        toast.error(`Error: ${error}`);
      } else {
        toast.success("Post scheduled!");
        setScheduleIdx(null);
      }
    } catch {
      toast.error("Scheduling error");
    }
    setScheduling(false);
  }
  const [trends, setTrends] = useState<Trend[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsOpen, setTrendsOpen] = useState(false);

  async function loadTrends() {
    if (trends.length > 0) {
      setTrendsOpen((v) => !v);
      return;
    }
    setTrendsLoading(true);
    setTrendsOpen(true);
    const fetched = await fetchTrends(profile?.niche || "general", 5);
    setTrends(fetched);
    setTrendsLoading(false);
    if (fetched.length === 0) {
      toast.error("Could not load trends. Try again later.");
    }
  }

  function useTrend(trend: Trend) {
    setSourceText(trend.title);
    setSourceMode("idea");
    setStarted(true);
    setStep(2);
  }

  // Hook suggestions based on user input + profile niche
  const suggestedHooks = useMemo<Hook[]>(() => {
    if (!sourceText.trim() || sourceText.trim().length < 3) return [];
    const detected = detectNiche(sourceText);
    const niche = detected !== "general" ? detected : (profile?.niche || "general");
    return getHooks(niche, undefined, 3);
  }, [sourceText, profile?.niche]);

  // Daily hook for the home screen
  const dailyHook = useMemo<Hook>(() => getDailyHook(profile?.niche), [profile?.niche]);

  function reset() {
    setStarted(true);
    setStep(0);
    setSelectedPlatform(null);
    setSelectedFormat(null);
    setSourceMode("keyword");
    setSourceText("");
    setSelectedDocumentIds([]);
    setVariations([]);
    setSelectedVariation(null);
    setSaveStatus("idle");
    setError(null);
    setFeedback({});
    setStyleMemoryActive(false);
    setGeneratedInfographicBase64(null);
  }

  function canGenerateInfographic(): boolean {
    const pl = selectedPlatform?.id?.toLowerCase() || "";
    const fmt = (selectedFormat || "").toLowerCase();
    return (pl.includes("linkedin") || pl.includes("facebook")) && fmt.includes("post");
  }

  function toggleDocumentId(id: string) {
    setSelectedDocumentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function goBack() {
    if (variations.length > 0) { setVariations([]); setSelectedVariation(null); return; }
    if (step === 0) { navigate("/dashboard"); return; }
    setStep(step - 1);
    if (step === 1) setSelectedFormat(null);
    if (step === 2) setSourceText("");
  }

  /* ── Web Search ── */

  async function handleWebSearch() {
    if (!sourceText.trim()) return;
    setWebSearching(true);
    setWebSearchResults("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("search-web", {
        body: { query: sourceText.trim(), max_results: 5 },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (data?.content) {
        setWebSearchResults(data.content);
        toast.success(`Found ${data.results?.length || 0} web results`);
      } else {
        toast.error("No results found");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Web search failed";
      toast.error(msg);
    } finally {
      setWebSearching(false);
    }
  }

  /* ── Generation ── */

  async function handleGenerate() {
    const isDocMode = sourceMode === "document" && selectedDocumentIds.length > 0;
    const isWebMode = sourceMode === "websearch" && webSearchResults.length > 0;
    if (!selectedPlatform || !selectedFormat) return;
    if (!isDocMode && !isWebMode && !sourceText.trim()) return;

    const sanitized = isDocMode
      ? sources.filter((s) => selectedDocumentIds.includes(s.id)).map((s) => s.title).join(", ")
      : sanitizeInput(sourceText, 5000);
    if (!sanitized) return;

    setIsGenerating(true);
    setVariations([]);
    setSelectedVariation(null);
    setError(null);
    setShowInfographic(false);
    setGeneratedInfographicBase64(null);

    try {
      // === User style memory ===
      // Fetch the user's voice profile (favorite angles, liked posts,
      // niche, tone preferences) so we can inject it into the system
      // prompt and personalise generation. Best-effort — silent on error.
      let userStyleMemoryBlock = "";
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u && selectedPlatform) {
          userStyleMemoryBlock = await getUserStyleMemory(u.id, selectedPlatform.name);
        }
      } catch { /* style memory is non-critical */ }
      // Track whether memory actually carried weight this run, so
      // saveVariations can persist the flag for later A/B analysis.
      setLastStyleMemoryUsed(userStyleMemoryBlock.length > 0);

      // === RAG: Retrieve relevant source content ===
      const allSourceIds = [...new Set([...activeSourceIds, ...selectedDocumentIds])];
      const focusDirectives = Object.values(sourceDirectives).filter(Boolean);
      const directive = focusDirectives.join(", ");
      let sourceContext = "";

      if (allSourceIds.length > 0) {
        // Strategy 1: RAG search (semantic + trigram + direct fallback)
        try {
          const ragQuery = directive ? `${directive}\n\n${sanitized}` : sanitized;
          const ragResults = await searchUserSources(ragQuery, allSourceIds, 8);

          if (ragResults.length > 0) {
            if (IS_DEV) console.log("[RAG] Found", ragResults.length, "relevant chunks");
            const seen = new Set<string>();
            sourceContext = ragResults
              .filter(r => {
                const key = r.content?.slice(0, 80);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              })
              .map(r => {
                const title = r.title.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
                return `━━━ ${title} ━━━\n${r.content?.slice(0, 2500)}`;
              })
              .join('\n\n');
          }
        } catch (e) {
          if (IS_DEV) console.warn("[RAG] Search failed, falling back to direct load:", e);
        }

        // Fallback: direct source loading if RAG returned nothing
        if (!sourceContext) {
          try {
            const { data: sourcesData } = await supabase
              .from("sources")
              .select("title, content")
              .in("id", allSourceIds)
              .limit(5);

            if (sourcesData && sourcesData.length > 0) {
              if (IS_DEV) console.log("[RAG] Direct load:", sourcesData.length, "sources");
              sourceContext = sourcesData.map(s => {
                const title = s.title.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
                return `━━━ ${title} ━━━\n${s.content?.slice(0, 2500)}`;
              }).join('\n\n');
            }
          } catch { /* network */ }
        }
      }

      // Inject web search results if available
      if (isWebMode && webSearchResults) {
        sourceContext = sourceContext
          ? `${sourceContext}\n\n━━━ WEB SEARCH RESULTS ━━━\n${webSearchResults}`
          : webSearchResults;
      }

      if (IS_DEV) console.log("[RAG] Context length:", sourceContext.length);

      // === Build user message ===
      const sanitizedInput = sanitized;
      const combinedContext = sourceContext;
      const sourceLabel = isWebMode ? "web research" : "documents";
      const userMessage = `
${combinedContext ? `
╔══════════════════════════════════════╗
║     ${isWebMode ? '  WEB RESEARCH CONTEXT   ' : '    DOCUMENT CONTEXT (RAG)  '}      ║
╚══════════════════════════════════════╝

${combinedContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SOURCE-USAGE RULES (non-negotiable):

1. STAY STRICTLY WITHIN THE SOURCES.
   Anything not in the ${sourceLabel} above must not appear in the post.
   No "common-knowledge" bridges. No invented examples. No filler stats.

2. QUOTE VERBATIM AT LEAST ONCE PER VARIATION.
   Pick ONE phrase or sentence from the ${sourceLabel} and reproduce it
   word-for-word inside straight quotation marks "...". Keep the quote
   short (under 20 words) and tie it to the surrounding paragraph so it
   reads as evidence, not as a pasted quote.

3. USE AT LEAST ONE HARD NUMBER FROM THE SOURCES.
   Real percentage, real dollar amount, real follower count, real
   timeframe. Pulled directly from the ${sourceLabel} — not paraphrased,
   not rounded, not invented.

4. NAME REAL ENTITIES (when the sources name them).
   If the ${sourceLabel} mention specific tools, people, products,
   companies, or URLs, use those names verbatim. Never replace them
   with "a tool" or "a popular platform".

5. WHEN THE SOURCES DON'T COVER SOMETHING, SAY SO.
   If the post needs a fact the ${sourceLabel} don't contain, either
   pivot to a fact they DO cover, or write the post around the gap
   ("the public data doesn't say how X works, but it does show Y").
   Never invent to fill a gap.

6. DO NOT REPRODUCE LARGE BLOCKS.
   Verbatim quotes are short (under 20 words). The post is your voice
   carrying the source's facts — not a copy-paste of the source.

${directive ? `7. USER FOCUS DIRECTIVE: ${directive}` : ""}

` : ''}CONTENT TO CREATE:
Topic: ${sanitizedInput}
Platform: ${selectedPlatform?.name}
Format: ${selectedFormat}
${profile?.target_audience ? `Target audience: ${profile.target_audience}` : ''}
${profile?.preferred_tone ? `Tone: ${profile.preferred_tone}` : ''}

Generate 5 complete ${selectedFormat} variations.
Each must be radically different in angle and structure.
${combinedContext ? `Each variation must contain at least one verbatim quote and one hard number from the ${sourceLabel}.` : ''}
Use white space and line breaks generously.
Make each post visually clean and easy to read.
`.trim();

      // === PLAYBOOK-POWERED SYSTEM PROMPT ===
      const isThread = selectedFormat === "Thread";
      const isScript = /script|reel|video/i.test(selectedFormat || "");
      const isLongScript = /script\s*long|long.*script/i.test(selectedFormat || "");
      const isLinkedIn = selectedPlatform?.name === "LinkedIn";
      const isTiktok = selectedPlatform?.id === "tiktok";
      const isX = selectedPlatform?.id === "x";
      const isTweet = selectedFormat === "Tweet";
      const isFacebook = selectedPlatform?.id === "facebook";
      const isPost = selectedFormat === "Post";
      const isYoutube = selectedPlatform?.id === "youtube";
      const isInstagram = selectedPlatform?.id === "instagram";
      const isCaption = selectedFormat === "Caption";

      // Get playbook-specific structure
      const playbookSection = isFacebook && isThread
        ? buildFacebookThreadPlaybook(profile?.niche || "", sanitizedInput)
        : isFacebook && isPost
          ? buildFacebookPostPlaybook(profile?.niche || "", sanitizedInput)
          : isInstagram && isPost
            ? buildInstagramPlaybook(profile?.niche || "", sanitizedInput)
            : isTiktok && isCaption
              ? buildInstagramPlaybook(profile?.niche || "", sanitizedInput)
              : isThread
                ? buildThreadPlaybook(profile?.niche || "", sanitizedInput)
                : isX && isTweet
                  ? buildXPlaybook(profile?.niche || "", sanitizedInput)
                  : isYoutube && isLongScript
                    ? buildYoutubePlaybook(profile?.niche || "", sanitizedInput)
                    : isScript && isTiktok
                      ? buildTiktokPlaybook(profile?.niche || "", sanitizedInput)
                      : isScript
                        ? buildReelPlaybook(profile?.niche || "", sanitizedInput)
                        : isLinkedIn
                          ? buildLinkedinPlaybook(profile?.niche || "", sanitizedInput)
                          : "";

      // LinkedIn already injects strict anti-AI rules via the playbook,
      // so the inline rules below are scoped to Thread / Reel / Script
      // (which don't use the LinkedIn playbook).
      const ANTI_AI_RULES_THREAD = buildAntiAiRules("standard");
      const ANTI_AI_RULES_SCRIPT = buildAntiAiRules("loose");

      const OUTPUT_FORMAT = `
OUTPUT FORMAT — EXACT:

[VARIATION_1_START]
(complete ${selectedFormat})
[VARIATION_1_END]

[VARIATION_2_START]
(complete ${selectedFormat})
[VARIATION_2_END]

[VARIATION_3_START]
(complete ${selectedFormat})
[VARIATION_3_END]

[VARIATION_4_START]
(complete ${selectedFormat})
[VARIATION_4_END]

[VARIATION_5_START]
(complete ${selectedFormat})
[VARIATION_5_END]`;

      // Persona line — adapts to platform/format so the model has the
      // right voice from the first token. The playbook injected above
      // already carries the platform-specific structural rules.
      const personaLine = (() => {
        if (isLinkedIn) return "You are a top LinkedIn ghostwriter. Your posts consistently get 50,000+ impressions. You write like a real person — specific, human, direct.";
        if (isFacebook && isPost) return "You are a top Facebook content writer. Your posts consistently drive long, high-quality comments because they read like real conversation, not marketing.";
        if (isFacebook && isThread) return "You are a top Facebook content writer. You write sequential wall posts that bring readers back across the day.";
        if (isInstagram && isPost) return "You are a top Instagram caption writer. Your captions earn the 'more' tap on a truncated mobile feed because line 1 lands hard, and they convert into saves and shares.";
        if (isTiktok && isCaption) return "You are a top TikTok caption writer. Your captions are short, sharp, and tied to the video — they don't repeat the script, they hook the next swipe.";
        if (isX && isTweet) return "You are a top X/Twitter writer. Your single tweets get reposted because each one is specific, sharp, and stands alone.";
        if (isThread) return "You are a viral X/Twitter thread writer. Your threads consistently get 500K+ impressions.";
        if (isYoutube && isLongScript) return "You are a top YouTube script writer in the Awa K. Penn signature style. Your scripts hold viewers from the first second, walk through real workflows, and convert subscribers.";
        if (isTiktok) return "You are a viral TikTok scriptwriter. Your scripts hit 1M+ views because the hook lands in 1-2 seconds, the value is dense, and the CTA drives DMs and follows.";
        if (isScript) return "You are a viral Reel/Short scriptwriter. Your scripts consistently get 1M+ views.";
        return "You are a top social media content writer. You write like a real person — specific, human, direct.";
      })();

      // Combined voice profile + playbook block — same string injected
      // at every system-prompt branch so we don't duplicate the wiring.
      const voiceAndPlaybookBlock = `${userStyleMemoryBlock ? `═══ USER VOICE PROFILE ═══\n${userStyleMemoryBlock}\n═══ END VOICE PROFILE ═══\n\n` : ""}${playbookSection ? `═══ PLAYBOOK (follow this structure) ═══\n${playbookSection}\n═══ END PLAYBOOK ═══\n` : ""}`;

      let systemPrompt: string;

      if (isYoutube && isLongScript) {
        // ── YouTube long-form (1500-3000 words spoken) ──
        systemPrompt = `${personaLine}

PLATFORM: ${selectedPlatform?.name}
FORMAT: ${selectedFormat}

${voiceAndPlaybookBlock}
SCRIPT REQUIREMENTS:
- 1500-3000 words for a 7-12 minute video
- Written as SPOKEN words, not text to be read silently
- Numbered steps where applicable (Step 1 — [Action title])
- Real URLs and tool names throughout (no "a tool", no "their website")
- Real prompts inside quotes (verbatim, copyable)
- Mid-script cliffhangers ("Stay with me because step 4...")
- Closing formula: Like → Subscribe → Comment → "I'll see you in the next one"

${OUTPUT_FORMAT}

Each variation = a COMPLETE script ready to record. No placeholders.`;

      } else if (isLinkedIn || (!isThread && !isScript)) {
        // ── Post prompt (LinkedIn / Facebook / X Tweet / IG Post / TikTok Caption) ──
        // The platform-specific rules live inside the injected playbook.
        // The static "LINKEDIN-SPECIFIC RULES" block now only fires when
        // we actually are on LinkedIn — otherwise we'd contradict the FB / X
        // playbook (different length targets, different CTAs).
        systemPrompt = `${personaLine}

PLATFORM: ${selectedPlatform?.name}
FORMAT: ${selectedFormat}

${voiceAndPlaybookBlock}${isLinkedIn ? `LINKEDIN-SPECIFIC RULES:
1. Hook: MAX 60 characters — must create curiosity or shock
2. Length: 1,200-1,800 characters total
3. One idea per line, blank line between sections
4. Symbols: Use ☑ ✦ ↳ → naturally (not bullets)
5. Numbers: Always specific ("47%" not "many")
6. End: Question OR "♻️ Repost if this helped"
7. ZERO markdown — no bold, no italic, no headers
8. ZERO corporate speak — write like a human texting a smart friend
9. SHORT sentences — max 15 words per sentence
10. White space: use line breaks generously for mobile readability

5 ANGLES — one per variation:
1. Story/failure angle: "I wasted 6 months doing X before I realized..."
2. Contrarian angle: "Everyone says X. They're wrong. Here's why:"
3. Data/proof angle: "From 0 to 47K in 90 days. Here's exactly how:"
4. Framework angle: "The 5-step system I use every week:"
5. Question angle: "Why do 97% of creators give up in month 3?"
` : ''}
${OUTPUT_FORMAT}

Each = COMPLETE, READY TO POST. Min 100 words. Generous line breaks.`;

      } else if (isThread) {
        // ── Thread prompt (X / Facebook) ──
        systemPrompt = `${personaLine}

PLATFORM: ${selectedPlatform?.name}
FORMAT: Thread

${voiceAndPlaybookBlock}${isFacebook ? `FACEBOOK THREAD RULES:
1. 4-6 separate posts, not tweets — each 80-120 words.
2. Separate posts with "---" on its own line.
3. Each post stands alone but references "earlier" / "yesterday" to acknowledge the series.
4. Last post: question that invites a 15+ word reply.
` : `X THREAD RULES:
1. Tweet 1 (HOOK): Max 280 chars. Stops the scroll. Creates MASSIVE curiosity.
2. Tweets 2-8: Each = ONE idea. Numbered (2/, 3/ etc.). Max 280 chars each.
3. Last tweet: Strong CTA + "Follow @[creator] for more"
4. Each tweet must stand alone AND connect to the next

SEPARATOR between tweets:
▸ ─────────────────────────────

HOOK FORMULAS (use the most powerful):
- "I [achieved X] without [common method]. Here's how:"
- "[Number] things most people don't know about [topic]:"
- "Unpopular opinion: [contrarian statement]"
- "I spent [time/money] on [thing]. Here's what I learned:"
`}

${ANTI_AI_RULES_THREAD}

${OUTPUT_FORMAT}

Each variation = DIFFERENT hook + DIFFERENT structure.`;

      } else {
        // ── Reel / Short script prompt (TikTok video, IG Reel, FB Reel, YouTube Shorts) ──
        systemPrompt = `${personaLine}

PLATFORM: ${selectedPlatform?.name}
FORMAT: ${selectedFormat}

${voiceAndPlaybookBlock}
SCRIPT FORMAT (60 seconds max):

[HOOK - 0 to 3 seconds]
One sentence. Stops the scroll. Makes viewer say "wait, what?"

[PROBLEM - 3 to 8 seconds]
Agitate the pain point. Make viewer feel understood.

[SOLUTION - 8 to 30 seconds]
Main value. Specific steps. "Here's exactly how..."
Name exact tools, buttons, URLs — not vague descriptions.

[PROOF - 30 to 45 seconds]
Real result or example. Specific numbers always.

[CTA - 45 to 60 seconds]
One clear action. "Comment [keyword] if you want more"

ON-SCREEN TEXT: List 3-5 text overlays for the video.

${ANTI_AI_RULES_SCRIPT}

5 ANGLES for 5 script variations:
1. AI showcase: "[Tool] can now [impressive claim]. Here's how to use it free."
2. Secret feature: "This secret [platform] feature will [specific outcome]"
3. 3 mistakes: "You're stuck because you don't do these 3 things"
4. Before/after: "Look at this transformation. Here's how I did it"
5. Myth busting: "You think X but actually Y. Let me prove it."

${OUTPUT_FORMAT}

Each variation includes: HOOK, PROBLEM, SOLUTION, PROOF, CTA, ON-SCREEN TEXT.`;
      }

      // === DEBUG LOGS ===
      if (IS_DEV) {
        console.log("=== GENERATION START ===");
        console.log("Platform:", selectedPlatform?.name);
        console.log("Format:", selectedFormat);
        console.log("Sources:", allSourceIds.length);
        console.log("Source context length:", sourceContext.length);
        console.log("User message preview:", userMessage.slice(0, 300));
      }

      assertOnline();

      // Call Claude via secure Edge Function (API key server-side only)
      const text = await withTimeout(
        callClaude(systemPrompt, [{ role: "user", content: userMessage }], {
          maxTokens: 4000,
          model: "claude-haiku-4-5-20251001",
        }),
        60_000,
        "Generation took too long. Try again with shorter content.",
      );

      setError(null);
      if (IS_DEV) {
        console.log("=== RAW RESPONSE ===");
        console.log(text.slice(0, 500));
      }
      const parsed = parseVariations(text);
      if (IS_DEV) console.log("Parsed variations:", parsed.length);

      // Sanitize each variation: strip curly quotes, decorative emoji,
      // markdown leakage, Title Case headings, em-dash overuse.
      // This is a safety net — the system prompt tells the model not to
      // produce these, but the sanitizer guarantees the user never sees them.
      const platformName = selectedPlatform?.name || "";
      const sanitizedVariations = parsed.map((v) => {
        const cleanContent = sanitizeForPlatform(v.content, platformName, selectedFormat || "");
        return {
          ...v,
          content: cleanContent,
          words: wordCount(cleanContent),
        };
      });

      // Heuristic viral score (synchronous, no API call). Real signal
      // based on hook / emotion / specificity / actionable / CTA presence.
      // Persisted to DB so analytics and future ranking have a real number.
      const scored = sanitizedVariations.map((v) => {
        const details = scoreVariationHeuristic(v.content, platformName);
        return {
          ...v,
          score: details.total,
          scoreDetails: details,
          scoring: false,
        };
      });

      // Show immediately so the user sees output. Auto-retry runs in the
      // background — if a variation reads as AI-flavoured even after the
      // sanitizer, we rewrite it once.
      setVariations(scored);

      // Auto-pick the best variation using a real combined score:
      //   combined = viral_score - 0.6 × ai_flavor_score
      // (higher viral, lower flavor is better; flavor weight tuned so a
      //  +20 viral edge can still lose to a +30 flavor regression)
      // Falls back to variation 0 if scores are too close to call.
      if (scored.length > 0) {
        const combined = scored.map((v, i) => {
          const flavor = detectAiFlavor(v.content).score;
          return { idx: i, score: (v.score || 0) - flavor * 0.6 };
        });
        combined.sort((a, b) => b.score - a.score);
        const winnerMargin = combined[0].score - (combined[1]?.score ?? 0);
        // Only auto-pick if there's a meaningful gap; otherwise let the
        // user choose without a default bias.
        if (winnerMargin > 4) {
          setSelectedVariation(combined[0].idx);
        }
      }

      // Background auto-retry. Budget: up to 2 retries per generation.
      // This is fire-and-forget — the user is not blocked.
      (async () => {
        const RETRY_THRESHOLD = 30; // moderate or heavy severity
        const MAX_RETRIES = 2;
        let retriesUsed = 0;
        const updates: { idx: number; content: string; words: number; score: number; scoreDetails: ScoreDetails }[] = [];
        for (let i = 0; i < scored.length && retriesUsed < MAX_RETRIES; i++) {
          const v = scored[i];
          const flavor = detectAiFlavor(v.content);
          if (flavor.score < RETRY_THRESHOLD) continue;
          retriesUsed += 1;
          try {
            const isLongFormat = /linkedin|youtube|long/i.test(`${platformName} ${selectedFormat || ""}`);
            const tightness = isLongFormat ? "strict" : "standard";
            const retrySystem = `You are a senior editor whose only job is to remove AI tells from a draft while keeping the message and structure intact.

PLATFORM: ${platformName}
FORMAT: ${selectedFormat || "post"}

The previous draft tripped these AI-flavour detectors: ${flavor.signals.map((s) => s.description).join(" | ")}.

TASK:
Rewrite the user's draft so it reads as if a sharp human creator wrote it.
- Keep the same core message, hook, and structural beats.
- Keep the same approximate length.
- Fix the specific issues listed above.
- Replace any banned word with normal English.
- Cut em-dashes to one per post maximum.
- Drop "in conclusion" / "overall" / "in summary" closers.
- Drop didactic disclaimers ("it's important to note").
- Keep contractions. Mix sentence lengths.
- Preserve real names, numbers, URLs, prompts, button paths verbatim.

OUTPUT:
Return ONLY the rewritten draft. No preamble, no explanation, no markdown fences. Just the text.

${buildAntiAiRules(tightness)}`;
            const raw = await callClaude(
              retrySystem,
              [{ role: "user", content: `Rewrite this draft:\n\n${v.content}` }],
              { maxTokens: 1500, model: "claude-haiku-4-5-20251001" },
            );
            const cleaned = sanitizeForPlatform(stripMarkdown(raw).trim(), platformName, selectedFormat || "");
            // Only accept the rewrite if it actually moved the needle.
            const newFlavor = detectAiFlavor(cleaned);
            if (newFlavor.score >= flavor.score) {
              if (IS_DEV) console.log(`[auto-retry] Variation ${i + 1} rewrite did not improve flavor (${flavor.score} → ${newFlavor.score}); keeping original.`);
              continue;
            }
            const newDetails = scoreVariationHeuristic(cleaned, platformName);
            updates.push({
              idx: i,
              content: cleaned,
              words: wordCount(cleaned),
              score: newDetails.total,
              scoreDetails: newDetails,
            });
            if (IS_DEV) console.log(`[auto-retry] Variation ${i + 1} cleaned (flavor ${flavor.score} → ${newFlavor.score}).`);
          } catch (e) {
            if (IS_DEV) console.warn(`[auto-retry] Variation ${i + 1} retry failed:`, e);
            // Silent failure — keep the original variation.
          }
        }
        if (updates.length > 0) {
          setVariations((prev) =>
            prev.map((v, i) => {
              const u = updates.find((up) => up.idx === i);
              if (!u) return v;
              return { ...v, content: u.content, words: u.words, score: u.score, scoreDetails: u.scoreDetails };
            })
          );
        }
      })();

      if (scored.length > 0 && onContentGenerated) {
        onContentGenerated(scored[0].content);
      }

      // Send content-ready email (fire and forget)
      supabase.auth.getUser().then(({ data: { user: u } }) => {
        if (u?.email) {
          supabase.functions.invoke("bright-processor", {
            body: {
              to: u.email,
              subject: "Your Supenli.ai content is ready!",
              type: "content-ready",
              data: {
                name: u.email.split("@")[0],
                platform: selectedPlatform?.name || "Social Media",
                topic: sanitizedInput.slice(0, 60),
              },
            },
          }).catch(() => {});
        }
      });

      // Save without waiting for real scoring
      saveVariations(scored);
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setIsGenerating(false);
    }
  }

  // ─── Retry on 529 / overloaded ───

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (retryIntervalRef.current) clearInterval(retryIntervalRef.current); };
  }, []);

  function handleRetryWithDelay() {
    if (retryIntervalRef.current) { clearInterval(retryIntervalRef.current); retryIntervalRef.current = null; }
    setRetryCountdown(30);
    setError(null);
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

  async function saveVariations(parsed: ParsedVariation[]): Promise<boolean> {
    if (!selectedPlatform || !selectedFormat) return false;
    setSaveStatus("saving");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaveStatus("failed"); return false; }

      const sessionId = crypto.randomUUID();
      setCurrentSessionId(sessionId);

      // Create a content_sessions row (best-effort)
      const topic = sourceText.trim().slice(0, 200) || "Untitled";
      try {
        await supabase.from("content_sessions").insert({
          id: sessionId,
          user_id: user.id,
          topic,
          platform: selectedPlatform.name,
          format: selectedFormat,
        });
      } catch (err) {
        console.warn("[StudioWizard] Session save failed (non-critical):", err);
      }

      const rows = parsed.map((v) => ({
        user_id: user.id,
        session_id: sessionId,
        platform: selectedPlatform.name,
        format: selectedFormat,
        content: v.content,
        viral_score: v.score || 0,
      }));
      const { data: savedRows, error: saveErr } = await supabase
        .from("generated_content")
        .insert(rows)
        .select("id");

      if (saveErr) {
        console.error("[StudioWizard] Save failed:", saveErr.message, saveErr.details, saveErr.hint);
        toast.error("Content not saved. Check your connection.");
        setSaveStatus("failed");
        // Still show infographic prompt despite save failure
        setTimeout(() => {
          toast("Turn this into a visual?", {
            description: "Generate an infographic for your best variation.",
            duration: 10000,
            action: { label: "Generate →", onClick: () => setShowInfographic(true) },
          });
        }, 5000);
        return false;
      }
      // Merge returned IDs into variations so InfographicModal can UPDATE the correct row
      if (savedRows && savedRows.length === parsed.length) {
        setVariations((prev) => prev.map((v, i) => ({ ...v, dbId: savedRows[i]?.id })));
      }
      setSaveStatus("saved");
      invalidateCache("history:");
      if (onGenerationComplete) onGenerationComplete();
      toast.success("Saved! Opening workspace...");
      // Navigate to immersive editor after short delay
      setTimeout(() => navigate(`/editor/${sessionId}`), 1500);
      return true;
    } catch (err) {
      console.error("[StudioWizard] Save exception:", err);
      toast.error("Content not saved. Check your connection.");
      setSaveStatus("failed");
      return false;
    }
  }

  async function retrySave() {
    if (variations.length > 0) {
      const ok = await saveVariations(variations);
      if (ok) toast.success("Save successful!");
    }
  }

  async function handleViewContents() {
    if (saveStatus !== "saved") {
      const ok = await saveVariations(variations);
      if (!ok) {
        toast.error("Save failed. Please try again.");
        return;
      }
    }
    toast.success("Content saved! Find it in your dashboard.");
    reset();
    // Reset brings the wizard back to home which displays the latest content
  }

  async function handleGoToDashboard() {
    // Save if not done yet
    if (saveStatus !== "saved" && variations.length > 0) {
      await saveVariations(variations);
    }
    toast("Find your content in the dashboard");
    reset();
  }

  /* ── Humanize ── */

  async function handleHumanize(idx: number) {
    const original = variations[idx];
    if (!original || !selectedPlatform) return;
    setIsHumanizing(true);
    setError(null);
    try {
      const platformName = selectedPlatform.name;
      const formatName = selectedFormat || "post";
      const isLongFormat = /linkedin|youtube|long/i.test(`${platformName} ${formatName}`);
      const tightness = isLongFormat ? "strict" : "standard";

      const humanizeSystem = `You are a senior editor whose only job is to remove AI tells from a draft while keeping the message and structure intact.

PLATFORM: ${platformName}
FORMAT: ${formatName}

TASK:
Rewrite the user's draft so it reads as if a sharp human creator wrote it.
- Keep the same core message, hook, and structural beats.
- Keep the same approximate length (do NOT shrink to 30% — readers asked for content, not a tweet).
- Replace any banned word or phrase with normal English.
- Cut em-dashes down to one per post maximum.
- Break any negative parallelism ("not just X, it's Y") if it fires more than once.
- Drop any "in conclusion" / "overall" / "in summary" closer.
- Drop didactic disclaimers ("it's important to note", "it's worth noting").
- Replace decorative emoji with functional emoji (☑ ✦ ↳ ❌ ✅ ♻️) or nothing.
- Replace curly quotes / apostrophes with straight ones.
- Keep contractions (you're, don't, it's). If the draft has none, add some.
- Vary sentence length: mostly short, one longer for rhythm, occasional fragment.
- Preserve real names, numbers, URLs, prompts, button paths verbatim.

OUTPUT:
Return ONLY the rewritten draft. No preamble, no "here's your humanized version", no explanation, no markdown code fences. Just the text.

${buildAntiAiRules(tightness)}`;

      const raw = await callClaude(
        humanizeSystem,
        [{ role: "user", content: `Rewrite this draft:\n\n${original.content}` }],
      );
      const stripped = stripMarkdown(raw).trim();
      const text = sanitizeForPlatform(stripped, platformName, formatName);
      setVariations((prev) => prev.map((v, i) => i === idx ? { ...v, content: text, words: wordCount(text) } : v));
      toast.success("Rewritten without the AI tells");
    } catch (err: unknown) {
      setError(`Humanization error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsHumanizing(false);
    }
  }

  const [imagePanel, setImagePanel] = useState<number | null>(null);
  const [imageGenerating, setImageGenerating] = useState<number | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
  // Custom-prompt image generation (available on every platform/format)
  const [customImagePanel, setCustomImagePanel] = useState<number | null>(null);
  const [customImagePrompts, setCustomImagePrompts] = useState<Record<number, string>>({});
  const [customImageGenerating, setCustomImageGenerating] = useState<number | null>(null);
  const [customImages, setCustomImages] = useState<Record<number, string>>({});
  const [infraPanel, setInfraPanel] = useState<number | null>(null);
  const [infraContent, setInfraContent] = useState("");
  const [genInfra, setGenInfra] = useState(false);
  const [infraCopied, setInfraCopied] = useState(false);

  function handleCopy(idx: number) {
    const v = variations[idx];
    navigator.clipboard.writeText(v.content);
    setCopiedIdx(idx);
    toast.success("Copied to clipboard ✓");
    setTimeout(() => setCopiedIdx(null), 2000);

    // Track interaction for style memory
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u && selectedPlatform) {
        saveInteraction(u.id, v.content, selectedPlatform.name, v.angle, v.score, "copied");
      }
    });
  }

  async function handleFeedback(idx: number, rating: "liked" | "disliked") {
    const v = variations[idx];
    const current = feedback[idx];
    const newRating = current === rating ? null : rating;
    setFeedback((prev) => ({ ...prev, [idx]: newRating }));

    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;

      if (newRating === null) {
        await supabase.from("variation_feedback")
          .delete()
          .eq("user_id", u.id)
          .eq("content_preview", v.content.slice(0, 100));
        return;
      }

      await supabase.from("variation_feedback").insert({
        user_id: u.id,
        content_preview: v.content.slice(0, 100),
        platform: selectedPlatform?.name || "",
        angle: v.angle,
        viral_score: v.score,
        rating: newRating,
      });

      if (newRating === "liked") {
        saveInteraction(u.id, v.content, selectedPlatform?.name || "", v.angle, v.score, "liked");
        toast.success(rating === "liked" ? "Noted! We'll generate more like this." : "Got it. We'll adjust your style.");
      }
    } catch { /* non-critical */ }
  }

  async function handleGenerateImage(idx: number, forceRegenerate = false) {
    if (imageGenerating !== null) return;

    // If already generated and not forcing regen → toggle panel visibility
    if (generatedImages[idx] && !forceRegenerate) {
      setImagePanel(imagePanel === idx ? null : idx);
      return;
    }

    setImageGenerating(idx);
    setImagePanel(idx);
    setInfraPanel(null);

    try {
      const { generateContentImage } = await import("@/lib/image-generator");
      const base64 = await generateContentImage(
        variations[idx].content,
        selectedPlatform?.name || "Instagram",
        profile?.niche,
      );

      if (base64) {
        setGeneratedImages((prev) => ({ ...prev, [idx]: base64 }));
        toast.success("Image generated!");
      } else {
        toast.error("Could not generate image. Try again.");
        setImagePanel(null);
      }
    } catch {
      toast.error("Image generation error");
      setImagePanel(null);
    }

    setImageGenerating(null);
  }

  // Toggle the custom-prompt image panel for a given variation.
  function toggleCustomImagePanel(idx: number) {
    setCustomImagePanel((prev) => (prev === idx ? null : idx));
    setImagePanel(null);
    setInfraPanel(null);
  }

  // Generate an image FROM the user-provided prompt. Distinct from
  // handleGenerateImage which auto-builds a prompt from the post content.
  async function handleCustomImageGenerate(idx: number) {
    if (customImageGenerating !== null) return;
    const prompt = (customImagePrompts[idx] || "").trim();
    if (prompt.length < 4) {
      toast.error("Describe the image you want (at least a few words).");
      return;
    }
    setCustomImageGenerating(idx);
    try {
      const { generateImageFromPrompt } = await import("@/lib/image-generator");
      const base64 = await generateImageFromPrompt(prompt, selectedPlatform?.name || "Instagram");
      if (base64) {
        setCustomImages((prev) => ({ ...prev, [idx]: base64 }));
        toast.success("Image generated from your prompt!");
      } else {
        toast.error("Could not generate that image. Try a different prompt.");
      }
    } catch {
      toast.error("Custom image generation failed.");
    } finally {
      setCustomImageGenerating(null);
    }
  }

  async function handleInfraPrompt(idx: number) {
    if (infraPanel === idx && infraContent) { setInfraPanel(null); return; }
    setInfraPanel(idx);
    setImagePanel(null);
    setInfraContent("");
    setGenInfra(true);
    try {
      const infraResult = await callClaude(
        `You are an expert in viral infographic design. Create an infographic structure for this ${selectedPlatform?.name || ""} content. Format: TITLE: [max 8 words]\nPOINT 1: [short text]\nPOINT 2: [short text]\nPOINT 3: [short text]\nCTA: [call to action]\nIn English. Respond ONLY with the structure.`,
        [{ role: "user", content: variations[idx].content.slice(0, 600) }],
        { maxTokens: 400 },
      );
      setInfraContent(infraResult);
    } catch (err) {
      if (IS_DEV) console.error("Infographic error:", err);
      toast.error("Infographic generation error");
      setGenInfra(false);
    }
    setGenInfra(false);
  }

  // Deduplicate sources by base title (PDF chunks → 1 entry)
  const uniqueSources = useMemo(() => {
    const seen = new Set<string>();
    return sources.filter((s) => {
      const base = s.title.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim();
      if (seen.has(base)) return false;
      seen.add(base);
      return true;
    });
  }, [sources]);

  const breadcrumb = [selectedPlatform?.name, selectedFormat].filter(Boolean).join(" / ");

  // Sort platforms: favorites (from onboarding) first
  const favPlatformNames = profile?.platforms || [];
  const sortedPlatforms = [...platforms].sort((a, b) => {
    const aFav = favPlatformNames.includes(a.name) ? 0 : 1;
    const bFav = favPlatformNames.includes(b.name) ? 0 : 1;
    return aFav - bFav;
  });

  const greeting = profile?.first_name
    ? `Hello ${profile.first_name}`
    : "Ready to create viral content?";

  const subtitle = profile?.niche
    ? `Create ${profile.niche} content that converts.`
    : "Pick a network, describe your topic, and let AI generate 5 ready-to-publish variations.";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ═══════ WIZARD ═══════ */}
        {started && variations.length === 0 && (
          <motion.div key="wizard" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="flex-1 flex flex-col overflow-hidden">
            
            {/* Header / Stepper — Minimalist Apple Style */}
            <div className="flex flex-col gap-4 px-6 py-4 shrink-0 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={goBack} className="w-8 h-8 rounded-lg glass border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-90">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h1 className="text-lg font-black tracking-tight text-foreground">Studio</h1>
                </div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={cn("h-1 rounded-full transition-all duration-500", i === step ? "bg-primary w-6 shadow-[0_0_12px_rgba(20,184,166,0.6)]" : i < step ? "bg-primary/40 w-3" : "bg-muted w-3")} />
                  ))}
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                {step === 0 && "Select Platform"}
                {step === 1 && `Select Format — ${selectedPlatform?.name}`}
                {step === 2 && "Feed your Genius"}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="max-w-4xl mx-auto px-8 py-10">
                <AnimatePresence mode="wait">
                  {step === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.4 }}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {sortedPlatforms.map((p) => {
                          const isFav = favPlatformNames.includes(p.name);
                          const isSelected = selectedPlatform?.id === p.id;
                          return (
                            <button 
                              key={p.id} 
                              onClick={() => { setSelectedPlatform(p); setStep(1); supabase.auth.getUser().then(({ data: { user: u } }) => { if (u) hasStyleMemory(u.id, p.name).then(setStyleMemoryActive); }); }} 
                              className={cn(
                                "group flex flex-col items-center gap-3 py-6 px-4 rounded-2xl border transition-all duration-500 active:scale-95",
                                isSelected 
                                  ? "bg-primary/10 border-primary shadow-[0_0_30px_-10px_rgba(20,184,166,0.3)]" 
                                  : "bg-card/20 border-border/40"
                              )}
                            >
                              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500", isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:scale-110 group-hover:text-foreground group-hover:bg-muted/80")}>
                                <p.icon className="w-6 h-6" />
                              </div>
                              <div className="text-center">
                                <span className="block text-xs font-black text-foreground mb-0.5">{p.name}</span>
                                {isFav && <span className="text-[8px] font-black uppercase tracking-widest text-primary opacity-60">Favorite</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                  {step === 1 && selectedPlatform && (
                    <motion.div key="s1" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.4 }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedPlatform.formats.map((f) => (
                          <button 
                            key={f} 
                            onClick={() => { setSelectedFormat(f); setStep(2); }} 
                            className={cn(
                              "group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 active:scale-95",
                              selectedFormat === f 
                                ? "bg-primary/10 border-primary shadow-[0_0_30px_-10px_rgba(20,184,166,0.3)]" 
                                : "bg-card/20 border-border/40"
                            )}
                          >
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500", selectedFormat === f ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground")}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 text-left">
                              <span className="block text-sm font-black text-foreground mb-0.5">{f}</span>
                              <span className="text-[9px] font-medium text-muted-foreground/40 tracking-wide uppercase">For {selectedPlatform.name}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {step === 2 && selectedPlatform && selectedFormat && (
                    <motion.div key="s2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }}>
                      
                      {/* Premium Source Mode Switcher */}
                      <div className="flex gap-1.5 mb-6 p-1 rounded-xl bg-card/10 border border-border/40">
                        {sourceModes.map((m) => (
                          <button 
                            key={m.id} 
                            onClick={() => { setSourceMode(m.id); setSourceText(""); setSelectedDocumentIds([]); }} 
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300", 
                              sourceMode === m.id ? "bg-foreground text-background shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            <m.icon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{m.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* DOCUMENT MODE */}
                      {sourceMode === "document" && (
                        <div className="space-y-6">
                          {sources.length === 0 ? (
                            <div className="rounded-[2rem] border-2 border-dashed border-white/10 p-12 text-center glass">
                              <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                              <p className="text-sm font-bold text-white mb-2">No documents in memory</p>
                              <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto mb-6">Add knowledge in your Library to fuel the AI with specific facts.</p>
                              <Button onClick={() => navigate("/dashboard")} variant="outline" className="rounded-xl border-white/10">Go to Library</Button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                              {uniqueSources.map((s) => {
                                const isChecked = selectedDocumentIds.includes(s.id);
                                const TypeIcon = sourceTypeIcons[s.type] || StickyNote;
                                return (
                                  <button 
                                    key={s.id} 
                                    onClick={() => toggleDocumentId(s.id)} 
                                    className={cn(
                                      "group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left", 
                                      isChecked ? "bg-primary/10 border-primary shadow-lg shadow-primary/5" : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                                    )}
                                  >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all", isChecked ? "bg-primary text-white" : "bg-white/5 text-muted-foreground")}>
                                      <TypeIcon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={cn("text-sm font-bold truncate", isChecked ? "text-white" : "text-muted-foreground")}>{s.title.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim()}</p>
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{s.type}</p>
                                    </div>
                                    <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", isChecked ? "bg-primary border-primary" : "border-white/10")}>
                                      {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* IDEA / KEYWORD / WEB SEARCH MODE */}
                      {sourceMode !== "document" && (
                        <div className="space-y-3">
                          <div className="relative group">
                            {sourceMode === "idea" ? (
                              <Textarea 
                                value={sourceText} 
                                onChange={(e) => setSourceText(e.target.value)} 
                                placeholder={sourceModes.find((m) => m.id === sourceMode)?.placeholder} 
                                className="w-full bg-card/20 border-border/40 rounded-2xl p-4 text-sm min-h-[140px] resize-none focus:border-primary/40 transition-all outline-none" 
                              />
                            ) : (
                              <div className="flex gap-2">
                                <Input 
                                  value={sourceText} 
                                  onChange={(e) => setSourceText(e.target.value)} 
                                  placeholder={sourceModes.find((m) => m.id === sourceMode)?.placeholder} 
                                  className="flex-1 h-12 bg-card/20 border-border/40 rounded-xl px-4 text-sm focus:border-primary/40 transition-all outline-none" 
                                  onKeyDown={(e) => e.key === "Enter" && (sourceMode === "websearch" ? handleWebSearch() : handleGenerate())}
                                />
                                {sourceMode === "websearch" && (
                                  <Button onClick={handleWebSearch} disabled={!sourceText.trim() || webSearching} className="h-12 px-6 rounded-xl bg-primary font-black text-xs gap-2 shrink-0">
                                    {webSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <GlobeIcon className="w-4 h-4" />}
                                    Search
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Suggested Hooks */}
                          {(sourceMode === "idea" || sourceMode === "keyword") && sourceText.trim().length > 3 && suggestedHooks.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {suggestedHooks.map((hook, i) => (
                                <button key={i} onClick={() => setSourceText(hook.text)} className="px-3 py-1.5 rounded-lg bg-card/30 border border-border/40 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
                                  {hook.text}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-8 flex flex-col items-center">
                        <Button
                          onClick={handleGenerate}
                          disabled={
                            (sourceMode === "document" ? selectedDocumentIds.length === 0 : sourceMode === "websearch" ? !webSearchResults : !sourceText.trim()) || isGenerating
                          }
                          className="h-12 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-sm gap-3 shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-20"
                        >
                          {isGenerating ? (<><RefreshCw className="w-4 h-4 animate-spin" /> Distilling...</>) : (<><Sparkles className="w-4 h-4" /> Generate Variations</>)}
                        </Button>
                        
                        {isGenerating && (
                          <div className="w-full max-w-xs mt-8">
                            <GenerationProgress isActive={isGenerating} steps={CONTENT_STEPS} estimatedSeconds={25} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════ RESULTS ═══════ */}
        {variations.length > 0 && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="flex-1 flex flex-col overflow-hidden">
            
            {/* Gallery Header */}
            <div className="flex flex-col gap-6 px-8 py-8 shrink-0 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={goBack} className="w-10 h-10 rounded-xl glass border-white/5 flex items-center justify-center text-muted-foreground hover:text-white transition-all active:scale-90">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-white">{variations.length} Strategic Variations</h1>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-primary opacity-60">{selectedPlatform?.name} • {selectedFormat}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    const all = variations.map((v, i) => `--- Variation ${i + 1} ---\n${v.content}`).join("\n\n");
                    navigator.clipboard.writeText(all);
                    toast.success("Creative Library copied!");
                  }}
                  className="h-10 rounded-xl glass border-white/5 text-xs font-black uppercase tracking-widest gap-2"
                >
                  <Copy className="w-4 h-4" /> Copy All
                </Button>
              </div>
            </div>

            {/* Cards Gallery */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-8">
              <div className="max-w-4xl mx-auto grid grid-cols-1 gap-6 pb-32">
                {variations.map((v, idx) => {
                  const isSelected = selectedVariation === idx;
                  const detector = passesDetectorEstimate(v.content);
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.5 }}
                      onClick={() => { setSelectedVariation(isSelected ? null : idx); setImagePanel(null); setInfraPanel(null); }}
                      className={cn(
                        "group relative rounded-2xl border transition-all duration-500 cursor-pointer p-6",
                        isSelected 
                          ? "bg-primary/5 border-primary shadow-xl shadow-primary/5" 
                          : "bg-card/20 border-border/40 hover:border-primary/20 hover:bg-card/30"
                      )}
                    >
                      {/* Variation Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Variation 0{idx + 1}</span>
                          {detector.verdict === 'likely_passes' && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                              <Shield className="w-2.5 h-2.5 text-emerald-400" />
                              <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-400">Human</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">{v.words} words</span>
                           <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", isSelected ? "bg-primary border-primary" : "border-border/40")}>
                             {isSelected && <Check className="w-3 h-3 text-white" />}
                           </div>
                        </div>
                      </div>

                      <div className="relative">
                        <p className="text-sm leading-relaxed font-medium text-foreground/90 whitespace-pre-wrap mb-6">{v.content}</p>
                      </div>

                      {/* Tooling for selected variation */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: 10 }}
                            className="flex flex-wrap gap-2 pt-8 border-t border-white/5"
                            onClick={(e) => e.stopPropagation()}
                          >
                             <Button onClick={(e) => { e.stopPropagation(); handleCopy(idx); }} variant="secondary" className="h-11 rounded-xl glass border-white/5 font-black uppercase tracking-widest text-[10px] gap-2 px-6">
                               {copiedIdx === idx ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                               {copiedIdx === idx ? "Copied" : "Copy Content"}
                             </Button>
                             <Button onClick={(e) => { e.stopPropagation(); handleHumanize(idx); }} disabled={isHumanizing} variant="secondary" className="h-11 rounded-xl glass border-white/5 font-black uppercase tracking-widest text-[10px] gap-2 px-6">
                               {isHumanizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                               Refine Style
                             </Button>
                             {canGenerateInfographic() && (
                               <Button onClick={(e) => { e.stopPropagation(); handleGenerateImage(idx); }} variant="secondary" className="h-11 rounded-xl glass border-white/5 font-black uppercase tracking-widest text-[10px] gap-2 px-6">
                                 <ImagePlus className="w-4 h-4" /> Visual
                               </Button>
                             )}
                             <Button onClick={(e) => { e.stopPropagation(); setScheduleIdx(idx); setScheduleDate(new Date().toISOString().slice(0, 10)); }} variant="secondary" className="h-11 rounded-xl glass border-white/5 font-black uppercase tracking-widest text-[10px] gap-2 px-6">
                               <CalendarDays className="w-4 h-4" /> Schedule
                             </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Image Preview Panel */}
                      <AnimatePresence>
                        {imagePanel === idx && isSelected && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 overflow-hidden">
                             {imageGenerating === idx ? (
                               <div className="flex flex-col items-center justify-center gap-4 py-12 glass rounded-3xl border-white/5">
                                 <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                 <span className="text-xs font-black uppercase tracking-widest text-white/40">Painting with AI...</span>
                               </div>
                             ) : generatedImages[idx] && (
                               <div className="relative rounded-3xl overflow-hidden border border-white/10 group/img">
                                 <img src={`data:image/jpeg;base64,${generatedImages[idx]}`} alt="Generated visual" className="w-full" />
                                 <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-end gap-3 translate-y-full group-hover/img:translate-y-0 transition-transform duration-500">
                                   <Button onClick={() => { const link = document.createElement("a"); link.href = `data:image/jpeg;base64,${generatedImages[idx]}`; link.download = `supen-${Date.now()}.jpg`; link.click(); }} variant="secondary" className="glass h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest">Download</Button>
                                   <Button onClick={() => handleGenerateImage(idx, true)} variant="secondary" className="glass h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest">Regenerate</Button>
                                 </div>
                               </div>
                             )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Floating Navigation Bar */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6">
              <div className="glass px-6 py-3 rounded-2xl border-border/40 shadow-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                   <div className={cn("w-2 h-2 rounded-full", saveStatus === 'saved' ? 'bg-primary shadow-[0_0_8px_rgba(20,184,166,0.6)]' : 'bg-amber-400 animate-pulse')} />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                     {saveStatus === 'saved' ? 'Synced' : 'Syncing...'}
                   </span>
                </div>
                <div className="flex items-center gap-2">
                   <Button variant="ghost" onClick={reset} className="h-9 px-4 rounded-xl hover:bg-card text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">Reset</Button>
                   <Button onClick={handleGoToDashboard} className="h-9 px-6 rounded-xl bg-foreground text-background font-black uppercase tracking-widest text-[10px] hover:bg-foreground/90 shadow-xl active:scale-95 transition-all">Finish</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(error || retryCountdown > 0) && (
        <div className="mx-5 mb-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 shrink-0 space-y-1.5">
          {error && <p className="text-[11px] text-destructive">{error}</p>}
          {retryCountdown > 0 && (
            <p className="text-[11px] text-muted-foreground font-mono">Auto-retry in {retryCountdown}s...</p>
          )}
          {error && (error.includes("overloaded") || error.includes("529")) && retryCountdown === 0 && (
            <button onClick={handleRetryWithDelay} className="text-[11px] text-primary hover:underline font-medium">
              Retry in 30s
            </button>
          )}
        </div>
      )}

      <InfographicModal
        open={showInfographic && selectedVariation !== null}
        onClose={() => setShowInfographic(false)}
        content={selectedVariation !== null ? variations[selectedVariation]?.content || "" : ""}
        platform={selectedPlatform?.name || ""}
        contentId={selectedVariation !== null ? variations[selectedVariation]?.dbId : undefined}
        sessionId={currentSessionId || undefined}
        existingHtml={selectedVariation !== null ? infographics[selectedVariation] : undefined}
        onGenerated={(html, base64) => {
          if (selectedVariation === null) return;
          const idx = selectedVariation;
          setInfographics((prev) => ({ ...prev, [idx]: html }));
          if (base64) setGeneratedInfographicBase64(base64);
        }}
      />

      {/* Schedule mini-modal */}
      <AnimatePresence>
        {scheduleIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setScheduleIdx(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-sm p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold">Schedule this post</h3>
              </div>
              <div className="bg-accent/20 border border-border/20 rounded-lg p-3 mb-4 max-h-24 overflow-y-auto">
                <p className="text-[11px] text-muted-foreground line-clamp-3 leading-snug">
                  {variations[scheduleIdx]?.content}
                </p>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-accent/30 border border-border/30 rounded-lg h-9 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full bg-accent/30 border border-border/30 rounded-lg h-9 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground/60 text-center">
                  Will be posted on <span className="text-foreground font-medium">{selectedPlatform?.name}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setScheduleIdx(null)} className="flex-1 h-9 text-xs">
                  Cancel
                </Button>
                <Button onClick={handleSchedule} disabled={scheduling} className="flex-1 h-9 gap-1.5 text-xs font-semibold">
                  {scheduling ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Schedule
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudioWizard;

import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Copy, Check, RefreshCw, ChevronLeft, ArrowRight,
  FileText, Lightbulb, Hash, ImagePlus, Wand2, Download, Loader2,
  Shield, Layers, Globe, ClipboardList, Save, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { anthropic, CLAUDE_MODEL, isAnthropicConfigured } from "@/lib/anthropic";
import { sanitizeInput } from "@/lib/security";
import { toast } from "sonner";
import { searchViralReferences, ViralReference, searchUserSources } from "@/lib/embeddings";
import { supabase } from "@/lib/supabase";
import { assertOnline, withRetry, withTimeout, friendlyError } from "@/lib/resilience";
import GenerationProgress, { CONTENT_STEPS } from "@/components/GenerationProgress";
import { scoreAllVariations, scoreColor, scoreBarColor, scoreBadge, type ScoreDetails } from "@/lib/viral-scorer";
import { saveInteraction, getUserStyleMemory, hasStyleMemory } from "@/lib/user-memory";
import { getHooks, detectNiche, getDailyHook, type Hook } from "@/lib/viral-hooks";
import { buildThreadPlaybook } from "@/lib/thread-playbook";
import { buildReelPlaybook } from "@/lib/reel-playbook";
import { buildYoutubePlaybook } from "@/lib/youtube-playbook";
import { buildLinkedinPlaybook } from "@/lib/linkedin-playbook";
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

type SourceMode = "document" | "idea" | "keyword";

const sourceModes: { id: SourceMode; label: string; placeholder: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "document", label: "Document", placeholder: "Paste the text from your article, PDF or web page...", icon: FileText },
  { id: "idea", label: "Idea", placeholder: "Describe your idea, what you want to convey...", icon: Lightbulb },
  { id: "keyword", label: "Keyword", placeholder: "E.g.: productivity, AI, digital marketing...", icon: Hash },
];

/* ─── Angles & scores ─── */

const ANGLE_LABELS = ["Educational", "Storytelling", "Provocative", "Practical", "Debate"] as const;
const ANGLE_COLORS: Record<string, string> = {
  "Educational": "bg-blue-500/15 text-blue-400",
  "Storytelling": "bg-purple-500/15 text-purple-400",
  "Provocative": "bg-red-500/15 text-red-400",
  "Practical": "bg-emerald-500/15 text-emerald-400",
  "Debate": "bg-amber-500/15 text-amber-400",
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
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^---+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseVariations(raw: string): ParsedVariation[] {
  // Split by the requested separator
  let parts = raw.split(/---VARIATION---/).map((s) => s.trim()).filter((s) => s.length > 20);

  // Fallback: split by numbering if the model doesn't use the separator
  if (parts.length < 2) {
    parts = raw.split(/\n\s*(?=\d\.\s)/).map((v) => v.replace(/^\d\.\s*/, "").trim()).filter((v) => v.length > 20);
  }

  // Ultimate fallback: everything as a single variation
  if (parts.length === 0) parts = [raw.trim()];

  return parts.map((content, idx) => ({
    angle: ANGLE_LABELS[idx % ANGLE_LABELS.length],
    content: stripMarkdown(content),
    words: wordCount(stripMarkdown(content)),
    score: 0,
    scoring: true,
  }));
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
  activityData?: ActivityData & { DAYS_FR: string[]; refetch: () => void };
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

  /* ── Generation ── */

  async function handleGenerate() {
    const isDocMode = sourceMode === "document" && selectedDocumentIds.length > 0;
    if (!selectedPlatform || !selectedFormat) return;
    if (!isDocMode && !sourceText.trim()) return;

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
      // === SECTION 2 : Contexte utilisateur (RAG sources) ===
      let userSection = "";
      const ragIds = isDocMode
        ? [...new Set([...selectedDocumentIds, ...activeSourceIds])]
        : activeSourceIds;

      if (ragIds.length > 0) {
        // searchUserSources a son propre fallback interne
        const userRefs = await searchUserSources(sanitized, ragIds, 8);
        if (userRefs.length > 0) {
          userSection = "\n\n## CONTEXTE UTILISATEUR (sources sélectionnées)\n" +
            userRefs.map((r) => `### [${r.type.toUpperCase()}] ${r.title}\n${r.content.slice(0, 3000)}`).join("\n\n");
        }
      }

      // Fallback ultime si RAG n'a rien retourné : injecter le contenu brut des sources sélectionnées
      if (ragIds.length > 0 && !userSection) {
        const selected = sources.filter((s) => ragIds.includes(s.id));
        if (selected.length > 0) {
          userSection = "\n\n## CONTEXTE UTILISATEUR (sources sélectionnées)\n" +
            selected.map((s) => `### [${s.type.toUpperCase()}] ${s.title}\n${s.content.slice(0, 3000)}`).join("\n\n");
        }
      }

      // Inject source directives if any
      const sourceDirectives = sources
        .filter((s) => ragIds.includes(s.id) && s.directive)
        .map((s) => `- "${s.directive}" (from ${s.title})`)
        .join("\n");
      if (sourceDirectives) {
        userSection += `\n\n## DOCUMENT FOCUS INSTRUCTIONS\nThe user wants to focus on these specific aspects:\n${sourceDirectives}\nGenerate content that specifically addresses these topics from the provided documents.`;
      }

      // === SECTION 3 : Modèles viraux (RAG viral) ===
      let viralSection = "";
      try {
        const refs: ViralReference[] = await searchViralReferences(sanitized, selectedPlatform.name, selectedFormat, 3);
        if (refs.length > 0) {
          viralSection = "\n\n## MODÈLES VIRAUX DE RÉFÉRENCE\nInspire-toi du ton, de la structure et du style. Ne copie pas.\n" +
            refs.map((r, i) => `### Modèle ${i + 1}\n${r.content}`).join("\n\n");
        }
      } catch { /* RAG indisponible */ }

      const modeLabel = isDocMode
        ? "Here are source documents to transform into content"
        : sourceMode === "idea" ? "Here is an idea to develop" : "Here is a topic / keyword";

      const userMessage = isDocMode
        ? `${modeLabel}. The selected sources are: ${sanitized}. Generate content based ONLY on these sources.`
        : `${modeLabel}:\n\n${sanitized}`;

      // === Instruction spéciale mode document ===
      const docInstruction = isDocMode
        ? `\n11. You MUST base the content ONLY on the sources provided in SECTION 2. Cite facts, figures and ideas that come directly from these sources. Do NOT generate information that is not in the sources.`
        : "";

      // === SECTION 5 : Style utilisateur (mémoire) ===
      let styleSection = "";
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          styleSection = await getUserStyleMemory(currentUser.id, selectedPlatform.name);
          setStyleMemoryActive(styleSection.length > 0);
        }
      } catch { /* memory is non-critical */ }

      // === GHOSTWRITER-STYLE PROMPT ===
      const systemPrompt = `You are a world-class ghostwriter for social media creators.
You write content that sounds like a real person talking — not a content machine producing templates.${userSection}${viralSection}${styleSection}

YOUR WRITING STYLE:
- Short punchy sentences. Like this. Then one longer one for contrast.
- NO bold text. NO asterisks. NO markdown formatting ever.
- NO numbered lists. Weave numbers into prose naturally.
- NO bullet points. Write in flowing paragraphs.
- Start with a specific moment, number, or bold claim.
- Use "I" sparingly — maximum 3 times per post.
- Specific details beat vague generalizations always.
  ("My post got 2.3M views on a Tuesday at 2am" not "posts can go viral")
- One idea per post. Not 5, not 8. ONE.
- End with ONE short question. Never "What do you think?"

WHAT MAKES CONTENT FEEL GENERIC (NEVER DO THIS):
- Starting with "Here's how to..." or "Want to..." or "Follow these X steps"
- Using bold headers to organize content
- Numbered lists (1. 2. 3. 4. 5.)
- Phrases like "game changer", "leverage", "optimize", "actionable"
- Giving 7-8 tips in one post
- Ending with "Let me know in the comments" or "Drop a like if you agree"
- Any sentence that could apply to ANY topic (not specific to THIS topic)

WHAT MAKES CONTENT FEEL REAL (ALWAYS DO THIS):
- A specific story moment in the first 3 lines
- One contrarian or uncomfortable truth
- A personal mistake or failure
- A specific number or date or person
- Something that sounds like it could get the author in trouble
- Raw emotion: frustration, surprise, regret, excitement
- A question the reader is afraid to answer honestly

PLATFORM RULES:
- LinkedIn: 150-220 words. Conversational but professional. No emojis. Paragraphs of 1-3 lines max.
- Instagram: 80-150 words. Punchy. Can use 1-2 emojis max.
- X/Twitter: Under 280 chars for hook. Then thread if needed.
- TikTok: Script format. Spoken word. Very casual.

Current platform: ${selectedPlatform.name}
Current format: ${selectedFormat}
${selectedFormat?.toLowerCase() === "thread" ? buildThreadPlaybook(profile?.niche || "", sanitized) : ""}
${/reel|video script|script shorts/i.test(selectedFormat || "") ? buildReelPlaybook(profile?.niche || "", sanitized) : ""}
${/script long/i.test(selectedFormat || "") ? buildYoutubePlaybook(profile?.niche || "", sanitized) : ""}
${selectedPlatform?.name === "LinkedIn" && selectedFormat?.toLowerCase() === "post" ? buildLinkedinPlaybook(profile?.niche || "", sanitized) : ""}
FOR EACH VARIATION, USE A DIFFERENT APPROACH:
- Variation 1: Open with a specific failure or mistake
- Variation 2: Open with a surprising number or stat
- Variation 3: Open with a contrarian statement (challenge common wisdom)
- Variation 4: Open with a specific moment in time
- Variation 5: Open with a question that stings a little

ABSOLUTE RULES:
- Zero markdown formatting (no **, no ##, no -, no __, no numbered lists)
- Zero em dash as universal connector (use commas, periods, or parens instead)
- Zero generic advice that applies to everyone
- Every sentence must earn its place
- If a sentence doesn't move the reader forward, delete it
- Write ALL content in ENGLISH only
- NEVER use artificially enthusiastic phrases ("Perfect!", "Absolutely!", "Excellent!")${docInstruction}

BANNED WORDS (zero tolerance — these are the classic AI tells):
delve, pivotal, tapestry, underscore, bolster, meticulous, vibrant, testament,
garner, intricate, interplay, showcase, foster, emphasize, enduring, align,
resonate, enhance, crucial, landscape (figurative), realm, beacon, illuminate,
harness, facilitate, seamless, robust, leverage, boast, boasts, nestled,
symbolize, encompass, evolving, shaping, unlock, elevate, empower,
revolutionize, groundbreaking, cutting-edge, game-changing, state-of-the-art,
next-level, holistic, synergy, streamline, optimize, actionable, transformative

BANNED PHRASES (never use):
"In today's fast-paced", "In today's digital landscape", "In today's world",
"In the realm of", "At its core", "It's important to note", "It's important to remember",
"It is crucial to", "It is essential to", "Without further ado", "At the end of the day",
"Game changer", "Embark on a journey", "In conclusion", "In summary", "Overall",
"Furthermore", "Moreover", "Additionally" (sentence start), "It goes without saying",
"Navigate the complexities", "Navigate the landscape", "Dive into", "Deep dive",
"Stands as a testament", "Serves as a reminder", "A vital role", "Key turning point",
"Focal point", "Indelible mark", "Deeply rooted", "Rich tapestry", "Valuable insights",
"Align with", "Resonate with", "Contributing to", "Setting the stage for",
"Reflects a broader", "Symbolizing its ongoing", "Have you ever wondered",
"Here's the thing", "Here's the truth", "But here's the thing", "The result?",
"Hot take:", "Trust me", "Let me tell you"

BANNED STRUCTURES:
- No "Not just X, but Y" / "Not only X, but also Y" / "It's not X, it's Y" parallelisms
- No rule-of-three clichés (three adjectives in a row, three short phrases)
- No "From X to Y" false ranges
- No "-ing" phrases tacked onto sentence ends for superficial analysis
  BAD: "...creating a dynamic landscape, highlighting its importance"
- No "Despite X, Y faces challenges..." conclusions
- No vague attributions ("Experts say", "Studies show", "Many believe")
- No hedge-heavy prose (might, could, perhaps, generally, typically, more often than not)
- No title case in headings — use sentence case

OUTPUT FORMAT (STRICT):
Generate exactly 5 DISTINCT variations, separated by the marker ---VARIATION--- on its own line.
Respond ONLY with the 5 variations separated by ---VARIATION---. Nothing before, nothing after.`;

      assertOnline();
      if (!isAnthropicConfigured()) {
        throw new Error("Anthropic API key not configured. Add VITE_ANTHROPIC_API_KEY to your environment.");
      }

      // Single call — no retry.
      const response = await withTimeout(
        anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        }),
        120_000,
        "Generation took too long. Try again with shorter content.",
      );

      setError(null);
      const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const parsed = parseVariations(text);
      setVariations(parsed);

      if (parsed.length > 0 && onContentGenerated) {
        onContentGenerated(parsed[0].content);
      }

      // Score all variations in parallel via Haiku, then save with real scores
      try {
        const scores = await scoreAllVariations(parsed, selectedPlatform.name, anthropic);
        const scored = parsed.map((v, i) => ({
          ...v,
          score: scores[i]?.total ?? 65,
          scoreDetails: scores[i],
          scoring: false,
        }));
        setVariations(scored);
        await saveVariations(scored);
      } catch {
        // Scoring failed — save with fallback scores
        const fallback = parsed.map((v) => ({ ...v, scoring: false, score: 65 }));
        setVariations(fallback);
        await saveVariations(fallback);
      }
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

      // Create a content_sessions row (best-effort — table may not exist yet)
      const topic = sourceText.trim().slice(0, 200) || "Untitled";
      supabase.from("content_sessions").insert({
        id: sessionId,
        user_id: user.id,
        topic,
        platform: selectedPlatform.name,
        format: selectedFormat,
      }).then(() => {}, () => {}); // Fire-and-forget, ignore errors

      const allSourceIds = [...new Set([...activeSourceIds, ...selectedDocumentIds])];
      const baseInserts = parsed.map((v) => ({
        user_id: user.id,
        platform: selectedPlatform.name,
        format: selectedFormat,
        content: v.content,
        viral_score: v.score || 0,
        image_prompt: v.scoreDetails ? JSON.stringify(v.scoreDetails) : null,
        source_ids: allSourceIds,
      }));

      // Try with session_id first, fallback without if column doesn't exist
      const insertsWithSession = baseInserts.map((ins) => ({ ...ins, session_id: sessionId }));
      let { data: savedRows, error: saveErr } = await supabase.from("generated_content").insert(insertsWithSession).select("id");

      if (saveErr) {
        // Retry without session_id (column may not exist yet)
        const retryResult = await supabase.from("generated_content").insert(baseInserts).select("id");
        savedRows = retryResult.data;
        saveErr = retryResult.error;
      }

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
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: `You are an expert in content rewriting. Make this text undetectable by AI detectors while keeping the same message.\nRules: English only. Natural, imperfect, human phrasing. Vary sentence length. Keep the format adapted to ${selectedPlatform.name}. Respond only with the rewritten text.`,
        messages: [{ role: "user", content: `Humanize this content:\n\n${original.content}` }],
      });
      const raw = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const text = stripMarkdown(raw);
      setVariations((prev) => prev.map((v, i) => i === idx ? { ...v, content: text, words: wordCount(text) } : v));
      toast.success("Humanized! Undetectable by AI detectors ✓");
    } catch (err: unknown) {
      setError(`Humanization error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsHumanizing(false);
    }
  }

  const [imagePanel, setImagePanel] = useState<number | null>(null);
  const [imageGenerating, setImageGenerating] = useState<number | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({});
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

  async function handleInfraPrompt(idx: number) {
    if (infraPanel === idx && infraContent) { setInfraPanel(null); return; }
    setInfraPanel(idx);
    setImagePanel(null);
    setInfraContent("");
    setGenInfra(true);
    try {
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 400,
        system: `You are an expert in viral infographic design. Create an infographic structure for this ${selectedPlatform?.name || ""} content. Format: TITLE: [max 8 words]\nPOINT 1: [short text]\nPOINT 2: [short text]\nPOINT 3: [short text]\nCTA: [call to action]\nIn English. Respond ONLY with the structure.`,
        messages: [{ role: "user", content: variations[idx].content.slice(0, 600) }],
      });
      setInfraContent(response.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
    } catch (err) {
      if (IS_DEV) console.error("Infographic error:", err);
      toast.error("Infographic generation error");
      setGenInfra(false);
    }
    setGenInfra(false);
  }

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
          <motion.div key="wizard" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: "easeOut" }} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 pt-4 pb-3 shrink-0 border-b border-border/10">
              <div className="flex items-center gap-2">
                <button onClick={goBack} className="w-7 h-7 rounded-lg border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground">New content</span>
                    {breadcrumb && (<><span className="text-muted-foreground/30 text-[10px]">/</span><span className="text-[11px] text-muted-foreground truncate">{breadcrumb}</span></>)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (<div key={i} className={cn("h-1 rounded-full transition-all duration-300", i <= step ? "bg-primary w-4" : "bg-accent/40 w-2")} />))}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-lg mx-auto px-5 py-6">
                <AnimatePresence mode="wait">
                  {step === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <p className="text-xs text-muted-foreground mb-3">Choose the network</p>
                      <div className="flex flex-wrap gap-2">
                        {sortedPlatforms.map((p) => {
                          const isFav = favPlatformNames.includes(p.name);
                          return (
                            <button key={p.id} onClick={() => { setSelectedPlatform(p); setStep(1); supabase.auth.getUser().then(({ data: { user: u } }) => { if (u) hasStyleMemory(u.id, p.name).then(setStyleMemoryActive); }); }} className={cn("flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-muted-foreground hover:text-foreground hover:bg-accent/40 hover:border-border/50 active:scale-[0.97] transition-all", isFav ? "border-primary/20 bg-primary/[0.03]" : "border-border/30")}>
                              <p.icon className="w-4 h-4" /><span className="text-xs font-medium">{p.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                  {step === 1 && selectedPlatform && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <p className="text-xs text-muted-foreground mb-3">Content type</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPlatform.formats.map((f) => (
                          <button key={f} onClick={() => { setSelectedFormat(f); setStep(2); }} className="px-4 py-2 rounded-lg text-xs font-medium border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/40 hover:border-border/50 active:scale-[0.97] transition-all">{f}</button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {step === 2 && selectedPlatform && selectedFormat && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <p className="text-xs text-muted-foreground mb-3">Your source material</p>
                      <div className="flex gap-1 mb-4 p-0.5 rounded-lg bg-accent/20 border border-border/20">
                        {sourceModes.map((m) => (
                          <button key={m.id} onClick={() => { setSourceMode(m.id); setSourceText(""); setSelectedDocumentIds([]); }} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-medium transition-all", sourceMode === m.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                            <m.icon className="w-3 h-3" />{m.label}
                          </button>
                        ))}
                      </div>

                      {/* DOCUMENT MODE — source selection */}
                      {sourceMode === "document" && (
                        <div>
                          {sources.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border/30 p-6 text-center">
                              <FileText className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
                              <p className="text-xs font-medium text-muted-foreground mb-1">No documents available</p>
                              <p className="text-[11px] text-muted-foreground/60">Add sources (PDF, URL, Notes) in your Notebook to use them here.</p>
                            </div>
                          ) : (
                            <>
                              <p className="text-[11px] text-muted-foreground/70 mb-2">
                                Select the documents to use as a base ({selectedDocumentIds.length} selected)
                              </p>
                              <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                                {sources.map((s) => {
                                  const isChecked = selectedDocumentIds.includes(s.id);
                                  const TypeIcon = sourceTypeIcons[s.type] || StickyNote;
                                  const words = s.content ? s.content.split(/\s+/).length : 0;
                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => toggleDocumentId(s.id)}
                                      className={cn(
                                        "w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all",
                                        isChecked
                                          ? "border-primary/40 bg-primary/5"
                                          : "border-border/20 hover:border-border/40 hover:bg-accent/20",
                                      )}
                                    >
                                      {/* Checkbox */}
                                      <div className={cn(
                                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                        isChecked ? "bg-primary border-primary" : "border-border/40",
                                      )}>
                                        {isChecked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                      </div>
                                      {/* Icon */}
                                      <div className={cn(
                                        "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                                        isChecked ? "bg-primary/15 text-primary" : "bg-accent/50 text-muted-foreground",
                                      )}>
                                        <TypeIcon className="w-3 h-3" />
                                      </div>
                                      {/* Info */}
                                      <div className="flex-1 min-w-0">
                                        <p className={cn("text-xs truncate", isChecked ? "text-foreground font-medium" : "text-muted-foreground")}>{s.title}</p>
                                        <p className="text-[10px] text-muted-foreground/50">
                                          {s.type === "url" ? "Link" : s.type === "pdf" ? "PDF" : "Note"}
                                          {words > 0 && ` · ${words} words`}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                              {selectedDocumentIds.length > 0 && (
                                <p className="text-[10px] text-primary/70 mt-2">
                                  AI will generate content based on these {selectedDocumentIds.length} document{selectedDocumentIds.length > 1 ? "s" : ""}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* IDEA MODE — textarea */}
                      {sourceMode === "idea" && (
                        <div>
                          <Textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder={sourceModes.find((m) => m.id === sourceMode)?.placeholder} maxLength={5000} className="bg-accent/20 border-border/30 min-h-[120px] resize-none text-sm" />
                          <div className="flex items-center justify-between mt-1.5">
                            <span className={cn("text-[10px] font-mono", sourceText.length < 150 ? "text-emerald-400/60" : sourceText.length < 200 ? "text-amber-400/60" : "text-red-400/60")}>
                              {sourceText.length} chars
                            </span>
                          </div>
                          {!sourceText.trim() && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {["How I grew my LinkedIn from 0 to 10K", "3 mistakes beginners make on Instagram", "Why most content fails (and how to fix it)", "The truth about going viral in 2026", "My morning routine as a content creator"].map((ex) => (
                                <button key={ex} type="button" onClick={() => setSourceText(ex)} className="text-[10px] px-2.5 py-1 rounded-full bg-accent/20 border border-border/20 text-muted-foreground/60 hover:text-foreground hover:bg-accent/40 transition-all">
                                  {ex}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* KEYWORD MODE — input */}
                      {sourceMode === "keyword" && (
                        <div>
                          <Input value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder={sourceModes.find((m) => m.id === sourceMode)?.placeholder} maxLength={200} className="bg-accent/20 border-border/30 h-11 text-sm" onKeyDown={(e) => e.key === "Enter" && sourceText.trim() && handleGenerate()} />
                          <span className={cn("text-[10px] font-mono mt-1 block", sourceText.length < 150 ? "text-emerald-400/60" : sourceText.length < 200 ? "text-amber-400/60" : "text-red-400/60")}>
                            {sourceText.length}/200
                          </span>
                        </div>
                      )}

                      {/* Hook suggestions for idea/keyword modes */}
                      {(sourceMode === "idea" || sourceMode === "keyword") && sourceText.trim().length > 3 && suggestedHooks.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Suggested hooks</p>
                          {suggestedHooks.map((hook, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSourceText(hook.text)}
                              className="text-[11px] text-left w-full px-2.5 py-1.5 rounded-lg bg-accent/15 hover:bg-accent/30 text-muted-foreground/70 hover:text-foreground transition-all truncate flex items-center gap-2"
                            >
                              <span className="text-amber-400/60 shrink-0">→</span>
                              <span className="truncate">{hook.text}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <Button
                        onClick={handleGenerate}
                        disabled={
                          (sourceMode === "document" ? selectedDocumentIds.length === 0 : !sourceText.trim()) || isGenerating
                        }
                        className="w-full h-11 mt-4 glow-sm gap-2 font-semibold text-sm"
                      >
                        {isGenerating ? (<><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>) : (<><Sparkles className="w-4 h-4" /> Generate 5 variations</>)}
                      </Button>

                      {styleMemoryActive && !isGenerating && (
                        <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-primary/60">
                          <Brain className="w-3 h-3" />
                          <span>Adapted to your style</span>
                        </div>
                      )}

                      {isGenerating && (
                        <div className="mt-4">
                          <GenerationProgress isActive={isGenerating} steps={CONTENT_STEPS} estimatedSeconds={25} />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════ RESULTS ═══════ */}
        {variations.length > 0 && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-4 pb-3 shrink-0 border-b border-border/10">
              <div className="flex items-center gap-2">
                <button onClick={goBack} className="w-7 h-7 rounded-lg border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1">
                  <span className="text-xs font-semibold">{variations.length} variations</span>
                  <span className="text-[11px] text-muted-foreground ml-2">{breadcrumb}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const all = variations.map((v, i) => `--- Variation ${i + 1} ---\n${v.content}`).join("\n\n");
                    navigator.clipboard.writeText(all);
                    toast.success("All variations copied!");
                  }}
                >
                  <Copy className="w-3 h-3" /> Copy All
                </Button>
              </div>
            </div>

            {/* Cards — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="max-w-lg mx-auto space-y-3">
                {(() => { const bestIdx = variations.reduce((best, v, i) => v.score > variations[best].score ? i : best, 0); return null; })()}
                {variations.map((v, idx) => {
                  const isSelected = selectedVariation === idx;
                  const angleColor = ANGLE_COLORS[v.angle] || "bg-accent/40 text-muted-foreground";
                  const isBestScore = v.score > 0 && v.score === Math.max(...variations.map(x => x.score));
                  return (
                    <div key={idx}>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => { setSelectedVariation(isSelected ? null : idx); setImagePanel(null); setInfraPanel(null); }}
                        className={cn("rounded-xl border p-4 cursor-pointer transition-all", isSelected ? "border-primary/40 bg-primary/[0.03] ring-1 ring-primary/15" : "border-border/20 hover:border-border/40")}
                      >
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", angleColor)}>{v.angle}</span>
                          {isBestScore && <span className="text-[9px] font-semibold text-amber-400">🔥 Top Pick</span>}
                          {isSelected && <span className="text-[9px] text-primary/70 flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Selected</span>}
                          <span className="text-[10px] text-muted-foreground/50 ml-auto">{v.words} words</span>
                          <div className="flex items-center gap-1.5 group/score relative">
                            {v.scoring ? (
                              <span className="text-[9px] text-muted-foreground/50 animate-pulse">Analyzing...</span>
                            ) : (
                              <>
                                <div className="w-12 h-1.5 rounded-full bg-accent/30 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${v.score}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className={cn("h-full rounded-full", scoreBarColor(v.score))}
                                  />
                                </div>
                                <span className={cn("text-[10px] font-semibold", scoreColor(v.score))}>{v.score}</span>
                                {scoreBadge(v.score) && (
                                  <span className="text-[8px] text-emerald-400/70 font-medium">{scoreBadge(v.score)}</span>
                                )}
                                {/* Score tooltip */}
                                {v.scoreDetails && (
                                  <div className="absolute right-0 top-full mt-1 z-50 hidden group-hover/score:block">
                                    <div className="bg-card border border-border/30 rounded-lg shadow-xl p-3 w-52 text-[10px]">
                                      <div className="space-y-1.5 mb-2">
                                        <div className="flex justify-between"><span className="text-muted-foreground">Hook</span><span className="font-semibold">{v.scoreDetails.hook}/20</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Emotion</span><span className="font-semibold">{v.scoreDetails.emotion}/20</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Specificity</span><span className="font-semibold">{v.scoreDetails.specificity}/20</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Actionable</span><span className="font-semibold">{v.scoreDetails.actionable}/20</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">CTA</span><span className="font-semibold">{v.scoreDetails.cta}/20</span></div>
                                      </div>
                                      {v.scoreDetails.feedback && (
                                        <p className="text-muted-foreground/80 text-[9px] border-t border-border/20 pt-1.5">{v.scoreDetails.feedback}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-foreground/85">{v.content}</p>

                        {/* Like/Dislike feedback */}
                        <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border/10">
                          <span className="text-[9px] text-muted-foreground/40 mr-1">Like this content?</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleFeedback(idx, "liked"); }}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] transition-all",
                              feedback[idx] === "liked"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "text-muted-foreground/40 hover:text-emerald-400 hover:bg-emerald-500/10"
                            )}
                          >
                            <ThumbsUp className="w-2.5 h-2.5" />
                            {feedback[idx] === "liked" ? "Liked" : "Like"}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleFeedback(idx, "disliked"); }}
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] transition-all",
                              feedback[idx] === "disliked"
                                ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                : "text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10"
                            )}
                          >
                            <ThumbsDown className="w-2.5 h-2.5" />
                            {feedback[idx] === "disliked" ? "Not for me" : "Not great"}
                          </button>
                          {feedback[idx] === "liked" && (
                            <span className="text-[9px] text-primary/50 ml-auto flex items-center gap-1">
                              <Brain className="w-2.5 h-2.5" /> Style saved
                            </span>
                          )}
                        </div>

                        {/* Actions inline */}
                        {isSelected && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-border/15">
                            <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1.5 px-2.5 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); handleCopy(idx); }}>
                              {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              {copiedIdx === idx ? "Copied" : "Copy"}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1.5 px-2.5 text-muted-foreground hover:text-foreground" disabled={isHumanizing} onClick={(e) => { e.stopPropagation(); handleHumanize(idx); }}>
                              {isHumanizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                              Humanize
                            </Button>
                            {selectedFormat?.toLowerCase() !== "thread" && (
                              <Button variant="ghost" size="sm" className={cn("h-7 text-[11px] gap-1.5 px-2.5", imagePanel === idx ? "text-primary" : generatedImages[idx] ? "text-emerald-400" : "text-muted-foreground hover:text-foreground")} disabled={imageGenerating !== null && imageGenerating !== idx} onClick={(e) => { e.stopPropagation(); handleGenerateImage(idx); }}>
                                {imageGenerating === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
                                {generatedImages[idx] ? (imagePanel === idx ? "Hide" : "View image") : imageGenerating === idx ? "Generating..." : "Image"}
                              </Button>
                            )}
                            {selectedFormat?.toLowerCase() !== "thread" && (
                              <Button variant="ghost" size="sm" className={cn("h-7 text-[11px] gap-1.5 px-2.5", infraPanel === idx ? "text-primary" : "text-muted-foreground hover:text-foreground")} onClick={(e) => { e.stopPropagation(); handleInfraPrompt(idx); }}>
                                <Layers className="w-3 h-3" /> Infographic
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1.5 px-2.5 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setScheduleIdx(idx); setScheduleDate(new Date().toISOString().slice(0, 10)); }}>
                              <CalendarDays className="w-3 h-3" /> Schedule
                            </Button>
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Panel image */}
                      <AnimatePresence>
                        {imagePanel === idx && isSelected && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}>
                            <div className="mt-1 p-3 rounded-lg bg-accent/20 border border-border/15">
                              {imageGenerating === idx ? (
                                <div className="flex items-center justify-center gap-2 py-8"><Loader2 className="w-4 h-4 animate-spin text-primary" /><span className="text-[11px] text-muted-foreground">Generating image...</span></div>
                              ) : generatedImages[idx] ? (
                                <>
                                  <div className="relative rounded-xl overflow-hidden">
                                    <img src={`data:image/jpeg;base64,${generatedImages[idx]}`} alt="Generated image" className="w-full rounded-xl" />
                                    <div className="absolute bottom-2 right-2 flex gap-2">
                                      <button onClick={(e) => { e.stopPropagation(); const link = document.createElement("a"); link.href = `data:image/jpeg;base64,${generatedImages[idx]}`; link.download = `supen-image-${Date.now()}.jpg`; link.click(); }} className="bg-black/60 backdrop-blur-sm text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-black/80 transition-all">
                                        <Download className="w-3 h-3" /> Download
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); handleGenerateImage(idx, true); }} className="bg-black/60 backdrop-blur-sm text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-black/80 transition-all">
                                        <RefreshCw className="w-3 h-3" /> Regenerate
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">AI-generated image — adapted to this post's content</p>
                                </>
                              ) : null}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Infographic panel */}
                      <AnimatePresence>
                        {infraPanel === idx && isSelected && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}>
                            <div className="mt-1 p-3 rounded-lg bg-accent/20 border border-border/15">
                              <p className="text-[10px] font-medium text-muted-foreground/70 mb-2">Infographic structure</p>
                              {genInfra ? (
                                <div className="flex items-center gap-2 py-2"><RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Generating...</span></div>
                              ) : (
                                <>
                                  <div className="text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/80 mb-2">{infraContent}</div>
                                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2 text-muted-foreground" onClick={() => { navigator.clipboard.writeText(infraContent); setInfraCopied(true); toast.success("Structure copied. Use it in Canva or Nano Banana."); setTimeout(() => setInfraCopied(false), 2000); }}>
                                    {infraCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                    {infraCopied ? "Copied" : "Copy structure"}
                                  </Button>
                                  <p className="text-[9px] text-muted-foreground/40 mt-1">Use this structure in Canva or Nano Banana</p>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                {/* ═══ INLINE INFOGRAPHIC SECTION ═══ */}
                {saveStatus === "saved" && (
                  <div className="border-t border-border/20 mt-4 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Infographic
                      </h3>
                      {generatedInfographicBase64 && (
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2 text-muted-foreground" onClick={() => {
                            const link = document.createElement("a");
                            link.href = `data:image/png;base64,${generatedInfographicBase64}`;
                            link.download = `supen-infographic-${Date.now()}.png`;
                            link.click();
                            toast.success("PNG downloaded!");
                          }}>
                            <Download className="w-3 h-3" /> PNG
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2 text-muted-foreground" onClick={() => {
                            const link = document.createElement("a");
                            link.href = `data:image/jpeg;base64,${generatedInfographicBase64}`;
                            link.download = `supen-infographic-${Date.now()}.jpg`;
                            link.click();
                            toast.success("JPEG downloaded!");
                          }}>
                            <Download className="w-3 h-3" /> JPEG
                          </Button>
                        </div>
                      )}
                    </div>

                    {generatedInfographicBase64 ? (
                      <div className="rounded-xl overflow-hidden border border-border/20">
                        <img
                          src={`data:image/png;base64,${generatedInfographicBase64}`}
                          alt="Generated infographic"
                          className="w-full h-auto"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center h-32 bg-accent/5 rounded-xl border-2 border-dashed border-border/20 cursor-pointer hover:border-primary/30 hover:bg-primary/[0.03] transition-all"
                        onClick={() => setShowInfographic(true)}
                      >
                        <div className="text-center">
                          <Sparkles className="w-6 h-6 text-primary/50 mx-auto mb-2" />
                          <p className="text-sm font-medium">Generate Infographic</p>
                          <p className="text-xs text-muted-foreground mt-1">Turn this into a shareable visual</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Spacer for the fixed bar */}
                <div className="h-14" />
              </div>
            </div>

            {/* ═══ FIXED ACTION BAR AT BOTTOM ═══ */}
            <div className="shrink-0 px-4 py-2.5 border-t border-border/20 bg-background/95 backdrop-blur-sm">
              <div className="max-w-lg mx-auto flex items-center gap-2">
                {/* Left — save status */}
                {saveStatus === "saving" && (
                  <span className="text-[9px] text-muted-foreground flex items-center gap-1 shrink-0">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Saving...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="text-[9px] text-emerald-400/70 flex items-center gap-1 shrink-0">
                    <Check className="w-2.5 h-2.5" /> Saved
                  </span>
                )}
                {saveStatus === "failed" && (
                  <Button variant="ghost" size="sm" onClick={retrySave} className="h-6 text-[9px] gap-1 px-2 text-red-400 hover:text-red-300 shrink-0">
                    <Save className="w-2.5 h-2.5" /> Save
                  </Button>
                )}
                <button onClick={reset} className="text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors shrink-0">
                  Start over
                </button>

                <div className="flex-1" />

                {/* Right — actions */}
                <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating} className="h-7 text-[10px] gap-1 px-2 text-muted-foreground shrink-0">
                  <RefreshCw className={cn("w-3 h-3", isGenerating && "animate-spin")} />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2 text-muted-foreground shrink-0" onClick={() => { handleCopy(selectedVariation ?? 0); }}>
                  <ClipboardList className="w-3 h-3" /> Copy
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2 text-muted-foreground shrink-0" onClick={handleGoToDashboard}>
                  <ChevronLeft className="w-3 h-3" /> Dashboard
                </Button>
                <Button
                  size="sm"
                  onClick={handleViewContents}
                  disabled={saveStatus === "saving"}
                  className="h-7 text-[10px] gap-1 px-3 glow-sm shrink-0"
                >
                  {saveStatus === "saving" ? (
                    <><RefreshCw className="w-3 h-3 animate-spin" /> Saving...</>
                  ) : (
                    <><Sparkles className="w-3 h-3" /> New content</>
                  )}
                </Button>
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
        open={showInfographic}
        onClose={() => setShowInfographic(false)}
        content={variations[selectedVariation ?? 0]?.content || ""}
        platform={selectedPlatform?.name || ""}
        contentId={variations[selectedVariation ?? 0]?.dbId}
        sessionId={currentSessionId || undefined}
        existingHtml={infographics[selectedVariation ?? 0]}
        onGenerated={(html, base64) => {
          const idx = selectedVariation ?? 0;
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

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Youtube, Lightbulb, Wand2, BarChart3, TrendingUp,
  Loader2, Wrench, Check, Copy, Plus, ChevronDown, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/use-profile";
import { useSources } from "@/hooks/use-sources";
import { assertOnline, withTimeout, friendlyError } from "@/lib/resilience";
import { getHooks } from "@/lib/viral-hooks";
import { fetchTrends, type Trend } from "@/lib/trends";
import { useNavigate } from "react-router-dom";

type ToolId = "transcriber" | "hooks" | "humanizer" | "analyzer" | "trends";

const TOOLS: Array<{
  id: ToolId;
  title: string;
  description: string;
  icon: typeof Youtube;
  color: string;
}> = [
  {
    id: "transcriber",
    title: "YouTube Transcriber",
    description: "Extract the transcript from a YouTube video and add it to your sources.",
    icon: Youtube,
    color: "text-red-400 bg-red-500/10",
  },
  {
    id: "hooks",
    title: "Viral Hook Generator",
    description: "10 powerful hooks ready to use for your niche.",
    icon: Lightbulb,
    color: "text-amber-400 bg-amber-500/10",
  },
  {
    id: "humanizer",
    title: "Anti-AI Humanizer",
    description: "Transform AI text into 100% human writing.",
    icon: Wand2,
    color: "text-purple-400 bg-purple-500/10",
  },
  {
    id: "analyzer",
    title: "Viral Analyzer",
    description: "Analyze a competitor's post and discover what makes it viral.",
    icon: BarChart3,
    color: "text-emerald-400 bg-emerald-500/10",
  },
  {
    id: "trends",
    title: "Trends Radar",
    description: "Discover trending topics in your niche in real-time.",
    icon: TrendingUp,
    color: "text-cyan-400 bg-cyan-500/10",
  },
];

const PLATFORMS_LIST = ["Instagram", "TikTok", "LinkedIn", "Facebook", "X (Twitter)", "YouTube"];

const Tools = () => {
  const { profile } = useProfile();
  const { addNote } = useSources();
  const [openTool, setOpenTool] = useState<ToolId | null>(null);

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Toolbox</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-12">
              Free utilities to speed up your workflow.
            </p>
          </div>

          {/* Tools grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TOOLS.map((tool, i) => (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setOpenTool(openTool === tool.id ? null : tool.id)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  openTool === tool.id
                    ? "border-primary/40 bg-primary/[0.03] ring-1 ring-primary/15"
                    : "border-border/30 bg-card/50 hover:border-border/60",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", tool.color)}>
                    <tool.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold mb-0.5">{tool.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{tool.description}</p>
                  </div>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-1 transition-transform", openTool === tool.id && "rotate-180")} />
                </div>
              </motion.button>
            ))}
          </div>

          {/* Tool panels */}
          <AnimatePresence mode="wait">
            {openTool === "transcriber" && (
              <motion.div key="transcriber" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
                <YouTubeTranscriber addNote={addNote} />
              </motion.div>
            )}
            {openTool === "hooks" && (
              <motion.div key="hooks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
                <HookGenerator profileNiche={profile?.niche} profilePlatforms={profile?.platforms} />
              </motion.div>
            )}
            {openTool === "humanizer" && (
              <motion.div key="humanizer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
                <Humanizer />
              </motion.div>
            )}
            {openTool === "analyzer" && (
              <motion.div key="analyzer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
                <ViralAnalyzer />
              </motion.div>
            )}
            {openTool === "trends" && (
              <motion.div key="trends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
                <TrendsRadar profileNiche={profile?.niche} addNote={addNote} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ─── Tool 1: YouTube Transcriber ─── */

function YouTubeTranscriber({ addNote }: { addNote: (title: string, content: string) => Promise<{ error: string | null }> }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleTranscribe() {
    if (!url.trim()) return;
    setLoading(true);
    setTranscript("");
    setTitle("");
    setAdded(false);

    try {
      assertOnline();
      const { data, error } = await supabase.functions.invoke("youtube-transcript", {
        body: { url: url.trim() },
      });
      if (error) throw new Error(error.message);
      if (!data?.transcript) throw new Error("No transcript returned");

      setTranscript(data.transcript);
      setTitle(data.title || "YouTube Video");
      toast.success("Transcript extracted!");
    } catch (err) {
      toast.error(friendlyError(err) || "Could not extract transcript. Make sure the video has subtitles.");
    }
    setLoading(false);
  }

  async function handleAddToSources() {
    if (!transcript) return;
    setAdding(true);
    const { error } = await addNote(`YouTube: ${title}`, transcript);
    setAdding(false);
    if (error) {
      toast.error(`Error: ${error}`);
    } else {
      setAdded(true);
      toast.success("Transcript added to your sources!");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(transcript);
    toast.success("Transcript copied!");
  }

  return (
    <div className="rounded-xl border border-border/30 bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Youtube className="w-4 h-4 text-red-400" />
        <h3 className="text-sm font-semibold">YouTube Transcriber</h3>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleTranscribe()}
          placeholder="https://youtube.com/watch?v=..."
          disabled={loading}
          className="bg-accent/30 border-border/30 h-10 text-sm"
        />
        <Button onClick={handleTranscribe} disabled={loading || !url.trim()} className="h-10 gap-2 text-xs font-semibold min-w-[120px]">
          {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting...</> : "Transcribe"}
        </Button>
      </div>

      {transcript && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground truncate flex-1">{title}</p>
            <span className="text-[10px] text-muted-foreground/60 ml-2">{transcript.split(/\s+/).length} words</span>
          </div>
          <div className="bg-accent/20 border border-border/20 rounded-lg p-3 mb-3 max-h-64 overflow-y-auto">
            <p className="text-[12px] leading-relaxed text-foreground/85 whitespace-pre-wrap">{transcript}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="h-9 gap-1.5 text-xs">
              <Copy className="w-3 h-3" /> Copy
            </Button>
            <Button onClick={handleAddToSources} disabled={adding || added} size="sm" className="h-9 gap-1.5 text-xs flex-1">
              {adding ? <Loader2 className="w-3 h-3 animate-spin" /> :
               added ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {added ? "Added to sources" : "Add to sources"}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Tool 2: Hook Generator ─── */

function HookGenerator({ profileNiche, profilePlatforms }: { profileNiche?: string; profilePlatforms?: string[] }) {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState(profileNiche || "");
  const [platform, setPlatform] = useState(profilePlatforms?.[0] || "Instagram");
  const [loading, setLoading] = useState(false);
  const [hooks, setHooks] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedLocal, setCopiedLocal] = useState<number | null>(null);

  const localHooks = useMemo(() => getHooks(niche, undefined, 5), [niche]);

  function copyLocalHook(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedLocal(idx);
    toast.success("Hook copied!");
    setTimeout(() => setCopiedLocal(null), 2000);
  }

  async function handleGenerate() {
    if (!topic.trim()) return;
    setLoading(true);
    setHooks([]);

    try {
      assertOnline();
      const response = await withTimeout(
        anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 1000,
          system: `You are an expert in viral hooks for social media. Generate 10 powerful hooks in English for ${platform}, niche ${niche || "creator"}.\n\nStrict rules:\n- Each hook is MAX 12 words\n- No intro, just the 10 numbered hooks 1. to 10.\n- Variety of styles: question, shocking stat, contrarian, confession, promise, story, FOMO\n- Avoid AI cliches (never "delve", "tapestry", "in today's world")\n- Direct, punchy, natural English tone\n- Respond ONLY with the 10 numbered hooks, nothing else`,
          messages: [{ role: "user", content: `Sujet : ${topic.trim()}` }],
        }),
        30_000,
      );

      const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const parsed = text
        .split("\n")
        .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
        .filter((line) => line.length > 5 && line.length < 200);

      if (parsed.length === 0) throw new Error("No hooks generated");
      setHooks(parsed.slice(0, 10));
      toast.success(`${parsed.length} hooks generated!`);
    } catch (err) {
      toast.error(friendlyError(err));
    }
    setLoading(false);
  }

  function copyHook(idx: number) {
    navigator.clipboard.writeText(hooks[idx]);
    setCopiedIdx(idx);
    toast.success("Hook copied!");
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="rounded-xl border border-border/30 bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold">Viral Hook Generator</h3>
      </div>

      <div className="space-y-2 mb-3">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Your topic (e.g., productivity, AI, fitness...)"
          disabled={loading}
          className="bg-accent/30 border-border/30 h-10 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Your niche"
            disabled={loading}
            className="bg-accent/30 border-border/30 h-10 text-sm"
          />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            disabled={loading}
            className="bg-accent/30 border border-border/30 rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            {PLATFORMS_LIST.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
        <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="w-full h-10 gap-2 text-xs font-semibold">
          {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> AI generating...</> : <>Generate 10 custom AI hooks</>}
        </Button>
      </div>

      {/* Local library hooks — instant */}
      {localHooks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
              Library
            </p>
            <span className="text-[9px] text-muted-foreground/40">{localHooks.length} hooks</span>
          </div>
          <div className="space-y-1.5">
            {localHooks.map((hook, idx) => (
              <div key={`lib-${idx}`} className="group flex items-start gap-2 p-2.5 rounded-lg bg-accent/15 border border-border/10 hover:border-border/30 transition-all">
                <span className="text-[8px] text-amber-400/60 font-bold mt-1 shrink-0 uppercase">{hook.type}</span>
                <p className="text-[12px] leading-relaxed text-foreground/85 flex-1">{hook.text}</p>
                <button onClick={() => copyLocalHook(hook.text, idx)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/60 hover:text-foreground shrink-0">
                  {copiedLocal === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI-generated hooks */}
      {hooks.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-medium text-primary/70 uppercase tracking-wider">
              AI-generated for "{topic}"
            </p>
          </div>
          <div className="space-y-1.5">
            {hooks.map((hook, idx) => (
              <div key={idx} className="group flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/15 hover:border-primary/30 transition-all">
                <span className="text-[10px] text-primary/60 font-mono mt-0.5 shrink-0 w-4">{idx + 1}.</span>
                <p className="text-[12px] leading-relaxed text-foreground/90 flex-1">{hook}</p>
                <button onClick={() => copyHook(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/60 hover:text-foreground shrink-0">
                  {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Tool 3: Anti-AI Humanizer ─── */

function Humanizer() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleHumanize() {
    if (!input.trim()) return;
    setLoading(true);
    setOutput("");

    try {
      assertOnline();
      const response = await withTimeout(
        anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 2000,
          system: `You are an expert in anti-AI rewriting. Transform this text into 100% human writing undetectable by AI detectors.\n\nStrict rules:\n- English only\n- Vary sentence length (mix short + long)\n- Natural, imperfect, sometimes casual phrasing\n- No banned AI words: delve, tapestry, vibrant, garner, intricate, foster, leverage, robust, seamless\n- No AI expressions: "in today's world", "game changer", "embark on a journey"\n- Keep the meaning and main message\n- No markdown, no lists\n- Respond ONLY with the rewritten text, nothing else`,
          messages: [{ role: "user", content: input.trim() }],
        }),
        45_000,
      );

      const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      setOutput(text.trim());
      toast.success("Text humanized!");
    } catch (err) {
      toast.error(friendlyError(err));
    }
    setLoading(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border/30 bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Wand2 className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold">Anti-AI Humanizer</h3>
      </div>

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste the text to humanize here..."
        disabled={loading}
        className="bg-accent/30 border-border/30 text-sm min-h-[120px] resize-none mb-2"
      />
      <Button onClick={handleHumanize} disabled={loading || !input.trim()} className="w-full h-10 gap-2 text-xs font-semibold mb-3">
        {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Humanizing...</> : <><Wand2 className="w-3.5 h-3.5" /> Humanize</>}
      </Button>

      {output && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <p className="text-[10px] font-medium text-muted-foreground/60 mb-1.5">Humanized result</p>
          <div className="bg-accent/20 border border-border/20 rounded-lg p-3 mb-2 max-h-64 overflow-y-auto">
            <p className="text-[12px] leading-relaxed text-foreground/90 whitespace-pre-wrap">{output}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopy} className="h-9 gap-1.5 text-xs">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy text"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Tool 4: Viral Analyzer ─── */

interface ViralAnalysis {
  hookScore: number;
  structureScore: number;
  ctaScore: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
}

function ViralAnalyzer() {
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<ViralAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    if (!input.trim()) return;
    setLoading(true);
    setAnalysis(null);

    try {
      assertOnline();
      const response = await withTimeout(
        anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 800,
          system: `You are an expert in viral content. Analyze this post and evaluate its viral potential.\n\nRespond ONLY with this exact JSON (no markdown, no backticks):\n{\n  "hookScore": N (0-100, hook strength),\n  "structureScore": N (0-100, structure quality),\n  "ctaScore": N (0-100, CTA strength),\n  "strengths": ["strength 1", "strength 2", "strength 3"],\n  "weaknesses": ["weakness 1", "weakness 2"],\n  "improvements": ["improvement 1", "improvement 2", "improvement 3"]\n}\n\nBe strict in scoring. All in English.`,
          messages: [{ role: "user", content: input.trim() }],
        }),
        30_000,
      );

      const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const cleaned = text.replace(/```json?/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned) as ViralAnalysis;
      setAnalysis(parsed);
      toast.success("Analysis complete!");
    } catch (err) {
      toast.error(friendlyError(err) || "Could not analyze the content");
    }
    setLoading(false);
  }

  function scoreColor(score: number) {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  }

  function scoreBar(score: number) {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  }

  return (
    <div className="rounded-xl border border-border/30 bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold">Viral Analyzer</h3>
      </div>

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste a post to analyze..."
        disabled={loading}
        className="bg-accent/30 border-border/30 text-sm min-h-[120px] resize-none mb-2"
      />
      <Button onClick={handleAnalyze} disabled={loading || !input.trim()} className="w-full h-10 gap-2 text-xs font-semibold mb-4">
        {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...</> : <><BarChart3 className="w-3.5 h-3.5" /> Analyze</>}
      </Button>

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Scores */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Hook", value: analysis.hookScore },
              { label: "Structure", value: analysis.structureScore },
              { label: "CTA", value: analysis.ctaScore },
            ].map((s) => (
              <div key={s.label} className="bg-accent/20 border border-border/20 rounded-lg p-2.5">
                <p className="text-[9px] text-muted-foreground uppercase mb-1">{s.label}</p>
                <p className={cn("text-lg font-bold", scoreColor(s.value))}>{s.value}<span className="text-[10px] text-muted-foreground/50">/100</span></p>
                <div className="h-1 bg-accent/40 rounded-full mt-1.5 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", scoreBar(s.value))} style={{ width: `${s.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Strengths */}
          <div>
            <p className="text-[10px] font-semibold text-emerald-400 uppercase mb-1.5">Strengths</p>
            <ul className="space-y-1">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="text-[12px] text-foreground/85 flex items-start gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" /> {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div>
            <p className="text-[10px] font-semibold text-red-400 uppercase mb-1.5">Weaknesses</p>
            <ul className="space-y-1">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="text-[12px] text-foreground/85 flex items-start gap-1.5">
                  <span className="text-red-400 shrink-0">×</span> {w}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div>
            <p className="text-[10px] font-semibold text-primary uppercase mb-1.5">Improvements</p>
            <ul className="space-y-1">
              {analysis.improvements.map((imp, i) => (
                <li key={i} className="text-[12px] text-foreground/85 flex items-start gap-1.5">
                  <Lightbulb className="w-3 h-3 text-primary shrink-0 mt-0.5" /> {imp}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Tool 5: Trends Radar ─── */

function TrendsRadar({ profileNiche, addNote }: { profileNiche?: string; addNote: (title: string, content: string) => Promise<{ error: string | null }> }) {
  const navigate = useNavigate();
  const [niche, setNiche] = useState(profileNiche || "");
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingIdx, setAddingIdx] = useState<number | null>(null);
  const [addedSet, setAddedSet] = useState<Set<number>>(new Set());

  async function handleScan() {
    if (!niche.trim()) return;
    setLoading(true);
    setTrends([]);
    setAddedSet(new Set());

    try {
      const fetched = await fetchTrends(niche, 8);
      if (fetched.length === 0) {
        toast.error("No trends found. Check your connection or the Tavily configuration.");
      } else {
        setTrends(fetched);
        toast.success(`${fetched.length} trends found!`);
      }
    } catch (err) {
      toast.error("Error scanning trends");
    }
    setLoading(false);
  }

  async function handleAddTrend(trend: Trend, idx: number) {
    setAddingIdx(idx);
    const noteContent = `${trend.title}\n\nSource: ${trend.source} (${trend.url})\n\n${trend.snippet}`;
    const { error } = await addNote(`Trend: ${trend.title.slice(0, 100)}`, noteContent);
    setAddingIdx(null);
    if (error) {
      toast.error(`Error: ${error}`);
    } else {
      setAddedSet((prev) => new Set(prev).add(idx));
      toast.success("Trend added to sources!");
    }
  }

  function handleCreateContent(trend: Trend) {
    sessionStorage.setItem("supen_pending_idea", trend.title);
    toast.success("Topic selected, redirecting to Studio...");
    navigate("/dashboard");
  }

  return (
    <div className="rounded-xl border border-border/30 bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold">Trends Radar</h3>
      </div>

      <div className="flex gap-2 mb-3">
        <Input
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleScan()}
          placeholder="Your niche (e.g., marketing, AI, fitness...)"
          disabled={loading}
          className="bg-accent/30 border-border/30 h-10 text-sm"
        />
        <Button onClick={handleScan} disabled={loading || !niche.trim()} className="h-10 gap-2 text-xs font-semibold min-w-[120px]">
          {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...</> : <><TrendingUp className="w-3.5 h-3.5" /> Scan</>}
        </Button>
      </div>

      {trends.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {trends.map((trend, idx) => (
            <div key={idx} className="rounded-lg border border-border/20 bg-accent/10 p-3 hover:border-border/40 transition-all">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-[12px] font-semibold text-foreground/90 leading-snug flex-1">{trend.title}</p>
                <span className="text-[9px] text-cyan-400/60 font-mono shrink-0">{trend.score}</span>
              </div>
              {trend.snippet && (
                <p className="text-[11px] text-muted-foreground/70 mb-2 line-clamp-2">{trend.snippet}</p>
              )}
              <div className="flex items-center justify-between gap-2">
                <a
                  href={trend.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground/50 hover:text-foreground flex items-center gap-1"
                >
                  <ExternalLink className="w-2.5 h-2.5" /> {trend.source}
                </a>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAddTrend(trend, idx)}
                    disabled={addingIdx === idx || addedSet.has(idx)}
                    className="text-[10px] text-muted-foreground/60 hover:text-foreground px-2 py-1 rounded hover:bg-accent/30 transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {addingIdx === idx ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> :
                     addedSet.has(idx) ? <Check className="w-2.5 h-2.5 text-emerald-400" /> :
                     <Plus className="w-2.5 h-2.5" />}
                    {addedSet.has(idx) ? "Added" : "Add"}
                  </button>
                  <button
                    onClick={() => handleCreateContent(trend)}
                    className="text-[10px] text-cyan-400/80 hover:text-cyan-400 font-medium px-2 py-1 rounded hover:bg-cyan-500/10 transition-all"
                  >
                    Create →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default Tools;

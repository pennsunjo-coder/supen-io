/**
 * Viral scoring — two strategies:
 *
 *  - scoreVariation / scoreAllVariations: Claude Haiku-based scoring
 *    (more accurate, costs API tokens, async). Use when the user explicitly
 *    asks for an "explain my score" or for high-stakes ranking.
 *
 *  - scoreVariationHeuristic: deterministic, synchronous, no API call.
 *    Used by default on every generation. The score it produces is real
 *    (not random) so analytics, DB rows, and any future ranking feature
 *    have a meaningful signal — without burning Haiku credits on every
 *    single generation. Average post lands around 60-72; only a post that
 *    nails hook + specificity + CTA crosses 85.
 *
 * Both strategies return the same ScoreDetails shape, so the consumer
 * doesn't care which one ran.
 */

import { callClaude } from "@/lib/anthropic";

export interface ScoreDetails {
  total: number;
  hook: number;
  emotion: number;
  specificity: number;
  actionable: number;
  cta: number;
  feedback: string;
}

const SCORING_PROMPT = `You are a viral content scoring expert. Score this social media post on 5 criteria (0-20 each).

1. HOOK (0-20): Does the first line grab attention instantly?
   0=boring generic opener, 10=decent curiosity, 20=irresistible stop-scrolling hook

2. EMOTION (0-20): Does it trigger strong emotion?
   (curiosity, fear, excitement, inspiration, controversy, FOMO)
   0=flat/neutral, 10=some emotional pull, 20=intense emotional trigger

3. SPECIFICITY (0-20): Does it use specific numbers, names, tools, data?
   0=vague generalities, 10=some specifics, 20=packed with precise data/examples

4. ACTIONABLE (0-20): Can the reader DO something concrete after reading?
   0=purely abstract, 10=somewhat actionable, 20=clear step-by-step they can follow

5. CTA (0-20): Does it encourage engagement (save, share, comment, follow)?
   0=no call to action, 10=weak/implied CTA, 20=compelling explicit CTA

Be STRICT. Average social media content scores 50-65. Only truly viral content scores 85+.

Respond ONLY with this exact JSON format (no markdown, no backticks):
{"hook":N,"emotion":N,"specificity":N,"actionable":N,"cta":N,"feedback":"one sentence explaining the main strength or weakness"}`;

export async function scoreVariation(
  content: string,
  platform: string,
): Promise<ScoreDetails> {
  try {
    const text = await callClaude(
      `Platform: ${platform}\n\n${SCORING_PROMPT}`,
      [{ role: "user", content: content.slice(0, 800) }],
      { maxTokens: 200, model: "claude-haiku-4-5-20251001" },
    );

    const jsonStr = text.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(jsonStr);

    const hook = clamp(data.hook ?? 15, 0, 20);
    const emotion = clamp(data.emotion ?? 15, 0, 20);
    const specificity = clamp(data.specificity ?? 15, 0, 20);
    const actionable = clamp(data.actionable ?? 15, 0, 20);
    const cta = clamp(data.cta ?? 15, 0, 20);

    return {
      total: hook + emotion + specificity + actionable + cta,
      hook, emotion, specificity, actionable, cta,
      feedback: typeof data.feedback === "string" ? data.feedback.slice(0, 200) : "",
    };
  } catch {
    return { total: 65, hook: 13, emotion: 13, specificity: 13, actionable: 13, cta: 13, feedback: "" };
  }
}

export async function scoreAllVariations(
  variations: { content: string }[],
  platform: string,
): Promise<ScoreDetails[]> {
  return Promise.all(variations.map((v) => scoreVariation(v.content, platform)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Heuristic scoring (synchronous, no API call) ───
//
// Maps the same 5 criteria as the Haiku-based scorer to surface signals
// you can detect from text alone. The numbers are calibrated against ~30
// hand-graded posts so the distribution feels right (median ~65, viral
// posts hit 85+).

const HOOK_SHOCK_WORDS = [
  "stop", "rip", "breaking", "secret", "killed", "warning", "nobody",
  "wrong", "myth", "reality", "broke", "exposed", "leaked", "viral",
  "cheatcode", "hack", "shortcut",
];

const EMOTION_TRIGGER_WORDS = [
  "failed", "failure", "burned", "regret", "lost", "wasted", "mistake",
  "scared", "afraid", "shocked", "angry", "frustrated",
  "obsessed", "addicted", "love", "hate",
  "secret", "exposed", "betrayed", "trapped",
];

const ACTIONABLE_VERBS = [
  "click", "go to", "open ", "select", "type ", "paste", "upload",
  "create", "build", "set up", "save this", "try this", "use this",
  "follow these", "step 1", "step 2", "step 3",
];

const CTA_SIGNALS = [
  "comment ", "comment '", "comment \"",
  "save this", "bookmark", "send this to",
  "drop it below", "tell me", "let me know",
  "follow for", "follow @",
  "♻️", "repost", "share this",
  "what's", "which", "how do you",
];

const NAMED_TOOLS = [
  "claude", "chatgpt", "gemini", "notebooklm", "notion", "stripe",
  "vislo", "stanley", "manus", "replit", "elevenlabs",
  "canva", "pomelli", "tavily", "supabase", "anthropic", "openai",
  "midjourney", "nano banana", "veo", "kling", "heygen",
  "gumroad", "manychat", "raycast", "beehiiv", "invideo",
];

function countMatches(text: string, needles: string[]): number {
  const lower = text.toLowerCase();
  return needles.reduce((acc, n) => (lower.includes(n) ? acc + 1 : acc), 0);
}

function scoreHook(content: string): number {
  const lines = content.split(/\n+/).filter((l) => l.trim().length > 0);
  const firstLine = (lines[0] || "").trim();
  if (!firstLine) return 5;
  const lower = firstLine.toLowerCase();

  let score = 8; // baseline

  // Length: under 60 chars is the LinkedIn / X scroll-stop sweet spot.
  if (firstLine.length < 60) score += 4;
  else if (firstLine.length < 100) score += 2;
  else if (firstLine.length > 180) score -= 2;

  // Specific number in the first line is a high-signal hook.
  if (/\d{2,}|\$\d|\d+%|\d+x/.test(firstLine)) score += 4;

  // Shock / contrarian words.
  if (HOOK_SHOCK_WORDS.some((w) => lower.includes(w))) score += 3;

  // Question opener is weak on most platforms (penalise mildly).
  if (firstLine.endsWith("?") && firstLine.length < 80) score -= 2;

  // Generic AI-flavoured opener.
  if (/^(have you ever|in today's|in the world|let's dive)/i.test(firstLine)) {
    score -= 5;
  }

  return clamp(score, 0, 20);
}

function scoreEmotion(content: string): number {
  const lower = content.toLowerCase();
  let score = 8;

  const triggerHits = countMatches(content, EMOTION_TRIGGER_WORDS);
  score += Math.min(8, triggerHits * 2);

  // First-person vulnerability ("I burned 6 months", "I lost a client").
  if (/\bi\s+(burned|lost|wasted|failed|spent|wished|regret|cried)\b/i.test(content)) {
    score += 3;
  }

  // Strong contrarian framing.
  if (/\b(everyone is wrong|stop doing|nobody talks about|the truth is)\b/i.test(lower)) {
    score += 2;
  }

  // Hedging stack — kills emotion.
  const hedgeHits = countMatches(content, ["might ", "could ", "perhaps ", "generally ", "typically "]);
  if (hedgeHits >= 3) score -= 3;

  return clamp(score, 0, 20);
}

function scoreSpecificity(content: string): number {
  let score = 6;

  // Hard numbers (digits, %, $).
  const digitMatches = (content.match(/\d+/g) || []).length;
  score += Math.min(6, Math.floor(digitMatches / 2));

  // Currency / percentage signals.
  if (/\$\d|\d+%|\d+\s*(x|×)/.test(content)) score += 2;

  // Named tools / brands.
  const toolHits = countMatches(content, NAMED_TOOLS);
  score += Math.min(4, toolHits);

  // Concrete URLs (real domains, not placeholder).
  if (/[\w.-]+\.(com|ai|io|app|google\.com|google)/i.test(content)) score += 2;

  // Vague-quantity penalty.
  const vagueHits = countMatches(content, ["many ", "several ", "a lot ", "some ", "various "]);
  if (vagueHits >= 2) score -= 2;

  return clamp(score, 0, 20);
}

function scoreActionable(content: string): number {
  const lower = content.toLowerCase();
  let score = 6;

  // Imperative steps.
  const verbHits = countMatches(content, ACTIONABLE_VERBS);
  score += Math.min(8, verbHits);

  // Numbered steps "Step 1", "1.", "Day 1".
  const stepHits = (content.match(/(^|\n)\s*(step\s*\d|day\s*\d|\d+\.)/gi) || []).length;
  score += Math.min(4, stepHits);

  // Direct quote prompts.
  if (/['"][^'"]{20,200}['"]/.test(content)) score += 2;

  // Pure abstract content with no actionable verbs.
  if (verbHits === 0 && stepHits === 0) score -= 3;

  return clamp(score, 0, 20);
}

function scoreCta(content: string): number {
  let score = 6;
  const lower = content.toLowerCase();

  const ctaHits = countMatches(content, CTA_SIGNALS);
  score += Math.min(10, ctaHits * 2);

  // Trailing question (drives 15+ word comments).
  const trimmed = content.trim();
  if (trimmed.endsWith("?")) score += 3;

  // Repost / save explicit signals.
  if (/♻️|\brepost\b|\bsave this\b/i.test(content)) score += 2;

  // No CTA at all.
  if (ctaHits === 0 && !trimmed.endsWith("?")) score -= 4;

  // Weak / banned CTAs.
  if (/\bclick the link in bio\b|\bfollow for more\b/i.test(lower)) score -= 2;

  return clamp(score, 0, 20);
}

function summariseFeedback(parts: { hook: number; emotion: number; specificity: number; actionable: number; cta: number }): string {
  const labels: Array<[keyof typeof parts, string, string]> = [
    ["hook", "weak hook", "strong hook"],
    ["emotion", "flat emotional pull", "high emotional pull"],
    ["specificity", "too vague — add real numbers and names", "concrete and specific"],
    ["actionable", "no clear action for the reader", "clear action steps"],
    ["cta", "missing or weak CTA", "strong CTA"],
  ];
  const weakest = labels.reduce((acc, cur) => (parts[cur[0]] < parts[acc[0]] ? cur : acc), labels[0]);
  const strongest = labels.reduce((acc, cur) => (parts[cur[0]] > parts[acc[0]] ? cur : acc), labels[0]);
  if (strongest[0] === weakest[0]) return strongest[2];
  return `${strongest[2]}; biggest lift comes from fixing the ${weakest[1]}`;
}

/**
 * Synchronous heuristic score. No API call. ~0.5ms per variation.
 * Returns the same ScoreDetails shape as the Haiku-based scorer.
 */
export function scoreVariationHeuristic(
  content: string,
  _platform?: string
): ScoreDetails {
  const hook = scoreHook(content);
  const emotion = scoreEmotion(content);
  const specificity = scoreSpecificity(content);
  const actionable = scoreActionable(content);
  const cta = scoreCta(content);
  const total = hook + emotion + specificity + actionable + cta;
  return {
    total,
    hook,
    emotion,
    specificity,
    actionable,
    cta,
    feedback: summariseFeedback({ hook, emotion, specificity, actionable, cta }),
  };
}

export function scoreColor(total: number): string {
  if (total >= 86) return "text-emerald-400";
  if (total >= 76) return "text-blue-400";
  if (total >= 61) return "text-amber-400";
  return "text-red-400";
}

export function scoreBarColor(total: number): string {
  if (total >= 86) return "bg-emerald-500";
  if (total >= 76) return "bg-blue-500";
  if (total >= 61) return "bg-amber-500";
  return "bg-red-500";
}

export function scoreBadge(total: number): string | null {
  if (total >= 86) return "High viral potential";
  if (total >= 76) return "Good potential";
  return null;
}

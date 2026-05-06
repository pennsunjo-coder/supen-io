/**
 * AI-flavor detector — measures how much a piece of text "smells" like
 * LLM output, AFTER the sanitizer has already done its surface cleanup.
 *
 * The sanitizer removes the obvious tells (curly quotes, decorative
 * emoji, Title Case headings, em-dash overuse). This module catches
 * the deeper ones the sanitizer cannot fix without rewriting:
 *
 *   - Banned vocabulary that survived the prompt
 *   - Negative parallelisms ("It's not just X, it's Y")
 *   - Rule-of-three rhythm
 *   - Hedging stack
 *   - Present-participle tail ("...creating a vibrant community")
 *   - Vague attribution ("experts say", "studies show")
 *   - "Despite challenges" closer
 *   - First-line generic openers ("In today's…")
 *
 * Score range: 0 (clean) → 100 (textbook AI prose).
 *
 * Used by StudioWizard to trigger an automatic re-roll on variations
 * that crossed a threshold even after sanitization.
 */

const BANNED_WORDS = [
  // 2023 GPT-4 cluster
  "delve", "tapestry", "intricate", "intricacies", "interplay",
  "pivotal", "underscore", "garner", "boasts", "bolstered",
  "meticulous", "meticulously", "testament", "valuable insights",
  "vibrant", "realm", "beacon",
  // 2024 GPT-4o cluster
  "align with", "fostering", "showcase", "showcasing",
  "highlighting", "emphasizing", "underscoring",
  "leverage", "leveraging", "harness", "illuminate",
  "facilitate", "elevating", "empowering",
  "transformative", "holistic", "synergy",
  "seamless", "robust", "groundbreaking", "cutting-edge",
  "game-changer", "next-level",
  // 2025 GPT-5 cluster
  "in today's fast-paced", "in the dynamic landscape",
  "evolving landscape", "ever-evolving", "rapidly evolving",
];

const FORBIDDEN_PHRASES = [
  "it's important to note",
  "it's worth noting",
  "have you ever wondered",
  "ever wondered",
  "here's the thing",
  "here's the truth",
  "in summary",
  "in conclusion",
  "as of my last knowledge",
  "based on available information",
  "while specific details are limited",
  "is not widely documented",
  "maintains a low profile",
  "active social media presence",
  "stands as a testament",
  "key turning point",
  "indelible mark",
  "deeply rooted",
  "i hope this helps",
  "as a large language model",
];

const VAGUE_ATTRIBUTION = [
  "experts say", "experts argue", "researchers say",
  "studies show", "studies have shown", "research shows",
  "industry reports", "observers have", "many believe",
  "it is widely accepted", "it is generally agreed",
  "scholarly sources", "according to scholars",
];

const GENERIC_OPENERS = [
  /^in today's/i,
  /^in the world of/i,
  /^in the realm of/i,
  /^have you ever/i,
  /^let's dive into/i,
  /^let's delve/i,
  /^did you know/i,
];

const NEGATIVE_PARALLELISM_RE =
  /\b(?:not just|not only|isn't just|isn't only|it's not just|it's not only)\b[^.!?\n]{4,80}[,;]?\s*(?:it's|it is|but)\s+/gi;

const PRESENT_PARTICIPLE_TAIL_RE =
  /,\s*(creating|fostering|highlighting|emphasizing|showcasing|empowering|cultivating|encompassing|enabling|ensuring|reflecting|symbolizing|contributing|setting)\s+\w+/gi;

const RULE_OF_THREE_ADJ_RE =
  // "powerful, intuitive, and seamless" — 3 adjectives in a row
  /\b\w+(?:ed|ing|ly|ful|ous|ive|al)?\s*,\s*\w+(?:ed|ing|ly|ful|ous|ive|al)?\s*,\s+and\s+\w+/gi;

const HEDGING_RE = /\b(might|could|perhaps|generally|typically|often|usually|sometimes|in some cases|more often than not)\b/gi;

const CHALLENGES_CLOSER_RE =
  /\bdespite\s+(?:these\s+)?(?:its\s+)?challenges?\b[\s\S]{0,200}/i;

const KNOWLEDGE_CUTOFF_RE =
  /\b(as of my last (?:training )?(?:knowledge )?update|knowledge cutoff)\b/i;

export interface AiFlavorSignal {
  /** Short tag identifying which detector fired. */
  type:
    | "banned_word"
    | "forbidden_phrase"
    | "vague_attribution"
    | "generic_opener"
    | "negative_parallelism"
    | "rule_of_three"
    | "present_participle_tail"
    | "hedging_stack"
    | "challenges_closer"
    | "knowledge_cutoff";
  /** Human-readable explanation. */
  description: string;
  /** Severity weight added to the total score for this signal. */
  weight: number;
}

export interface AiFlavorReport {
  /** 0-100. Higher = more AI-flavoured. */
  score: number;
  /** Categorical severity. */
  severity: "clean" | "mild" | "moderate" | "heavy";
  /** Detailed signals fired. */
  signals: AiFlavorSignal[];
}

function lower(text: string): string {
  return text.toLowerCase();
}

function countBannedWords(text: string): { count: number; samples: string[] } {
  const lo = lower(text);
  const samples: string[] = [];
  let count = 0;
  for (const w of BANNED_WORDS) {
    if (lo.includes(w)) {
      count += 1;
      if (samples.length < 5) samples.push(w);
    }
  }
  return { count, samples };
}

function countForbiddenPhrases(text: string): { count: number; samples: string[] } {
  const lo = lower(text);
  const samples: string[] = [];
  let count = 0;
  for (const p of FORBIDDEN_PHRASES) {
    if (lo.includes(p)) {
      count += 1;
      if (samples.length < 3) samples.push(p);
    }
  }
  return { count, samples };
}

function countVagueAttribution(text: string): number {
  const lo = lower(text);
  return VAGUE_ATTRIBUTION.reduce((acc, a) => (lo.includes(a) ? acc + 1 : acc), 0);
}

function hasGenericOpener(text: string): boolean {
  const firstLine = text.split(/\n+/).find((l) => l.trim().length > 0) || "";
  return GENERIC_OPENERS.some((re) => re.test(firstLine.trim()));
}

function countMatches(text: string, re: RegExp): number {
  return (text.match(re) || []).length;
}

/**
 * Compute the AI-flavor report for a piece of text.
 * Independent of platform / format — caller decides what threshold to act on.
 */
export function detectAiFlavor(content: string): AiFlavorReport {
  if (!content || content.trim().length < 20) {
    return { score: 0, severity: "clean", signals: [] };
  }

  const signals: AiFlavorSignal[] = [];
  let score = 0;

  // Banned vocabulary — most load-bearing single signal.
  const banned = countBannedWords(content);
  if (banned.count > 0) {
    const weight = Math.min(40, banned.count * 8);
    score += weight;
    signals.push({
      type: "banned_word",
      description: `${banned.count} banned word${banned.count > 1 ? "s" : ""} (${banned.samples.join(", ")})`,
      weight,
    });
  }

  // Forbidden phrases.
  const phrases = countForbiddenPhrases(content);
  if (phrases.count > 0) {
    const weight = Math.min(25, phrases.count * 8);
    score += weight;
    signals.push({
      type: "forbidden_phrase",
      description: `Forbidden phrase: ${phrases.samples.join("; ")}`,
      weight,
    });
  }

  // Vague attribution.
  const vague = countVagueAttribution(content);
  if (vague > 0) {
    const weight = Math.min(15, vague * 6);
    score += weight;
    signals.push({
      type: "vague_attribution",
      description: `${vague} vague attribution${vague > 1 ? "s" : ""} ("experts say", "studies show", etc.)`,
      weight,
    });
  }

  // Generic opener on the first non-empty line.
  if (hasGenericOpener(content)) {
    score += 12;
    signals.push({
      type: "generic_opener",
      description: 'First line uses an AI-flavoured opener ("In today\'s…", "Have you ever…").',
      weight: 12,
    });
  }

  // Negative parallelism. ONE is fine, two or more is a tell.
  const parallelHits = countMatches(content, NEGATIVE_PARALLELISM_RE);
  if (parallelHits >= 2) {
    const weight = Math.min(20, parallelHits * 8);
    score += weight;
    signals.push({
      type: "negative_parallelism",
      description: `${parallelHits} negative-parallelism patterns ("not just X, it's Y") — one is fine, this is too many.`,
      weight,
    });
  } else if (parallelHits === 1) {
    // Mild only — one is allowed.
  }

  // Rule-of-three (three adjectives + and).
  const ruleOfThree = countMatches(content, RULE_OF_THREE_ADJ_RE);
  if (ruleOfThree >= 1) {
    const weight = Math.min(10, ruleOfThree * 5);
    score += weight;
    signals.push({
      type: "rule_of_three",
      description: `${ruleOfThree} rule-of-three triplet${ruleOfThree > 1 ? "s" : ""} ("X, Y, and Z" adjective stack).`,
      weight,
    });
  }

  // Present-participle tails.
  const ppHits = countMatches(content, PRESENT_PARTICIPLE_TAIL_RE);
  if (ppHits >= 2) {
    const weight = Math.min(15, ppHits * 5);
    score += weight;
    signals.push({
      type: "present_participle_tail",
      description: `${ppHits} present-participle tails (", creating…", ", highlighting…").`,
      weight,
    });
  }

  // Hedging stack — three or more in the same post is a tell.
  const hedgeHits = countMatches(content, HEDGING_RE);
  if (hedgeHits >= 3) {
    const weight = Math.min(12, (hedgeHits - 2) * 4);
    score += weight;
    signals.push({
      type: "hedging_stack",
      description: `${hedgeHits} hedging words ("might", "could", "typically") — pick a position.`,
      weight,
    });
  }

  // "Despite these challenges, X continues to thrive…" closer.
  if (CHALLENGES_CLOSER_RE.test(content)) {
    score += 12;
    signals.push({
      type: "challenges_closer",
      description: '"Despite challenges, X continues to thrive…" closer detected.',
      weight: 12,
    });
  }

  // Knowledge-cutoff disclaimer.
  if (KNOWLEDGE_CUTOFF_RE.test(content)) {
    score += 25;
    signals.push({
      type: "knowledge_cutoff",
      description: 'Knowledge-cutoff disclaimer leaked through ("as of my last knowledge update…").',
      weight: 25,
    });
  }

  score = Math.min(100, score);
  const severity: AiFlavorReport["severity"] =
    score >= 50 ? "heavy" : score >= 30 ? "moderate" : score >= 15 ? "mild" : "clean";

  return { score, severity, signals };
}

/**
 * Convenience: just the score.
 */
export function aiFlavorScore(content: string): number {
  return detectAiFlavor(content).score;
}

// ─── Composite "passes-detector" indicator ───
//
// Goal: estimate, from text alone, the likelihood that a piece of
// content would pass a real AI-detection tool (GPTZero, Originality,
// Copyleaks). We don't call those services — we use the same set of
// signals they rely on, plus a few human-writing positive signals
// the flavor detector doesn't reward.

/**
 * Verdict returned by passesDetectorEstimate(). Categorical so the UI
 * can pick a colour and a copy line without doing any of the math.
 */
export type DetectorVerdict = "likely_passes" | "borderline" | "likely_flagged";

export interface DetectorEstimate {
  verdict: DetectorVerdict;
  /**
   * 0-100. Higher = more likely to pass an external AI detector.
   * Roughly: ≥75 → likely_passes, 50-74 → borderline, <50 → likely_flagged.
   */
  confidence: number;
  /** Short reason line, suitable for showing in a tooltip. */
  reason: string;
}

const HUMAN_SIGNAL_WORDS = [
  // Casual / spoken markers
  "honestly", "tbh", "y'all", "kinda", "gonna", "gotta",
  // Strong emotion / vulnerability
  "burned", "wasted", "regret", "scared", "obsessed",
  // First-person specifics
  "i shipped", "i lost", "i wasted", "i tried", "my brain",
];

const FRAGMENT_RE = /(?:^|\.\s+|\n)[A-Z][a-z]*\.(?:\s|$)/g; // very short sentences like "True." "Done." "Fast."

const CONTRACTION_RE = /\b(?:i'm|you're|don't|can't|won't|it's|that's|we're|they're|let's|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|wouldn't|couldn't|shouldn't)\b/gi;

function countContractions(text: string): number {
  return (text.match(CONTRACTION_RE) || []).length;
}

function countHumanSignals(text: string): number {
  const lo = text.toLowerCase();
  return HUMAN_SIGNAL_WORDS.reduce((acc, w) => (lo.includes(w) ? acc + 1 : acc), 0);
}

function countShortFragments(text: string): number {
  return (text.match(FRAGMENT_RE) || []).length;
}

function sentenceLengthVariance(text: string): number {
  // Variance > ~70 means the writer mixes short and long sentences,
  // which is what humans do and what LLMs default away from.
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim().split(/\s+/).filter(Boolean).length)
    .filter((n) => n > 0);
  if (sentences.length < 3) return 0;
  const mean = sentences.reduce((a, b) => a + b, 0) / sentences.length;
  const variance = sentences.reduce((acc, n) => acc + (n - mean) ** 2, 0) / sentences.length;
  return variance;
}

/**
 * Estimate, from the text alone, whether the content would pass an
 * external AI-detection tool. Cheap (no API), deterministic, and
 * calibrated against the same flavor signals the detector uses.
 */
export function passesDetectorEstimate(content: string): DetectorEstimate {
  if (!content || content.trim().length < 30) {
    return {
      verdict: "borderline",
      confidence: 50,
      reason: "Too short to estimate reliably.",
    };
  }

  const flavor = detectAiFlavor(content);
  let confidence = 100 - flavor.score; // start from the inverse of flavor

  // Positive human-writing signals (boost confidence)
  const contractions = countContractions(content);
  if (contractions >= 4) confidence += 8;
  else if (contractions >= 2) confidence += 4;
  else if (contractions === 0) confidence -= 6; // formal/AI register

  const humanWords = countHumanSignals(content);
  if (humanWords >= 2) confidence += 8;
  else if (humanWords === 1) confidence += 4;

  const fragments = countShortFragments(content);
  if (fragments >= 2) confidence += 6;

  const variance = sentenceLengthVariance(content);
  if (variance > 70) confidence += 6;
  else if (variance > 40) confidence += 3;
  else if (variance < 12) confidence -= 8; // monotone — strong AI signal

  confidence = Math.max(0, Math.min(100, confidence));

  let verdict: DetectorVerdict;
  let reason: string;

  if (confidence >= 75) {
    verdict = "likely_passes";
    reason =
      flavor.severity === "clean"
        ? "Reads as human-written. Sentence variance and contractions look natural."
        : `Reads as human-written despite mild flavor signals (${flavor.severity}).`;
  } else if (confidence >= 50) {
    verdict = "borderline";
    const top = flavor.signals[0];
    reason = top
      ? `Could go either way. Watch the ${top.type.replace(/_/g, " ")} signal.`
      : "Could go either way — surface mechanics are clean but voice is flat.";
  } else {
    verdict = "likely_flagged";
    const topThree = flavor.signals.slice(0, 3).map((s) => s.type.replace(/_/g, " ")).join(", ");
    reason = topThree
      ? `Likely flagged by AI detectors. Tells: ${topThree}.`
      : "Likely flagged by AI detectors. Voice reads as machine-generated.";
  }

  return { verdict, confidence, reason };
}

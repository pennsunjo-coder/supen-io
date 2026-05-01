/**
 * Real viral scoring via Claude Haiku (through secure Edge Function).
 * Evaluates content on 5 criteria (0-20 each) for a total /100.
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

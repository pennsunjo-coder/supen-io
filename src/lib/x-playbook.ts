/**
 * X (Twitter) single-tweet playbook — different DNA from threads.
 * Used when format = "Tweet" (single post, max 280 chars by default,
 * or up to 25k chars on X Premium but the cadence stays "tweet-like":
 * one punch, one idea, no setup-payoff structure).
 *
 * Single-tweet DNA:
 * - One idea per tweet — no setup-then-payoff (that's a thread).
 * - Pattern interrupt in the first 5 words. Stop the thumb.
 * - The "punchline" lives at line 1 OR line 3 — never paragraph-style.
 * - Replies and retweets, not comments. Engagement = sharability.
 * - Specificity > cleverness. "$19/mo, locked in" beats wordplay.
 */

import { buildAntiAiRules } from "@/lib/anti-ai-rules";

export type TweetStructure =
  | "hot_take"        // Strong opinion, one line. "X is over. Y won."
  | "before_after"    // "OLD: X. NEW: Y." (single tweet variant)
  | "tiny_list"       // 3 items max, line break between each
  | "question_hook"   // One sharp question that invites quote-tweets
  | "specific_proof"  // "I did X. Here's the receipt:" + one stat
  | "tool_drop";      // "[Tool] just did X. Free. Link below."

export interface NicheHint {
  keywords: string[];
  preferredStructures: TweetStructure[];
}

const NICHE_STRUCTURE_MAP: NicheHint[] = [
  { keywords: ["ai", "gpt", "claude", "gemini", "tool", "tech", "automation", "code"], preferredStructures: ["tool_drop", "hot_take", "before_after", "specific_proof"] },
  { keywords: ["marketing", "growth", "audience", "content", "creator", "viral", "followers"], preferredStructures: ["hot_take", "specific_proof", "tiny_list", "question_hook"] },
  { keywords: ["business", "entrepreneur", "startup", "founder", "saas"], preferredStructures: ["specific_proof", "hot_take", "before_after", "tiny_list"] },
  { keywords: ["finance", "invest", "money", "saving", "wealth"], preferredStructures: ["before_after", "tiny_list", "specific_proof"] },
];

function detectNicheStructures(niche: string, content: string): TweetStructure[] {
  const text = `${niche} ${content}`.toLowerCase();
  const matches: TweetStructure[] = [];
  for (const hint of NICHE_STRUCTURE_MAP) {
    if (hint.keywords.some((k) => text.includes(k))) {
      matches.push(...hint.preferredStructures);
    }
  }
  if (matches.length === 0) return ["hot_take", "specific_proof", "tool_drop", "tiny_list", "question_hook"];
  return Array.from(new Set(matches)).slice(0, 5);
}

// ─── Structure templates ───

const STRUCTURE_TEMPLATES: Record<TweetStructure, string> = {
  hot_take: `
STRUCTURE: "HOT TAKE / STRONG OPINION"
Pattern: declarative one-liner that invites disagreement.
Length: 80-220 characters.

FORMULAS:
"[Established belief] is over. [New thing] won."
"Stop [doing X]. Just [do Y]."
"You don't need [common thing]. You need [actual thing]."

EXAMPLE:
"You don't need a course on AI. You need 30 minutes and a Claude subscription."

MANDATORY:
- One idea. One punch.
- No hedging. No "I think". Pick the side.
- No emoji unless functional.
`,

  before_after: `
STRUCTURE: "BEFORE / AFTER (SINGLE TWEET)"
Pattern: two-line contrast that shows the shift.
Length: 100-260 characters.

FORMULA:
"OLD: [previous behaviour or tool with detail]
NEW: [current behaviour or tool with detail + a stat or price]"

EXAMPLE:
"OLD: 3 hours editing a thumbnail in Photoshop.
NEW: 30 seconds in Pomelli. Same quality. Free."

MANDATORY:
- Both lines must be specific (named tool, real number, real time).
- Line 2 must include the kicker: a price, a stat, or a time saving.
- One line break between OLD and NEW.
`,

  tiny_list: `
STRUCTURE: "TINY LIST (3 items max)"
Pattern: one-line setup, then 3 short lines, optional kicker.
Length: 150-260 characters.

FORMULA:
"[Setup line in 5-10 words]:

— [Item 1]
— [Item 2]
— [Item 3]

[Optional kicker]"

EXAMPLE:
"3 prompts I run every Monday:

— 'Summarise last week's wins'
— 'List my open loops'
— 'Draft 5 LinkedIn hooks'

That's the whole system."

MANDATORY:
- Maximum 3 items. Four breaks the cadence.
- Each item starts with the same dash style for visual rhythm.
- Items should be specific, not categorical.
`,

  question_hook: `
STRUCTURE: "QUESTION HOOK"
Pattern: one sharp question that begs a quote-tweet.
Length: 60-180 characters.

FORMULAS:
"What's a [thing] that quietly [outcome] in 2026?"
"Who else [did rare specific thing]?"
"Honest take: [contested thing]?"

EXAMPLE:
"What's a free AI tool you'd refuse to give up — even if your competitor was paying $200/mo for it?"

MANDATORY:
- Real question, not rhetorical.
- Must invite a SPECIFIC, SHAREABLE answer (not "what do you think about AI?").
- One question. Don't stack two.
`,

  specific_proof: `
STRUCTURE: "SPECIFIC PROOF / RECEIPT"
Pattern: claim + receipt in one tweet.
Length: 150-260 characters.

FORMULAS:
"[Specific result] in [timeframe]. [How — one line]."
"I [did X]. Here's the receipt: [single stat or screenshot reference]."

EXAMPLE:
"15,000 followers in 30 days. Same workflow every morning: 1 viral hook from Stanley, 1 carousel from Vislo, 1 reply ladder. That's it."

MANDATORY:
- Specific number in the first 5 words.
- One concrete how-to line (not 5 — that's a thread).
- No setup. No "long story short". Just the result and the move.
`,

  tool_drop: `
STRUCTURE: "TOOL DROP"
Pattern: name the tool, show the move, drop the link.
Length: 120-260 characters.

FORMULA:
"[Tool] just [impressive specific capability]. [One detail or stat]. [Link]"

EXAMPLE:
"NotebookLM now turns 50 YouTube links into a structured report in under 2 minutes. Free with any Google account. notebooklm.google.com"

MANDATORY:
- Tool named in the first 3 words.
- One specific capability (verb + object), not a vague claim.
- One stat OR one real URL — never both, the tweet needs air.
`,
};

/**
 * Build the X single-tweet playbook injection.
 * Picks 5 distinct structures matched to niche so each variation
 * tries a different sharable shape.
 */
export function buildXPlaybook(niche: string, content: string): string {
  const structures = detectNicheStructures(niche, content);
  const templates = structures.map((s) => STRUCTURE_TEMPLATES[s]).join("\n\n");

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
X / TWITTER SINGLE-TWEET PLAYBOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For X Tweet format, each of the 5 variations uses a DIFFERENT
structure below. Pick from these (matched to niche: "${niche || "general"}"):
${templates}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SINGLE-TWEET FORMATTING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LENGTH:
- Default target: 80-260 characters (fits standard X cards).
- Premium / long tweets allowed up to 800 chars but only for
  specific_proof and tiny_list — never for hot_take.

LINE BREAKS:
- Use them. White space is part of the cadence.
- 1-3 short lines is the sweet spot.
- Never a wall of text — that reads as a missed-thread.

VOICE:
- One idea per tweet. No setup-then-payoff (that's a thread).
- No emojis unless functional (→ for flow, 👇 for thread teaser).
- No hashtags except for established niche tags (#buildinpublic).
- No "@mentions" of brands unless you're tagging the actual maker.

WHAT KILLS A TWEET:
- "Hot take:" as an opener — it announces what should be implicit.
- Stacked questions ("X? Y? Z?") — pick one.
- "Here's what I learned…" without the actual lesson.
- Long preambles. Cut the first sentence; usually the second is the tweet.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNATURE MOVES (real X creators use these)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. The receipt
   Specific number, named tool, real timeframe.
   "$19/mo. Locked in for 100 founders." beats "great pricing".

2. The pivot
   Two halves separated by a line break, second half flips the first.
   "Most people burn 4 hours on a thumbnail.
    I just had Pomelli build 8 in a row. Free."

3. The drop
   Just name the tool and the move. No commentary.
   "Try this: gemini.google.com → Tools → Create image → Thinking model."

4. The contrarian sentence
   One line, no qualifiers. "Newsletters aren't dead. Yours is."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${buildAntiAiRules("standard")}
`;
}

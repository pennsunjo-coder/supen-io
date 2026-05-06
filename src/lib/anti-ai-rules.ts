/**
 * Anti-AI writing rules — shared across all platform playbooks
 * (LinkedIn, X, TikTok, IG Reels, Facebook, YouTube).
 *
 * Source material:
 * - Wikipedia "Signs of AI writing" field guide (2026)
 * - Multiple AI-detection studies (Kobak et al. 2025, Reinhart et al. 2025,
 *   Juzek & Ward 2025, Kousha & Thelwall 2025, WaPo 2025)
 * - Patterns observed in viral human-written posts (Awa K. Penn, others)
 *
 * The goal: stop the model from regressing to the statistical mean of
 * "AI prose" — the bland, hedging, em-dash-laden, rule-of-three voice
 * that readers now recognise instantly and trust less.
 */

// ─── Forbidden vocabulary, organised by LLM era ───
//
// "Era" = the period when each cluster of words spiked sharply in
// LLM output relative to pre-2022 baselines. Not hard cutoffs, but a
// useful mental model: the longer the list a model still uses, the
// more obviously dated and AI-flavoured the prose feels.

const ERA_2023_GPT4 = [
  "delve",
  "tapestry",
  "intricate",
  "intricacies",
  "interplay",
  "pivotal",
  "underscore",
  "garner",
  "boasts",
  "bolstered",
  "meticulous",
  "meticulously",
  "testament",
  "valuable insights",
  "vibrant",
  "landscape", // when used abstractly (the digital landscape, the AI landscape)
  "realm",
  "beacon",
  "additionally", // as a sentence opener
];

const ERA_2024_GPT4O = [
  "align with",
  "fostering",
  "showcase",
  "showcasing",
  "enhance",
  "enhancing",
  "highlight", // as a verb
  "highlighting",
  "emphasizing",
  "underscoring",
  "leverage",
  "leveraging",
  "harness",
  "illuminate",
  "facilitate",
  "navigate", // figurative
  "elevating",
  "empowering",
  "transformative",
  "holistic",
  "synergy",
  "seamless",
  "robust",
  "groundbreaking",
  "cutting-edge",
  "game-changer",
  "next-level",
];

const ERA_2025_GPT5 = [
  "in today's fast-paced",
  "in the dynamic landscape",
  "evolving landscape",
  "ever-evolving",
  "rapidly evolving",
  "in the age of",
  "in the era of",
];

// ─── Forbidden phrases — the "AI tells" everyone now recognises ───

const FORBIDDEN_PHRASES = [
  // Editorialising / didactic disclaimers
  "it's important to note",
  "it's worth noting",
  "it's important to remember",
  "it's crucial to understand",
  "keep in mind that",
  "it goes without saying",

  // Generic openings
  "have you ever wondered",
  "ever wondered",
  "here's the thing",
  "here's the truth",
  "let's dive in",
  "let's delve into",
  "without further ado",

  // Section summaries / conclusion clichés
  "in summary",
  "in conclusion",
  "to sum up",
  "overall,",
  "to wrap up",
  "all in all",

  // Knowledge cutoff / hedging disclaimers
  "as of my last knowledge update",
  "based on available information",
  "while specific details are limited",
  "is not widely documented",
  "maintains a low profile",
  "keeps personal details private",

  // Press-release tone
  "active social media presence",
  "stands as a testament",
  "serves as a reminder",
  "represents a shift",
  "marks a pivotal moment",
  "key turning point",
  "indelible mark",
  "deeply rooted",

  // Collaborative chatbot leakage
  "certainly!",
  "of course!",
  "you're absolutely right!",
  "i hope this helps",
  "let me know if you need",
  "would you like me to",
  "as a large language model",
  "as an ai language model",
];

// ─── Patterns that reveal AI writing even when individual words look fine ───

const FORBIDDEN_PATTERNS = `
EM DASHES — limit ONE per post maximum.
Use commas, periods, parentheses, or colons instead.
LLMs deploy em dashes mechanically as a "Swiss-army connector"; readers now
read multiple em dashes as a tell, not as style.

NEGATIVE PARALLELISM ("Not just X, it's Y" / "It's not X, it's Y") —
use ONCE per post maximum, never as a structural device.
Two or more is the strongest single tell of AI prose.

RULE OF THREE — limit ONE triplet per post.
Three adjectives in a row, three short phrases ending with "and",
three parallel clauses — all instantly recognisable as AI rhythm.

HEDGING STACK — never use "might", "could", "perhaps", "generally",
"typically", "more often than not" three or more times in a single post.
Pick a position and commit.

FROM X TO Y — avoid "from beginners to experts", "from cities to landscapes".
False ranges are an AI tell when X and Y aren't actual range endpoints.

PRESENT-PARTICIPLE TAILS ("...creating a vibrant community", "...fostering
growth", "...highlighting its significance") — limit to ONE per post.
LLMs use these 2-5x more than humans for fake "analysis".

TITLE CASE in section headings (e.g. "Why This Matters", "Key Takeaways")
— use sentence case only. Title case in body copy is an AI tell.

DECORATIVE EMOJI in front of headings or bullets (🚀 🧠 📌 ✨) — banned.
Functional emoji inline (♻️ for repost, ☑ for checklist, → for flow) is fine.

INLINE-HEADER LISTS like "1. Topic Header: explanation..." with bold keywords
— banned. Either prose or a clean vertical list, not the readme-style hybrid.

CURLY QUOTES (" " ' ') and curly apostrophes (') — write straight only
("..." and '...' and apostrophe '). Curly quotes are a strong tell when paired
with other indicators.

CONCLUSION-OF-CHALLENGES paragraph: "Despite these challenges, [subject]
continues to thrive..." — banned. End on a real position, not a wash.

VAGUE ATTRIBUTION ("experts say", "many believe", "industry reports show",
"observers have noted") — banned unless you can name the source on the next
line.

OVERATTRIBUTION ("Her work has been featured in CNN, Vogue, Wired, and..."
when you can't actually cite the link) — banned.
`;

// ─── Voice + specificity (what TO do, not just what to avoid) ───

const REQUIRED_VOICE = `
VOICE — write like a person, not a model:
- Contractions everywhere: you're, don't, it's, we're, I'm.
- Mix first person ("I shipped this in 90 days") with second person
  ("here's how you steal it"). Voice switching is a human signal.
- Sentence length: vary it. Mostly short. One longer one for rhythm.
  Like this. Then a fragment. Then a longer one that lands the point.
- One committed position per post. No "on the other hand" middle ground.
- Concrete > abstract. "47% drop in reach" beats "significant decline".
- A typo or a one-word sentence is a feature, not a bug. Be human.

SPECIFICITY — non-negotiable:
- Real tool names: Claude, Gemini, NotebookLM, Notion, Vislo, Stripe.
  NEVER "an AI tool", "a platform", "a service".
- Real numbers: $19/month, 1,608 people, 7.5M impressions, 90 days.
  NEVER "many", "a lot", "several", "significant".
- Real URLs and buttons: "Settings → Capabilities → Skills → Upload",
  "claude.com/download", "gemini.google.com".
  NEVER "go to settings", "their website".
- Real prompts in quotes when showing prompts (verbatim, copyable).
  NEVER paraphrased.
- Real timeframes: "took 9 months", "in the last 4 weeks", "Q3 2025".
  NEVER "recently", "lately", "for a while now".

CONFIDENCE — pick a side:
- Strong opinions stated plainly. "ChatGPT is over for power users" is a
  post. "ChatGPT may have some limitations for some users" is filler.
- Admit failure when relevant. "I burned 6 months on the wrong niche"
  outperforms any victory-lap framing.
`;

// ─── Builder ───

/**
 * Returns the full anti-AI rules block, ready to be injected into any
 * platform-specific system prompt. Keep it inside ═══ markers in the
 * caller so the model can clearly see it as a constraint block.
 *
 * @param tightnessLevel  "standard" for posts, "strict" for high-trust
 *                        formats (LinkedIn long-form, newsletters).
 *                        "loose" for spoken short-form (TikTok / Reels)
 *                        where some rules (em dash count, sentence length)
 *                        are less load-bearing.
 */
export function buildAntiAiRules(
  tightnessLevel: "loose" | "standard" | "strict" = "standard"
): string {
  const allBannedWords = [
    ...ERA_2023_GPT4,
    ...ERA_2024_GPT4O,
    ...ERA_2025_GPT5,
  ];

  const phraseList = FORBIDDEN_PHRASES.map((p) => `  - "${p}"`).join("\n");

  const tightnessNote =
    tightnessLevel === "strict"
      ? `
STRICTNESS: high. This is long-form, durable content. Apply every rule below
without compromise. If a draft uses any banned word, rewrite the sentence —
do not just swap the word for a synonym from the same list.`
      : tightnessLevel === "loose"
        ? `
STRICTNESS: relaxed for spoken delivery. The vocabulary blacklist still
applies, but sentence-length variation, em-dash count, and rule-of-three
limits can flex slightly because spoken cadence ≠ written cadence.`
        : `
STRICTNESS: standard. Apply every rule. One slip is fine. Two slips means
the draft sounds like AI and needs a rewrite, not a patch.`;

  return `━━━ ANTI-AI WRITING RULES — ZERO TOLERANCE ━━━
${tightnessNote}

FORBIDDEN VOCABULARY (do not use any of these — pick a normal English word):
${allBannedWords.join(", ")}.

FORBIDDEN PHRASES (do not open, close, or pad with these):
${phraseList}

FORBIDDEN PATTERNS:
${FORBIDDEN_PATTERNS}

${REQUIRED_VOICE}

ENFORCEMENT:
Before returning each variation, scan it once for the rules above. If you
spot a banned word, phrase, or pattern, rewrite the affected sentence in
plain English. Do not annotate the post. Do not apologise. Just ship the
clean version.
━━━ END ANTI-AI RULES ━━━`;
}

/**
 * Compact one-liner for the banned vocabulary, useful when you want to
 * inline it in a longer prompt without burning tokens on the full block.
 */
export const BANNED_WORDS_INLINE = [
  ...ERA_2023_GPT4,
  ...ERA_2024_GPT4O,
  ...ERA_2025_GPT5,
].join(", ");

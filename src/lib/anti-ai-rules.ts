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
  "emphasize",
  "emphasized",
  "emphasizing",
  "underscoring",
  "leverage",
  "leveraging",
  "harness",
  "illuminate",
  "facilitate",
  "navigate", // figurative
  "elevate",
  "elevating",
  "empower",
  "empowering",
  "unlock", // as a marketing verb
  "transformative",
  "holistic",
  "synergy",
  "seamless",
  "robust",
  "groundbreaking",
  "cutting-edge",
  "game-changer",
  "next-level",
  // ── puffery / "words to watch" cluster (Wikipedia AI-writing field guide) ──
  "profound",
  "exemplifies",
  "renowned",
  "ensuring", // superficial-analysis participle tail
  "encompassing",
  "cultivating",
  "resonate",
  "resonates",
  "commitment to",
  "diverse array",
  "focal point",
  "setting the stage for",
  "deeply rooted",
  "rich cultural heritage",
];

// ── AILEGACY / AISUPERFICIAL cluster (Reinhart 2025, Markey 2025) ──
// The single highest-leverage gap from the Anti AI writing PDF audit.
// These are the words the field guide flags MOST insistently as the modern
// AI tell — they survived past "delve" being scrubbed by every model.
// "Reflects broader trends... contributes to... embodies... symbolises..."
// is the prose shape that triggered the Michael Zacs feedback most directly.
const ERA_LEGACY_REFLECTS = [
  "crucial",
  "key", // as an adjective ("key insight", "key takeaway")
  "enduring",
  "enduring legacy",
  "enduring influence",
  "enduring relevance",
  "reflects",
  "reflecting",
  "symbolizes",
  "symbolize",
  "symbolizing",
  "embodies",
  "embodying",
  "contributing to",
  "contributes to",
  "palpable",
  "cacophony",
  "continuation",
  "forefront",
  "at the forefront of",
  "breathtaking",
  "stunning",
  "captivating",
  "nestled",
  "in the heart of",
];

const ERA_2025_GPT5 = [
  "in today's fast-paced",
  "in the dynamic landscape",
  "evolving landscape",
  "ever-evolving",
  "rapidly evolving",
  "as it continues to evolve",
  "in this rapidly changing",
  "in the age of",
  "in the era of",
  "embark on a journey",
  "embark on this journey",
  "dive into",
  "dive right in",
  "dive right into",
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
  "but here's the thing",
  "then i realized",
  "the result?",
  "hot take:",
  "let's dive in",
  "let's delve into",
  "without further ado",

  // Filler bridges (sound like a TED-talk teleprompter, never a friend)
  "at its core",
  "that being said",
  "to put it simply",
  "in a nutshell",
  "at the end of the day",
  "thinking outside the box",

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

  // Vague attribution — name the source on the next line or cut it
  "industry reports",
  "observers have cited",
  "observers have noted",
  "experts argue",
  "experts say",
  "some critics argue",
  "studies show",
  "research suggests",
  "it is widely regarded",
  "is considered one of the most",
];

// ─── Patterns that reveal AI writing even when individual words look fine ───

const FORBIDDEN_PATTERNS = `
EM DASHES — limit ONE per post maximum.
Use commas, periods, parentheses, or colons instead.
LLMs deploy em dashes mechanically as a "Swiss-army connector"; readers now
read multiple em dashes as a tell, not as style.
Sandwich form ("word—word", no spaces) is the strongest tell — always
prefer "word, word" or "word (word)" when an em dash sneaks in at all.

NEGATIVE PARALLELISM ("Not just X, it's Y" / "It's not X, it's Y" /
"Not only X but also Y") — use ONCE per post maximum, never as a
structural device. Two or more is the strongest single tell of AI prose.

SAFE-HOUSE FORMULAS — banned outright. When the model gets pressure
to "sound smart" it falls back on these. Each one is a signature
LLM tell. The em-dash sandwich variant is the worst.
  ❌ "X n'est pas Y — c'est Z."
  ❌ "X is not Y — it's Z."
  ❌ "X isn't Y, it's Z."
  ❌ "C'est pas X. C'est Y." (when used as a one-liner reveal)
  ❌ "It's not the X. It's the Y."
  ❌ "X isn't about Y. It's about Z."
If you find yourself reaching for this shape, write the claim as a
single declarative sentence instead: "Y is the thing." Period.

CROSS-VARIATION REPETITION — when generating multiple variations of
the same topic, NO two variations may share the same key phrase
verbatim. If variation 1 says "n'est pas une question de chance, c'est
une structure", NO other variation may use that quote, that shape, or
its rough translation. Each variation must reach the same conclusion
through DIFFERENT wording and a DIFFERENT angle. Repeated phrasing
across variations reveals the model is reskinning one post, not
producing five.

STACCATO TRIPLET ("No X. No Y. Just Z.") — use ONCE per post maximum,
never twice in the same piece. LLMs cycle this rhythm mechanically.

COLON-TITLE / SUBTITLE FORMULA — banned. "Master X in Y Days:", "From
Beginner to Pro: The Complete Guide", "Why X Matters: A Breakdown". Real
people don't add colon subtitles to social posts. Pick one half of the
phrase and ship that.

FORCED-SASS / EDGE-LORD OPENERS — banned: "But here's the thing:",
"Then I realized:", "The result?", "Hot take:", "Plot twist:", "Here's
the kicker:". These are LLM substitutes for an actual hook. State the
specific claim directly instead.

VOICE-LOCK — never write a whole post in only 2nd person OR only 3rd
person. Within any post longer than 50 words, the voice must shift at
least once (e.g. "I noticed..." → "you've probably hit this too..." or
"here's what they did..." → "I tried it last week..."). Voice-lock is a
high-signal AI tell.

SENTENCE-LENGTH UNIFORMITY — if every sentence in a draft sits in the
15-30 word range, that's an AI failure mode (low burstiness). A real
post mixes 3-word jabs with 25-word reflections. Variance is the goal,
not consistency.

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

MARKDOWN ARTIFACTS (**bold**, *italic*, ### headers, --- bars) — banned.
Real humans writing on social media do not use markdown bolding (as it doesn't 
render). It's a 100% giveaway. Write in plain text ONLY. If you need emphasis, 
use word choice or line breaks.

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

ELEGANT VARIATION — do NOT swap in fancy synonyms just to avoid repeating a
word ("the device... the apparatus... the gadget..."). Repeat the plain word.
Reaching for a thesaurus to dodge repetition is a classic AI tell.

PLACEHOLDER / TEMPLATE LEAKAGE — never ship scaffolding in the final text:
no [brackets], {{curly placeholders}}, "insert X here", "[Your Name]",
"[link]", "as needed", or "(add example)". If you don't have the real value,
write a concrete plausible one. The output is final copy, not a template.

COPULATIVE AVOIDANCE — don't dress up "is/are" to sound grander. Write
"X is a tool that...", not "X serves as / stands as / functions as / boasts /
represents a tool that...". Plain "is" is the human choice.

OPENER "ADDITIONALLY/MOREOVER/FURTHERMORE" — never start a sentence with
these. Start with the actual point.

MULTI-SIGNAL CO-OCCURRENCE — the AI-writing field guide is explicit that
the diagnosis is multi-signal: curly quotes + em dash + parallel triplet
in the same paragraph is the strongest detector. If your draft has TWO
of these signals in close proximity, rewrite the paragraph from scratch.
Single-signal occurrences read as style. Co-occurrence reads as a model.
`;

// ─── Before / after examples (teach by demonstration) ───
// Source: paired rewrites from the Anti AI writing.pdf field guide.
// The model learns the rules faster from one good example than from
// fifty banned phrases. Keep these tight and load-bearing.

const REWRITE_EXAMPLES = `
REWRITE EXAMPLES — the same idea, AI-shaped vs human-shaped.
Mirror the right column. Avoid every move in the left column.

1. COPULATIVE PUFFERY
   ❌ Gallery 825 serves as LAAA's exhibition space, providing a focal
      point for the artistic community.
   ✅ Gallery 825 is LAAA's exhibition arm.

2. "DESPITE...CONTINUES TO THRIVE" WASH
   ❌ Despite its industrial slowdown, Korattur faces challenges yet
      continues to thrive, embodying enduring resilience.
   ✅ Korattur's factories shut down in the 90s. The town never came back.

3. PARTICIPLE-TAIL ANALYSIS
   ❌ He works closely with junior staff, creating a lively atmosphere
      within the department.
   ✅ He works closely with junior staff. The department feels lively
      because he's in it.

4. NEGATIVE PARALLELISM STACK
   ❌ This is not dissolution. Rather, it constitutes a transformation.
      It is not a mirror but a portal into something deeper.
   ✅ This isn't dissolution. It's transformation.

5. OVERATTRIBUTION
   ❌ Her work has been featured in Vogue, Wired, Toronto Star, the
      Guardian, and other major media outlets.
   ✅ Vogue ran a piece on her in March 2024. (Or drop the line entirely.)

6. AI-SOUP CLOSER
   ❌ In today's fast-paced and rapidly evolving digital landscape,
      AI writing has emerged as a game-changing technology that
      empowers creators to unlock new levels of productivity, ensuring
      a more efficient and impactful future for content creation.
   ✅ AI writing is good now. It's going to keep getting better.
      What you do with it matters more than which model you pick.

7. COLON-TITLE → DIRECT CLAIM
   ❌ Master Claude in 30 Days: The Ultimate Productivity Guide
   ✅ Master Claude in 30 days. Here's the plan.

8. AILEGACY CLUSTER
   ❌ This product reflects a crucial moment in design history,
      symbolizing the enduring legacy of Bauhaus principles and
      contributing to a renewed appreciation of form.
   ✅ The design is Bauhaus. That's why it still looks right 100 years
      later.
`;

// ─── Voice + specificity (what TO do, not just what to avoid) ───

const REQUIRED_VOICE = `
VOICE — write like a person, not a model:
- Contractions everywhere: you're, don't, it's, we're, I'm.
- Mix first person ("I shipped this in 90 days") with second person
  ("here's how you steal it"). Voice switching is a human signal —
  REQUIRED at least once in any post over 50 words. A piece written
  entirely in 2nd-person OR entirely in 3rd-person reads as a model.
- Sentence length: vary it AGGRESSIVELY. Mostly short. One longer one
  for rhythm. Mix 3-word jabs with 25-word reflections in the same post.
  Like this. Then a fragment. Then a longer sentence that lands the
  point because the rhythm earned it. Uniform 15-30 word sentences =
  AI rhythm. The variance is the human signal.
- Inject ONE sensory detail, metaphor, curveball, or piece of humor
  per post. Not three (that's a rule-of-three tell). One.
- One committed position per post. No "on the other hand" middle ground.
- Hedging: cap at ONE per post total ("might", "could", "perhaps",
  "generally", "typically"). Past one, commit or cut the sentence.
- Speak TO the reader, not AT them. "You" pulls them in. "One" /
  "people" / "individuals" pushes them away.
- Concrete > abstract. "47% drop in reach" beats "significant decline".
- NO FORMATTING. No bolding, no italics. Use line breaks for white space.
- A typo or a one-word sentence is a feature, not a bug. Be human.
- No pat-on-the-back energy ("Overall verdict: your routine is extremely
  well thought-out!"). Real people are not relentlessly encouraging.

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
    ...ERA_LEGACY_REFLECTS,
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
${REWRITE_EXAMPLES}

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
  ...ERA_LEGACY_REFLECTS,
  ...ERA_2025_GPT5,
].join(", ");

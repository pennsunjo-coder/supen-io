/**
 * Viral reel/short-form video script playbook.
 * Extracted from 40+ top-performing TikTok / Instagram Reels / Facebook Reels.
 * Used when user generates a "Reel (script)", "Video script", or "Script Shorts" format.
 * Adapts the structure template based on user's niche.
 */

export type ReelStructure =
  | "ai_showcase"       // "Visit [AI tool], do X, done. Comment [kw] for link"
  | "secret_feature"    // "This secret feature will 4x your views"
  | "tool_list"         // "5 essential tools for X. Comment to get list"
  | "lessons_learned"   // "I grew 50k followers. Here are the 3 lessons"
  | "disruption_news"   // "Open AI just killed this billion dollar company"
  | "before_after"      // "Look at this transformation. Here's how"
  | "three_mistakes"    // "You're stuck because you don't do these 3 things"
  | "money_hack"        // "These accounts make $10k/month. Here's how"
  | "myth_busting"      // "You think X but actually Y"
  | "walkthrough";      // Pure step-by-step tool walkthrough

export interface NicheHint {
  keywords: string[];
  preferredStructures: ReelStructure[];
}

const NICHE_STRUCTURE_MAP: NicheHint[] = [
  { keywords: ["ai", "gpt", "claude", "tech", "tool", "software", "automation"], preferredStructures: ["ai_showcase", "walkthrough", "disruption_news", "tool_list"] },
  { keywords: ["marketing", "growth", "audience", "viral", "content", "creator", "followers"], preferredStructures: ["secret_feature", "three_mistakes", "lessons_learned", "money_hack"] },
  { keywords: ["business", "entrepreneur", "startup", "founder", "money", "income"], preferredStructures: ["money_hack", "lessons_learned", "myth_busting"] },
  { keywords: ["fitness", "health", "workout", "diet"], preferredStructures: ["before_after", "three_mistakes", "myth_busting"] },
  { keywords: ["finance", "invest", "saving", "wealth"], preferredStructures: ["money_hack", "three_mistakes", "myth_busting"] },
  { keywords: ["design", "canva", "photoshop", "creative"], preferredStructures: ["before_after", "walkthrough", "ai_showcase"] },
];

function detectNicheStructures(niche: string, content: string): ReelStructure[] {
  const text = `${niche} ${content}`.toLowerCase();
  const matches: ReelStructure[] = [];
  for (const hint of NICHE_STRUCTURE_MAP) {
    if (hint.keywords.some((k) => text.includes(k))) {
      matches.push(...hint.preferredStructures);
    }
  }
  if (matches.length === 0) return ["secret_feature", "lessons_learned", "tool_list", "myth_busting"];
  return Array.from(new Set(matches)).slice(0, 5);
}

// ─── Structure templates — proven viral short-form patterns ───

const STRUCTURE_TEMPLATES: Record<ReelStructure, string> = {
  ai_showcase: `
STRUCTURE: "AI TOOL SHOWCASE"
Target length: 25-35 seconds spoken

HOOK (0-3s): "This AI is going to scare you" / "This AI just broke [X]" / "[Specific tool] can now [impressive claim]"

BUILD-UP (3-5s): One specific promise. "And it's completely free." / "Here's how to use it for free."

VALUE (5-25s): Pure walkthrough.
"Visit [tool name]. Click on [specific button]. Upload/paste [specific thing]. Select [option]. In seconds you'll get [result]."
Name the exact URL or button every time. Not "a menu" — "the Create button in the top right."
Show one concrete example.

CTA (last 3-5s): "Comment [keyword] and I'll send the link to your DMs. Follow for more AI tips."

MANDATORY:
- Name the exact tool by name in the hook
- Walk through the UI step by step as if screen-recording
- End with comment-to-unlock DM (gives you follows AND DMs)
- Max 35 seconds. Faster is better.
`,

  secret_feature: `
STRUCTURE: "SECRET FEATURE / HACK"
Target length: 20-30 seconds spoken

HOOK (0-3s): "This secret [platform] feature will [specific outcome]" / "This [tool] hack 4x'd my views"

BUILD-UP (3-6s): "And literally a 5 year old could do this in a couple seconds." / "It's actually way easier than it looks."

VALUE (6-22s): Walk through the hack in plain language.
"Head over to [tool]. Add [specific thing]. Make sure [specific detail]. Most people [common mistake]. Do this instead."
Explain WHY it works in one line — the insight, not the instruction.

CTA (last 3-5s): "As always, follow for more value" OR "Comment [word] to get this shortcut in your DMs."

MANDATORY:
- "Secret" or "hack" or "trick" in the hook
- One specific insight about WHY it works (the algorithm, psychology, etc.)
- Max 30 seconds
- Friendly, conspiratorial tone — like sharing with a friend
`,

  tool_list: `
STRUCTURE: "N ESSENTIAL TOOLS"
Target length: 30-45 seconds spoken

HOOK (0-3s): "Here are the [N] [tools/apps/hacks] to [specific outcome]" / "You're ruining your [X] if you're not using these [N] tools"

LIST (3-35s): Numbered rapid-fire.
"Number 1: [Tool name]. [One-line what it does]. [One-line why it matters / concrete use case]."
"Number 2: [Tool name]. [One-line what it does]. [One-line why it matters]."
Keep each item to 5-8 seconds.

OPTIONAL last item (35-40s): "And lastly: [Tool name]. [One-line why this is the bonus]."

CTA (last 3-5s): "Comment [keyword] to get the list in DM. Follow for more."

MANDATORY:
- 3-5 items max (never 7+ in a single reel)
- Name every tool explicitly (Raycast, Arc, Text Blaze, Beehiiv, Claude, Elevenlabs, etc.)
- One concrete use case per tool — not "it's great for productivity" but "it saves 2 hours of daily email writing"
- Never use "game changer" or "revolutionary"
`,

  lessons_learned: `
STRUCTURE: "I DID X, HERE ARE THE LESSONS"
Target length: 30-45 seconds spoken

HOOK (0-3s): "I [specific result: grew 50k followers / made $10k / did X] in [timeframe]. Here are the [N] lessons."

LESSON 1 (3-15s): State the lesson bluntly. "Not giving a f about views." / "Post daily."
Then ONE sentence of why it matters. Optional: one specific example.

LESSON 2 (15-28s): Same format. State → why → example.

LESSON 3 (28-40s): Save the best for last. Tease it before delivering.
"The best is last. Number 3: [unexpected lesson]."

CTA (last 3-5s): "Follow for more." OR "Comment [word] if you're serious about applying this."

MANDATORY:
- Specific result number + timeframe in the hook (50k / 90 days)
- Each lesson is counter-intuitive or uncomfortable — not "work hard"
- One personal detail or example per lesson
- Sound like you're talking to a friend, not a class
`,

  disruption_news: `
STRUCTURE: "BREAKING: X JUST KILLED Y"
Target length: 20-35 seconds spoken

HOOK (0-3s): "[Big company] just woke up and killed this billion dollar company." / "BREAKING: [old tool] is dead."

CONTEXT (3-12s): What was announced, in one specific sentence.
"They just announced [feature name], see this as [concrete analogy: Google but with steroids from AI]."
Then the impact: "This will kill [competitor], which has been the current alternative."

TAKE (12-25s): Your opinion in one paragraph.
"There's no real moat in the world of AI." OR
"This is exactly what I've been saying from day one."
Include one real data point: "Perplexity had planned to raise $250M at a $3B valuation — and now they've got OpenAI breathing down their neck."

REALITY CHECK (last 5-8s): "But [specific caveat]. Remember [previous flop]. We'll see if this delivers."
CTA: "Follow to be the first to know."

MANDATORY:
- Specific company names, specific product names, specific numbers
- A real data point (valuation, funding, user count)
- A caveat at the end — avoids pure hype
- No buzzwords like "game-changer" or "revolutionary"
`,

  before_after: `
STRUCTURE: "TRANSFORMATION REVEAL"
Target length: 20-30 seconds spoken

HOOK (0-3s): "This AI is going to scare you" / "Look at what this AI did to an empty room"

BEFORE (3-8s): Show / describe the starting state.
"My room is completely empty like this."
"This website is getting zero traffic."
"This person had 200 followers."

ACTION (8-20s): Walk through the transformation.
"Upload a picture. The AI will in a couple seconds give you multiple crazy suggestions."
Specific steps, specific tool.

AFTER (20-25s): The result.
"Just look at this." (pause) "Wild."

CTA (last 3-5s): "To try this AI, comment [keyword] and I'll DM the link."

MANDATORY:
- Visual thinking — the viewer should imagine the before/after
- Specific tool name
- One surprising moment of "wait what?"
- No over-selling — let the transformation do the work
`,

  three_mistakes: `
STRUCTURE: "YOU'RE STUCK BECAUSE OF THESE 3 MISTAKES"
Target length: 25-40 seconds spoken

HOOK (0-4s): "You're stuck at [X] because you don't do these [N] things." / "[Audience] are ruining their [outcome] by making these [N] mistakes."

MISTAKE 1 (4-13s): State mistake bluntly + the fix.
"Number 1: We need to grab your viewers' attention to your new post. So reply and engage with old comments and DMs."

MISTAKE 2 (13-22s): Same format.

MISTAKE 3 / THE SECRET (22-35s): Save the best for last. Tease it.
"Number 3 — this is actually my real secret."
Then deliver the contrarian, unexpected tactic.

CTA (last 3-5s): "Follow for more value, so you're the first to know when a new video drops."

MANDATORY:
- Tease "the best is last" before mistake 3
- Each mistake is specific and actionable — not "post more"
- Include at least one concrete tactic most people don't know
- Cut abruptly at the end
`,

  money_hack: `
STRUCTURE: "HOW TO MAKE $X WITH AI/TOOLS"
Target length: 25-40 seconds spoken

HOOK (0-4s): "These [accounts/stores/creators] make [$specific amount] a month through [method]." / "Here's how to make your first $[amount] as a [role]."

SETUP (4-10s): Tease the method.
"And this guy? Yeah, he's an AI." / "They're using this 1 free tool."

WALKTHROUGH (10-30s): Step-by-step.
"Visit [tool]. Paste [specific thing]. Pick [option]. Connect to [platform like Etsy or Shopify]. In a couple minutes you have [result] live without investing a penny."

CTA (last 3-5s): "Comment [keyword] to get started. Follow for more."

MANDATORY:
- Specific dollar amount in hook ($1,000 / $10k / $40k)
- Name the tool AND the platform (Printify + Etsy, Beehiiv + Gumroad)
- Show the actual workflow — no vague "start an online store"
- End with a comment-to-DM CTA
`,

  myth_busting: `
STRUCTURE: "YOU THINK X BUT ACTUALLY Y"
Target length: 25-35 seconds spoken

HOOK (0-4s): "Thinking you need [the common belief] is the reason you will never [result]." / "[Common advice] is wrong. Here's why."

THE BELIEF (4-10s): State what most people think.
"You're waiting for that perfect revolutionary idea."
"Most creators think they need expensive gear."

THE TRUTH (10-25s): Flip it.
"But here's the truth: without mastering the basics, you can't even execute that brilliant idea anyway."
Include a personal example: "I started with some simple Minecraft parkour clips. 50 views, shit-looking content. But it taught me all the fundamentals."

RESOLUTION (25-32s): The real takeaway.
"The simpler the idea, the more likely you are to start rather than letting perfectionism procrastinate you."

CTA (last 3-5s): "Follow for more value."

MANDATORY:
- Contradict a common belief in the hook
- Personal example or specific counter-evidence
- No hedging — commit fully to the contrarian take
- End with action, not a question
`,

  walkthrough: `
STRUCTURE: "PURE TOOL WALKTHROUGH"
Target length: 20-30 seconds spoken

HOOK (0-3s): "Here's how to [specific outcome] in seconds using AI." / "This is how I [specific result]."

STEPS (3-25s): Walk through it like you're screen-recording.
"Step 1: Go to [URL]. Click on [button name]."
"Step 2: Upload [specific thing] / Paste [specific thing]."
"Step 3: Select [specific option]."
"Step 4: Hit [button]. Done."

OPTIONAL RESULT SHOWCASE (25-28s): "And in seconds you'll have something like this."

CTA (last 3-5s): "Comment [keyword] and I'll DM you the link. Follow for more AI tips."

MANDATORY:
- Exact URLs and button names (not "a tool")
- 3-5 steps max (can combine 6-8 if needed but keep tight)
- Visual-first — the viewer should picture what the screen looks like
- No filler between steps — one action per sentence
`,
};

/**
 * Build the reel-specific playbook injection for the system prompt.
 * Detects the best structures based on the user's niche + content,
 * then provides 3-5 structure options the model can pick from.
 */
export function buildReelPlaybook(niche: string, content: string): string {
  const structures = detectNicheStructures(niche, content);
  const templates = structures.map((s) => STRUCTURE_TEMPLATES[s]).join("\n\n");

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REEL / SHORT-FORM VIDEO PLAYBOOK — proven viral structures
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For Reel/Video-script format, each of the 5 variations uses a DIFFERENT
structure below. Pick from these (matched to user's niche: "${niche || "general"}"):
${templates}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REEL SCRIPT FORMATTING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Spoken format — write as words will be SPOKEN, not read on screen
- Target 20-45 seconds (90-150 words max per script)
- Short punchy sentences. One idea per sentence.
- Use contractions naturally (don't, can't, it's, you're)
- Write as if talking to ONE person, not an audience
- Never use asterisks, bold, headers, or markdown
- Do not include stage directions like "[cut to...]", "[music]", etc.
  unless the script is for a narrative/story reel
- Name specific tools, URLs, button names, dollar amounts
- Include ONE clear CTA at the very end (comment + follow, or just follow)
- Hook must grab attention in the first 3 seconds or viewers scroll
- Never start with "Hey guys" / "What's up" / "Hello everyone"
- Start mid-sentence, mid-thought, mid-action

TONE:
- Conspiratorial, friendly, slightly urgent
- Like texting a friend who asked for a tip
- Confident. No hedging. No "maybe" or "could."
- Specific. Always specific.
`;
}

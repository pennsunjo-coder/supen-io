/**
 * TikTok script playbook — viral short-form patterns extracted from
 * top-performing TikTok creators (AI / tech / productivity niches).
 *
 * TikTok DNA (different from Instagram Reels and Facebook Reels):
 * - Hook MUST land in the first 1-2 seconds — TikTok's swipe rate is brutal
 * - Build-up is a 1-line promise (3-5s) that stops the swipe before value
 * - Value is dense, walked through visually as if screen-recording
 * - CTA is a comment-trigger ("Comment X for the link") — drives DMs and follows
 * - Total spoken length: 25-45 seconds (sweet spot)
 *
 * Used when user generates a "TikTok script" / "TikTok video" format.
 */

import { buildAntiAiRules } from "@/lib/anti-ai-rules";

export type TiktokStructure =
  | "tool_tutorial"   // "Here's how to [do X] in [N] seconds"
  | "secret_reveal"   // "This [tool/hack] will [outcome]"
  | "before_after"    // "Stop doing X. Do this instead."
  | "number_list"     // "3 AI tools that [outcome]"
  | "cheatcode";      // "[Tool] just changed everything. Here's why:"

export interface NicheHint {
  keywords: string[];
  preferredStructures: TiktokStructure[];
}

const NICHE_STRUCTURE_MAP: NicheHint[] = [
  { keywords: ["ai", "gpt", "claude", "gemini", "tool", "tech", "automation", "code", "software"], preferredStructures: ["tool_tutorial", "cheatcode", "secret_reveal", "number_list"] },
  { keywords: ["marketing", "growth", "content", "creator", "viral", "audience", "followers", "tiktok"], preferredStructures: ["secret_reveal", "before_after", "number_list", "cheatcode"] },
  { keywords: ["business", "entrepreneur", "startup", "founder", "money", "income", "side hustle"], preferredStructures: ["cheatcode", "number_list", "before_after"] },
  { keywords: ["fitness", "health", "workout", "diet", "habit"], preferredStructures: ["before_after", "secret_reveal", "number_list"] },
  { keywords: ["finance", "invest", "saving", "wealth", "budget"], preferredStructures: ["before_after", "number_list", "cheatcode"] },
  { keywords: ["design", "canva", "creative", "edit", "photo", "video"], preferredStructures: ["tool_tutorial", "before_after", "secret_reveal"] },
  { keywords: ["productivity", "habit", "routine", "study", "learn", "skill"], preferredStructures: ["number_list", "cheatcode", "before_after"] },
];

function detectNicheStructures(niche: string, content: string): TiktokStructure[] {
  const text = `${niche} ${content}`.toLowerCase();
  const matches: TiktokStructure[] = [];
  for (const hint of NICHE_STRUCTURE_MAP) {
    if (hint.keywords.some((k) => text.includes(k))) {
      matches.push(...hint.preferredStructures);
    }
  }
  if (matches.length === 0) return ["tool_tutorial", "secret_reveal", "before_after", "number_list", "cheatcode"];
  return Array.from(new Set(matches)).slice(0, 5);
}

// ─── Structure templates — proven viral TikTok script patterns ───

const STRUCTURE_TEMPLATES: Record<TiktokStructure, string> = {
  tool_tutorial: `
STRUCTURE: "TOOL TUTORIAL"
Hook reference: "Here's how to [do X] in [N] seconds"
Target: 25-35 seconds spoken

HOOK (0-2s, ULTRA-SHORT, scroll-stopper):
"Here's how to [outcome] in [N] seconds."
"How to [do X] without [common pain]."
"[Tool] just made [hard thing] take 30 seconds."

BUILD-UP (2-5s, the rapid promise):
"It's actually free."
"And you don't need any skill."
"This is the fastest way I've found."

VALUE (5-30s, dense step-by-step walkthrough):
"Step 1: Open [exact tool name]. Hit [exact button]."
"Step 2: Paste [specific thing]. Pick [option]."
"Step 3: [Final action]. Done."
Show one concrete output. Name URLs, buttons, settings — never "a menu".

CTA (last 2-4s, direct):
"Comment '[keyword]' and I'll DM you the link."
"Follow for more [niche] hacks."

MANDATORY:
- Exact tool name in the hook (NOT "this AI tool")
- Walk the UI step-by-step like a screen-recording
- No fluff, no intros — every second earns the next
- End on a comment-trigger that drives DMs + follows
`,

  secret_reveal: `
STRUCTURE: "SECRET REVEAL / HACK"
Hook reference: "This [tool/hack] will [outcome]"
Target: 20-30 seconds spoken

HOOK (0-2s, claim that sounds too good):
"This [tool] will [specific outcome] in [N] seconds."
"This [feature] is the reason [creators] are blowing up."
"Nobody is talking about this [tool/feature]."

BUILD-UP (2-5s, fast lock-in):
"And it's literally a 5-year-old level easy."
"Most people miss this completely."
"Here's the part nobody shows you."

VALUE (5-25s, the actual reveal):
"Go to [exact tool]. Click [exact button]."
"Add [specific input]. Make sure [specific detail] — most people skip this."
"What this does is [specific mechanism + outcome]."
Show ONE before / after frame if possible.

CTA (last 2-4s):
"Comment '[keyword]' for the full step-by-step."
"Follow so you don't miss part 2."

MANDATORY:
- "Secret" / "nobody talks about" framing in the hook
- Reveal ONE specific mechanism (not 5 — depth beats breadth)
- Call out the common mistake ("most people [wrong action]")
- Comment-to-unlock CTA
`,

  before_after: `
STRUCTURE: "BEFORE / AFTER — STOP DOING X"
Hook reference: "Stop doing X. Do this instead."
Target: 20-30 seconds spoken

HOOK (0-2s, direct command):
"Stop [common bad behavior]. Do this instead."
"[Audience], stop [wasting time on X]."
"Throw your [old tool] away. Use [new tool] instead."

BUILD-UP (2-5s, the why):
"Here's why it's killing your [outcome]."
"Most [audience] do this — and it's why nothing works."

VALUE (5-25s, the swap):
"OLD WAY: [What they're doing] → [bad outcome]."
"NEW WAY: [Specific replacement action with exact tool/method]."
Show one concrete A/B side-by-side if possible.
"This alone got me [specific metric / result]."

CTA (last 2-4s):
"Save this so you don't forget."
"Follow for more [niche] tips that actually work."

MANDATORY:
- Direct command in the hook ("Stop X")
- Explicit OLD vs NEW contrast (not vague advice)
- One concrete metric/result tied to the new way
- Save-this CTA (TikTok saves boost reach)
`,

  number_list: `
STRUCTURE: "NUMBERED LIST — N THINGS"
Hook reference: "3 AI tools that [outcome]"
Target: 30-45 seconds spoken

HOOK (0-2s, the number is the magnet):
"[N] [tools/hacks/mistakes] that [specific outcome]."
"[N] AI tools that will [outcome] in [time]."
"[N] [audience] mistakes killing your [metric]."

BUILD-UP (2-5s, lock-in):
"Number [middle] is the one nobody uses."
"And the last one is wild."
"Number [last] changed everything for me."

VALUE (5-40s, walk each item — 5-10s per item max):
"#1 [Tool/Tip name]. [What it does in one line]. [How to use it: button/URL]."
"#2 [Tool/Tip name]. [What it does]. [How to use it]."
"#3 [Tool/Tip name]. [What it does]. [How to use it]."
Each item = NAME + 1-line value + 1-line action. No fluff.

CTA (last 2-4s):
"Comment '[keyword]' for the full list."
"Follow — part 2 drops tomorrow."

MANDATORY:
- Specific number in hook (3, 5, 7 — odd numbers convert better)
- Tease the best item at the start ("number 3 is wild")
- Each item NAMED (not "a tool" — "Cluely / NotebookLM / etc")
- Each item ≤ 10 seconds — keep momentum
`,

  cheatcode: `
STRUCTURE: "CHEATCODE / GAME-CHANGER"
Hook reference: "[Tool] just changed everything. Here's why:"
Target: 25-40 seconds spoken

HOOK (0-2s, big claim):
"[Tool] just changed everything for [audience]."
"This is the cheatcode for [outcome]."
"[Tool] is the closest thing to a [cheat code/unfair advantage] in [niche]."

BUILD-UP (2-5s, raise the stakes):
"Here's why nobody's seen this yet."
"This is what the top 1% of [audience] are quietly using."
"And it's free."

VALUE (5-35s, the demo + the why):
"[Tool] does [specific capability] that [old way] couldn't."
"You go to [URL]. You give it [specific input]. It returns [specific output]."
"What used to take [old time] now takes [new time]."
"Use it for [use case 1]. Use it for [use case 2]. Use it for [use case 3]."

CTA (last 2-4s):
"Comment '[keyword]' — I'll DM you the workflow."
"Follow before everyone else figures this out."

MANDATORY:
- "Cheatcode" / "unfair advantage" / "game-changer" framing
- ONE specific tool by name (not generic)
- Time asymmetry (old time → new time) — TikTok loves this
- DM-trigger CTA (drives DMs + follows simultaneously)
`,
};

/**
 * Build the TikTok playbook injection for the system prompt.
 * Picks 5 distinct structures matched to the user's niche so each
 * variation tries a different viral pattern.
 */
export function buildTiktokPlaybook(niche: string, content: string): string {
  const structures = detectNicheStructures(niche, content);
  const templates = structures.map((s) => STRUCTURE_TEMPLATES[s]).join("\n\n");

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIKTOK SCRIPT PLAYBOOK — proven viral patterns
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For TikTok script format, each of the 5 variations uses a DIFFERENT
structure below. Pick from these (matched to user's niche: "${niche || "general"}"):
${templates}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIKTOK FORMATTING RULES (data-backed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PACING (this is non-negotiable on TikTok):
- Hook: 1-2 seconds MAX. If it's 3+ seconds, you've already lost the swipe.
- Build-Up: 3-5 seconds. One line of promise, not two.
- Value: 15-30 seconds. Dense walkthrough. Cuts every 1-2 seconds.
- CTA: 2-4 seconds. One ask. Comment-trigger or follow.
- Total: 25-45 seconds. Past 60s, drop-off climbs steeply.

SCRIPT FORMAT (output exactly):
Hook: [The one-liner that lands in 1-2s]
Build-Up: [The promise that locks them in for 3-5s]
Value: [Dense walkthrough — name tools, URLs, exact buttons]
CTA: [One direct action: "Comment X" or "Follow for Y"]

VOICE:
- Direct, second person ("you", "your")
- Fragments are fine. So are run-on sentences. This is spoken, not written.
- Contractions everywhere
- Specific over general — "Cluely", "NotebookLM", "Gemini" — never "a tool"
- Numbers, prices, time savings — "30 seconds", "$0", "2 hours"

BANNED:
- "Hey guys" / "What's up TikTok" / any intro greeting
- "In this video I'm going to show you" — just SHOW it
- "Make sure to like and subscribe" — that's YouTube energy
- Vague verbs: "leverage", "optimize", "streamline", "unlock"
- Three-adjective stacks ("powerful, easy, free")
- Anything that sounds written, not spoken

WINNERS (use these levers):
- Hook + tease ("number 3 is wild") → +30% watch-through
- Comment-to-unlock CTA → drives DMs AND follows simultaneously
- Save-this CTA → boosts reach via save signal
- Time asymmetry ("2 hours → 30 seconds") → high share rate
- Specific tool names → builds you as the niche authority

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFERENCE EXAMPLES — real viral TikTok scripts. Imitate the cadence.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[secret_reveal] —
"Hook: This secret Instagram feature will 4x your views.
Build-Up: And literally a 5 year old could do this in a couple seconds.
Value: Head over to Canva. Add a picture of you, your video hook, and a
little frame with the topic. Make sure all the text fits in this safe
zone. It did not take a genius to figure out we made a thumbnail for
our Reel — but you most likely think this is only for MrBeast on
YouTube. Well not really. A large portion of your viewers find your
content through the Explore page, and when scrolling I think it's safe
to say which one you would have clicked on.
CTA: As always, follow for more value."

[number_list] —
"Hook: I gained 40,000 followers in the last 3 months. Here are the
3 secrets so you can do the same. The best is last.
Build-Up: Number 1 is obvious. The third one nobody does.
Value: Number 1 — just post more. I used to analyse my content. Now I
post daily and get surprised when stuff pops off. Consistency does it.
Number 2 — give value. Memes attract no one. Educate.
Number 3 — what has gone viral will go viral. Don't steal. Steal like
an artist and make it your own.
CTA: As always, follow for more value."

[cheatcode] —
"Hook: These accounts make $10k a month through TikTok Shop affiliates.
Build-Up: And this guy? Yeah, he is an AI. Here's how to do it.
Value: Visit this AI, and paste the link to the product you want to
sell. It analyses the product and gives you 4 different video scripts.
Press next, pick your template, character, and music. In seconds you
have a complete ad ready to post.
CTA: As always, follow for more AI tips."

[before_after] —
"Hook: You are stuck at 200 views because you don't do these 3 things
after posting.
Build-Up: Number 3 is my real secret.
Value: Number 1 — reply and engage with old comments and DMs the
moment you post. Number 2 — put up a story. And no, stop using your
Reel as the story. Use polls or stories people can engage with.
Number 3 — if you're early to a big creator's new post, leave a
thoughtful or semi-controversial comment that gets reactions. That
drives traffic to YOUR video.
CTA: As always, follow for more value."

[tool_tutorial] —
"Hook: This AI is going to scare you.
Build-Up: Visit Collov AI — it can renovate any room and give you
insane suggestions.
Value: Let's say your room is empty like this one. If I just upload a
picture, in a couple seconds it gives me multiple before-and-afters.
You can even get inspired from their community to see other rooms and
not have yours look like crap.
CTA: To try this AI, comment Collov and I will send the link in DM."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNATURE MOVES (use these — they're what TikTok readers respond to)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Number tease in the hook
   "3 secrets — the best is last." / "Number 3 is wild."
   This buys you the next 5 seconds of watch time.

2. Specific tool by name in the hook OR build-up
   "Collov AI", "InVideo", "HeyGen", "ManyChat", "Notion", "Gumroad".
   Never "this AI tool", never "a website".

3. Comment-to-unlock CTA
   "Comment '[keyword]' and I'll DM you the link."
   Highest-converting CTA on TikTok — drives BOTH comments AND follows.

4. Save-this CTA (alternative)
   "Save this so you don't forget."
   Saves boost reach more than likes do.

5. "As always, follow for more value" closer
   Short, almost throwaway — the cadence locks in the loop.

6. Time asymmetry inside Value
   "Used to take 2 hours. Now takes 30 seconds."
   "Used to cost $50/month. Now it's free."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${buildAntiAiRules("loose")}
`;
}

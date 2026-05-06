/**
 * Viral thread playbook — extracted from top-performing Facebook/X threads.
 * Used when user generates a "Thread" format in StudioWizard.
 * Adapts the structure template based on user's niche.
 */

import { buildAntiAiRules } from "@/lib/anti-ai-rules";

export type ThreadStructure =
  | "cheatcode"       // "BREAKING: X is a cheatcode for Y. Here are N ways + prompts"
  | "disruption"      // "In 2007, iPhone killed Nokia. In 2026, X will kill Y"
  | "rip_tool"        // "RIP [Old tool]. [New tool] is impressive."
  | "prompt_library"  // "I grew 15K followers. Here are the N prompts I used"
  | "story_arc"       // Personal story unfolding across 4-6 posts
  | "educational";    // 5-part step-by-step teaching series

export interface NicheHint {
  keywords: string[];
  preferredStructures: ThreadStructure[];
}

const NICHE_STRUCTURE_MAP: NicheHint[] = [
  { keywords: ["ai", "gpt", "claude", "tech", "tool", "software", "automation"], preferredStructures: ["cheatcode", "rip_tool", "disruption"] },
  { keywords: ["marketing", "growth", "audience", "viral", "content", "creator"], preferredStructures: ["prompt_library", "cheatcode", "educational"] },
  { keywords: ["business", "entrepreneur", "startup", "founder", "money"], preferredStructures: ["disruption", "story_arc", "prompt_library"] },
  { keywords: ["fitness", "health", "habit", "discipline", "mindset"], preferredStructures: ["story_arc", "educational"] },
  { keywords: ["finance", "invest", "saving", "wealth"], preferredStructures: ["prompt_library", "disruption", "educational"] },
];

function detectNicheStructures(niche: string, content: string): ThreadStructure[] {
  const text = `${niche} ${content}`.toLowerCase();
  const matches: ThreadStructure[] = [];
  for (const hint of NICHE_STRUCTURE_MAP) {
    if (hint.keywords.some((k) => text.includes(k))) {
      matches.push(...hint.preferredStructures);
    }
  }
  if (matches.length === 0) return ["story_arc", "educational", "cheatcode"];
  return Array.from(new Set(matches)).slice(0, 4);
}

// ─── Structure templates — proven viral patterns ───

const STRUCTURE_TEMPLATES: Record<ThreadStructure, string> = {
  cheatcode: `
STRUCTURE: "CHEATCODE / FRAMEWORK"
Pattern: Dramatic opener → numbered methods → concrete prompts inside

Post 1 (hook):
"BREAKING: [Tool/Method] is literally a cheatcode for [specific outcome].
Here are [N] ways + [prompts/steps] to [concrete result]
(step by step guide)"

Post 2 (setup):
Quick setup instructions. Numbered micro-steps, 4-6 lines max.

Posts 3 to N (one per method):
Each post:
- Numbered title line: "1. [Clear action verb + benefit]"
- 2-3 sentences of context/why
- Concrete "Prompt:" block with an actual usable prompt the reader can copy
- Keep each method self-contained

Last post:
Recap + soft CTA ("save this, follow for more")

MANDATORY:
- Numbers used for methods (1., 2., 3.) — this is the one place list structure is allowed
- Each method delivers a concrete, copyable asset (prompt, step, formula)
- No filler — every line earns its place
`,

  disruption: `
STRUCTURE: "HISTORICAL DISRUPTION / WARNING"
Pattern: Parallel past disruptions → name the new one → break it down → proof

Post 1 (hook):
"In [year], [Big thing] killed [Incumbent].
In [year], [Big thing] killed [Incumbent].
In [current year], [New thing] will kill [Current incumbent].

And [who] is behind it.

Here's what [New thing] really is (and why it matters):"

Posts 2-6 (breakdown):
Each post tackles one facet:
- 2) The real plan (simple): A sells X. B wants to sell Y.
- 3) The scary part / implication
- 4) The domino effect (old → new table)
- 5) Why the incumbent should worry
- 6) Concrete before/after example

Post 7 (proof):
"This is NOT theory. Here's the proof:"
Cite a specific leak, podcast, moment, source.

Final post:
The real goal in 3 short lines. Cut abruptly.

MANDATORY:
- Three historical parallels in post 1 for pattern recognition
- Real, specific examples (not "some companies")
- One before/after contrast block somewhere in the thread
`,

  rip_tool: `
STRUCTURE: "RIP OLD TOOL / NEW TOOL BREAKDOWN"
Pattern: Obituary hook → feature list → how-to steps

Post 1 (hook):
"BREAKING: RIP [Old tool name].
[New tool name] is [impressive claim].

It functions like [big metaphor — a full X in one dashboard].

- [Capability 1]
- [Capability 2]
- [Capability 3]

And the best part: it's [free / cheap / accessible].

Here's what it can do and how to use it:"

Posts 2-5 (how-to):
Each post = one clear step with concrete instructions
"Step 1: [Action]
- Go to [URL or menu]
- Click [button]
- Upload/select [thing]
- Generate"

Include screenshots or describe the UI precisely.

Final post:
Soft pitch — try it, save this, follow for more launches.

MANDATORY:
- Bullet points only for capability list in post 1
- Concrete URLs / menu items / button names
- Show the actual workflow, not abstract description
`,

  prompt_library: `
STRUCTURE: "PROMPT LIBRARY / BIG RESULT"
Pattern: Social proof hook → N reusable prompts

Post 1 (hook):
"BREAKING: [Tool] can now [impressive claim].
I [specific result: grew X followers, made $X, saved X hours] in [timeframe].
Here are the [N] prompts I used:"

Posts 2 to N+1 (one per prompt):
Each post:
- Header line: "[N]. [PROMPT NAME IN CAPS]"
- 1-line description of what it does
- Full copyable prompt block with {{placeholders}} or [brackets] for user inputs
- Keep the prompt production-ready (not generic)

Final post:
"Save this. Bookmark it. These prompts give you [specific outcome]."

MANDATORY:
- Each prompt is actually usable, not a description of a prompt
- Specific result claim in the hook (number + timeframe)
- Use context file references like [audience.md], [voice.md] to signal pro-level prompting
`,

  story_arc: `
STRUCTURE: "STORY ARC / PERSONAL JOURNEY"
Pattern: Specific moment → tension → reveal → takeaway

Post 1 (opening):
Open with a grounded, specific moment. Time, place, detail.
Not "I was struggling" but "It was 2am on a Tuesday. I had $200 left."
End with a question or tension hook: "Here's what happened next."

Posts 2-5 (build):
Each post = one beat of the story:
- The realization / discovery
- The failure / setback
- The turning point / decision
- The result

Keep each post 80-120 words.
One idea per post. One scene. One insight.

Final post:
The lesson, stated simply. No moral-of-the-story speech.
Just the one line that matters.
End with a question the reader is afraid to answer honestly.

MANDATORY:
- Specific numbers, names, dates, places
- Raw emotion (frustration, surprise, regret)
- No generic "this changed my life" endings
- Build tension across posts, don't front-load the insight
`,

  educational: `
STRUCTURE: "EDUCATIONAL SERIES / 5-STEP TEACHING"
Pattern: Clear promise → step-by-step breakdown → recap

Post 1 (promise):
State what the reader will learn. One sentence.
"Most [audience] get [topic] wrong. Here's the actual [framework/method] that works."

Posts 2-6 (one step each):
Each post:
- Step number and title
- What this step does (1 sentence)
- How to do it (2-3 sentences)
- What to avoid (1 sentence)
Keep each post focused on ONE idea.

Final post:
Recap the 5 steps in one sentence each.
End with "Save this" or a tight call to apply.

MANDATORY:
- Each step is a concrete action, not a concept
- Specific example inside at least 2 of the steps
- Avoid academic or corporate tone — talk like explaining to a friend
`,
};

/**
 * Build the thread-specific playbook injection for the system prompt.
 * Detects the best structures based on the user's niche + content,
 * then provides 2-3 structure options the model can pick from.
 */
export function buildThreadPlaybook(niche: string, content: string): string {
  const structures = detectNicheStructures(niche, content);
  const templates = structures.map((s) => STRUCTURE_TEMPLATES[s]).join("\n\n");

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THREAD PLAYBOOK — proven viral structures
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For Thread format, each of the 5 variations uses a DIFFERENT structure below.
Pick from these (they match the user's niche: "${niche || "general"}"):
${templates}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THREAD FORMATTING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Separate each post in the thread with "---" on its own line
- Post 1 (the hook) is the most important — must stop the scroll
- 4-8 posts per thread. Not more, not less.
- Each post stands alone AND advances the thread
- Use concrete numbers, names, URLs, dates throughout
- Bullet points allowed ONLY inside a post when listing tool features or steps
- Mention specific tools/companies by name (not "a popular tool")
- End the hook post with a colon ":" teasing the next post

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFERENCE EXAMPLES — real viral threads. Match the cadence, not the words.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[disruption] —
"Post 1 (hook):
In 2007, iPhone killed Nokia.
In 2012, Netflix killed Blockbuster.
In 2026, Macrohard will kill Microsoft.
And Elon Musk is behind it.
Here's what Macrohard really is (and why it's dangerous): 👇

Post 2 (the real plan):
Microsoft sells software.
Elon wants to sell digital workers.
Not 'chatbots.' Not 'assistants.'
Actual agents that can:
- open apps
- click buttons
- type fast
- follow steps
- finish tasks
- repeat the work 1,000 times without stopping

Post 3 (scary part):
If Macrohard works…
You will not need to learn new tools.
The AI agent will use the tools FOR you.
The future is not 'New app replaces Excel.'
The future is 'AI agent uses Excel better than you.'

Post 4 (domino effect):
Excel — AI handles it
PowerPoint — AI builds it
Word — AI writes it
SharePoint — AI organizes it

Post 5 (proof):
This is NOT theory. An xAI engineer did a podcast interview where
he spoke openly about what they were building. A few days later,
he was no longer at xAI. People took that as a leak."

[cheatcode] —
"Post 1 (hook):
BREAKING: NotebookLM + Gemini is literally a Cheatcode for exploding on YouTube.
Here are 6 ways + Prompts to reverse engineer any successful YouTube channel
(step by step guide)

Post 2 (setup):
First, Connect NotebookLM to Gemini. Here is how 👇
- Open Gemini App
- From the dropdown, select NotebookLM
- Choose the Notebook (up to 50 YT links)
- Paste the prompts below 👇

Post 3 (method 1):
1. Extract High-Performing Hooks
Take the same video sources already inside NotebookLM. Focus only
on the first 15-30 seconds of each video.
Prompt:
'I have uploaded multiple high-performing videos. Analyze only the
opening sections. Extract the hook patterns used across these videos.
Group them into clear categories and explain why each type works.
Then generate 10 original hooks I can use in the same niche, following
the same patterns.'

[Repeat for methods 2-6, each with its full copyable prompt.]"

[rip_tool] —
"Post 1 (hook):
BREAKING: RIP Canva.
Google's new tool Pomelli is impressive.
It functions like a full marketing department in one dashboard.
- Creates Photoshoots from any photo
- Learns your brand's tone
- Generates complete social campaigns in seconds
And the best part: it is completely FREE.
Here's what it can do and how to use it:

Post 2 (step 1):
Step 1:
- Go to labs.google.com
- Click 'let's get started'
- Click on Photoshoot
- Upload any product image
- Select aspect ratio, then generate

Post 3 (step 2):
Step 2:
- Wait 2 minutes, then preview your photoshoots.
- If anything looks off, you can always edit."

[prompt_library] —
"Post 1 (hook):
BREAKING: CLAUDE CAN NOW WRITE 30 DAYS OF VIRAL CONTENT IN 1 HOUR.
I grew 15,000+ new followers in one month.
Here are the 5 prompts I used:

Post 2 (prompt 1 — FACEBOOK POST: STORY + ENGAGEMENT):
[Full copyable prompt with file references like [audience.md],
[offer.md], [voice.md], success brief structure, etc.]

[Repeat for prompts 2-5, each post = one full prompt.]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNATURE MOVES (use these — they're what thread readers respond to)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Three historical parallels in the hook (disruption only)
   "In 2007, iPhone killed Nokia. In 2012, Netflix killed Blockbuster."
   Pattern recognition fires before logic does.

2. "BREAKING:" opener
   Cheap but it works. Pair with a real, specific claim — not hype.

3. One copyable artifact per post
   Every post past the hook should have ONE thing the reader can
   screenshot or copy: a prompt, a step, a price, a URL, a stat.
   Posts without artifacts get scrolled.

4. "And the best part:" line
   Used to land the kicker before pivoting to the how-to.
   "And the best part: it is completely FREE."

5. Cliffhanger close on the hook post
   End with a colon and "👇" or "Here's how:" — never a period.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${buildAntiAiRules("standard")}
`;
}

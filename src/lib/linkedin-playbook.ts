import { buildAntiAiRules } from "@/lib/anti-ai-rules";

/**
 * LinkedIn post playbook — viral long-form LinkedIn structures.
 * Extracted from 16+ real posts by top AI/tech creators (7.5M+ impressions).
 * Used when user generates a "Post" format for LinkedIn in StudioWizard.
 *
 * Signature LinkedIn DNA identified:
 * - Bold one-line hook at top (the scroll-stopper)
 * - 1-line empty paragraphs for mobile readability
 * - Structured bullets with specific symbols: ☑ ✦ ↳ ❌ ✅
 * - Numbered sections/steps (1. 2. 3.)
 * - Real tool names, URLs, prices, subscriber counts throughout
 * - Product/newsletter CTA embedded in the post
 * - Repost line: "♻️ Repost this to help someone in your network"
 * - P.S. line with engagement-driving question
 * - Target length: 1,200-1,800 characters (data-backed sweet spot)
 * - Line length: under 55 chars for mobile
 * - Hooks under 60 characters
 */

export type LinkedinStructure =
  | "tool_tutorial"     // "How to set up X so it never forgets you"
  | "level_up"          // "Prompts → Projects → Skills (explained in 3 mins)"
  | "n_day_plan"        // "840/1000 have never used AI. Here's the 7-day plan"
  | "myth_busting"      // "Half of what experts say about X is wrong"
  | "elements_framework"// "7 elements behind my 7.5M+ impressions"
  | "process_deep_dive" // "8 steps to know if your content will perform"
  | "tool_breakdown"    // "Claude Code is 48 tools in one"
  | "install_guide"     // "Claude Code usually costs $100/month. Run it free locally"
  | "founder_story"     // "I (secretly) became a SaaS founder"
  | "contrarian_hack"   // "You don't need to learn to code anymore"
  | "myth_buster"       // ❌ OLD / ✅ NEW punchy 4-6 line variant
  | "data_story"        // "[Big number] [audience] [stat]. Here's the N-step plan."
  | "comparison_table"; // "You're paying for X. Y does it for free: ☑ ☑ ☑"

export interface NicheHint {
  keywords: string[];
  preferredStructures: LinkedinStructure[];
}

const NICHE_STRUCTURE_MAP: NicheHint[] = [
  { keywords: ["ai", "gpt", "claude", "gemini", "tech", "tool", "software", "automation", "code"], preferredStructures: ["tool_tutorial", "level_up", "tool_breakdown", "comparison_table", "contrarian_hack"] },
  { keywords: ["marketing", "growth", "audience", "viral", "content", "creator", "linkedin", "followers"], preferredStructures: ["elements_framework", "data_story", "myth_buster", "process_deep_dive"] },
  { keywords: ["business", "entrepreneur", "startup", "founder", "saas", "product"], preferredStructures: ["founder_story", "tool_breakdown", "comparison_table", "data_story"] },
  { keywords: ["career", "job", "skill", "learn", "education"], preferredStructures: ["data_story", "level_up", "tool_tutorial", "contrarian_hack"] },
  { keywords: ["finance", "invest", "money", "saving"], preferredStructures: ["myth_buster", "comparison_table", "contrarian_hack"] },
  { keywords: ["design", "infographic", "visual", "brand"], preferredStructures: ["process_deep_dive", "elements_framework", "founder_story"] },
];

function detectNicheStructures(niche: string, content: string): LinkedinStructure[] {
  const text = `${niche} ${content}`.toLowerCase();
  const matches: LinkedinStructure[] = [];
  for (const hint of NICHE_STRUCTURE_MAP) {
    if (hint.keywords.some((k) => text.includes(k))) {
      matches.push(...hint.preferredStructures);
    }
  }
  if (matches.length === 0) return ["tool_tutorial", "process_deep_dive", "contrarian_hack", "myth_buster", "data_story"];
  return Array.from(new Set(matches)).slice(0, 5);
}

// ─── Structure templates — extracted from real viral LinkedIn posts ───

const STRUCTURE_TEMPLATES: Record<LinkedinStructure, string> = {
  tool_tutorial: `
STRUCTURE: "TOOL SETUP / TUTORIAL"
Reference: "How to set up Claude so it never forgets you"
Target: 1,200-1,800 characters

HOOK (first line, under 60 chars — the scroll-stopper):
"You love [tool], so you are prompting it every day."
"How to set up [tool] so it never [bad outcome]:"
"You're using just 1% of [tool]."

SETUP (empty line, then 2-3 short lines of context):
Frame WHY this matters NOW. One reframe that changes how people see the topic.
"But [new thing] is the way to (actually) use it:"

CHECKBOX BENEFITS (3 lines with ☑):
☑ [Specific benefit with a number]
☑ [Specific benefit that saves money/time]
☑ [Specific benefit about outcomes]

TRANSITION to step-by-step:
"In this completely free [guide/article], I share exactly:"
OR: "Here's the [N]-step process:"

NUMBERED STEPS (4-7 steps, each 2-4 lines):
Step 1: [Short title]
✦ [Action verb + specific URL/button]
✦ [What happens when you do it]
✦ [Why it's different from Level 0]

Step 2: [Short title]
✦ [Specific click path]
✦ [Real prompt example inside quotes]

CTA LINE (free resource):
"Read it here: [newsletter link]"
OR: "Full playbook: [link]"

REPOST LINE:
"♻️ Repost this to help someone on your team [specific pain point]."

P.S. LINE (optional, engagement question):
"P.S. [Specific question related to the topic]"

MANDATORY:
- Hook under 60 characters
- Real tool names (Claude, Gemini, Notion, Slack — never "a tool")
- Specific settings/buttons ("Go to Settings → Capabilities → Skills → Upload")
- Real prompts inside quotes when showing prompts
- One free resource CTA
- Repost line with "♻️"
`,

  level_up: `
STRUCTURE: "EVOLUTION / LEVEL UP FRAMING"
Reference: "Prompts → Projects → Skills (explained in 3 mins)"
Target: 1,200-1,600 characters

HOOK (arrow progression):
"[Level 1] → [Level 2] → [Level 3] (explained in [X] mins)"

ANALOGY LINE (3 lines explaining each level):
"Prompts = telling a stranger your job every morning.
Projects = giving a new hire a binder on day one.
Skills = training an employee once. For forever."

STEP 1: Start with [Level 1]
✦ [What you do]
✦ [What happens]
✦ [The pain / why it fails long-term]
✦ "That's Level 1. Most people never leave it."

STEP 2: Move to [Level 2]
✦ [Specific menu/button path]
✦ [What you upload]
✦ [What gets easier]
BUT — [what still doesn't work]. [The pain that forces the next level.]

STEP 3: Graduate to [Level 3]
✦ [Specific setup with real URL/button]
✦ [Specific prompt inside quotes]
[One paragraph on why specificity matters here]
"The specificity is the [skill/system/output]."

STEP 4: Install and test
✦ [Concrete save/install action]
✦ [Final test]
✦ "[Tool] just knows."

WRAP-UP (1-2 lines):
"I just wrote my full [topic] breakdown. It covers [specific details]."
"Read it here: [link]"

REPOST LINE:
"♻️ Repost this to help someone [specific pain]."

MANDATORY:
- Three levels with clear progression
- Each level has a specific pain that forces the next
- One killer insight ("The specificity is the skill")
- Newsletter CTA + Repost line
`,

  n_day_plan: `
STRUCTURE: "N-DAY PLAN / MULTI-DAY ROADMAP"
Reference: "840 out of 1,000 people have never used AI. Here's the 7-day plan"
Target: 1,700-2,200 characters (can go longer for multi-day plans)

HOOK (shock statistic + solution):
"[Shocking stat] out of [base] [audience description].
Here's the [N]-day plan so you're not one of them:"

DAY 1: [Action title] (and specific outcome)
1. [Concrete action with URL]
2. [Next action]
3. [Create / upload / set up specific thing]
4. [Link to resource]
5. Full setup guide: [link]

DAY 2: Master [tool/skill] ([specific benefit])
Same pattern — 5 numbered actions, each with tool names / URLs.

DAY 3 to DAY N: Same 5-action pattern.
Each day should build on the previous.
Each day delivers ONE concrete skill.

WHY THIS MATTERS (after all days):
"Here's why this matters:
→ [stat 1]
→ [stat 2]
→ [stat 3]
→ [stat 4]"

RARITY / CREDIBILITY CLAIM:
"If you're reading this, you're already in the top [X]%.
These [N] guides put you in the top [Y]%."

TIME INVESTMENT:
"It took me [big effort number] to write them.
It takes you [short time] to use them."

REPOST LINE:
"♻️ Repost this if your network is still in the [N audience]."

MANDATORY:
- Specific shock statistic in the hook (not "many people")
- Each day = 5 concrete actions with URLs
- Rarity math at the end (top X% → top Y%)
- Effort asymmetry (my 1000 hours vs your 7 days)
- Repost line tied to the original stat
`,

  myth_busting: `
STRUCTURE: "MYTH-BUSTING / OLD vs NEW"
Reference: "Half of what 'experts' say about LinkedIn is wrong"
Target: 1,800-2,500 characters (can run long for depth)

HOOK (direct contrarian):
"Half of what '[experts]' say about [topic] is wrong."
OR: "Stop following 2023 advice in 2026."

DATA OPENING (3 short arrow lines):
"Here's the reality of [topic] in [year]:
↳ [Metric 1 up/down %]
↳ [Metric 2 up/down %]
↳ [Metric 3 up/down %]"

---

SOURCES SECTION (credibility):
"Sources:
Industry data: [Real source with real name / number]
My data: [Specific tool/method used for personal validation]"

---

REFRAME (1 line):
"[Topic] isn't broken. The rules just changed."

---

MYTH 1: [Bold claim / old advice]
❌ OLD: [Short statement of what people believe]
✅ NEW: [Correction with specific data/mechanism]

MYTH 2 to N (5-6 myths):
Same ❌ OLD / ✅ NEW pattern.
Each correction includes a specific data point or mechanism.

---

DATA CONFIRMATION:
"What my data confirmed:

The real killers:
↳ [Specific bad practice with metric]
↳ [Specific bad practice with metric]

The real winners:
↳ [Specific good practice with metric]
↳ [Specific good practice with metric]

The algorithm now rewards:
↳ [Reward 1]
↳ [Reward 2]"

---

CLOSE (1 line):
"Stop following [old year] advice in [current year]."

ENGAGEMENT:
"Which myth were you still believing? Drop it below."

REPOST LINE:
"♻️ Repost to help someone in your network."

MANDATORY:
- Real source cited by name (Richard van der Blom, 1.8M posts analyzed, etc.)
- 5-6 myths with ❌ OLD / ✅ NEW pattern
- Specific metrics (up 12%, down 50-65%, 1.6x, 2.5x)
- Separator lines (---) between major sections
- Engagement question at end
`,

  elements_framework: `
STRUCTURE: "N ELEMENTS BEHIND MY [BIG RESULT]"
Reference: "My AI infographics generated 7.5M+ impressions. 7 elements"
Target: 1,400-1,800 characters

HOOK (result claim):
"My [thing] generated [impressive metric]."
"Here are the [N] elements behind every one:"

ELEMENT 1: [Name]
✦ [Specific rule or pattern]
✦ [Rule 2 with measurable detail]

[One-line insight about why it matters]

ELEMENT 2 to N (5-7 total):
Same pattern: 2 bullets + 1-line insight.

Keep each element tight: 3-4 lines total.

CONTEXT / WHY IT WORKS (2-3 lines):
"The [old approach] worked for a while.
Now everyone's feed looks the same.
[New approach] stands out because [specific reason]."

PRODUCT / RESOURCE CTA:
"I built [product] to solve this.
(The [status] is now live)"
OR: "Full guide → [link]"

PRICING TEASER (optional):
"First [N] users get [price], locked in for life."

REPOST LINE:
"♻️ Repost this to help someone in your network."

P.S. LINE:
"P.S. Which element do you skip most often?"

MANDATORY:
- Specific result number in the hook (7.5M+ impressions, not "a lot")
- 5-7 elements, each with 2 bullets + insight line
- Product tie-in toward the end (never at the top)
- P.S. with a specific engagement question
`,

  process_deep_dive: `
STRUCTURE: "N-STEP PROCESS DEEP DIVE"
Reference: "8 steps to know if your content will perform"
Target: 2,000-2,800 characters

HOOK (pain point + solution):
"[X]% of [audience] [bad behavior].
[N]-steps to [desired outcome]:"

STEP 1: [Action title]
- [Concrete what-to-do]
- [Specific detail or output]
- [Specific detail]

[One killer sentence insight]

STEP 2 to N (7-8 total steps):
Each step has 3 bullets + 1 insight line.

For complex steps, include:
- Sub-framework (e.g., "H → Hook (under 60 chars)")
- Prompt in quotes ("Write a LinkedIn post...")
- Specific tool/feature name

WHY THIS WORKS (backed by data):
"The data backs this up ([specific dataset]):

✦ [Finding 1 with metric]
✦ [Finding 2 with metric]
✦ [Finding 3 with metric]
✦ [Finding 4 with metric]"

TOOL / PRODUCT LINK:
"Try [tool] → [link]
(You get [free trial terms] with my link)"

REPOST LINE:
"♻️ Repost this to help someone in your network."

P.S. LINE:
"P.S. Which step are you missing?"

MANDATORY:
- 7-8 steps minimum (this format rewards depth)
- Each step has 3 bullets + insight
- Real prompts in quotes where relevant
- Data backing at the end (specific sample size / metrics)
- Clear P.S. question
`,

  tool_breakdown: `
STRUCTURE: "X IS Y TOOLS IN ONE"
Reference: "Claude Code is 48 tools in one"
Target: 1,400-1,800 characters

HOOK (massive capability claim):
"[Tool] is [N] [tools/features/skills] in one.
(Here's what it does and why it matters)"

REFRAME (2 short paragraphs):
"Most people use [old tool] like [old way].
[New tool] turns it into [new way]."

"[Old tool] is [weak metaphor].
[New tool] is [strong metaphor]."

WHAT YOU GET:
"What you get:
✦ [Capability 1]
✦ [Capability 2]
✦ [Capability 3]
✦ [Capability 4]
✦ [Capability 5]"

WHAT PEOPLE ARE BUILDING:
"What people are building with it:
✦ [Real use case 1]
✦ [Real use case 2]
✦ [Real use case 3]
✦ [Real use case 4]
✦ [Real use case 5]
✦ [Real use case 6]"

WHAT IT REPLACES (dollar stack):
"What it replaces:
✦ $[X]/month in [category 1]
✦ $[X]/month in [category 2]
✦ $[X]/month in [category 3]
✦ [N] hours per week of manual work

All for $[0 or small amount]/month on top of your [tool] subscription."

NEWSLETTER CTA:
"I wrote a [word count]+ word newsletter breaking down [tool].
Read it free here → [link]"

REPOST LINE:
"♻️ Repost to help someone in your network."

P.S. LINE:
"P.S. Which layer are you starting with?"

MANDATORY:
- Big capability number in hook ("48 tools", "20 features")
- Three parallel lists: what you get / what people build / what it replaces
- Dollar-stack comparison for "what it replaces"
- Newsletter CTA with specific word count claim
`,

  install_guide: `
STRUCTURE: "INSTALL / TECHNICAL SETUP"
Reference: "Claude Code usually costs $100+/month. Run it for $0 locally"
Target: 1,200-1,600 characters

HOOK (price / access contrast):
"[Tool] usually costs $[X]/month.
How to run it for $0 [alternative access method]."

"Here's the [N]-step install guide:"

STEP 1: [Action]
- [Specific URL / install command]
- [One-line what it does]

STEP 2: [Action]
[Specific command inside a code block or quoted line]
Wait about [specific time].

STEP 3: Install [tool]
[Platform-specific commands, clearly separated]

✦ Mac/Linux:
[command]

✦ Windows:
[command]

STEP 4: Launch it
[Final command]
- [What you see]
- [What to select]
- "[Tool] is running on your machine."

USE CASES (3 quoted prompts):
"Now ask it to build things for you:

✦ '[Real prompt 1]'
✦ '[Real prompt 2]'
✦ '[Real prompt 3]'"

CONTEXT (1-2 lines):
"It [does impressive thing] and ships [output] from one prompt.
Everything runs [locally/for free/etc]."

NEWSLETTER CTA:
"I wrote a [word count]+ word newsletter breaking down [topic] → [link]"

"Save this guide."

REPOST + P.S.:
"♻️ Repost to help someone in your network.
P.S. Have you tried [specific question related to setup]?"

MANDATORY:
- Specific price contrast in hook ($100/month → $0)
- Exact commands (not pseudocode)
- Platform splits where relevant (Mac/Linux/Windows)
- 3 real example prompts in quotes
- "Save this guide" line
`,

  founder_story: `
STRUCTURE: "FOUNDER / LAUNCH STORY"
Reference: "I (secretly) became a SaaS founder"
Target: 1,500-2,000 characters

HOOK (personal confession):
"I (secretly) [did specific thing]."
"It took [long time] to say that publicly."

BACKSTORY (3-4 short lines):
"I started [doing the thing] in [specific month year].

This is my first time [specific thing].
I've been overprotective about every detail."

CURRENT STATE (honest / vulnerable):
"Right now, this is the worst [product] will ever be.

It still [best current feature with proof/social proof]."

PRICING / OFFER:
"That's why the founding price is $[X]/month.

Only for the first [N] users."

WHAT'S COMING (✦ list):
"What's coming next:

✦ [Feature 1]
✦ [Feature 2]
✦ [Feature 3]
✦ [Feature 4]"

LOCKED-IN PROMISE:
"Your price stays the same. Locked in for life."

SOCIAL PROOF:
"[N] people joined the waitlist before we opened.

The early feedback keeps saying two things:

1. [Quote 1]
2. [Quote 2]

Both of those were deliberate decisions."

VULNERABILITY / HONEST REFLECTION (3 bullets):
"Building a [thing] is nothing like building a [other thing].
The skills overlap, but the pressure is different.

- [Fear / worry 1]
- [Fear / worry 2]
- [Fear / worry 3]"

CALL TO ACTION:
"If you [specific audience description], this is what I built for you.

Start free. Lock in founding pricing if it fits.

Sign up here → [link]"

CLOSING ENGAGEMENT:
"If you have questions, feedback, or feature requests, I want to hear them."

P.S. LINE:
"P.S. Have you ever thought about [specific related question]?"

MANDATORY:
- Vulnerable/honest tone (not pure promo)
- Real dates and numbers (months spent, waitlist count)
- Feature list with ✦ bullets
- Lock-in pricing promise
- 2-3 fears/worries disclosed
- Sign-up link + clear offer
`,

  contrarian_hack: `
STRUCTURE: "CONTRARIAN HACK / STOP DOING X"
Reference: "You don't need to learn to code anymore"
Target: 1,200-1,600 characters

HOOK (direct contrarian):
"You don't need to [common belief] anymore."
"Stop [common behavior]."
"You're using [tool] wrong."

SETUP (1 short line):
"Here's how to [new way]:"

NUMBERED STEPS (5-7, each very short):
1. [Action with specific tool/URL]
2. [Action]
3. [Action]
4. [Action]
5. [Link or final setup]

KEY INSIGHT (1-2 short paragraphs):
"[Tool] now [impressive capability].

But here's where it gets powerful:"

NEXT-LEVEL SETTING / HACK:
"Before you prompt, change these [N] settings:

1. Select '[Specific setting]'.
[Why it matters in one line.]

2. Turn on '[Specific setting].'
[What it unlocks.]"

PROMPT TEMPLATE (in quotes):
"Then stop [old bad behavior]. Paste this instead:

'[Full copy-paste prompt with brackets for user inputs].'"

INSIGHT / REFRAME:
"The secret is not [old skill] anymore.
It is [new skill]."

PLAYBOOK CTA:
"But to go even deeper, use my full playbook: [link]"

ENGAGEMENT LINE:
"(save this if you [specific use case] — you won't need to)"

MANDATORY:
- Contrarian hook that challenges a common belief
- 5-7 short numbered steps (not bullets)
- One copyable prompt template in quotes
- Key insight reframe ("The secret is not X, it is Y")
- Save-this line at the end
`,

  myth_buster: `
STRUCTURE: "MYTH BUSTER (PUNCHY)"
Reference: "Half of what experts say about [topic] is wrong"
Target: 1,000-1,400 characters (sharper / shorter than myth_busting)

HOOK (one direct line):
"Half of what 'experts' say about [topic] is wrong."
OR: "Most '[topic] best practices' are outdated."

REALITY OPENER (one line + cited source):
"Here's the reality: [data source — real publication / dataset name]"

OLD vs NEW BLOCKS (4-6 pairs, no fluff):
❌ OLD: [conventional wisdom in one line]
✅ NEW: [reality in one line + specific stat or year]

❌ OLD: [conventional wisdom]
✅ NEW: [reality + stat]

❌ OLD: [conventional wisdom]
✅ NEW: [reality + stat]

[Repeat 4-6 times total. Each pair on its own paragraph.]

ENGAGEMENT QUESTION (final line):
"Which myth were you still believing?"

MANDATORY:
- 4-6 OLD/NEW pairs — never fewer than 4, never more than 6
- Each ✅ NEW line must include a specific stat OR a specific year
- Cite a real source after the hook (publication, dataset, study)
- Engagement question MUST be the last line — it drives 15+ word comments
- Hook under 60 characters
- No CTA other than the question (this format converts on comments, not links)
`,

  data_story: `
STRUCTURE: "DATA STORY / ROADMAP"
Reference: "[Big number] [audience] [surprising stat]. Here's the [N]-step plan."
Target: 1,400-2,000 characters

HOOK (shock stat → solution):
"[Big number] [people / creators / audience] [surprising stat]."
"Here's the [N]-step plan so you're not one of them:"

DAY / STEP BLOCKS (5-7 days, each one specific tool):
Day 1: [Specific action with named tool]
Day 2: [Specific action with named tool]
Day 3: [Specific action with named tool]
Day 4: [Specific action with named tool]
Day 5: [Specific action with named tool]

Each day = ONE concrete action + ONE named tool. No vague verbs.
Tools must be real: Claude, Gemini, NotebookLM, Notion, Lindy, Vislo.

WHY IT WORKS (3 arrow data lines):
↳ [Stat 1 with %]
↳ [Stat 2 with %]
↳ [Stat 3 with %]

REPOST LINE (last line):
"♻️ Repost this if your network needs this."

MANDATORY:
- Hook = real shock stat with specific big number ("87% of creators…")
- Each day numbered + specific named tool (NEVER "an AI tool")
- 3 arrow data lines as the proof block
- Repost line is the final element — no P.S., no CTA after
- Total 5-7 days (not 3, not 10)
`,

  comparison_table: `
STRUCTURE: "COMPARISON / SWAP"
Reference: "You're still paying for [old tool]. But [new tool] does it for free."
Target: 800-1,200 characters (intentionally short — high scroll-stop)

HOOK (the swap setup):
"You're still paying for [old tool]."
"But [new tool] does it for free:"

CHECKBOX FEATURES (3-5 lines with ☑):
☑ [Feature 1 — specific capability]
☑ [Feature 2 — specific capability]
☑ [Feature 3 — specific capability]
☑ [Feature 4 — optional]
☑ [Feature 5 — optional]

PROOF LINE (one line):
"And it's [free / $0 / $5/month] vs [old tool's price]."

CTA (one line, link or action):
"[Try it: URL]"
OR: "Try it free: [link]"

REPOST LINE (optional):
"♻️ Repost this for someone still paying $[X]/month."

MANDATORY:
- Hook calls out a SPECIFIC named old tool ("Notion AI", "ChatGPT Plus", "Jasper")
- New tool also named explicitly with URL
- 3-5 ☑ feature lines — concise capability per line, no fluff
- Price contrast on its own line ($X vs $0)
- Whole post under 1,200 characters — this format works because it's scannable
`,
};

/**
 * Build the LinkedIn playbook injection for the system prompt.
 * Detects the best structures based on the user's niche + content,
 * then provides 3-5 structure options the model can pick from.
 */
export function buildLinkedinPlaybook(niche: string, content: string): string {
  const structures = detectNicheStructures(niche, content);
  const templates = structures.map((s) => STRUCTURE_TEMPLATES[s]).join("\n\n");

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LINKEDIN POST PLAYBOOK — proven viral structures (7.5M+ impressions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For LinkedIn Post format, each of the 5 variations uses a DIFFERENT
structure below. Pick from these (matched to user's niche: "${niche || "general"}"):
${templates}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LINKEDIN FORMATTING RULES (data-backed, 537k posts analyzed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LENGTH:
- Target 1,200-1,800 characters (the verified viral sweet spot)
- Can go longer for myth_busting and process_deep_dive (up to 2,800)
- Never shorter than 800 characters (dwell time matters)

LINE FORMATTING:
- Hook line under 60 characters (mobile scroll-stopper)
- Line length under 55 characters throughout
- Empty line between every 1-3 lines (white space = dwell time)
- NO long paragraphs — break into short visual blocks
- Never orphan words at the end of lines

BULLET SYMBOLS (use these, not markdown):
- ☑ for checkbox benefits (3 per post max)
- ✦ for feature/capability lists
- ↳ for data arrows (metrics, sources)
- ❌ OLD / ✅ NEW for myth-busting contrasts
- — for transitions or separators
- --- for major section dividers (myth_busting only)

NUMBERED SECTIONS:
- Use "1." "2." "3." (never Markdown ## headers)
- Sub-items with "- " dashes
- Section headers in sentence case (never Title Case)

ENGAGEMENT MECHANICS:
- Hook: specific, contrarian, or data-heavy opener
- No "hey guys" / "welcome" / "hello everyone"
- Start mid-thought or with a direct claim
- End with ONE of these:
  1. "♻️ Repost this to help someone in your network"
  2. "P.S. [specific engagement question]"
  3. Both (typical for long posts)

CTA RULES:
- ONE newsletter/product/resource CTA max per post
- Place CTA at 70-80% of the post (not at the top)
- Link on its own line: "Read it here: [link]"
- Never "click here" — use "Read it here", "Try it free", "Access the guide"

SPECIFICITY RULES (zero tolerance for vagueness):
- Real tool names: Claude, Gemini, Notion, Slack, Vislo
  (NEVER "a tool", "an app", "a platform")
- Real URLs: gemini.google.com, notebooklm.google.com, claude.com
  (NEVER "their website")
- Real numbers: $19/month, 1,608 people, 7.5M+ impressions
  (NEVER "many", "a lot", "several")
- Real buttons/menus: "Settings → Capabilities → Skills → Upload"
  (NEVER "go to settings")
- Real prompts in quotes (not paraphrased)

OPENING PATTERNS (pick one per variation — never repeat):
Variation 1 tool_tutorial: "How to [setup X so it never Y]:"
Variation 2 level_up: "[Level 1] → [Level 2] → [Level 3]"
Variation 3 myth_busting: "Half of what 'experts' say about X is wrong."
Variation 4 elements_framework: "My [X] generated [impressive result]."
Variation 5 contrarian_hack: "You don't need to [common belief] anymore."

BANNED (classic AI tells that kill LinkedIn reach):
- "In today's world" / "In today's digital landscape"
- "Have you ever wondered"
- "Here's the thing" / "Here's the truth"
- "It's important to note" / "It goes without saying"
- "Game changer" / "Revolutionary" / "Cutting-edge"
- "Delve" / "Tapestry" / "Pivotal" / "Landscape" / "Robust"
- "Unlock" / "Empower" / "Elevate" / "Synergy"
- Em dashes as universal connectors (use commas or periods)
- Rule-of-three clichés (three adjectives in a row)
- "-ing" phrases tacked on for superficial analysis
- Academic / corporate tone — this is a conversational platform

VOICE:
- Direct, second person ("you", "your")
- Contractions everywhere (you're, don't, it's, we're)
- Short punchy sentences + occasional longer one for rhythm
- Personal examples with "I" (not self-promotion)
- Admit struggle/failure — vulnerability drives dwell time
- Specific over general, always

DATA-BACKED WINNERS (enforce these):
- Trailing question → +27% engagement
- Hook under 60 chars → 1.5x scroll-stop
- 1,200-1,800 char length → optimal dwell time
- Links in body → -45% engagement (keep links at end)
- 15+ word comments drive 2.5x reach boost (post should invite long comments)
- Personal story + lesson → 1.3x-1.6x reach
- Long-form educational → 2.5x-5.8x reach
- Carousels → 1.9x better than video

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFERENCE EXAMPLES — study these openings, then write in this voice
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are real, high-performing openings from a top LinkedIn AI creator.
Match the cadence, the specificity, the willingness to commit to a position.
Do NOT copy the words — copy the *moves*.

[tool_tutorial] —
"How to set up Claude so it never forgets you:

Prompts → Projects → Skills (explained in 3 mins)

Prompts = telling a stranger your job every morning.
Projects = giving a new hire a binder on day one.
Skills = training an employee once. For forever.

Step 1: Start with a Prompt (but don't stay there)
✦ Open Claude. Type your task. Get an answer.
✦ It works. But tomorrow? Claude forgot everything.
✦ You re-explain. Again. Every. Single. Chat.
✦ That's Level 1. Most people never leave it."

[n_day_plan] —
"840 out of 1,000 people have never used AI.

Here's the 7-day plan so you're not one of them:

Day 1: Set up Claude (and actually quit ChatGPT)
1. Download the desktop app from claude.com
2. Get the Pro. Select Opus 4.6 + Extended thinking.
3. Create your 'about me' markdown file.

[...]

If you're reading this, you're already in the top 16%.
These 7 guides put you in the top 0.4%.

It took me 1,000+ hours to write them.
It takes you 7 days to use them.

♻️ Repost this if your network is still in the 840."

[myth_busting] —
"Half of what 'experts' say about LinkedIn is wrong.

Here's the reality of LinkedIn in 2026:
↳ Follower growth down 59%
↳ Impressions down 50-65%
↳ Engagement up 12%

---

Sources:
Industry data: Richard van der Blom's Algorithm Insights 2025 (1.8M+ posts analysed).
My data: Stanley helped me analyse 12 months of my posts to validate these findings.

---

LinkedIn isn't broken. The rules just changed.

---

1. Engagement pods boost visibility
❌ OLD: Pods = more reach.
✅ NEW: LinkedIn detects artificial engagement. Pods trigger spam filters and suppress your reach.

[...4-5 more myths...]

Stop following 2023 advice in 2026.
Which myth were you still believing? Drop it below.
Repost ♻️ to help someone in your network."

[founder_story] —
"I (secretly) became a SaaS founder.

It took 9+ months to say that publicly.

I started building in June 2025.

This is my first time launching a SaaS product.
I've been overprotective about every detail.

Right now, this is the worst Vislo will ever be.

It still creates branded infographics better than anything else I've tested.

That's why the founding price is $19/month.

Only for the first 100 users.

What's coming next:
✦ Carousel creation
✦ GIFs and video editing
✦ Even better infographics
✦ Features I haven't announced yet

Your price stays the same. Locked in for life.

1,608 people joined the waitlist before we opened.

P.S. Have you ever thought about building a SaaS?"

[contrarian_hack] —
"You don't need to learn to code anymore.

Here's how to prompt Claude Code (zero coding):

1. Open the Claude desktop app.
2. Click 'Code' (not Chat, not Cowork).
3. Select a folder from your computer.
4. Connect a free GitHub account in Settings.
5. Go to Connectors.

Claude now builds anything you describe in English.

But here's where it gets powerful:

Before you prompt, change these 2 settings:
1. Select 'Opus 4.6' model. It's the smartest for complex builds.
2. Turn on 'Auto accept edits.' It stops Claude from pausing after every action.

Then stop describing code. Paste this instead:

'Create a GitHub repo named [NAME]. I do not know how to code. Code everything for me. I want to [GOAL] for [SUCCESS CRITERIA]. Here's an example [attach screenshot].'

Claude reads your screenshot. It builds the site.

The secret is not knowing how to code anymore.
It is knowing how to prompt.

(save this if you can't code — you won't need to)"

[comparison_table] —
"You're still paying for ChatGPT.

But Grok 4.20 is now the best at searching:

☑ The #1 AI at instructions following.
☑ Lowest hallucination rate across AI models.
☑ Uses a unique 4x simultaneous AI agents tech.

I wrote a full guide with 10 prompts to copy-paste.
To access it, for free, go to: [link]

♻️ Repost this image to help people search better."

[elements_framework] —
"My AI infographics generated 7.5M+ impressions.

Here are the 7 elements behind every one:

1. Hook Formula
✦ Bold title under 10 words
✦ Use contrast, numbers, or a pattern interrupt

This decides if anyone stops scrolling

2. Rehook Subtitle
✦ Reinforces the promise
✦ Adds credibility or specificity

'I grew to 200K followers using this system'

[...5 more elements...]

P.S. Which element do you skip most often?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNATURE MOVES (use these — they're what readers actually respond to)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Vulnerable confidence
   "I (secretly) became a SaaS founder. It took 9+ months to say publicly."
   "It took me 1,000+ hours to write them. It takes you 7 days to use them."
   The pattern: admit hard work or fear, then deliver value.

2. Time / effort asymmetry
   "It took me X. It takes you Y." (where X >> Y)
   Builds gratitude AND credibility in one move.

3. Stat → percentile math
   "If you're reading this, you're already in the top 16%.
    These 7 guides put you in the top 0.4%."

4. Emoji used FUNCTIONALLY only
   ✦ for capability lists, ☑ for checkbox benefits, ↳ for data arrows,
   ❌/✅ for myth pairs, ♻️ for repost. Never decorative. Never in front
   of headings. Never random sparkles 🚀✨🔥.

5. Inline real artifact
   Real prompt in quotes (verbatim, copyable).
   Real menu path ("Settings → Capabilities → Skills → Upload").
   Real URL on its own line.

6. Save / Repost trigger as the LAST line
   "♻️ Repost this if your network is still in the 840."
   "(save this if you can't code — you won't need to)"
   "P.S. Which element do you skip most often?"
   Pick exactly ONE: ♻️ repost, save-this, or P.S. question.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${buildAntiAiRules("strict")}
`;
}

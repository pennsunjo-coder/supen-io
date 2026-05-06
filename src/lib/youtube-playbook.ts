/**
 * YouTube long-form script playbook.
 * Extracted from 10+ real scripts by Awa K. Penn (AI/tech creator, 1M+ followers).
 * Used when user generates "Script long" format in StudioWizard.
 * Adapts the structure template based on user's niche.
 *
 * Awa K Penn's signature structural DNA:
 * - Hook with a specific claim, shock number, or "what if" opening
 * - Short intro with what-you'll-learn preview
 * - Optional 1-sentence educational disclaimer (for income/financial topics)
 * - Step-by-step walkthrough with NUMBERED steps
 * - Real URLs and specific tool names throughout (never "a tool")
 * - Cliffhangers: "stay with me because step 4..."
 * - Common Mistakes / Real Use Case sections to add depth
 * - Closing formula: Like → Subscribe → Comment → See you
 */

import { buildAntiAiRules } from "@/lib/anti-ai-rules";

export type YoutubeStructure =
  | "tutorial"           // "In this video I'll walk you through the full workflow"
  | "listicle"           // "10 AI tools you won't believe are free"
  | "workflow_combo"     // "This NotebookLM + Google AI Studio workflow is insane"
  | "contrarian_truth"   // "Most people use ChatGPT wrong. Fix it in X minutes"
  | "business_cases"     // "7 Business Use Cases for [X] in 2026"
  | "ecosystem_guide"    // "20 things you can create with Gemini"
  | "skills_framework"   // "The 6 AI Skills That Separate Winners From Losers"
  | "disruption_breakdown"; // "RIP Canva / This killed [X]"

export interface NicheHint {
  keywords: string[];
  preferredStructures: YoutubeStructure[];
}

const NICHE_STRUCTURE_MAP: NicheHint[] = [
  { keywords: ["ai", "gpt", "claude", "gemini", "tech", "tool", "software", "automation"], preferredStructures: ["tutorial", "listicle", "workflow_combo", "ecosystem_guide", "disruption_breakdown"] },
  { keywords: ["marketing", "growth", "audience", "viral", "content", "creator", "youtube", "followers"], preferredStructures: ["tutorial", "skills_framework", "workflow_combo", "business_cases"] },
  { keywords: ["business", "entrepreneur", "startup", "founder", "money", "income", "monetize"], preferredStructures: ["business_cases", "tutorial", "skills_framework", "contrarian_truth"] },
  { keywords: ["education", "learn", "tutorial", "teach", "course"], preferredStructures: ["tutorial", "ecosystem_guide", "skills_framework"] },
  { keywords: ["design", "canva", "photoshop", "creative", "image"], preferredStructures: ["tutorial", "workflow_combo", "business_cases"] },
  { keywords: ["finance", "invest", "saving", "wealth"], preferredStructures: ["business_cases", "listicle", "contrarian_truth"] },
];

function detectNicheStructures(niche: string, content: string): YoutubeStructure[] {
  const text = `${niche} ${content}`.toLowerCase();
  const matches: YoutubeStructure[] = [];
  for (const hint of NICHE_STRUCTURE_MAP) {
    if (hint.keywords.some((k) => text.includes(k))) {
      matches.push(...hint.preferredStructures);
    }
  }
  if (matches.length === 0) return ["tutorial", "listicle", "skills_framework", "business_cases"];
  return Array.from(new Set(matches)).slice(0, 5);
}

// ─── Structure templates — extracted from real Awa K Penn scripts ───

const STRUCTURE_TEMPLATES: Record<YoutubeStructure, string> = {
  tutorial: `
STRUCTURE: "STEP-BY-STEP TUTORIAL"
Reference: "How to turn a Google Doc into a web app with Replit Agent 4"
Target length: 5-8 minutes spoken (800-1400 words)

HOOK (30-60 seconds, ~60-100 words):
Open with "What if you could..." OR "What if I told you..." OR "Most people still [wrong thing]. That is a mistake."
Deliver a specific, almost-unbelievable claim.
End with: "Let me show you how this works."

INTRO (30-45 seconds, ~60-80 words):
Frame the problem most people have with this topic.
State what this video will teach, explicitly.
Name the tools being used.
Close with: "By the end of this video, you'll [specific outcome]. Let's walk through the process step by step."

STEP 1 to STEP N (60-90% of video, 600-1000+ words):
Each step:
- Header line: "Step 1 – [Action verb + specific noun]"
- Concrete instruction: "Go to [exact URL]. Click on [exact button name]."
- ONE paragraph of context or reasoning
- Include real prompts inside quotes when applicable
- Between steps, add transitions: "Now let's..." / "This is where [tool] comes in."
- Include at least one mid-script cliffhanger or rhetorical question
  Example: "Quick question. How long do you think it normally takes to build something like this from scratch? For most people… hours or even days. But here, [tool] does it in minutes."

COMMON MISTAKES TO AVOID (optional, 60-90 seconds):
"Before you start using this regularly, there are a few mistakes that can affect your results."
List 3 specific mistakes with the fix for each.

REAL USE CASE / WHY THIS MATTERS (optional, 45-60 seconds):
"Let's say you want to [specific scenario]. Instead of [old painful way], you can [new way using tool]."
Connect the how-to to a real business or workflow outcome.

CLOSING (15-25 seconds):
Exactly this format:
"If this helped you, hit Like so more [audience] can discover this.
Subscribe for more [specific-topic] workflows like this.
And comment below [specific engagement question].
I'll see you in the next one."

MANDATORY:
- Name every tool EXPLICITLY (ElevenLabs, Replit, NotebookLM, Manus, not "a tool")
- Include real URLs (gemini.google.com, notebooklm.google.com, replit.com)
- Name buttons and menu items ("click on Start", "select Deep Research from the drop-down")
- Include ACTUAL prompts inside quotes when showing a prompt
- Use "you" heavily, "I" for personal examples
- Contractions throughout (you'll, I'm, don't, it's)
`,

  listicle: `
STRUCTURE: "TOP N TOOLS / TIPS / HACKS"
Reference: "10 AI Tools You Won't Believe Are Free"
Target length: 8-12 minutes spoken (1500-2500 words)

HOOK (40-60 seconds, ~100-130 words):
Open with a shock number or contrast.
"Right now, most creators are paying $20... $40... even $100 every month for AI tools."
"But what if I told you… You can replace most of those paid tools with completely free ones?"
Tease the outcome: "By the end of this video, you might cancel a few subscriptions."
"Let's start with the first one."

TOOL/ITEM 1 (60-90 seconds, ~180-250 words):
"Tool number one is [Name]."
Explain the PROBLEM it solves ("Think about how much time you spend typing: captions, emails, scripts…")
Explain HOW it works ("With [tool], you can open Google Docs, Notion or even your email… Start talking through your idea, and it writes the draft in real time.")
Include a specific number or benefit ("A script that normally takes 45 minutes to type can be spoken out in 5 minutes.")
TRANSITION with cliffhanger: "Wait till you see what Tool #2 does for design."

TOOL/ITEM 2 to N (same pattern, 60-90 seconds each):
- Same structure: problem → how → specific benefit → transition to next
- Vary the transition hooks:
  "Now imagine if..." / "And once you have those clips..." / "But what if you want to..."
- For items 5-8, add variety: questions, examples, "this is how creators use it"

FINAL / MOST POWERFUL ITEM (70-100 seconds):
Tease it before delivering: "And now... The last tool is the one I personally think is the most powerful. Because it can replace hours of research work."
Go deeper on this one — more detail, more benefit claims.

WRAP-UP + CLOSING (30-45 seconds):
"If even 2 or 3 of these tools replace the ones you're paying for right now…
That's $20… $50… maybe even $100 saved every single month.
Which means by the end of this year… You could literally save hundreds of dollars.
And more importantly… You stop waiting on freelancers, software exports or monthly renewals…
And start creating whenever you want."
Then the standard closing formula (Like → Subscribe → Comment → See you).

MANDATORY:
- 5-10 items (never fewer, rarely more)
- Every tool/item named explicitly
- Specific price or saving mentioned at least 3 times across the script
- Cliffhanger transitions between items 1→2, 2→3, etc.
- Save the best for last — tease it
- Total word count in the 1500-2500 range for long-form
`,

  workflow_combo: `
STRUCTURE: "MULTI-TOOL WORKFLOW"
Reference: "This NotebookLM + Google AI Studio Workflow is Insane"
Target length: 7-10 minutes spoken (1200-2000 words)

HOOK (45-60 seconds):
State the #1 mistake people make with this workflow:
"Most people mess up [tool] before they even type a single prompt. They add a few sources, click generate, and then they wonder why the output feels generic."
Explain what makes the combination powerful.
Tease what the viewer will see: "In today's video, I'm going to walk you through the full workflow step by step, from [start] to [outcome]."

DISCLAIMER (optional, 10-15 seconds):
"Quick disclaimer before we start. This video is for education only. I'm not giving financial advice, and I'm not promising you will make money."

OPENING SETUP (60-90 seconds):
Show the starting point. What are you feeding into the workflow?
"The first thing I'm going to do is go to [source] and pick [specific thing]."
Often uses multiple sources for density: "I won't use just one video. I will use four videos on the same topic."
Introduce any Chrome extensions or supporting tools needed.

PHASE 1 — Tool A (90-150 seconds):
Walk through the first tool's role.
"So, I will go to [URL], click on [button], open a new [project] and name it [specific name]."
Include specific prompts inside quotes.
Show the intermediate output ("And just like that, [tool] creates [output] for me. This is already crazy...")

TRANSITION (15-30 seconds):
"But now we want [improvement]. So the next thing I'm going to do is..."
Make the viewer understand WHY you're going deeper.

PHASE 2 — Tool B (90-150 seconds):
Walk through tool B and how it connects to the output of Tool A.
"Now we go into [tool B]. I open the [feature], click [button], paste the [output from A]..."
Emphasize what's possible because of the combination.

BONUS / MULTIPLE OUTPUTS (60-180 seconds):
"Now, here's the part that makes [tool] even more powerful."
Show all the different outputs you can generate from the same setup:
video overview, infographic, mind map, slides, quiz, audio overview, etc.
Keep each brief (20-30 seconds per output type).

CLOSING (30-40 seconds):
"So the goal of this video is not just the [specific thing].
The real goal is to show you what is possible when you combine [tool A] with [tool B]."
Add a call to action: "Open [tool] and do this once. Take one [input], generate one [output], and then build one [outcome]. Even if it's not perfect."
Standard closing (Like → Subscribe → See you).

MANDATORY:
- Show the actual combination/connection between tools
- Include at least one "wow moment" where output exceeds expectations
- Name every menu item and button click
- Use real URLs and extension links
- Show the workflow is REAL, not theoretical
`,

  contrarian_truth: `
STRUCTURE: "YOU'RE USING X WRONG"
Reference: "You're Using ChatGPT Wrong. Fix It in X Minutes"
Target length: 7-12 minutes spoken (1400-2500 words)

HOOK (30-45 seconds):
Direct contrarian statement:
"Most people still use [tool] like a simple chat box. That is a mistake."
Follow with the setup: "[Tool] is now a full software with several types of features you can use to make life better. And I bet you won't even need to pay for other AI tools."
Preview what the viewer will learn.

PREVIEW LIST (30-60 seconds):
List all the features/sections being covered, briefly. 10-20 items is acceptable here.
"We will cover [feature 1], [feature 2], [feature 3]..."
This creates anticipation and signals depth.

FEATURE 1 to N (30-60 seconds each, ~80-150 words per feature):
"The first point is [feature]."
State why most people miss it.
Walk through the setup: "To set this up, go to Settings, then [specific menu], then [action]."
Include a real-world use case: "You can type an example like this: [actual prompt or example]."
Show the benefit: "This is so good and every [tool] user should be using it."

TRANSITIONS between features:
Keep them short: "The next point is..."
Variety: "The tenth point is..." / "The next feature is..."
Occasionally add a personal use case: "My best use case is using this while driving..."

CLOSING (15-30 seconds):
"And that is it. You just went from using [tool] like a simple [old way] to understanding how it really works. You now know what to use and how to use it."
Standard closing formula (Like → Subscribe → See you).

MANDATORY:
- 10-20 distinct features covered (this is a depth-showing format)
- Each feature has a 2-4 step setup walkthrough
- Real prompt examples inside quotes
- Sentence-case headings ("The first point is..." not "## Point 1")
- No numbered lists in the text — weave numbers into spoken flow
`,

  business_cases: `
STRUCTURE: "N BUSINESS USE CASES FOR X"
Reference: "7 Business Use Cases for Nano Banana Pro in 2026"
Target length: 8-12 minutes spoken (1500-2500 words)

HOOK (40-60 seconds):
Open with a specific income/outcome question.
"What's the most lucrative business use case for [tool] in 2026 if you're starting from zero? With no followers, no budget, and no plan."
Position yourself: "I'm someone who has used [tool] extensively across real projects, and if I were starting again today, this is precisely how I would approach it."
Promise concrete value: "And yes, I'm going to show you where these skills are commonly used, how delivery usually works, and the real effort involved for each idea."

DISCLAIMER (15-20 seconds):
"Quick disclaimer before we continue. This video is for educational purposes only. I am not making income guarantees or financial promises. Results vary based on skill, experience, market demand, and execution."

LEVELS / FRAMEWORK (60-90 seconds):
Set up a framework (Level 1 / Level 2 / Level 3 is Awa K Penn's signature):
"Before we go further, you need to understand three different ways people actually use [tool], depending on their experience level.
At Level one, Most beginners [basic approach].
At Level two, Advanced users [intermediate approach].
At Level three, System builders focus on automation. They [advanced approach]."
State which level THIS video targets.

TOOL SETUP (60-90 seconds):
Explain how to ACCESS the tool properly:
"To access it, go to [URL]. Click the model selector and select [option]. Then click [action]."
Warn about common access mistakes: "If you use the standard model, the outputs will be simpler."

PREVIEW OF USE CASES (30 seconds):
"As mentioned at the beginning, I will show [N] common ways people use [tool]. We will cover [use case 1], [use case 2]..."

USE CASE 1 to N (90-150 seconds each, ~180-300 words per case):
"The first is [use case name]. Here's the problem being solved."
Explain WHO has the problem: "People have [specific problem scenario]."
Show the SOLUTION: "You upload their [input], and [tool] enhances it."
Include a REAL PROMPT inside quotes.
Add a SOCIAL PROOF or market signal: "I regularly receive messages from people on Facebook and Instagram asking about..."
Explain WHERE to sell: "People who offer this service typically list it on Fiverr under [category] or on Upwork under [category]. Others reach clients through [channel]."

CALL TO ACTION (30-45 seconds):
"So here is your action for today. Pick one idea from this list. Create a few examples. Share them or apply them in a real project."
Standard closing (Subscribe → Notifications → See you).

MANDATORY:
- Include a disclaimer about income/results
- Use a Levels framework (Level 1/2/3 or Beginner/Intermediate/Advanced)
- Each use case includes: problem → solution → prompt → where to sell
- Reference real platforms (Fiverr, Upwork, Etsy, LinkedIn, Facebook)
- 5-7 use cases (not 10+, which feels shallow)
- Conclude with ONE clear action step
`,

  ecosystem_guide: `
STRUCTURE: "COMPLETE GUIDE TO [PLATFORM]"
Reference: "20 Things You Can Create with Gemini"
Target length: 10-15 minutes spoken (2000-3500 words)

HOOK (45-60 seconds):
Position against the competition:
"While so many people are still paying for [competitor], [tool] is a completely different beast on its own."
Claim under-utilization: "If you only open the [basic feature], you're barely using ten percent of what [tool] can do."
Self-intro (1 sentence, OPTIONAL): "I am [Name], an [role] with over [follower count]."
Promise foundation-first approach: "Before we go through the [N] things, I want to give you the full foundation."

FOUNDATION / ACCESS POINTS (90-120 seconds):
Walk through where to access the tool.
List all entry points: web version, mobile app, Workspace integration, labs, etc.
For each, one sentence about what it does.
"The easiest place to start is [URL]. Once you sign in, the full interface opens up."

PREVIEW: "Now let's move into the [N] free things you can create with [tool]."

FEATURE 1 to N (30-60 seconds each, 80-150 words per feature):
"The first feature is [name], and it's very easy to do inside [tool]."
Describe what it does and how to use it:
"You simply upload your [input] the same way you would upload a file anywhere else."
"The moment it loads, tell [tool] exactly what you want. You can say, '[specific prompt].'"
End with the use case: "It's perfect for turning [X] into [Y]."

TRANSITIONS:
"The second feature is..." / "The third feature is..."
Keep them light and consistent.

CLOSING (30-45 seconds):
"And that's the full picture. Once you understand how the ecosystem works, [tool] becomes one of the most useful and generous AI platforms you can use for free."
Standard closing (Subscribe → See you).

MANDATORY:
- Cover 15-20+ features (this is a depth-showing format)
- Name every access point, URL, and feature explicitly
- Include real prompt examples every 3-4 features
- Foundation first, then features (not the other way around)
- Keep each feature explanation CONCISE — don't go deep on any single one
`,

  skills_framework: `
STRUCTURE: "N SKILLS TO [OUTCOME]"
Reference: "The 6 AI Skills That WILL Separate Winners From Losers"
Target length: 8-12 minutes spoken (1600-2800 words)

HOOK (45-60 seconds):
Open with a macro trend or cultural shift.
"[Topic] is booming in 2026. And right now, there's a global gold rush happening. Some people are already cashing in, and many don't even realise they're standing next to it."
Reveal the insight: "The gold isn't going to the people who know the most tools. It's going to the people who have learned a small set of high-leverage skills."
Promise what's coming: "So in this video, I'll show you the [N] skills that put you on the winning side in 2026."
Add a cliffhanger: "Stay with me, because skill number four is the reason I stopped paying freelancers $300 every month."

SKILL 1 to N (90-150 seconds each, ~200-350 words per skill):
"The first is [skill name]."
Distinguish it from what most people think it is:
"Many people think that [common misconception]. But [skill] is different."
Define it precisely.
Show contrast with beginner example:
"A beginner might ask general questions like '[basic example]'. But someone who understands [skill] starts with context. They would ask something like '[advanced example]'."
Give a FRAMEWORK or checklist (Awa K Penn signature):
"I want to give you a simple framework you can use... Include Four things: [Item 1], [Item 2], [Item 3], [Item 4]."
End with why it matters: "When you structure [X] this way, [tool] stops giving you generic advice and starts giving you actionable answers."

TRANSITIONS between skills:
"Now that you know [X], let's talk about [Y]."
"The second skill is..."
Connect skills to each other: "And when you combine this with [previous skill], you stop [bad outcome]."

CLOSING (30-45 seconds):
"If you start building even two or three of these skills, you'll already be ahead of most people in 2026."
Create a choice frame: "The question is whether you're going to be on the side that benefits from it or the side that watches from the outside."
Standard closing (Like → Subscribe → Comment which skill → See you).

MANDATORY:
- 5-7 skills (not more — keep it digestible)
- Each skill has a framework, a beginner vs. advanced contrast, and a reason it matters
- Cliffhanger in the hook teasing skill #4 or #5
- Connect skills to each other across the video
- End with a call to apply at least 2-3 skills
`,

  disruption_breakdown: `
STRUCTURE: "RIP [OLD TOOL] / THIS JUST KILLED [X]"
Reference: "RIP Canva — Google's new Pomelli is impressive"
Target length: 4-7 minutes spoken (800-1500 words)

HOOK (30-45 seconds):
Dramatic opening:
"BREAKING: RIP [old tool]. [New tool] is impressive."
OR: "[Big company] just woke up and decided to end a billion dollar company."
Follow with what was announced in ONE sentence.
"It functions like [big metaphor — a full marketing department in one dashboard]."

FEATURE LIST (20-30 seconds):
Rapid-fire bullet summary of capabilities:
"- Creates [capability 1]
- Learns [capability 2]
- Generates [capability 3] in seconds"
End with: "And the best part, it's completely FREE. Here's what it can do and how to use it."

STEP-BY-STEP DEMO (60-90% of video):
Follow the tutorial structure:
"Step 1: Go to [URL]. Click on [button]. Upload/paste [specific input]."
"Step 2: Wait for [time]. Preview your [output]."
Show intermediate outputs throughout.
Include one moment of "wait what?": "And it does this in seconds."

COMPARISON (optional, 30-45 seconds):
"Before: You would [old painful process taking hours/days].
After: You type [one sentence prompt] and it does it in [minutes]."

CLOSING (15-25 seconds):
"The [name] name is funny. But the goal is serious: [the real impact]."
Standard closing (Like → Subscribe → Comment → See you).

MANDATORY:
- "RIP" / "just killed" / "just woke up" style hook
- Specific company names, specific product names
- Real URLs in the demo
- A before/after contrast somewhere in the script
- Soft closing — don't over-hype, let the tool speak for itself
`,
};

/**
 * Build the YouTube long-form playbook injection for the system prompt.
 * Detects the best structures based on the user's niche + content,
 * then provides 3-5 structure options the model can pick from.
 */
export function buildYoutubePlaybook(niche: string, content: string): string {
  const structures = detectNicheStructures(niche, content);
  const templates = structures.map((s) => STRUCTURE_TEMPLATES[s]).join("\n\n");

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUTUBE LONG-FORM PLAYBOOK — Awa K Penn signature style
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For YouTube long-form scripts, each of the 5 variations uses a DIFFERENT
structure below. Pick from these (matched to user's niche: "${niche || "general"}"):
${templates}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUTUBE SCRIPT FORMATTING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Written as SPOKEN words (not read silently)
- Target 1500-3000 words for a 7-12 minute video
- Use concrete URLs: gemini.google.com, notebooklm.google.com, replit.com
- Name every tool EXPLICITLY (NotebookLM, ElevenLabs, Manus, Gemini, etc.)
- Name every button and menu item ("click on Start", "select Deep Research")
- Include real prompts inside quotes (not paraphrased)
- Use "you" constantly — talking TO the viewer, not AT them
- Use "I" for personal examples only (not self-praise)
- Contractions throughout: you'll, I'm, don't, it's, we're, that's
- Short punchy sentences mixed with longer explanatory ones
- No asterisks, no bold, no markdown headers — this is spoken text
- Use "Step 1 – [Action]" header style for tutorials (never "## Step 1")
- Rhetorical questions to engage: "Quick question. How long do you think..."
- Cliffhangers: "Stay with me because [step] is the reason I..."
- Mid-script transitions: "Now let's...", "This is where [X] comes in", "But here's the crazy part..."

CLOSING FORMULA (use this exact pattern):
"If this helped you, hit Like so [audience] can discover this.
Subscribe for more [topic] workflows like this.
And comment below [specific question related to video topic].
I'll see you in the next one."

DISCLAIMERS (include when topic is income/business/monetization):
"Quick disclaimer before we continue. This video is for educational purposes
only. I am not making income guarantees or financial promises. Results vary."

TONE:
- Confident, practical, no-hype, show-don't-tell
- Like a technical friend walking you through their workflow
- Zero "game-changer" / "revolutionary" / "cutting-edge" vocabulary
- Zero "delve", "tapestry", "pivotal", "intricate", "robust"
- Occasional enthusiasm ("Just look at this." / "This is wild." / "This is insane.")
- Credible over promotional — cite real numbers, real URLs, real workflows

OPENING PATTERNS (pick one per variation — do not repeat):
Variation 1: "What if you could/I told you..."
Variation 2: "Most people still [wrong thing]. That is a mistake."
Variation 3: "BREAKING: [Company] just [action]" / "RIP [tool]"
Variation 4: "Right now, most [audience] are [current painful reality]..."
Variation 5: "I'm going to say something that will sound crazy, but it is 100% true."

AVOID:
- Starting with "Hey guys" / "What's up" / "Hello everyone" / "Welcome back"
- Over-formal academic openings
- "In today's world" / "In today's digital landscape"
- Listicles that feel padded with filler items
- Summary/conclusion sections that rehash everything (wastes watch time)
- Rule-of-three clichés (three adjectives, three short phrases)
- Em dashes as universal connectors (use commas, periods, parens)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFERENCE OPENINGS — match this cadence
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[tutorial] —
"What if you could create content without having to sit down and record
every single time? Just imagine having a version of you that can speak
your ideas, explain things clearly, and keep posting consistently…
Even when you're not filming anything.

This is exactly what AI clones have made possible.
And in this video, I'll walk you through the full workflow so you can
set this up for yourself using just a photo and a script."

[contrarian_truth] —
"Most people still use ChatGPT like a simple chat box. That is a
mistake. ChatGPT is now a full software with several types of features
you can use to make life better and I bet you won't even need to pay
for other AI tools. In this video, I will show you the new ChatGPT in
one clear walkthrough."

[listicle] —
"Right now, most creators are paying $20… $40… even $100 every month
for AI tools. For voiceovers, video editing, landing pages, music,
research and more. But what if I told you you can replace most of
those paid tools with completely free ones? In this video, I'm going
to show you 10 AI tools you won't believe are free."

[business_cases] —
"What's the most lucrative business use case for Nano Banana Pro in
2026 if you're starting from zero? With no followers, no budget, and
no plan. I'm someone who has used Nano Banana Pro extensively across
real projects, and if I were starting again today, this is precisely
how I would approach learning and applying it from day one in business."

[skills_framework] —
"AI is booming in 2026. And right now, there's a global gold rush
happening. Some people are already cashing in, and many don't even
realise they're standing next to it. And here's what nobody really
tells you. The gold isn't going to the people who know the most tools.
It's not going to the people who spend all day watching tutorials.
It's going to the people who have learned a small set of high-leverage
AI skills."

[disruption_breakdown] —
"Most people mess up NotebookLM before they even type a single prompt.
They add a few sources, click generate, and then they wonder why the
output feels generic or even unreliable. But here is the key.
NotebookLM is not a typical chatbot like Gemini, ChatGPT, or Claude.
It is more like a research system, and the quality of what you get
depends on what you feed it and how you set it up."

[ecosystem_guide] —
"While so many people are still paying for ChatGPT, Claude, and even
Perplexity every single month, Google Gemini is a completely different
beast on its own. Most of what it offers is free, and the ecosystem
behind it is much bigger than people realise. If you only open the
chat box, you're barely using ten percent of what Gemini can do."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNATURE MOVES (the cadence Awa Penn uses repeatedly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. "What if you could…" / "What if I told you…" opener
   Curiosity gap that doesn't sound like clickbait when followed by
   a specific, almost-unbelievable claim.

2. Quick disclaimer block (2 sentences max) for any income/business topic
   "Quick disclaimer before we start. This video is for education only.
   I am not giving financial advice." Builds trust without killing pace.

3. "Stay with me because…" mid-script cliffhanger
   "Stay with me because skill number four is the reason I stopped
   paying freelancers $300 every month."

4. Real URL + real button path inside the script
   "Go to gemini.google.com. Click the model selector and select
   Thinking. Then click Create image." Specificity is the moat.

5. "Just look at this" / "This is wild" / "This is insane" interjection
   Used sparingly, at moments of genuine reveal. Keeps the script
   alive without becoming hype.

6. Closing formula — use it verbatim
   "If this helped you, hit Like so YouTube shows this to more
   creators trying to [outcome]. Subscribe for more [topic] like
   this. And comment below [specific question]. I'll see you in
   the next one."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${buildAntiAiRules("loose")}
`;
}

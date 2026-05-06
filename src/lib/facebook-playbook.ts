/**
 * Facebook playbook — both Posts and Threads.
 * Different DNA from LinkedIn (more casual, story-first, comment-driven)
 * and from X (longer cadence allowed, less punchline-driven).
 *
 * Facebook DNA:
 * - Story-first: open with a grounded specific moment, not a claim.
 * - Comment-bait > like-bait: the algorithm rewards real comments
 *   with 15+ words. End on a question that invites real responses.
 * - Group-style intimacy: write like you're posting in a closed group,
 *   not broadcasting. "You guys" cadence is welcome.
 * - Threads on FB are sequential posts on the same wall, not replies.
 *   Each post is self-contained but the series creates a return-loop.
 */

import { buildAntiAiRules } from "@/lib/anti-ai-rules";

// ─────────────────────────────────────────────────────────────
// Single Post
// ─────────────────────────────────────────────────────────────

export type FacebookPostStructure =
  | "story_engagement"  // Specific moment → tension → insight → question
  | "opinion_authority" // Strong stance + one example → invites debate
  | "lesson_arc"        // "I learned this the hard way" → 3-5 beats → close
  | "tool_moment";      // "Just discovered X. Here's what it does for me."

const POST_TEMPLATES: Record<FacebookPostStructure, string> = {
  story_engagement: `
STRUCTURE: "STORY + ENGAGEMENT"
Reference: Trust-building post that drives real comments.
Target: 120-180 words.

OPENING (1-2 lines):
Open with a specific, grounded moment. Time, place, one sensory detail.
Not "I was struggling" — "It was 11pm Tuesday and my battery hit 3%."

TENSION (2-4 lines):
Build the stakes. What was on the line. Why it mattered.
Don't telegraph the lesson yet.

INSIGHT (1-2 lines):
The realisation, in plain words. No moral-of-the-story speech.

QUESTION (last line):
A real question that invites a 15+ word reply.
Not "thoughts?" — "What's the one decision you regret avoiding for too long?"

MANDATORY:
- Specific opening (named place, real time, one sensory anchor)
- No motivational clichés
- One committed insight, not a balanced "both sides" wash
- Closing question must be answerable with a personal experience
`,

  opinion_authority: `
STRUCTURE: "OPINION + AUTHORITY"
Reference: Sharp position post that builds credibility.
Target: 100-150 words.

POSITION (1-2 lines):
State your take in the first line. No "I think" — just the claim.
"Most productivity apps are built for people who don't actually work."

DEFENCE (3-5 lines):
ONE concrete example or piece of evidence. Specific names, real numbers.
Not "studies show" — "I tracked my time for 6 weeks across Notion, Linear, and ClickUp."

INVITATION (last line):
"Disagree? Tell me where I'm wrong."
Or: "What's the one tool you'd defend even if it broke tomorrow?"

MANDATORY:
- Strong stance early (no soft openers)
- One concrete proof, not three vague ones
- Direct invitation to push back
- No hedging stack ("might", "could", "perhaps")
`,

  lesson_arc: `
STRUCTURE: "HARD-WAY LESSON"
Reference: Vulnerable confession that lands a useful lesson.
Target: 130-190 words.

CONFESSION (1 line):
"I burned 6 months on the wrong [thing]."
"I lost a $4k client because I [specific bad move]."

CONTEXT (2-3 lines):
What you were doing and why you thought it would work.

THE BREAK (2-3 lines):
The moment it fell apart. Specific, painful, short.

THE LESSON (1-2 lines):
What you'd do differently — stated as a transferable rule.

QUESTION (last line):
"What's a hard lesson you wish you'd learned 2 years sooner?"

MANDATORY:
- Real failure, not humblebrag
- Specific dollar/time numbers
- Lesson stated as rule, not "you should"
- Question invites a similar story
`,

  tool_moment: `
STRUCTURE: "TOOL DISCOVERY"
Reference: "Just found this and it's changing how I work."
Target: 90-140 words.

DISCOVERY (1 line):
Name the tool. Name the moment. No setup.
"Tried Stanley this morning. Already replaced 3 of my apps."

WHAT IT DID (3-4 lines):
ONE specific job it handled, with the before-state and after-state.
Real numbers if possible (time saved, dollars avoided).

CAVEAT (1 line):
What it's NOT good for. Builds trust.

QUESTION (last line):
"What's a tool you swapped recently that actually stuck?"

MANDATORY:
- Real tool, named in line 1
- Concrete job with before/after
- Honest caveat (not a sales pitch)
- Tool-discovery question
`,
};

// ─────────────────────────────────────────────────────────────
// Thread (multi-post sequence on the same wall)
// ─────────────────────────────────────────────────────────────

export type FacebookThreadStructure =
  | "educational_series" // Teach one idea step by step across 5 posts
  | "story_arc";         // Tell one story across 4-6 posts

const THREAD_TEMPLATES: Record<FacebookThreadStructure, string> = {
  educational_series: `
STRUCTURE: "EDUCATIONAL SERIES (5-PART)"
Each post: 80-120 words. Five posts total.

POST 1 — The promise:
"Most [audience] get [topic] wrong. Here's the actual [framework]."
Tease parts 2-5 in the last line.

POST 2 — Part 1 of the framework:
ONE concrete step. Real example. Specific tool/move.

POST 3 — Part 2:
ONE step. Builds on Part 1. Specific.

POST 4 — Part 3:
ONE step. The "level-up" move most people miss.

POST 5 — Recap + invite:
One sentence per part. End with a question.

MANDATORY:
- Each post stands alone (people land mid-thread)
- Each post anticipates the next ("Tomorrow: …")
- No part covers more than one idea
- No academic tone — write like you're teaching one friend
`,

  story_arc: `
STRUCTURE: "STORY ARC (4-6 POSTS)"
Each post: 80-120 words. Tells one story across the wall.

POST 1 — Specific opening moment:
Time, place, one detail. End with tension hook.

POST 2 — The setback:
What broke. Concrete consequence. No insight yet.

POST 3 — The pivot:
The decision. One line of what shifted.

POST 4 — The result:
Specific outcome. Numbers, names, dates.

POST 5 (optional) — The lesson:
One transferable rule from the experience.

POST 6 (optional) — Question to readers:
"What's the [equivalent decision] you've been avoiding?"

MANDATORY:
- Build tension across posts — don't front-load the insight
- Specific names, numbers, places throughout
- Raw emotion (frustration, surprise, regret) at least once
- No "this changed my life" closing speech
`,
};

// ─────────────────────────────────────────────────────────────
// Builders
// ─────────────────────────────────────────────────────────────

export function buildFacebookPostPlaybook(niche: string, _content: string): string {
  // Niche-aware ordering, but for Facebook posts we offer all 4 by default
  // since the structures are differentiated by intent (story / opinion /
  // lesson / tool) more than by niche.
  const structures: FacebookPostStructure[] = [
    "story_engagement",
    "opinion_authority",
    "lesson_arc",
    "tool_moment",
  ];
  const templates = structures.map((s) => POST_TEMPLATES[s]).join("\n\n");

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FACEBOOK POST PLAYBOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each of the 5 variations uses a DIFFERENT structure below.
Niche: "${niche || "general"}".
${templates}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FACEBOOK FORMATTING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LENGTH: 90-190 words. Past 200, drop-off climbs sharply.
LINE BREAKS: Every 1-3 lines. Mobile readability matters.
HASHTAGS: None unless the niche genuinely uses them (rare on FB).
EMOJI: Sparse. Functional only. No decorative sparkles.
CTAs: Question → comment. Not "DM me" or "click link" — those underperform on FB.

WHAT KILLS A FACEBOOK POST:
- Opening with a question. ("Have you ever wondered…")
- Listicles with 5+ items. (Save those for LinkedIn.)
- Polished marketing tone. FB punishes "ad voice".
- Closing with a sales pitch. End on an invitation, not a request.

REFERENCE EXAMPLES — what good FB posts feel like:

[story_engagement] —
"It was 11pm and I hadn't eaten since lunch.
The deck was due in the morning, the client wanted 'something punchy',
and my brain was three coffees past empty.

I closed the laptop.
Told my partner I'd handle dinner.
Slept for 9 hours.

Sent the deck the next afternoon.
They loved it.

I keep forgetting that 'one more hour' usually costs me three.

What's the one boundary you keep ignoring even when it always backfires?"

[opinion_authority] —
"Most productivity apps are built for people who don't actually work.

I tracked my time for 6 weeks across Notion, Linear, and ClickUp.
Notion was where I planned. Linear was where I thought I'd track.
ClickUp was a graveyard.

The pattern: every app demanded I shape my work around its model.
The actual work happened in 3 docs and a Stickies window.

I deleted all three.

Disagree? Tell me where I'm wrong."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${buildAntiAiRules("standard")}
`;
}

export function buildFacebookThreadPlaybook(niche: string, _content: string): string {
  const structures: FacebookThreadStructure[] = ["educational_series", "story_arc"];
  const templates = structures.map((s) => THREAD_TEMPLATES[s]).join("\n\n");

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FACEBOOK THREAD PLAYBOOK (sequential wall posts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A Facebook thread is NOT an X-style reply chain. It's 4-6 separate
posts on the same wall, posted within hours of each other, that build
a story or teaching arc. Each post stands alone but creates a return
loop for readers who saw post 1.

Niche: "${niche || "general"}".

Each variation = ONE complete thread (4-6 posts).
${templates}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THREAD FORMATTING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Separate each post with "---" on its own line
- Each post: 80-120 words
- Each post anchors a single beat (one step, one scene)
- Posts 2-N must reference "earlier this week" or similar
  to acknowledge the series — drives back-clicks
- Last post = recap or question, never a sales pitch

OUTPUT FORMAT for each variation:
[Post 1]
[separator]
[Post 2]
[separator]
[Post 3]
[separator]
[Post 4]
[optional Post 5]
[optional Post 6]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${buildAntiAiRules("standard")}
`;
}

/**
 * Instagram playbook — Post (static carousel/single image caption) and
 * standalone Caption format.
 *
 * Instagram DNA (different from LinkedIn, Facebook, TikTok):
 * - The first line is everything. IG truncates after ~125 characters
 *   on mobile feed. If line 1 doesn't earn the "more" tap, the rest
 *   doesn't exist.
 * - Hashtag literacy matters. 3-8 niche-specific hashtags > 30
 *   generic ones. Tags placed at the end, NOT mid-caption.
 * - Stories-style cadence: short lines, line breaks, one idea per line.
 * - Carousel-aware: if the user said "carousel", the caption must
 *   reference the slides ("swipe →") and tease the payoff.
 * - Comment-driven: IG ranks on saves and shares more than likes.
 *   End with a save-this trigger or a question that invites a real reply.
 *
 * Used when format = "Post" on Instagram, or "Caption" on TikTok / IG.
 */

import { buildAntiAiRules } from "@/lib/anti-ai-rules";

export type InstagramStructure =
  | "carousel_caption"   // Caption that supports a 5-10 slide carousel
  | "single_image_post"  // Standalone caption, no carousel reference
  | "story_caption"      // Personal moment → reflection → invite
  | "list_caption"       // 3-5 short tips with line breaks (high save rate)
  | "hot_take_caption";  // Strong opinion in 80-150 words, drives comments

export interface NicheHint {
  keywords: string[];
  preferredStructures: InstagramStructure[];
}

const NICHE_STRUCTURE_MAP: NicheHint[] = [
  { keywords: ["ai", "tech", "tool", "automation", "code", "software"], preferredStructures: ["carousel_caption", "list_caption", "hot_take_caption"] },
  { keywords: ["marketing", "growth", "audience", "creator", "viral", "content"], preferredStructures: ["carousel_caption", "list_caption", "story_caption"] },
  { keywords: ["business", "entrepreneur", "startup", "founder", "money"], preferredStructures: ["story_caption", "hot_take_caption", "list_caption"] },
  { keywords: ["fitness", "health", "wellness", "habit", "routine"], preferredStructures: ["story_caption", "single_image_post", "list_caption"] },
  { keywords: ["fashion", "design", "art", "creative", "photo"], preferredStructures: ["single_image_post", "story_caption", "carousel_caption"] },
  { keywords: ["food", "recipe", "travel", "lifestyle"], preferredStructures: ["single_image_post", "story_caption"] },
];

function detectNicheStructures(niche: string, content: string): InstagramStructure[] {
  const text = `${niche} ${content}`.toLowerCase();
  const matches: InstagramStructure[] = [];
  for (const hint of NICHE_STRUCTURE_MAP) {
    if (hint.keywords.some((k) => text.includes(k))) {
      matches.push(...hint.preferredStructures);
    }
  }
  if (matches.length === 0) return ["carousel_caption", "list_caption", "story_caption", "hot_take_caption", "single_image_post"];
  return Array.from(new Set(matches)).slice(0, 5);
}

const STRUCTURE_TEMPLATES: Record<InstagramStructure, string> = {
  carousel_caption: `
STRUCTURE: "CAROUSEL CAPTION"
Pattern: hook → tease the payoff on slide 5+ → swipe-CTA → save-CTA → tags.
Length: 100-220 words.

OPENING (line 1 — under 125 chars to survive feed truncation):
"[Specific number] [things/mistakes/lessons] that [outcome]."
"You're [common bad thing] and you don't even know it."
"I [did specific thing] and tracked the result for [timeframe]."

TEASE (1-2 short lines):
"The third one is the move nobody talks about."
"Slide 7 is the one I wish someone had told me."

VALUE (3-5 short paragraphs, each 1-2 lines):
Light prose summary. The full breakdown lives on the slides.
Don't recap every slide — leave a reason to swipe.

SAVE-CTA (1 line):
"Save this so you don't forget."
OR: "Bookmark this for the next time you [scenario]."

QUESTION (1 line — drives comments):
"Which one hits hardest for you?"
OR: "Did I miss one? Drop it below."

HASHTAGS (3-8 niche-specific, on a single line at the very end):
Real, in-niche, used by the actual audience.
NEVER 30 generic tags. NEVER #love #life #blessed.

MANDATORY:
- First 125 chars must hold the click on truncated feed.
- One swipe-trigger AND one save-trigger.
- Real number in the hook, not "many" / "some".
- Hashtags only at the end, on one line.
`,

  single_image_post: `
STRUCTURE: "SINGLE-IMAGE CAPTION"
Pattern: one moment → one observation → one invite.
Length: 60-150 words.

OPENING (line 1):
A grounded specific anchor — time, place, sensory detail.
"3pm Tuesday, my battery on 4%, deck still due in the morning."
NOT a question. NOT a quote.

OBSERVATION (2-4 short lines):
What you noticed. The smaller the detail, the better it lands.
No moralising. No "and that's when I realised…" speech.

INVITE (1 line, last):
"What's the version of this in your week?"
"Tell me I'm not the only one."
A real question, answerable with a personal story.

HASHTAGS (3-6 niche-specific, on a single line at the end):
Match the photo's actual subject — coffee shot? #coffee not #lifestyle.

MANDATORY:
- No introduction. Just step into the moment.
- One sensory detail somewhere (light, sound, texture, smell).
- No hashtags inside the caption body — only at the end.
- Don't double-caption (no "swipe to see more" if it's a single image).
`,

  story_caption: `
STRUCTURE: "STORY CAPTION (personal arc)"
Pattern: scene → tension → reveal → invite.
Length: 120-220 words.

SCENE (line 1-2, under 125 chars combined):
Open mid-action. "I almost deleted the post."

TENSION (3-5 short lines):
What was on the line. What you almost did.
Concrete numbers if possible (dollars, hours, followers).

REVEAL (2-3 short lines):
What actually happened. The shift.
NOT "and it changed my life" — keep it dry.

LESSON (1 short line, optional):
"The thing I'd tell my younger self: [one transferable rule]."
Skip if forced.

INVITE (1 line):
"What's a post you almost didn't publish?"

HASHTAGS (3-6 niche-specific, end line only).

MANDATORY:
- Real failure or near-miss, not a humblebrag.
- Specific numbers somewhere in the body.
- No motivational close. The lesson should land in 6 words or fewer.
`,

  list_caption: `
STRUCTURE: "LIST CAPTION (high-save rate)"
Pattern: setup line → 3-5 numbered items → save CTA.
Length: 80-160 words.

SETUP (line 1):
"3 [specific thing] that [outcome]:"
"5 lessons from [specific experience that just happened]:"
The number is the hook. Specific > vague.

ITEMS (3-5 numbered, each 1-3 lines):
1. [Specific tactic + one detail]
2. [Specific tactic + one detail]
3. [Specific tactic + one detail]
Use real names, real numbers, real button paths.
NO emoji at the start of items. NO bold.

SAVE-CTA (1 line):
"Save this. The next time you're stuck on [specific scenario], you'll thank yourself."

QUESTION (optional, 1 line):
"Which one are you trying first?"

HASHTAGS (3-6 niche-specific, end line only).

MANDATORY:
- Numbered list — never bullets, never decorative emojis.
- Each item is concrete, not categorical.
- Save-CTA is the primary CTA. Question is optional.
- Hashtags placed AFTER the CTA, never inside the list.
`,

  hot_take_caption: `
STRUCTURE: "HOT TAKE CAPTION"
Pattern: declarative claim → one defence → invite to disagree.
Length: 80-150 words.

CLAIM (line 1, under 125 chars):
State the contrarian position in the first line.
"Most '10x productivity' content is just rebranded burnout."
NOT "I think…", NOT "in my opinion…". Just the claim.

DEFENCE (3-5 short lines):
ONE concrete piece of evidence. Real names, real numbers, real timeframe.
"I tracked my output across 6 weeks of those routines. My deep work hours dropped 40%."

INVITE (1 line):
"Disagree? Tell me where I'm wrong."
OR: "What's a piece of advice you keep refusing to take, even though everyone says it works?"

HASHTAGS (3-6 niche-specific).

MANDATORY:
- Strong stance early. No softening.
- ONE piece of evidence, not three vague ones.
- Direct invitation to push back.
- Don't end with "thoughts?" — too weak.
`,
};

/** Build the Instagram playbook injection for the system prompt. */
export function buildInstagramPlaybook(niche: string, content: string): string {
  const structures = detectNicheStructures(niche, content);
  const templates = structures.map((s) => STRUCTURE_TEMPLATES[s]).join("\n\n");

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTAGRAM CAPTION PLAYBOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each of the 5 variations uses a DIFFERENT structure below.
Niche: "${niche || "general"}".
${templates}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTAGRAM FORMATTING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LINE 1 IS EVERYTHING:
- Mobile feed truncates after ~125 characters. Test it: read line 1
  in isolation. If it doesn't earn the "more" tap, rewrite it.
- No questions on line 1 (low click-through on IG specifically).
- No emoji on line 1.

LENGTH:
- Sweet spot: 80-220 words. Shorter than LinkedIn, longer than X.
- Past 250 words, drop-off climbs sharply on IG specifically.

LINE BREAKS:
- Short lines win. 1-3 lines per "paragraph".
- Use a single empty line between sections.
- IG strips multiple blank lines; don't rely on triple gaps.

HASHTAGS:
- 3-8 hashtags max. More gets demoted as spam.
- Niche-specific only. #marketing if you're a marketer.
  Never #love #life #blessed #motivation.
- ONE LINE at the very end of the caption. Never mid-body.
- No hashtag in line 1 (kills the click).

EMOJI:
- Functional only (☑ ✦ ↳ → ❌ ✅ ♻️). Sparse.
- Never decorative line prefixes (🚀✨🔥).
- Never replace words with emoji ("Time 🕐 to post 📲").

CTAs THAT WORK ON IG:
- "Save this." (saves boost reach more than likes)
- "Send this to [specific audience]." (shares are a top signal)
- "Which one [specific question]?" (15+ word comments are gold)

CTAs THAT DON'T WORK ON IG:
- "Click the link in bio." (under-converts unless the offer is sharp)
- "Follow for more." (already implicit; saying it underperforms)
- "Like if you agree." (algorithm de-prioritises like-bait)

WHAT KILLS A CAPTION:
- Listicle with 7+ items (save it for a carousel).
- "Did you know..." opener (algorithm tells).
- Long preamble. The actual caption usually starts at line 2-3.
- Auto-generated hashtags from the topic (read as spam).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNATURE MOVES (real IG creators use these)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. The 125-char hook
   Write line 1, count characters, cut until it lands. Anything past
   125 chars is invisible until "more" is tapped.

2. The save-trigger
   "Save this so you don't forget." beats "follow for more" 3:1.

3. The send-this-to invite
   "Send this to a friend who [specific scenario]" — turns one viewer
   into two (the sender's reach + the recipient's view).

4. The "swipe →" tease (carousel only)
   Reference the reveal without spoiling it. "Slide 7 is the one
   nobody told me."

5. End-only hashtags
   3-8 niche tags on the last line. Not in body. Not on line 1.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${buildAntiAiRules("standard")}
`;
}

/**
 * Intelligent infographic engine.
 * Auto-analyzes content → selects template → builds prompt.
 *
 * DESIGN PHILOSOPHY (from Awa K. Penn reference analysis):
 * - DENSITY: 85-95% canvas fill, NO empty space
 * - COMPACT: tight padding (24px), small gaps (8px), small fonts
 * - RICH: 7 sections + pro tip, sub-bullets within body
 * - EMPHASIS: inline colored bold words (<span class="a">)
 */

import { TEMPLATE_REGISTRY, TEMPLATE_IDS } from "./infographic-templates";
import { selectIcon, getIconSvg } from "./infographic-icons";
import { selectIllustration, getIllustrationSvg } from "./infographic-illustrations";

// ─── Types ───

interface Point {
  title: string;
  body: string;
}

interface ExtractionResult {
  title: string;
  badge: string;
  subtitle: string;
  points: Point[];
  proTip: string;
}

export interface TemplateSelection {
  templateId: string;
  reason: string;
}

export interface ContentAnalysis {
  contentType: string;
  colorTheme: string;
  format: "square" | "portrait";
  wordCount: number;
}

// ─── Format dimensions ───

const FORMAT_DIMS = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
} as const;

export function getFormatDimensions(format: "square" | "portrait") {
  return FORMAT_DIMS[format];
}

// ─── Content analysis ───

export function analyzeContent(content: string, _platform: string): ContentAnalysis {
  const wordCount = content.split(/\s+/).length;

  const hasSteps = /étape|step|premier|first|ensuite|then|how to|comment|\d\.\s/i.test(content);
  const hasComparison = /\bvs\b|versus|contre|compared|plutôt|rather|difference|better than|avant.*après|before.*after/i.test(content);
  const hasStats = /\d+[%km€$]|\d{4,}|million|thousand|billion|revenue|growth/i.test(content);
  const hasQuote = /["«»"]|said|dit|quote|—\s/i.test(content) && wordCount < 100;
  const hasList = /[•\-\*→]/.test(content) || /\d+[\.\)]\s/g.test(content);
  const hasTips = /conseil|tip|astuce|hack|trick|secret/i.test(content);

  let contentType: string;
  if (hasComparison) contentType = "comparison";
  else if (hasStats && wordCount < 200) contentType = "stats";
  else if (hasSteps) contentType = "howto";
  else if (hasQuote) contentType = "quote";
  else if (hasTips || hasList) contentType = "tips";
  else contentType = "general";

  const isTech = /\bai\b|tech|digital|code|app|software|\bia\b|machine learning|api|cloud|saas|chatgpt|claude/i.test(content);
  const isBusiness = /business|money|revenue|profit|sales|entrepreneur|startup|marketing/i.test(content);
  const isHealth = /health|fitness|wellness|santé|sport|workout|nutrition|mental/i.test(content);
  const isEducation = /learn|study|education|cours|formation|student|university|skill/i.test(content);

  let colorTheme: string;
  if (isTech) colorTheme = "tech";
  else if (isBusiness) colorTheme = "business";
  else if (isHealth) colorTheme = "health";
  else if (isEducation) colorTheme = "education";
  else colorTheme = "default";

  const format = wordCount > 300 ? "portrait" : "square";
  return { contentType, colorTheme, format, wordCount };
}

// ─── Template selection ───

export function selectBestTemplate(content: string, platform: string): TemplateSelection {
  const words = content.toLowerCase().split(/\s+/);
  const wordCount = words.length;

  const p = {
    hasNumberedList: /(\d+\.|①|②|③|étape|step|premier|first)/i.test(content),
    hasStats: /\d+[%km€$]|\d{4,}/i.test(content),
    hasComparison: /\bvs\b|versus|contre|avant.*après|before.*after|plutôt|better than/i.test(content),
    hasHowTo: /comment|how to|étape|step|guide|tutorial/i.test(content),
    hasTips: /conseil|tip|astuce|hack|trick|secret/i.test(content),
    isTech: /\bai\b|tech|digital|code|app|software|chatgpt|claude|ia/i.test(content),
    isBusiness: /business|argent|money|revenue|vente|sale|entrepreneur/i.test(content),
    isMarketing: /marketing|contenu|content|viral|audience|engagement/i.test(content),
  };

  const hasBreaking = /breaking|urgent|stop|dead|goodbye|end of|rip\b|game.?over|replaced/i.test(content);
  const hasMasterclass = /master|guide complet|cheat.?sheet|tout savoir|everything|complete guide/i.test(content);

  let templateId: string;
  let reason: string;

  if (hasBreaking && wordCount < 200) {
    templateId = "AWA_BREAKING";
    reason = "Breaking/urgent content — high-impact alert layout";
  } else if (p.hasStats && wordCount < 200) {
    templateId = "STATS_IMPACT";
    reason = "Key statistics detected — large numbers visual";
  } else if (p.hasComparison) {
    templateId = "COMPARISON_VS";
    reason = "Comparison content — two-column VS layout";
  } else if (hasMasterclass && wordCount > 200) {
    templateId = "AWA_MASTERCLASS";
    reason = "Masterclass/guide — structured learning layout";
  } else if (p.hasHowTo || p.hasNumberedList) {
    templateId = "AWA_CLASSIC";
    reason = "How-to/steps — classic Awa Penn numbered sections";
  } else if (p.hasTips && !p.isTech) {
    templateId = "VIRAL_TIPS";
    reason = "Tips content — clean modern numbered design";
  } else if (p.isTech && !p.isMarketing) {
    templateId = "DARK_TECH";
    reason = "Tech content — dark modern glassmorphism";
  } else if (wordCount > 300) {
    templateId = "CHEAT_SHEET";
    reason = "Long content — multi-section grid cheat sheet";
  } else {
    templateId = "AWA_CLASSIC";
    reason = "General content — Awa Penn viral style";
  }

  return { templateId, reason };
}

// ─── Key point extraction ───

function detectBadge(content: string): string {
  const lower = content.toLowerCase();
  if (/how to|comment/i.test(lower)) return "HOW-TO GUIDE";
  if (/tip|astuce|conseil/i.test(lower)) return "TOP TIPS";
  if (/\bvs\b|versus|compar/i.test(lower)) return "COMPARISON";
  if (/\d+%|\d+k/i.test(lower)) return "KEY STATS";
  if (/learn|education|cours/i.test(lower)) return "LEARNING";
  if (/ai\b|tech|software/i.test(lower)) return "AI & TECH";
  if (/business|money|revenue/i.test(lower)) return "BUSINESS";
  return "KEY INSIGHTS";
}

export function extractKeyPoints(content: string): ExtractionResult {
  const lines = content.split("\n").filter(l => l.trim().length > 5);

  const title = (lines[0]?.trim().slice(0, 70) || "Key Insights").toUpperCase();
  const badge = detectBadge(content);
  const subtitle = lines[1]?.trim().slice(0, 100) || "";

  const points: Point[] = [];

  // Pass 1: look for numbered/bulleted lines
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[\d\.\-•→\*]\s*/.test(trimmed)) {
      const text = trimmed.replace(/^[\d\.\-•→\*\s]+/, "").trim();
      if (text.length > 10 && points.length < 9) {
        const colonSplit = text.split(/[:—–]/);
        if (colonSplit.length >= 2) {
          points.push({ title: colonSplit[0].trim().slice(0, 50), body: colonSplit.slice(1).join(":").trim().slice(0, 200) });
        } else {
          points.push({ title: text.slice(0, 45), body: text.slice(45, 200).trim() });
        }
      }
    }
  }

  // Pass 2: if not enough, split by sentences
  if (points.length < 5) {
    const sentences = content.match(/[^.!?\n]+[.!?]+/g) || [];
    for (const s of sentences) {
      const trimmed = s.trim();
      if (trimmed.length > 20 && points.length < 7) {
        points.push({ title: trimmed.slice(0, 45), body: trimmed.slice(45, 200).trim() });
      }
    }
  }

  // Pass 3: last resort — chunk paragraphs
  if (points.length < 5) {
    const chunks = content.split(/\n\n+/).filter(c => c.trim().length > 20);
    for (const chunk of chunks) {
      if (points.length < 7) {
        const t = chunk.trim();
        points.push({ title: t.slice(0, 45), body: t.slice(45, 200).trim() });
      }
    }
  }

  // Generate a pro tip from the content
  const proTip = generateProTip(content);

  return { title, badge, subtitle, points: points.slice(0, 7), proTip };
}

function generateProTip(content: string): string {
  const sentences = content.match(/[^.!?\n]+[.!?]+/g) || [];
  // Find a good actionable sentence for the pro tip
  for (const s of sentences) {
    if (/start|begin|first|try|recomm|conseil|astuce|important|clé|essentiel/i.test(s) && s.trim().length > 30) {
      return s.trim().slice(0, 150);
    }
  }
  return sentences[sentences.length - 1]?.trim().slice(0, 150) || "Start implementing today for maximum impact.";
}

// ─── Emoji assignment (kept for backward compat but not used in templates) ───

const EMOJI_LIBRARY: Record<string, string[]> = {
  money: ["💰", "💵", "📈", "🏆", "💎", "🤑", "📊"],
  tech: ["🤖", "💻", "⚡", "🚀", "🔧", "🧠", "📱"],
  time: ["⏰", "📅", "🎯", "⚡", "🔥", "⏱️", "📌"],
  learn: ["📚", "🧠", "💡", "🎓", "✅", "📖", "🔑"],
  growth: ["📈", "🚀", "💪", "🌟", "🏆", "🔥", "⭐"],
  warning: ["⚠️", "🚨", "❌", "🛑", "💡", "👀", "🔍"],
  success: ["✅", "🎯", "🏆", "⭐", "🔥", "💎", "🎉"],
  social: ["📱", "👥", "🌐", "💬", "📣", "🎥", "📸"],
  health: ["💪", "🏃", "🧘", "❤️", "🥗", "🧠", "😊"],
  default: ["💡", "🎯", "✅", "🔑", "⭐", "🚀", "📌"],
};

function detectEmojiCategory(content: string): string {
  const lower = content.toLowerCase();
  if (/money|revenue|profit|sales|€|\$|argent|vente/i.test(lower)) return "money";
  if (/ai\b|tech|code|software|app|chatgpt|claude/i.test(lower)) return "tech";
  if (/time|temps|schedule|productiv/i.test(lower)) return "time";
  if (/learn|education|study|cours|formation/i.test(lower)) return "learn";
  if (/grow|scale|business|startup/i.test(lower)) return "growth";
  if (/warning|danger|avoid|mistake|error/i.test(lower)) return "warning";
  if (/success|win|achieve|goal/i.test(lower)) return "success";
  if (/social|media|content|viral|post/i.test(lower)) return "social";
  if (/health|fitness|sport|wellness/i.test(lower)) return "health";
  return "default";
}

export function assignEmojis(points: Point[], content: string): string[] {
  const category = detectEmojiCategory(content);
  const emojis = EMOJI_LIBRARY[category] || EMOJI_LIBRARY.default;
  return points.map((_, i) => emojis[i % emojis.length]);
}

// ─── Build the filled prompt for Claude ───

let regenerationCounter = 0;

const LAYOUT_VARIATIONS = ["vertical numbered", "two-column grid", "timeline steps", "split comparison", "hierarchy pyramid"];

export function buildInfographicPrompt(content: string, platform: string, customInstructions?: string): string {
  regenerationCounter++;
  const analysis = analyzeContent(content, platform);
  const dims = FORMAT_DIMS[analysis.format];
  const selection = selectBestTemplate(content, platform);

  // On regeneration, rotate to a different template
  let templateId = selection.templateId;
  if (regenerationCounter > 1) {
    const alternatives = TEMPLATE_IDS.filter(id => id !== templateId);
    templateId = alternatives[(regenerationCounter - 2) % alternatives.length];
  }

  const templateFn = TEMPLATE_REGISTRY[templateId];
  let templateHtml = templateFn(dims.width, dims.height);
  const extraction = extractKeyPoints(content);

  // Pre-fill SVG icons into the template (deterministic)
  const sectionColors = ["#E53E3E", "#3182CE", "#38A169", "#DD6B20", "#9B59B6", "#EC4899", "#00897B"];
  for (let i = 0; i < 7; i++) {
    const pointText = extraction.points[i]?.title || "";
    const iconName = selectIcon(pointText, i);
    const color = sectionColors[i % sectionColors.length];
    const iconSvg = getIconSvg(iconName, color, 20);
    templateHtml = templateHtml.replace(`{{P${i + 1}_ICON}}`, iconSvg);
  }

  // Pre-fill main illustration into header (if template supports it)
  if (templateHtml.includes("{{MAIN_ILLUSTRATION}}")) {
    const illustName = selectIllustration(analysis.contentType, templateId, content);
    const illustSvg = getIllustrationSvg(illustName, 100);
    templateHtml = templateHtml.replace("{{MAIN_ILLUSTRATION}}", illustSvg);
  }

  const variationSeed = Math.random().toString(36).substring(2, 8);
  const extra = customInstructions ? `\nUser instructions: ${customInstructions}` : "";

  const pointHints = extraction.points.map((p, i) =>
    `${i + 1}. "${p.title}" — ${p.body}`
  ).join("\n");

  // Regeneration variation instruction
  const regenInstruction = regenerationCounter > 1
    ? `\n\nREGENERATION #${regenerationCounter}
The previous design was rejected. You MUST use a COMPLETELY DIFFERENT approach:
- Different title angle and wording
- Different emphasis on content points
- Suggested layout style: ${LAYOUT_VARIATIONS[(regenerationCounter - 1) % LAYOUT_VARIATIONS.length]}
Make it significantly better.\n`
    : "";

  return `You are the world's best infographic designer. You specialize in viral social media content that gets millions of views. You have studied Awa K. Penn's infographics (26K+ likes, 1.7M+ views per post) and replicate their exact quality.

Your infographics go viral because they are:
• ULTRA-DENSE — content fills 90%+ of the canvas, NO empty space at bottom
• Instantly scannable — reader understands value in 3 seconds
• High contrast — crystal clear visual hierarchy
• Information-rich — every section has 2-3 detail lines with specific data
• Shareable — people save and repost them

═══ YOUR TASK ═══
Fill the HTML template below by replacing {{PLACEHOLDERS}} with real content.
Template: ${templateId} (${selection.reason})
Seed: ${variationSeed}
${regenInstruction}
═══ CONTENT ANALYSIS ═══
Before filling, analyze:
- Main message: What is the ONE takeaway?
- Target: Who will share this?
- Extract: The 7 most ACTIONABLE, SPECIFIC points (not 4 or 5 — SEVEN)

═══ ABSOLUTE RULES ═══

DENSITY (CRITICAL — #1 priority):
- Fill ALL 7 sections — do NOT delete any section divs
- Each {{Pn_BODY}} must be 25-50 words with SPECIFIC details, data, or examples
- Use <span class="a">key phrase</span> to highlight 1-2 important words per body in accent color
- Add bullet-style content: use " • " to separate sub-points within body text
- {{PRO_TIP}} must be a specific actionable sentence (30-50 words)
- The content MUST fill the entire ${dims.height}px height — zero empty space at bottom

TYPOGRAPHY:
- Font: Poppins only (900 for titles, 700 for section heads, 400 for body)
- NEVER use italic — font-style:italic is FORBIDDEN
- Titles: ALL CAPS, punchy, create urgency
- Body: sentence case, direct, rich with specifics

CONTENT QUALITY:
- Section titles: MAX 6 words, specific and actionable
- Section body: 25-50 words with numbers, tools, outcomes, sub-points
- NO generic statements. Include specific numbers, tool names, percentages
- NO emoji characters anywhere — SVG icons are pre-embedded
- Each body should contain at least one <span class="a">highlighted phrase</span>
- For key statistics, make numbers visually impactful:
  <span style="font-size:20px;font-weight:900;color:#E53E3E">40%</span>

HEADER ILLUSTRATION:
- A contextual SVG illustration is pre-embedded in the header area
- Do NOT modify or remove it — it adds visual richness like Awa K. Penn's infographics
- The illustration occupies the right side of the header

VIRAL TITLE FORMULAS (use one):
- STOP [doing X]. [Better alternative] instead.
- [Number] [things] that [big claim]
- How I [result] in [timeframe] (without [common excuse])
- The [adjective] truth about [topic]
- [Famous thing] is DEAD. Here's what's NEXT.
- [Number]% of [people] don't know this [topic] secret
- BREAKING: [shocking statement about topic]

TITLE EXAMPLES:
BAD: "Artificial Intelligence Is Important"
GOOD: "AI REPLACES 40% OF JOBS BY 2030"

BAD: "You Should Learn New Skills"
GOOD: "LEARN THIS SKILL OR GET LEFT BEHIND"

TEMPLATE RULES:
- Keep ALL HTML structure, CSS, SVG icons, and SVG illustrations EXACTLY as-is
- ONLY replace {{text placeholders}} — nothing else
- NEVER delete section divs — fill ALL 7 sections with content
- Do NOT add any new HTML elements, classes, or styles
- Do NOT modify or remove any pre-embedded SVG elements (icons + header illustration)

═══ PLACEHOLDER MAP ═══
{{BADGE}} → "${extraction.badge}"
{{TITLE}} → Viral ALL CAPS title. Wrap ONE key word with <span> for accent color. Max 60 chars.
{{FOOTER}} → "Created with Supen.io · Follow for more"
{{Pn_TITLE}} → Bold section title (max 6 words, specific)
{{Pn_BODY}} → Rich detail (25-50 words, with <span class="a">emphasis</span> and sub-points using " • ")
{{PRO_TIP}} → Actionable pro tip sentence (30-50 words)

═══ BODY TEXT EXAMPLE ═══
BAD: "AI tools can help you work faster"
GOOD: "Use <span class=\\"a\\">Claude + Cursor</span> to write production code 10x faster • Average dev saves 3h/day • 87% of YC startups already adopted this stack"

═══ EXTRACTED KEY POINTS ═══
Use these as starting points — EXPAND each with specific details, data, and examples:
${pointHints}

Pro tip hint: ${extraction.proTip}

═══ TEMPLATE TO FILL ═══
${templateHtml}

═══ SOURCE CONTENT ═══
${content.slice(0, 2500)}

Platform: ${platform}
${extra}

═══ FINAL CHECKLIST ═══
Before outputting, verify:
□ ALL 7 sections filled — no section deleted
□ Title is PUNCHY with urgency/curiosity
□ Each body has 25-50 words with specific data
□ Each body uses <span class="a"> for emphasis on 1-2 key phrases
□ {{PRO_TIP}} is filled with actionable advice
□ NO italic text anywhere
□ All SVG icons left untouched
□ Content fills ENTIRE ${dims.width}x${dims.height}px — no empty space at bottom
□ NO emoji characters — only SVG icons
□ Starts with <!DOCTYPE html>, ends with </html>

OUTPUT: Only the filled HTML. No explanation. No markdown.`;
}

// ─── Gemini prompt builder ───

const GEMINI_STYLE_GUIDES: Record<string, { layout: string; colors: string; illustration: string; density: string }> = {
  howto: {
    layout: "Vertical numbered steps with large colored circles (30px) and line icons (20px). Each step has a bold colored title + 2-3 detail lines below. Process flow arrows or numbered circles illustration in header.",
    colors: "#FFFFF5 cream background, #5D3A1A wood border (6px), section colors rotating: #E53E3E, #3182CE, #38A169, #DD6B20, #9B59B6, #EC4899, #00897B",
    illustration: "Simple process-flow diagram (3 circles connected by arrows) in the top-right header area, ~90px wide",
    density: "7 steps, each with bold 6-word title + 25-40 word body with bullet sub-points using ' - '"
  },
  tips: {
    layout: "Clean numbered list with colored circle numbers and icon boxes. White background, subtle gray section backgrounds (#F8FAFC). Gradient badge (purple→pink).",
    colors: "White #FFFFFF background, no border. Section colors: #6366F1, #EC4899, #F59E0B, #10B981, #8B5CF6, #3B82F6, #EF4444",
    illustration: "Checklist graphic (3 colored checkboxes with lines) in header, ~90px",
    density: "7 tips, each with specific tool names, numbers, or percentages"
  },
  stats: {
    layout: "2x2 grid of large hero numbers (44px bold) in bordered cards at top, followed by 3 detail rows below. Each stat card has an icon, the big number, and a label.",
    colors: "#FFFFF5 cream background, #5D3A1A border. Stat card borders: #E53E3E, #3182CE, #38A169, #DD6B20",
    illustration: "Bar chart or growth curve SVG in header area, ~90px",
    density: "4 big stat cards (huge numbers) + 3 supporting detail rows + pro tip"
  },
  comparison: {
    layout: "Two columns separated by a VS circle badge (36px black circle, white 'VS' text). Left column blue (#3182CE), right column red (#E53E3E). Column headers are full-width colored pills.",
    colors: "#FFFFF5 background, #888 border. Left: blue tints. Right: red tints. VS badge: #1A1A1A",
    illustration: "Before/After arrows comparison graphic in header",
    density: "3 comparison rows per column + verdict box at bottom"
  },
  quote: {
    layout: "Large decorative quotation marks in header, centered quote text in large font, attribution below, then 3-4 context points.",
    colors: "#FFFFF5 background, #E53E3E accent for quote marks, #1A1A1A text",
    illustration: "Large decorative opening quotation marks, ~80px",
    density: "1 main quote + 4 supporting context points"
  },
  general: {
    layout: "Awa K. Penn classic: badge pill + ALL CAPS title in header (left) with illustration (right). 7 numbered sections below with colored circle numbers, icon boxes, and text blocks. Pro tip box at bottom with dashed border.",
    colors: "#FFFFF5 cream background, #5D3A1A wood-tone border (6px). Section colors rotating: #E53E3E, #3182CE, #38A169, #DD6B20, #9B59B6, #EC4899, #00897B. Header border-bottom: 3px solid #E53E3E.",
    illustration: "Contextual SVG illustration (growth chart, brain circuit, or target) in header right, ~90px",
    density: "7 sections with 25-40 words each, every section has specific data points and sub-bullets"
  },
};

export function buildGeminiImagePrompt(content: string, platform: string, customPrompt?: string): string {
  const analysis = analyzeContent(content, platform);
  const dims = FORMAT_DIMS[analysis.format];
  const extraction = extractKeyPoints(content);
  const guide = GEMINI_STYLE_GUIDES[analysis.contentType] || GEMINI_STYLE_GUIDES.general;

  const dimStr = `${dims.width}x${dims.height}`;
  const isDark = analysis.colorTheme === "tech";

  const pointsText = extraction.points.slice(0, 7).map((p, i) =>
    `${i + 1}. ${p.title}${p.body ? ": " + p.body : ""}`
  ).join("\n");

  return `You are the world's greatest viral infographic designer. Your work consistently achieves:
- 26,000+ likes on Facebook
- 1.7 MILLION+ views on Twitter/X
- 5,000+ shares in 24 hours
- 97% save rate on Instagram

Your style is based on Awa K. Penn's viral methodology — the most-saved infographic creator on social media.

${"═".repeat(50)}
CONTENT INTELLIGENCE REPORT
${"═".repeat(50)}

Content Type: ${analysis.contentType.toUpperCase()}
Platform: ${platform}
Format: ${dimStr}px (EXACT — no variation)
Color Theme: ${analysis.colorTheme}
Badge: "${extraction.badge}"

Key Points Extracted:
${pointsText}

Pro Insight: ${extraction.proTip}

${"═".repeat(50)}
MASTERCLASS DESIGN SPECIFICATIONS
${"═".repeat(50)}

CANVAS (mandatory):
- Size: EXACTLY ${dimStr}px — this is non-negotiable
- Background: ${isDark ? "dark navy gradient #0F172A→#1E293B" : guide.colors.split(",")[0]}
- Border: ${isDark ? "none" : "6px solid #5D3A1A (warm wood-tone frame)"}
- Padding: 24px on all sides (TIGHT — like reference images)
- Font: Poppins from Google Fonts — weights 900, 700, 400 ONLY
- Overflow: hidden
- Content must fill 90-95% of canvas — ZERO empty space at bottom

LAYOUT: ${guide.layout}

HEADER (top 12-15% of canvas):
- LEFT side: badge pill (10px uppercase, colored background, white text, rounded) + title below
- Title: ALL CAPS, Poppins 900, ${analysis.format === "portrait" ? "32px" : "28px"}, letter-spacing -0.5px
- ONE word in the title highlighted with accent color (most impactful word)
- RIGHT side: contextual illustration — ${guide.illustration}
- Bottom border: 3px solid accent color, 12px padding below

SECTION DESIGN (7 sections — ALL required):
- Each section: flex row with [circle number] [icon box] [text content]
- Circle number: 30px diameter, solid accent color, white number 14px Poppins 900
- Icon box: 32px, 8px border-radius, 10% opacity accent color background, containing a simple 20px stroke-based line icon (like Lucide/Feather icons — NOT filled, NOT clipart)
- Section title: 14px Poppins 700, accent color matching the circle
- Section body: 12px Poppins 400, color ${isDark ? "#94A3B8" : "#2D3748"}, line-height 1.3
  - 25-40 words per body
  - Sub-points separated by " • " for density
  - One key phrase in BOLD matching section color
  - At least one specific number, percentage, tool name, or metric
- Section background: ${isDark ? "rgba(255,255,255,0.04) with 1px white/8% border" : "rgba(0,0,0,0.02)"}
- Border-left: 3px solid section accent color
- Border-radius: 8px
- Padding: 10px 12px
- Gap between sections: 7-8px ONLY (very tight)

SECTION COLORS (must rotate in this exact order):
1: #E53E3E (red)  2: #3182CE (blue)  3: #38A169 (green)
4: #DD6B20 (orange)  5: #9B59B6 (purple)  6: #EC4899 (pink)  7: #00897B (teal)

PRO TIP BOX (mandatory, after sections):
- Dashed border: 2px dashed accent color
- Background: 5% opacity accent color
- Label: "PRO TIP:" in 11px uppercase Poppins 900, accent color
- Body: specific actionable advice, 30-50 words
- Border-radius: 8px
- Padding: 10px 14px

FOOTER (mandatory, at very bottom):
- Border-top: 2px solid ${isDark ? "rgba(0,201,177,0.2)" : "#5D3A1A"}
- Text: "Created with Supen.io · Follow for more"
- Font: 12px Poppins 700, color ${isDark ? "#00C9B1" : "#5D3A1A"}
- Margin-top: 8px, padding-top: 10px

${"═".repeat(50)}
TYPOGRAPHY RULES (STRICT)
${"═".repeat(50)}

- Title: Poppins 900, ALL CAPS, letter-spacing -0.5px
- Section headers: Poppins 700, sentence case, colored
- Body text: Poppins 400, sentence case, dark gray
- Pro tip label: Poppins 900, uppercase, accent color
- NEVER use italic — font-style must ALWAYS be normal
- NEVER use decorative/script fonts
- Line-height: 1.08 for titles, 1.3 for body

${"═".repeat(50)}
ICON & ILLUSTRATION GUIDE
${"═".repeat(50)}

Section icons (30x30px):
- Style: stroke-based line art (1.5px stroke, no fill)
- Like Lucide/Feather icon library
- Color: matches section accent color
- Background: 10% opacity colored rounded rectangle
- Examples: lightbulb, target, zap, chart, brain, rocket, shield, book, users, code

Header illustration (~90px):
- Simple, elegant SVG-style graphic
- Uses stroke lines (1.5px) and subtle fills (10-20% opacity)
- Relevant to the content topic
- Position: right side of header, vertically centered with title
- NEVER use realistic images, photos, or complex clipart

${"═".repeat(50)}
VIRAL CONTENT FORMULAS
${"═".repeat(50)}

Title must use one of these proven patterns:
- "[Number] [THINGS] THAT [BIG CLAIM]" → "7 AI TOOLS THAT REPLACE YOUR ENTIRE TEAM"
- "STOP [DOING X]. [DO Y] INSTEAD." → "STOP USING CHATGPT WRONG. DO THIS INSTEAD."
- "THE [ADJECTIVE] TRUTH ABOUT [TOPIC]" → "THE UGLY TRUTH ABOUT FREELANCING IN 2026"
- "[X]% OF [PEOPLE] DON'T KNOW THIS" → "90% OF MARKETERS DON'T KNOW THIS HACK"
- "HOW I [RESULT] IN [TIME]" → "HOW I MADE $10K IN 30 DAYS WITH AI"
- "[THING] IS DEAD. HERE'S WHAT'S NEXT." → "SEO IS DEAD. HERE'S WHAT'S NEXT."

Body text must:
- Include specific tool names (Claude, Notion, Figma, etc.)
- Include specific numbers (47%, 3x faster, $2K/month)
- Answer "So what?" for every point
- Use " • " to pack multiple sub-facts per section

${"═".repeat(50)}
CONTENT TO TRANSFORM
${"═".repeat(50)}

${content.slice(0, 3000)}

Platform: ${platform}
${customPrompt ? `\nSpecial instructions: ${customPrompt}` : ""}

${"═".repeat(50)}
FINAL QUALITY CHECKLIST
${"═".repeat(50)}

Before generating, verify ALL of these:
[ ] Canvas is EXACTLY ${dimStr}px
[ ] ALL 7 sections present and filled with 25-40 words each
[ ] Header has: badge pill + ALL CAPS title + illustration
[ ] Title uses a viral formula with ONE highlighted word
[ ] Each section: colored circle number + icon + title + rich body
[ ] Each body has at least one bold key phrase in accent color
[ ] Each body has specific data (numbers, tool names, percentages)
[ ] Pro tip box present with dashed border and actionable advice
[ ] Footer present: "Created with Supen.io · Follow for more"
[ ] NO italic text anywhere
[ ] NO emoji characters — only clean line-art SVG icons
[ ] Content fills 90-95% of canvas — NO dead space at bottom
[ ] Colors rotate: red→blue→green→orange→purple→pink→teal
[ ] Gap between sections is 7-8px (very tight, no wasted space)
[ ] Font is Poppins only — 900/700/400 weights

Generate the infographic image now. Output ONLY the image.`;
}

// ─── Post-process generated HTML ───

export function postProcessHtml(html: string): string {
  let out = html;

  // Ensure font link
  if (!out.includes("fonts.googleapis.com")) {
    out = out.replace("</head>",
      '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" rel="stylesheet"></head>'
    );
  }

  // Remove italic
  out = out.replace(/font-style\s*:\s*italic/gi, "font-style:normal");

  // Ensure overflow hidden on body
  if (out.includes("<body") && !out.includes("overflow")) {
    out = out.replace(/(<body[^>]*style="[^"]*)(")/, "$1;overflow:hidden$2");
  }

  // Ensure meta charset
  if (!out.includes("charset")) {
    out = out.replace("<head>", '<head><meta charset="UTF-8">');
  }

  return out;
}

// ─── Quality score ───

export interface QualityScore {
  score: number;
  checks: { label: string; pass: boolean }[];
}

export function scoreInfographic(html: string, dims: { width: number; height: number }): QualityScore {
  const checks = [
    { label: "Has title", pass: /<div class="(title|main-title)">/.test(html) && !html.includes("{{TITLE}}") },
    { label: "Has sections", pass: /<div class="section/.test(html) || /<div class="(stat|card|block|row)/.test(html) },
    { label: "No placeholders left", pass: !html.includes("{{") },
    { label: "Has footer", pass: /<div class="footer">/.test(html) && !html.includes("{{FOOTER}}") },
    { label: "Correct dimensions", pass: html.includes(`${dims.width}px`) && html.includes(`${dims.height}px`) },
    { label: "Font loaded", pass: html.includes("fonts.googleapis.com") },
    { label: "No italic", pass: !html.includes("font-style:italic") && !html.includes("font-style: italic") },
    { label: "No emoji characters", pass: !/[\u{1F300}-\u{1F9FF}]/u.test(html) },
    { label: "Has SVG icons", pass: html.includes("<svg") },
    { label: "Overflow hidden", pass: html.includes("overflow:hidden") || html.includes("overflow: hidden") },
    { label: "Has pro tip", pass: html.includes("pro-tip") || html.includes("what-now") || html.includes("verdict") || html.includes("bonus") },
    { label: "Has inline emphasis", pass: html.includes('class="a"') || html.includes("class='a'") },
    { label: "Has header illustration", pass: html.includes("header-illust") },
  ];

  const passed = checks.filter(c => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);

  return { score, checks };
}

// ─── Reset regeneration counter (call when modal opens fresh) ───

export function resetRegenerationCounter(): void {
  regenerationCounter = 0;
}

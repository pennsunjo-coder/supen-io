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

export function selectBestTemplate(content: string, platform: string, forcedTemplate?: string): TemplateSelection {
  if (forcedTemplate && TEMPLATE_REGISTRY[forcedTemplate]) {
    return { templateId: forcedTemplate, reason: "Manually selected" };
  }

  const lower = content.toLowerCase();
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const wordCount = lower.split(/\s+/).length;

  // Numbered steps (Step 1, 1., 2., 3.)
  const hasNumberedSteps =
    /step\s+\d/i.test(content) ||
    lines.filter(l => /^\d+[\.\)]\s/.test(l.trim())).length >= 3;

  // Comparison (vs, versus, better than)
  const hasComparison =
    /\bvs\b|\bversus\b|compared to|better than|worse than/i.test(content) ||
    (content.match(/\bvs\.?\b/gi)?.length || 0) >= 2;

  // Tech / command style
  const isTech =
    /\$\s|terminal|command|code|api|function|install|npm|git|dev/i.test(content);

  // Editorial list (N ways, tips, reasons)
  const isEditorial =
    /\d+\s+(ways|tips|reasons|things|secrets|mistakes|hacks|tools|lessons|rules)/i.test(content);

  // Funnel / pipeline
  const hasFunnel =
    /funnel|pipeline|roadmap|journey|workflow|conversion|parcours/i.test(content);

  // Resource list
  const hasResources =
    /\d+\s+(free|best|top)\s+(course|resource|tool|book|app)/i.test(content);

  // Selection with clear priority
  if (hasNumberedSteps && !hasComparison) {
    return { templateId: "PROCESS_STEPS", reason: "Numbered steps detected" };
  }
  if (hasComparison) {
    return { templateId: "COMPARISON", reason: "Comparison content" };
  }
  if (isTech) {
    return { templateId: "COMMAND_CENTER", reason: "Technical content" };
  }
  if (hasFunnel) {
    return { templateId: "FUNNEL", reason: "Process/funnel flow" };
  }
  if (isEditorial) {
    return { templateId: "EDITORIAL_LIST", reason: "Numbered list content" };
  }
  if (hasResources) {
    return { templateId: "NOTEBOOK", reason: "Resource/course list" };
  }

  // Platform-aware defaults
  const p = platform.toLowerCase();
  if (p.includes("linkedin")) {
    return { templateId: "EDITORIAL_LIST", reason: "LinkedIn professional style" };
  }
  if (wordCount > 300) {
    return { templateId: "WHITEBOARD", reason: "Long content — dense layout" };
  }

  return { templateId: "PROCESS_STEPS", reason: "Default: clean step layout" };
}

// ─── Key point extraction ───

function detectBadge(content: string): string {
  const lower = content.toLowerCase();
  if (/how to|comment/i.test(lower)) return "GUIDE PRATIQUE";
  if (/tip|astuce|conseil/i.test(lower)) return "TOP CONSEILS";
  if (/\bvs\b|versus|compar/i.test(lower)) return "COMPARAISON";
  if (/\d+%|\d+k/i.test(lower)) return "STATS CLÉS";
  if (/learn|education|cours/i.test(lower)) return "APPRENTISSAGE";
  if (/ai\b|tech|software/i.test(lower)) return "IA & TECH";
  if (/business|money|revenue/i.test(lower)) return "BUSINESS";
  return "POINTS CLÉS";
}

export function extractKeyPoints(content: string): ExtractionResult {
  const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 5);

  const title = (lines[0]?.slice(0, 70) || "Key Insights").toUpperCase();
  const badge = detectBadge(content);
  const subtitle = lines[1]?.slice(0, 100) || "";

  const points: Point[] = [];

  // Pass 1: numbered/bulleted lines
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[\d\.\-•→\*▸]\s*/.test(trimmed)) {
      const text = trimmed.replace(/^[\d\.\-•→\*▸\s]+/, "").trim();
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

  // Pass 2: sentences
  if (points.length < 5) {
    const sentences = content.match(/[^.!?\n]+[.!?]+/g) || [];
    for (const s of sentences) {
      const trimmed = s.trim();
      if (trimmed.length > 20 && points.length < 8) {
        points.push({ title: trimmed.slice(0, 45), body: trimmed.slice(45, 200).trim() });
      }
    }
  }

  // Pass 3: paragraphs
  if (points.length < 5) {
    const chunks = content.split(/\n\n+/).filter(c => c.trim().length > 20);
    for (const chunk of chunks) {
      if (points.length < 8) {
        const t = chunk.trim();
        points.push({ title: t.slice(0, 45), body: t.slice(45, 200).trim() });
      }
    }
  }

  const proTip = generateProTip(content);

  return { title, badge, subtitle, points: points.slice(0, 8), proTip };
}

// ─── Enhanced extraction for DALL-E prompts ───

export interface EnhancedExtraction {
  title: string;
  points: string[];
  stats: string[];
  keywords: string[];
}

export function extractForDallE(content: string): EnhancedExtraction {
  const lines = content
    .split(/\n+/)
    .map(l => l.trim())
    .filter(l => l.length > 5);

  const title = lines[0]?.slice(0, 70) || "Key Insights";

  const points = lines
    .slice(1)
    .filter(l => l.length > 15)
    .filter(l => !/^https?:\/\//.test(l))
    .map(l => l
      .replace(/^[\d]+[\.\/]\s*/, '')
      .replace(/^[▸→•\-\*]\s*/, '')
      .trim()
    )
    .filter(l => l.length > 10)
    .slice(0, 8);

  const stats = content.match(/\d+[\.,]?\d*\s*(%|€|\$|K|M|x|fois|days?|months?|years?|hours?|minutes?)/gi) || [];

  const keywords = content
    .match(/["«»]([^"«»]{3,50})["«»]/g)
    ?.map(k => k.replace(/["«»]/g, '').trim())
    .slice(0, 3) || [];

  return { title, points, stats: stats.slice(0, 5), keywords };
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

const CLEAN_TEMPLATES = new Set(["UI_CARDS", "WHITEBOARD", "FUNNEL", "DATA_GRID"]);

// ─── Template-specific prompt for Claude HTML generation ───

function getTemplatePrompt(
  templateId: string,
  extraction: ExtractionResult,
  dims: { width: number; height: number },
): string {
  const dimStr = `${dims.width}x${dims.height}`;
  const pointsList = extraction.points.map((p, i) =>
    `${i + 1}. ${p.title} — ${p.body}`
  ).join("\n");

  switch (templateId) {
    case "WHITEBOARD":
      return `Generate a WHITEBOARD BULLET LIST infographic at ${dimStr}px.

CANVAS:
- Background: #f8f9f7 with ultra-subtle paper grain (2-3% opacity)
- 4 metallic corner clips (12x20px, gray #aaaaaa) at each corner
- 1px border #dddddd around canvas, border-radius 6px
- Soft shadow: box-shadow 0 4px 24px rgba(0,0,0,0.08)

TITLE BLOCK (top 12% of canvas):
- Title: "${extraction.title}" — Nunito Black 900, 52-56px, #111111, centered
- Colored underline below title: 2-3px, color #C0392B, full width minus 40px margins

CONTENT (12% to 93% height):
- Left/right padding: 40px
- Each SECTION has:
  * Section header: Nunito Bold 20-24px, colored (#C0392B or #2B4DAF or #2E7D32)
  * Colored underline 2px under header, same color
  * Bullets: colored • symbols, Caveat 400 18-20px, #111111
  * Key terms: yellow #E8F044 background highlight (inline, flat)
  * Tool/platform names: blue #2B4DAF bold underlined

SECTIONS TO RENDER:
Badge: ${extraction.badge}
${pointsList}
Pro tip: ${extraction.proTip}

NO FOOTER — no signature, no branding, no "follow" text.`;

    case "UI_CARDS":
      return `Generate a 3-TIER COMPARISON infographic at ${dimStr}px.

CANVAS: Background #f8f9f7 (cool off-white)

TITLE BLOCK: Nunito Black 900, 48-52px, #111111, centered
Yellow #E8F044 highlight on one keyword

3 CARDS stacked vertically:
Card 1 (Avoid): bg #FFF0F0, border 1.5px #FFCCCC, border-left 5px #C0392B, icon ✗ bg #FFB3B3 color #CC0000
Card 2 (Better): bg #FEF9E7, border 1.5px #FFE5A0, border-left 5px #D4A017, icon ~ bg #FFD4A3 color #CC6600
Card 3 (Best): bg #F0FFF4, border 1.5px #B3EED0, border-left 5px #2E7D32, icon ✓ bg #B3FFD1 color #006633

Each card: Nunito 800 title + Caveat 400 body, border-radius 16px
Key terms: yellow #E8F044 background inline highlight

CONTENT:
${pointsList}

NO footer, NO signature, NO watermark. The infographic ends after the last content card.`;

    case "FUNNEL":
      return `Generate a FUNNEL / PROCESS FLOW infographic at ${dimStr}px.

CANVAS: Background #fffef5 (warm ivory)

TITLE BLOCK (top 14%):
- Title: Nunito 900, 52-56px, #111111
- Subtitle: Caveat italic 14-16px, #666666, centered

FUNNEL (center, 70% height):
- 5 horizontal stages, progressively narrower (100% → 88% → 74% → 60% → 46%)
- Stage 1: #B83228 (red) — widest
- Stage 2: #E07B20 (orange)
- Stage 3: #D4A017 (gold)
- Stage 4: #2E7D32 (green)
- Stage 5: #1565C0 (blue) — narrowest
- Each stage: white number circle + Nunito 800 title + Caveat 400 body
- ▼ arrows between stages in #C0392B
- Key terms: yellow #E8F044 background highlight

STAGES TO RENDER:
${pointsList}
Pro tip: ${extraction.proTip}

NO footer, NO signature, NO branding. End after the last content point.`;

    case "DATA_GRID":
      return `Generate a DATA TABLE infographic at ${dimStr}px.

CANVAS: Background #f8f9f7

TITLE: Nunito Black 900, 48px, #111111, centered
One keyword highlighted with #E8F044 background

TABLE (4 rows × 3 columns):
- Header: bg #f5f5f5, Nunito 900 uppercase
  * Column 1 "Concept": color #C0392B
  * Column 2 "Description": color #2B4DAF
  * Column 3 "Best For": color #2E7D32
- Rows alternate: #ffffff / #f9f9f9
- Colored dots per row: #C0392B / #D4A017 / #2E7D32 / #8B5CF6
- Concept names: Nunito 800
- Descriptions: Caveat 400, key terms highlighted #E8F044
- Use cases: Nunito 700, color #2E7D32

KEY TAKEAWAY box: border-left 4px #C0392B, bg #fffdf0

CONTENT:
${pointsList}
Pro tip: ${extraction.proTip}

NO footer, NO "follow" text, NO branding.`;

    default: // AWA_CLASSIC
      return `Generate a DENSE GUIDE SKETCHBOARD infographic at ${dimStr}px.

CANVAS:
- Background: #ffffff with 3% paper grain
- OUTER FRAME: 28-32px all sides, dark brown wood grain #3d2b1a
- Inner edge: ivory line #f0e8d8, 2px

TITLE BLOCK (top 12%):
- Full-width off-white band #f8f8f8
- Separator below: #111111, 2px
- Title: "${extraction.title}" — Nunito 900, 48-60px, UPPERCASE, centered
- Subtitle: italic 14px #666666

CONTENT (12% to 88%):
- 7 numbered sections vertically
- Each section:
  * Colored rounded number square (10px radius)
  * Section title: Nunito Bold 18-22px, colored per section
  * Colored underline 2px under title
  * Body: Caveat 400, 14-16px, #111111
  * Key terms: yellow #E8F044 background highlight
- Colors: #C0392B, #2B4DAF, #2E7D32, #D4A017, #8B5CF6, #EC4899, #0D9488

SECTIONS TO RENDER:
${pointsList}
Pro tip: ${extraction.proTip}

NO FOOTER — do not add any dark band, signature, or "follow" text at the bottom.`;
  }
}

// ─── Claude HTML prompt builder (generates complete HTML/CSS) ───

export function buildInfographicPrompt(
  content: string,
  platform: string,
  customInstructions?: string,
  forcedTemplate?: string,
): string {
  const UNIVERSAL_STYLE_CONTEXT = `
STYLE CONTEXT — READ THIS FIRST AND APPLY TO EVERYTHING:

You are generating viral educational infographic HTML/CSS for social media.
The reference style is Awa K Penn — hand-crafted whiteboard/notebook content.

════════════════════════════════════════════════
MANDATORY AESTHETIC RULES — NO EXCEPTIONS
════════════════════════════════════════════════

1. Background: ALWAYS #f8f9f7 to #fffef8 — NEVER dark backgrounds
2. TWO fonts ONLY:
   - Titles/headers: Nunito ExtraBold weight 900
   - Body/bullets: Caveat Regular/Bold (handwritten feel)
   - Load: https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap
3. Yellow ONLY as inline highlighter: background:#FFEF5A on specific words
   NEVER as card background or section color
4. Max 4 accent colors:
   - Red: #C0392B (warm brownish — NOT #FF0000)
   - Blue: #2563EB (medium — NOT navy)
   - Green: #4A8B35 (natural — NOT lime)
   - Orange: #F5922A (tertiary only)
5. NO gradients. NO dark cards. NO corporate slide aesthetic.
6. Dense information — every section packed with useful content
7. Each section header has colored underline in accent color
8. NO footer, NO signature, NO watermark, NO "follow for more" text
9. ALL CSS MUST BE INLINE (style="...") — NEVER use CSS classes
   This is critical for PNG export with html2canvas

════════════════════════════════════════════════
VISUAL SIGNATURE ELEMENTS (MANDATORY)
════════════════════════════════════════════════

WHITEBOARD TEMPLATES:
- 4 small metal clips at corners (12x18px dark gray rectangles)
- Very subtle border 0.5px #e0e0e0 around canvas
- Background grain 2% opacity
- [Square brackets] around title — bold black, Nunito 900

NOTEBOOK TEMPLATES:
- Top spiral binding: 20 metallic coils, 70px tall
- Left margin line: vertical #E63946, 1.5px, at x=72px
- Horizontal ruled lines: #dde8f0, 0.5px, every 34px

ALL TEMPLATES:
- Yellow #FFEF5A inline highlights (flat, no border-radius, like Stabilo marker)
- Colored section header underlines (2px, accent color)
- Circle/oval badges for numbered lists (stroke 1.5px, white fill)
- ✓ checkmarks in #C0392B
- ★ stars for emphasis in #F5922A
- → arrows between elements
- Circled numbers ①②③④⑤⑥ in Nunito Bold blue #2563EB

════════════════════════════════════════════════
QUALITY THRESHOLD — REJECT IF ANY OF THESE:
════════════════════════════════════════════════
✗ Clean modern sans-serif throughout (Caveat missing)
✗ Dark backgrounds or dark section cards
✗ Pale/washed-out colors
✗ Empty whitespace between sections
✗ Missing numbered badge circles on step items
✗ Text cut off or misaligned
✗ Yellow used as card/section background
✗ More than 4 accent colors`;

  const analysis = analyzeContent(content, platform);
  const dims = FORMAT_DIMS[analysis.format];
  const selection = selectBestTemplate(content, platform, forcedTemplate);
  const templateId = selection.templateId;
  const extraction = extractKeyPoints(content);

  const templatePrompt = getTemplatePrompt(templateId, extraction, dims);

  const dimStr = `${dims.width}x${dims.height}`;

  return `${UNIVERSAL_STYLE_CONTEXT}

TEMPLATE ACTIF : ${templateId}
DIMENSIONS : ${dimStr}px

${templatePrompt}

CONTENT TO INCLUDE:
Title: ${extraction.title}
Badge: ${extraction.badge}
${extraction.points.map((p, i) => `P${i+1}_TITLE: ${p.title}\nP${i+1}_BODY: ${p.body}`).join('\n')}
Pro tip: ${extraction.proTip}
NO footer or branding text.

${customInstructions ? `Additional instructions: ${customInstructions}` : ""}

TYPOGRAPHY RULES — MANDATORY:
- Title: Nunito font-weight 900, font-size minimum 44px
- Section headers: Nunito font-weight 800, font-size 24-28px
- Body text: Caveat font-weight 500, font-size minimum 16px
- Labels/badges: Nunito font-weight 800, font-size 11-13px
- ALL text must have overflow:hidden + -webkit-line-clamp
- NO text can overflow its container
- white-space:nowrap on single-line elements only
- line-height: 1.1-1.15 for titles, 1.3-1.5 for body

ORDER RULES — MANDATORY:
- Header first (badge + title): flex-shrink:0
- Body in middle: flex:1, min-height:0
- Footer last: flex-shrink:0
- Every flex container needs: display:flex, overflow:hidden
- Every flex child needs: min-width:0 OR min-height:0

DENSITY RULES — MANDATORY:
- Minimum 5 distinct points per infographic (never less)
- Each point must have a title (3-6 words) AND a body (15-25 words)
- An infographic with less than 5 points will be REJECTED
- Content must fill 75-85% of the canvas visually
- NO empty sections, NO placeholder text like "lorem ipsum"
- Every point must be specific and actionable

RAPPEL FINAL :
- Nunito 900 pour TOUS les titres
- Caveat pour TOUT le corps de texte
- Styles INLINE uniquement (jamais de classes CSS)
- Background #f8f9f7 (jamais #ffffff pur)
- Couleurs saturées et confiantes (pas de pastels trop pâles)
- Génère UNIQUEMENT le code HTML complet
- Commence par <!DOCTYPE html> et termine par </html>
- Aucun texte avant ou après le HTML
- All visible text must be in ENGLISH`;
}


// ─── Unified template detection (delegates to selectBestTemplate) ───

function detectTemplate(content: string): string {
  return selectBestTemplate(content, "").templateId;
}

// ─── Content type analysis for prompt enrichment ───

function analyzeContentType(content: string): string {
  if (/step\s+\d|étape/i.test(content)) return "step-by-step tutorial";
  if (/\bvs\b|versus|compared/i.test(content)) return "comparison guide";
  if (/\d+\s+(ways|tips|reasons|things)/i.test(content)) return "numbered list";
  if (/story|histoire|j'ai|i was|i lost|i made/i.test(content)) return "personal story";
  if (/cheatcode|framework|formula|blueprint/i.test(content)) return "framework/system";
  if (/command|terminal|code|api/i.test(content)) return "technical guide";
  return "educational content";
}

// ─── DALL-E prompt builder — pixel-precise layout instructions ───

export function buildDallEPrompt(
  content: string,
  platform: string,
  template?: string,
): string {
  const selectedTemplate = template || detectTemplate(content);
  const ext = extractForDallE(content);
  const n = ext.points.length;

  const RULES = `ABSOLUTE REQUIREMENTS:
- Every single word must be FULLY VISIBLE and READABLE
- NO text cut off at edges — 60px margin on ALL sides
- NO text overlapping other text or elements
- Minimum font size: 20px for body, 36px for titles
- High contrast: dark text on light bg OR white on dark bg
- Professional typography: clean sans-serif font
- ALL ${n} points from the content must appear
- Use EXACTLY the text provided — do not paraphrase or invent
- NO footer, NO signature, NO watermark, NO branding`;

  const contentType = analyzeContentType(content);

  const CONTENT = `CONTENT TYPE: ${contentType}
Topic: "${ext.title}"
The visual must DIRECTLY represent this ${contentType}. No generic business visuals.

EXACT TEXT TO DISPLAY (use word for word):

MAIN TITLE: "${ext.title}"

${ext.points.map((p, i) => `POINT ${i + 1}: "${p}"`).join('\n')}
${ext.stats.length > 0 ? `\nKEY NUMBERS: ${ext.stats.map(s => `"${s}"`).join(', ')}` : ''}`;

  // ── WHITEBOARD ──
  if (selectedTemplate === "WHITEBOARD" || selectedTemplate === "UI_CARDS" || selectedTemplate === "AWA_CLASSIC") {
    return `Create a VIRAL hand-drawn whiteboard infographic.

${RULES}

${CONTENT}

VISUAL LAYOUT — WHITEBOARD:
Background: Warm off-white #F9F7F2 (paper texture)
4 metallic binder clips at corners
Faint ruled lines in background

TOP SECTION (15% of height):
- Title "${ext.title}" in huge bold marker font (52px)
  Underlined with thick colored marker stroke
  Color: Deep charcoal #1A1A1B

CONTENT SECTION (75% of height):
${ext.points.map((p, i) => {
  const colors = ["Red #D93025", "Blue #1A73E8", "Green #188038", "Purple #7B2FBE"];
  return `POINT ${i + 1}:
- Hand-drawn numbered circle in ${colors[i % colors.length]}
- Bold colored header: first 4 words of "${p}"
- Body text: "${p}" in clean 18px
- Yellow highlighter (#FFE066) on 1-2 key words
- Wavy separator below`;
}).join('\n')}

BOTTOM (10%):
- Key stat in yellow sticky note (slight tilt, shadow)

Hand-drawn arrows connecting related points
Small doodle icons in margins (lightbulb, star, checkmark)
All ${n} points fully readable`;
  }

  // ── PROCESS_STEPS ──
  if (selectedTemplate === "PROCESS_STEPS") {
    return `Create a BREATHTAKING step-by-step process infographic.

${RULES}

${CONTENT}

VISUAL LAYOUT — PROCESS STEPS:
Background: Warm cream #FAF8F5
Dot grid pattern (very subtle, #E5E0D8)

TOP SECTION (15%):
- Small orange category pill badge
- Bold title "${ext.title}" (48px, charcoal #1A1A1B)

STEPS SECTION (75%):
${ext.points.map((p, i) => `STEP ${i + 1} CARD:
- Left: Circle badge number ${i + 1} (Gradient Blue #1A73E8 → Purple #7B2FBE, white number)
- Right: Bold title + body text: "${p}"
- Bottom: dashed connector line to next step`).join('\n')}

BOTTOM SECTION (10%):
- Green result box: "${ext.stats[0] || 'Apply this framework'}"

All ${n} steps fully visible, clean connecting arrows between steps`;
  }

  // ── EDITORIAL_LIST ──
  if (selectedTemplate === "EDITORIAL_LIST") {
    return `Create a STRIKING editorial magazine-style infographic.

${RULES}

${CONTENT}

VISUAL LAYOUT — EDITORIAL LIST:
Background: Warm cream #FDFAF6
Thin black border frame (3px, 8px inset from edges)

TOP SECTION (12%):
- "INSIGHTS" small caps label in orange
- Title "${ext.title}" ultra-bold black (44px)
- Full-width black divider line (2px)

LIST ITEMS SECTION (76%):
${ext.points.map((p, i) => `ITEM ${i + 1}:
- Giant number "${i + 1}" (80px, orange #FF6B35, left aligned)
- Bold title: first 6 words of "${p}" (22px, black)
- Body text: "${p}" (15px, dark gray #333)
- Full-width thin separator line below`).join('\n')}

BOTTOM (12%):
- Pull quote box with most impactful insight
- Large quotation marks, italic text

All ${n} items visible, clearly separated`;
  }

  // ── COMMAND_CENTER ──
  if (selectedTemplate === "COMMAND_CENTER") {
    return `Create a STUNNING dark terminal command-center infographic.

${RULES}

${CONTENT}

VISUAL LAYOUT — COMMAND CENTER:
Background: Near-black #0A0E1A
Terminal window with chrome bar at top
Traffic lights (red/yellow/green dots) top-left
Window title: "~/strategy" in gray monospace

COMMAND LINES:
${ext.points.map((p, i) => `LINE ${i + 1}:
$ ${p.split(' ').slice(0, 3).join('_').toLowerCase()}
▸ "${p}"
(blank line separator)`).join('\n')}

Typography: Monospace font
$ prompt: Bright green #00FF41
Commands: White #FFFFFF
Output (▸): Cyan #00D4FF
All text fully visible on dark background`;
  }

  // ── ICON_GRID ──
  if (selectedTemplate === "ICON_GRID") {
    return `Create a modern bento grid icon infographic.

${RULES}

${CONTENT}

VISUAL LAYOUT — ICON GRID:
Background: Pure white #FFFFFF

HEADER: Centered title "${ext.title}" (32px bold #1A1A1B). Small category badge above.

GRID: ${Math.min(n, 12)} cells in 3-column bento grid.
${ext.points.map((p, i) => `CELL ${i + 1}: Orange circled number ${i + 1}, bold title, flat icon. Text: "${p.slice(0, 40)}"`).join('\n')}

Each cell: rounded card (12px radius), thin #F0F0F0 border
Icons: bicolor orange #FF6B35 and black
All cells clearly readable`;
  }

  // ── COMPARISON / DATA_GRID ──
  if (selectedTemplate === "COMPARISON" || selectedTemplate === "DATA_GRID") {
    return `Create a STUNNING professional comparison infographic.

${RULES}

${CONTENT}

VISUAL LAYOUT — COMPARISON:
Background: Deep dark #0D1117

TOP SECTION (15%):
- Small badge "COMPARISON" in neon green #00D4AA
- Main title "${ext.title}" in large white bold (48px)
- Thin white divider line below title

COLUMNS SECTION (70%):
${Math.min(n, 3)} equal vertical columns.
- Column 1: Header badge Electric Blue #00B4FF
- Column 2: Header badge Neon Green #00D4AA
- Column 3: Header badge Warm Orange #FF8B00
- Each column: rounded card (#161B22 bg, 1px border #30363D)
- White bullet points with colored checkmarks inside

${ext.points.map((p, i) => `Column ${(i % 3) + 1} content: "${p}"`).join('\n')}

BOTTOM (15%): Gradient bar (Blue→Green→Orange), white text

All text: white on dark, fully visible, high contrast`;
  }

  // ── NOTEBOOK ──
  if (selectedTemplate === "NOTEBOOK") {
    return `Create a GORGEOUS spiral notebook infographic.

${RULES}

${CONTENT}

VISUAL LAYOUT — NOTEBOOK:
Background: Warm white #FFFEF8
Ruled lines every 28px (#E8E4DA)
Red vertical margin line 28px from left
Metallic spiral binding at top (18 silver coils)

TOP (15%):
- Title "${ext.title}" in large colorful text
  Each word different color (green, blue, orange)

CONTENT (75%):
${ext.points.map((p, i) => {
  const colors = ["blue", "orange", "green", "purple"];
  return `ITEM ${i + 1}:
- Colored oval badge (${colors[i % colors.length]}) with number ${i + 1}
- Text: "${p}" in clean handwritten-style font
- Small doodle icon to the right`;
}).join('\n')}

BOTTOM (10%):
- Yellow sticky note with key insight (slight tilt, shadow)

All ${n} items visible between ruled lines`;
  }

  // ── FUNNEL ──
  if (selectedTemplate === "FUNNEL") {
    return `Create an educational funnel flow infographic.

${RULES}

${CONTENT}

VISUAL LAYOUT — FUNNEL:
Background: Warm off-white #FFFEF5

TOP: Title "${ext.title}" very large bold centered, thick underline

FUNNEL SHAPE: Large trapezoid, wide top → narrow bottom
${Math.min(n, 5)} stages, each a colored band:
${ext.points.slice(0, 5).map((p, i) => {
  const colors = ["Red #D93025", "Orange #FF6B35", "Gold #F59E0B", "Green #188038", "Blue #1A73E8"];
  return `Stage ${i + 1} (${colors[i]}): White label box — "${p}"`;
}).join('\n')}

Side elements: Two large red curved arrows flanking funnel
Gold sparkle stars scattered
Hand-drawn irregular outlines`;
  }

  // ── CTA_VISUAL ──
  if (selectedTemplate === "CTA_VISUAL") {
    return `Create a clean promotional infographic.

${RULES}

${CONTENT}

VISUAL LAYOUT — CTA VISUAL:
Background: Light gray #F5F5F5 with subtle dot grid

TOP: Large imposing text "${ext.title}" with yellow highlight on key word

CENTER: Minimalist icon (orange #FF6B35)
${Math.min(n, 4)} floating rounded folder cards (blue #4A90D9) connected by dotted lines

${ext.points.slice(0, 4).map((p, i) => `Folder ${i + 1}: "${p.slice(0, 30)}"`).join('\n')}

Clean structured layout, rounded corners 8px
All text fully readable`;
  }

  // Default
  return `Create a stunning professional infographic.

${RULES}

${CONTENT}

VISUAL LAYOUT:
- Clean white background
- Bold title at top: "${ext.title}"
- ${n} clearly separated sections
- Each point in its own visual block
- Professional color accents
- All text perfectly readable`;
}

// ─── Post-process generated HTML ───

export function postProcessHtml(html: string): string {
  let out = html;

  // Ensure font link (covers all templates: Poppins, Inter, Playfair Display, Caveat)
  if (!out.includes("fonts.googleapis.com")) {
    out = out.replace("</head>",
      '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&family=Caveat:wght@500;700&display=swap" rel="stylesheet"></head>'
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
    { label: "Has cards/sections", pass: /<div class="(card|section|stat|block|row)/.test(html) },
    { label: "Has Header section", pass: /<div class="header"/.test(html) },
    { label: "Has Body section", pass: /<div class="(body|sections|cards|funnel|table|content|grid|stats|details)"/.test(html) },
    { label: "No placeholders left", pass: !html.includes("{{") },
    { label: "Has footer", pass: /<div class="footer">/.test(html) && !html.includes("{{FOOTER}}") },
    { label: "Correct dimensions", pass: html.includes(`${dims.width}px`) && html.includes(`${dims.height}px`) },
    { label: "Font loaded", pass: html.includes("fonts.googleapis.com") },
    { label: "No italic", pass: !html.includes("font-style:italic") && !html.includes("font-style: italic") },
    { label: "No emoji characters", pass: !/[\u{1F300}-\u{1F9FF}]/u.test(html) },
    { label: "Soft shadow used", pass: html.includes("box-shadow") && !/border:\s*\d+px solid #000/.test(html) },
    { label: "Overflow hidden", pass: html.includes("overflow:hidden") || html.includes("overflow: hidden") },
    { label: "Has inline emphasis", pass: html.includes('class="a"') || html.includes("class='a'") },
  ];

  const passed = checks.filter(c => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);

  return { score, checks };
}

// ─── Reset regeneration counter (call when modal opens fresh) ───

export function resetRegenerationCounter(): void {
  regenerationCounter = 0;
}

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
  // User override takes precedence — no detection logic.
  if (forcedTemplate && TEMPLATE_REGISTRY[forcedTemplate]) {
    return { templateId: forcedTemplate, reason: "Style choisi manuellement" };
  }

  const lower = content.toLowerCase();
  const words = lower.split(/\s+/);
  const wordCount = words.length;

  // ── Detect 3-entity comparison (A vs B vs C) → COMPARISON ──
  const vsMatches = content.match(/\bvs\.?\b/gi);
  const hasMultiVs = vsMatches && vsMatches.length >= 2; // "A vs B vs C" has 2 "vs"
  const has3Entities = /(.+)\s+vs\.?\s+(.+)\s+vs\.?\s+(.+)/i.test(content);

  // ── Detect resource/course lists → NOTEBOOK ──
  const hasResourceList = /\d+\s+(free|best|top)\s+(course|resource|tool|book|site|app|platform)/i.test(content)
    || /free\s+(course|resource|tool)/i.test(content)
    || /cours gratuit|ressources? gratuit|outils? gratuit/i.test(content)
    || /course|udemy|coursera|edx|skillshare|masterclass/i.test(lower);

  const p = {
    hasNumberedList: /(\d+\.|①|②|③|étape|step|premier|first)/i.test(content),
    hasStats: /\d+[%km€$]|\d{4,}/i.test(content),
    hasComparison: /\bvs\b|versus|contre|avant.*après|before.*after|plutôt|better than|bad.*good|good.*great|niveau|level|compare|compared to/i.test(content),
    hasHowTo: /comment|how to|étape|step|guide|tutorial|ways to|steps to/i.test(content),
    hasTips: /conseil|tip|astuce|hack|trick|secret|mistakes?|ways |things /i.test(content),
    isTech: /\bai\b|tech|digital|code|app|software|chatgpt|claude|ia/i.test(content),
    isBusiness: /business|argent|money|revenue|vente|sale|entrepreneur/i.test(content),
    isMarketing: /marketing|contenu|content|viral|audience|engagement/i.test(content),
  };

  const hasFunnel = /funnel|entonnoir|processus|parcours|roadmap|pipeline|conversion|tunnel|étapes? du|journey|workflow/i.test(content);
  const hasDataGrid = /framework|modèle|méthode|tableau|matrix|matrice|grille|glossaire|comparison detailed|data|statistics|survey|research/i.test(content);

  let templateId: string;
  let reason: string;

  // Priority 1: 3-entity comparison → COMPARISON (3-column layout)
  if (has3Entities || hasMultiVs) {
    templateId = "COMPARISON";
    reason = "Comparaison à 3 entités — colonnes côte à côte";
  }
  // Priority 2: Resource/course lists → NOTEBOOK (spiral binding)
  else if (hasResourceList) {
    templateId = "NOTEBOOK";
    reason = "Liste de ressources/cours — style cahier spirale";
  }
  // Priority 3: Funnel/process
  else if (hasFunnel) {
    templateId = "FUNNEL";
    reason = "Processus/parcours — entonnoir progressif";
  }
  // Priority 4: 2-entity comparison or tiers → COMPARISON
  else if (p.hasComparison) {
    templateId = "COMPARISON";
    reason = "Comparaison détectée — colonnes côte à côte";
  }
  // Priority 5: Framework/data grid
  else if (hasDataGrid) {
    templateId = "DATA_GRID";
    reason = "Framework/ressources — tableau structuré";
  }
  // Priority 6: How-to, tips, numbered lists → WHITEBOARD
  else if (p.hasHowTo || p.hasTips || p.hasNumberedList) {
    templateId = "WHITEBOARD";
    reason = "Conseils/étapes — style tableau dessiné";
  }
  // Priority 7: Long content → WHITEBOARD (dense)
  else if (wordCount > 300) {
    templateId = "WHITEBOARD";
    reason = "Contenu long — whiteboard dense";
  }
  // Default: AWA_CLASSIC
  else {
    templateId = "AWA_CLASSIC";
    reason = "Contenu général — style viral Awa Penn";
  }

  return { templateId, reason };
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


// ─── DALL-E 3 auto-detect template ───

function detectTemplate(content: string): string {
  const lower = content.toLowerCase();

  if (/step|steps|how to|guide|tutorial|process/i.test(lower))
    return "PROCESS_STEPS";
  if (/command|terminal|code|developer|api|tool/i.test(lower))
    return "COMMAND_CENTER";
  if (/list|tips|\d+\s+ways|\d+\s+things|tools|resources/i.test(lower))
    return "ICON_GRID";
  if (/vs\b|versus|compared|comparison|difference/i.test(lower))
    return "COMPARISON";
  if (/funnel|stage|pipeline|journey|flow/i.test(lower))
    return "FUNNEL";
  if (/automate|system|workflow|everything/i.test(lower))
    return "CTA_VISUAL";
  if (/tip|advice|rule|principle|lesson/i.test(lower))
    return "EDITORIAL_LIST";

  return "WHITEBOARD";
}

// ─── DALL-E prompt builder — "WOW" level prompts ───

export function buildDallEPrompt(
  content: string,
  platform: string,
  template?: string,
): string {
  const selectedTemplate = template || detectTemplate(content);
  const ext = extractForDallE(content);
  const pl = platform?.toLowerCase() || "";

  const baseRules = `CRITICAL RULES — NO EXCEPTIONS:
1. ALL TEXT IN ENGLISH ONLY — no other language
2. NO footer, NO signature, NO watermark, NO "follow for more", NO branding
3. Every word FULLY READABLE — never cut off, never truncated, never blurry
4. 50px safe margin on ALL sides — text NEVER touches edges
5. Minimum 18px body text, 32px titles — HIGH CONTRAST always
6. NO text overlapping other elements — clean visual hierarchy
7. Fill 88% of canvas with information — DENSE but organized
8. Use ONLY the exact content below — do NOT invent or add anything`;

  const contentBlock = `EXACT CONTENT TO DISPLAY:

TITLE: "${ext.title}"
${ext.points.length > 0 ? `\nPOINTS (display ALL):\n${ext.points.map((p, i) => `${i + 1}. "${p}"`).join('\n')}` : ''}
${ext.stats.length > 0 ? `\nSTATS (highlight):\n${ext.stats.map(s => `• ${s}`).join('\n')}` : ''}
${ext.keywords.length > 0 ? `\nKEY TERMS: ${ext.keywords.map(k => `"${k}"`).join(', ')}` : ''}

Use EVERY piece of information. Do not skip any point.`;

  let formatHint = "Portrait format.";
  if (pl.includes("linkedin")) formatHint = "Portrait (1024x1536). LinkedIn-optimized.";
  else if (pl.includes("facebook")) formatHint = "Square (1024x1024). Facebook-optimized.";
  else if (pl.includes("instagram")) formatHint = "Portrait (1024x1536). Instagram-optimized.";
  else if (pl.includes("twitter") || pl.includes("x (")) formatHint = "Landscape (1536x1024). X/Twitter-optimized.";

  const n = ext.points.length;

  // ── WHITEBOARD ──
  if (selectedTemplate === "WHITEBOARD" || selectedTemplate === "UI_CARDS" || selectedTemplate === "AWA_CLASSIC") {
    return `${baseRules}\n\n${contentBlock}\n\nVISUAL STYLE — "Viral Creator Whiteboard":
${formatHint}

CANVAS: Warm off-white paper #F9F7F2 with subtle grain. 4 realistic metallic binder clips at corners. Faint ruled lines in background.

TYPOGRAPHY:
- TITLE: Massive ultra-bold hand-lettered, 90% width, thick marker underline. Color: #1A1A1B
- SECTION HEADERS: Bold, alternating colors: Red #D93025, Blue #1A73E8, Green #188038, Purple #7B2FBE
- BODY: Clean handwritten style 18px, dark gray #2D2D2D, line-height 1.6

LAYOUT: Top 12% = category badge + HUGE title. Middle 75% = ${n} sections, each with: colored numbered circle, bold header with underline, 2-3 lines body, yellow highlighter #FFE066 on key terms, small doodle icon. Bottom 13% = key stat in yellow box.

DETAILS: Hand-drawn arrows connecting ideas. Stars and checkmarks in margins. Curly brackets for grouping. Wavy hand-drawn separators. Slightly imperfect marker strokes (human feel). Every corner has visual interest. 88% canvas fill.

BENCHMARK: Looks like a 50K+ impression LinkedIn creator post.`;
  }

  // ── PROCESS_STEPS ──
  if (selectedTemplate === "PROCESS_STEPS") {
    return `${baseRules}\n\n${contentBlock}\n\nVISUAL STYLE — "Premium SaaS Step-by-Step":
${formatHint}

CANVAS: Ultra-clean cream #FAF8F5. Subtle dot grid (#E5E0D8, 20px, 40% opacity). 48px margin.

STEP CARDS (${n} steps): Each card has: Left = large numbered circle (gradient Blue #1A73E8 → Purple #7B2FBE, white number), Right = bold title 20px #1A1A1B + body 15px #555555 + small icon. Between cards: curved gradient arrow (Blue → Purple → Orange progression).

HEADER (top 18%): Small category pill (light blue #EBF3FF), huge title 36px ultra-bold #0F0F0F, one-line subtitle.

FOOTER (bottom 10%): Key result in gradient rounded box (Blue → Purple), white bold text.

COLORS: Blue #1A73E8, Purple #7B2FBE, Orange #FF6B35, BG #FAF8F5, Text #1A1A1B.

QUALITY: Magazine editorial meets Apple product page. Premium SaaS aesthetic.`;
  }

  // ── EDITORIAL_LIST ──
  if (selectedTemplate === "EDITORIAL_LIST") {
    return `${baseRules}\n\n${contentBlock}\n\nVISUAL STYLE — "Bold Editorial Magazine":
${formatHint}

CANVAS: Warm cream #FDFAF6. Thin 3px border frame #1A1A1B (8px inset). Corner registration marks.

TYPOGRAPHY (the star): Giant background number 120px burnt orange #FF6B35 at 15% opacity. Solid item number 48px #FF6B35 on top. Title 22px black #0F0F0F weight 800, tight letter-spacing. Body 15px #333333 weight 400, line-height 1.7. Full-width 2px separator between items.

LAYOUT PER ITEM: Giant BG number + solid number + bold title + body text + separator line. Pull quote box for strongest insight (large quotation marks, italic).

DECORATIVE: Small geometric shapes (triangles, circles, squares) in accent color. Magazine header with "INSIGHTS" in all-caps.

COLORS: Orange #FF6B35 (numbers), Black #0F0F0F (titles), Cream #FDFAF6 (bg), Gray #888888 (body).

FEEL: The Economist meets Instagram carousel. Sophisticated, scroll-stopping.`;
  }

  // ── COMMAND_CENTER ──
  if (selectedTemplate === "COMMAND_CENTER") {
    return `${baseRules}\n\n${contentBlock}\n\nVISUAL STYLE — "Developer Command Center":
${formatHint}

CANVAS: Near-black #0A0E1A. Faint circuit board pattern #111827. Green phosphor glow at top #00FF41 at 3%.

TERMINAL WINDOW: Dark chrome #1A1A2E. Traffic lights (red/yellow/green dots top-left). Title "~/content-strategy" monospace. Large blurred shadow.

COMMAND LINES: Prompt "$" bright green #00FF41. Commands white monospace. Flags orange #FF8B00. Output cyan #00D4FF. Comments gray #666666. Percentage bars [████████░░] style.

DECORATIVE: ASCII dividers. Loading dots animation feel. Small status indicators.

COLORS: Green #00FF41, Cyan #00D4FF, Orange #FF8B00, Red #FF3B30, BG #0A0E1A.

FEEL: Linear.app meets Vercel dashboard. Viral in dev communities.`;
  }

  // ── ICON_GRID ──
  if (selectedTemplate === "ICON_GRID") {
    return `${baseRules}\n\n${contentBlock}\n\nVISUAL STYLE — "Bento Grid Icons":
${formatHint}

CANVAS: Pure white #FFFFFF. Clean and airy.

GRID: ${Math.min(n, 12)} cells in a bento grid (3 columns). Each cell: rounded card (12px radius, thin #F0F0F0 border), circled orange number #FF6B35, bold title, simplified flat illustration in orange+black bicolor. Cards have subtle shadow on hover feel.

HEADER: Centered title 32px bold #1A1A1B. Small category badge above.

COLORS: Orange #FF6B35, Black #1A1A1B, White #FFFFFF, Light gray #F8F8F8.

FEEL: Notion-style bento grid. Modern, clean, information-dense. Each cell tells a micro-story.`;
  }

  // ── COMPARISON / DATA_GRID ──
  if (selectedTemplate === "COMPARISON" || selectedTemplate === "DATA_GRID") {
    return `${baseRules}\n\n${contentBlock}\n\nVISUAL STYLE — "Dark Luxury Dashboard":
${formatHint}

CANVAS: Rich dark #0D1117. Subtle grid #161B22. Top gradient glow: Blue #1A73E8 at 5%.

HEADER: Small "COMPARISON" badge in neon green #00D4AA (border + bg). Title 32px white bold. Subtitle 14px #8B949E.

COLUMNS (${Math.min(n, 3)}): Each column card: bg #161B22, 1px border #30363D, 12px radius, 24px padding. Colored header pill (Blue #00B4FF, Green #00D4AA, Orange #FF8B00). White items with colored checkmarks.

GLOW EFFECTS: Column headers have subtle color glow. Bottom CTA with gradient border (Blue → Green → Orange).

COLORS: Blue #00B4FF, Green #00D4AA, Orange #FF8B00, Purple #BD93F9, BG #0D1117.

FEEL: Premium SaaS pricing page. Modern dark mode, trustworthy.`;
  }

  // ── NOTEBOOK ──
  if (selectedTemplate === "NOTEBOOK") {
    return `${baseRules}\n\n${contentBlock}\n\nVISUAL STYLE — "Cozy Creator Notebook":
${formatHint}

CANVAS: Warm white #FFFEF8 with fine paper grain. Faint ruled lines #E8E4DA every 28px. Left margin: vertical red line #FF3B30. Top: 18 realistic metallic spiral coils (3D).

TYPOGRAPHY: Title HUGE colorful — each word different color (Green #2D6A4F, Blue #1A73E8, Orange #FF6B35). Bouncy hand-lettered feel. Items bold black 16px. Body casual 14px #2D2D2D.

ELEMENTS: Oval numbered badges alternating colors (blue, orange, green, purple). Yellow #FFE066 highlights on key terms. Doodle icons in margins (stars, arrows, hearts). Sticky note callout (yellow, tilted) for best insight. Washi tape decoration at top.

DENSITY: Fills the page completely. Energetic student study notes aesthetic.

FEEL: Warm, personal, creative. Like peeking into a brilliant creator's notebook.`;
  }

  // ── FUNNEL ──
  if (selectedTemplate === "FUNNEL") {
    return `${baseRules}\n\n${contentBlock}\n\nVISUAL STYLE — "Conversion Funnel Flow":
${formatHint}

CANVAS: Warm off-white #FFFEF5 with subtle paper grain.

TITLE: Very large, bold centered. Thick underline.

FUNNEL: Large trapezoid shape, wide top → narrow bottom. ${Math.min(n, 5)} stages. Each stage: colored band (Red #D93025 → Orange #FF6B35 → Gold #F59E0B → Green #188038 → Blue #1A73E8), white label box inside with title + checkmarks. Hand-drawn irregular outlines 2.5px.

SIDE ELEMENTS: Two large red curved arrows flanking funnel. 6-8 gold sparkle stars scattered. Percentage labels on sides showing conversion.

COLORS: Stage colors gradient from warm to cool. Background #FFFEF5.

FEEL: Warm, approachable, educational. The kind of funnel diagram that gets saved and shared.`;
  }

  // ── CTA_VISUAL ──
  if (selectedTemplate === "CTA_VISUAL") {
    return `${baseRules}\n\n${contentBlock}\n\nVISUAL STYLE — "Indie Hacker Hero":
${formatHint}

CANVAS: Light gray #F5F5F5 with subtle dot grid.

CENTER: Large minimalist asterisk/logo icon, orange #FF6B35. ${Math.min(n, 4)} floating rounded folder cards (blue #4A90D9) orbiting center, connected by dotted lines.

TOP: Imposing large text with one word highlighted yellow #FFE066. Deep black #1A1A1B.

ACCENTS: Orange #FF6B35 for badges and highlights. Rounded corners 8px. Clean structured layout.

FEEL: ProductHunt launch page energy. Clean, impactful, makes you want to click.`;
  }

  // Default
  return `${baseRules}\n\n${contentBlock}\n\nVISUAL STYLE: Professional educational infographic.
${formatHint}
Dense information layout. High contrast. Scroll-stopping design. Viral social media quality.`;
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

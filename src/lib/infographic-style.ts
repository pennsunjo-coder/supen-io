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

function detectContentType(content: string): string {
  if (/step\s+\d|étape\s+\d/i.test(content)) return "tutorial";
  if (/\bvs\b|\bversus\b|compared/i.test(content)) return "comparison";
  if (/\d+\s+(ways|tips|reasons|things|secrets|mistakes|hacks|tools|lessons)/i.test(content)) return "list";
  if (/story|histoire|j'ai|i was|i spent|i lost|i made/i.test(content)) return "story";
  if (/cheatcode|framework|formula|blueprint/i.test(content)) return "framework";
  if (/thread|tweet/i.test(content)) return "thread";
  return "educational";
}

export function extractForDallE(content: string): EnhancedExtraction & { quotes: string[]; contentType: string } {
  const lines = content
    .split(/\n+/)
    .map(l => l.trim())
    .filter(l => l.length > 10);

  // Title: clean markdown, trim to readable length
  const title = (lines[0] || "Key Insights")
    .replace(/^#+\s*/, '')
    .replace(/^\*+\s*/, '')
    .replace(/\*\*/g, '')
    .slice(0, 65);

  // Points: all substantial lines, cleaned and truncated
  const points = lines
    .slice(1)
    .filter(l => l.length > 20)
    .filter(l => !/^https?:\/\//.test(l))
    .filter(l => !/^-{3,}/.test(l))
    .map(l => l
      .replace(/^\d+[\.\)\/]\s*/, '')
      .replace(/^[▸→•\-\*☑✦↳]\s*/, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .trim()
    )
    .filter(l => l.length > 15)
    .map(l => l.length > 65 ? l.slice(0, 62) + "..." : l)
    .slice(0, 7);

  // Stats/numbers
  const stats = (content.match(
    /\d+[\.,]?\d*\s*(%|€|\$|K|M|x|×|fois|days?|jours?|months?|mois|years?|ans?|hours?|heures?|minutes?|followers?|impressions?|views?)/gi,
  ) || []).slice(0, 3);

  // Quoted text
  const quotes = (content.match(/["«»"]([^"«»"]{10,80})["«»"]/g) || [])
    .map(q => q.replace(/["«»"]/g, '').trim())
    .slice(0, 2);

  // Keywords
  const keywords = (content.match(/["«»]([^"«»]{3,50})["«»]/g) || [])
    .map(k => k.replace(/["«»]/g, '').trim())
    .slice(0, 3);

  const contentType = detectContentType(content);

  return { title, points, stats, keywords, quotes, contentType };
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
  userName?: string,
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

  const contentBlock = `CONTENT TYPE: ${ext.contentType}
This is a ${ext.contentType} infographic — the visual must match this type.

MANDATORY CONTENT — USE WORD FOR WORD:

TITLE (display prominently): "${ext.title}"
${ext.points.length > 0 ? `\nKEY POINTS (display ALL ${ext.points.length} points):\n${ext.points.map((p, i) => `${i + 1}. "${p}"`).join('\n')}` : ''}
${ext.stats.length > 0 ? `\nKEY NUMBERS (highlight visually):\n${ext.stats.map(s => `• ${s}`).join('\n')}` : ''}
${ext.quotes.length > 0 ? `\nPULL QUOTE (display in quote box):\n"${ext.quotes[0]}"` : ''}

CRITICAL: Use ONLY the text above. Do NOT invent, paraphrase, or add unrelated graphics. Every point must be FULLY READABLE with no text cut off.`;

  let formatHint = "Portrait format.";
  if (pl.includes("linkedin")) formatHint = "Portrait (1024x1536). LinkedIn-optimized.";
  else if (pl.includes("facebook")) formatHint = "Square (1024x1024). Facebook-optimized.";
  else if (pl.includes("instagram")) formatHint = "Portrait (1024x1536). Instagram-optimized.";
  else if (pl.includes("twitter") || pl.includes("x (")) formatHint = "Landscape (1536x1024). X/Twitter-optimized.";

  const n = ext.points.length;
  const AVOID = "\n\nAVOID: blurry, cluttered, messy layout, too many colors, realistic photo, 3D render, low resolution, bad typography, misaligned text, dark background (unless dark template), generic stock photo style.";

  // ── WHITEBOARD (single forced style with variation) ──
  {
    const COLORS = ['Blue', 'Red', 'Orange', 'Purple', 'Green'];

    const backgrounds = ["creamy paper #FAF9F6", "pure white #FFFFFF", "warm white #FDFCFA", "light cream #FFF8F0"];
    const bgChoice = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    const layouts = [
      "vertical stacked blocks with numbers on left",
      "two-column layout with icons on left, text on right",
      "timeline layout with connecting arrows between sections",
      "grid layout with key points in colored cards",
    ];
    const layoutChoice = layouts[Math.floor(Math.random() * layouts.length)];

    return `ABSOLUTE RULE: Fill 100% of the canvas vertically. NO white space at top. NO white space at bottom. The background color must reach ALL 4 edges of the image. Start content at the very top edge. End content at the very bottom edge. If needed, increase font sizes or spacing to fill the space.

Generate a digital whiteboard-style infographic.

STYLE — MANDATORY:
- Canvas: vertical 4:5 format, fill ENTIRE canvas edge to edge
- Background: ${bgChoice} — must extend to ALL 4 edges, zero empty space
- Layout: ${layoutChoice}
- Hand-drawn marker aesthetic — imperfect lines, human feel
- Blocks with hand-drawn borders (slightly wobbly, not perfectly straight)
- Title at top: large handwritten font, double orange underline (thick marker effect)
- Color palette: marker colors — Blue, Red, Orange, Purple, Green (changes per section)
- Numbers: hand-drawn circles on left of each block
- Highlights: yellow fluorescent highlighter effect behind key words
- Icons: doodle style (lightbulb, star, gear, dollar) inside blocks
- Footer: hand-drawn black line separator + CTA text
- Typography: handwritten-style font (Caveat or similar)
- 100% flat digital design, NO perspective, NO 3D, NO dark background
- NO table surface, NO wooden desk, NO notebook rings, NO camera angle
- ALL text in ENGLISH only
- Every word FULLY READABLE — never cut off

TITLE: "${ext.title}"

CONTENT (display ALL ${n} points):
${ext.points.map((point, i) => `${i + 1}. [${COLORS[i % COLORS.length]} block] "${point}"`).join('\n')}

${ext.stats.length > 0 ? `KEY NUMBERS: ${ext.stats.join(', ')}` : ''}

FOOTER: "Follow @${userName || 'supenli.io'} for more | Repost ♻️"

CREATIVITY:
- Vary section shapes: rectangles, rounded cards, speech bubbles, banners
- Vary title treatment: underlined, circled, highlighted, boxed
- Match visual mood to content tone
- Make it UNIQUE and eye-catching on a social media feed
- Balance: 50% visuals/whitespace, 50% text
- Guide the eye from top to bottom naturally

AVOID: blurry, cluttered, 3D, photos, dark background, perspective, table surface, cut-off text, white space at top/bottom.`;
  }

  // ── PROCESS_STEPS ──
  if (selectedTemplate === "PROCESS_STEPS") {
    return `Generate a single image of a clean, professional step-by-step process infographic.

${baseRules}

${contentBlock}

CRUCIAL STYLE INSTRUCTIONS:
- MEDIUM: Clean printed poster aesthetic — looks like a high-quality design agency output
- Clean minimal design, cream background #FAF8F5 with subtle dot grid pattern
- Bold sans-serif typography (Inter/Helvetica style)
- Numbered steps with gradient colored circle badges
- Connecting dashed arrows between steps with gradient color progression
- Soft drop shadows on step cards
- Simple flat icons next to each step (gear, rocket, chart, target)
- ${formatHint}
- No photos, no 3D, no realistic elements
- Make it easy to scan in less than 10 seconds

LAYOUT (top to bottom):

━━━ HEADER (top 15%) ━━━
Small orange category pill badge above title.
Large bold title: "${ext.title}" (48px, charcoal #1A1A1B)

━━━ STEPS (70%) ━━━
${ext.points.map((point, i) => `STEP ${i + 1}:
- Large numbered circle badge (gradient blue #1A73E8 → purple #7B2FBE, white number inside)
- Bold step title: "${point.split(' ').slice(0, 5).join(' ')}"
- Description in gray: "${point}"
- Simple flat icon on the right side
- Dashed gradient connecting line to next step`).join('\n\n')}

━━━ FOOTER (15%) ━━━
Green result box with key outcome text.
"Follow @${userName || 'supenli.io'} for more | Repost ♻️" in small text.

QUALITY: Magazine editorial meets Apple product page. Premium SaaS aesthetic. Information-dense but scannable.${AVOID}`;
  }

  // ── EDITORIAL_LIST ──
  if (selectedTemplate === "EDITORIAL_LIST") {
    return `Generate a single image of a bold editorial magazine-style list infographic.

${baseRules}

${contentBlock}

CRUCIAL STYLE INSTRUCTIONS:
- MEDIUM: Premium design magazine page aesthetic — like a spread from The Economist or Monocle
- Warm cream background #FDFAF6 with thin black border frame (3px, inset 8px)
- Corner registration marks like a print proof
- Large bold orange numbers #FF6B35 as list markers (80px size)
- Clean sans-serif typography — tight letter-spacing on titles
- Horizontal thin divider lines between items
- ${formatHint}
- No photos, no 3D
- Make it easy to scan in less than 10 seconds
- Use consistent structure across all items

LAYOUT (top to bottom):

━━━ HEADER (12%) ━━━
"INSIGHTS" small caps label in orange #FF6B35.
Title: "${ext.title}" ultra-bold black 44px.
Full-width black divider line (2px).

━━━ LIST ITEMS (76%) ━━━
${ext.points.map((point, i) => `ITEM ${i + 1}:
- Giant number "${i + 1}" in orange #FF6B35 (80px, left-aligned)
- Bold title: "${point.split(' ').slice(0, 5).join(' ')}" (22px, black #0F0F0F)
- Body: "${point}" (15px, dark gray #333)
- Full-width thin separator line below`).join('\n\n')}

━━━ FOOTER (12%) ━━━
Pull quote box with most impactful insight (large quotation marks).
"Follow @${userName || 'supenli.io'} for more | Repost ♻️" in small text.

QUALITY: Sophisticated, scroll-stopping, The Economist meets Instagram carousel.${AVOID}`;
  }

  // ── COMMAND_CENTER ──
  if (selectedTemplate === "COMMAND_CENTER") {
    return `Create a terminal/command-center dark UI infographic.

${baseRules}

${contentBlock}

STYLE:
- Near-black background #0A0E1A
- Terminal window with chrome bar (traffic lights red/yellow/green top-left)
- Monospace font (JetBrains Mono style)
- Green prompt $ symbol #00FF41
- Cyan output text #00D4FF
- Orange accent #FF8B00
- ${formatHint}

LAYOUT:
Terminal window title bar with red/yellow/green dots.
Window path: "~/strategy"

COMMAND LINES:
${ext.points.map((point, i) => `$ ${point.split(' ').slice(0, 3).join('_').toLowerCase()}
▸ "${point}"`).join('\n\n')}

AVOID: light background, photos, blur, 3D, cluttered.`;
  }

  // ── ICON_GRID ──
  if (selectedTemplate === "ICON_GRID") {
    return `Create a modern bento grid icon infographic.

${baseRules}

${contentBlock}

STYLE:
- Pure white background #FFFFFF
- 3-column bento grid layout
- Rounded cards (12px radius, thin #F0F0F0 border)
- Orange circled numbers #FF6B35
- Flat bicolor icons (orange + black)
- ${formatHint}
- No photos, no 3D

LAYOUT:
Header: "${ext.title}" centered 32px bold. Category badge above.

GRID CELLS:
${ext.points.map((point, i) => `Cell ${i + 1}: Orange circled number ${i + 1}, bold title, text: "${point.slice(0, 40)}"`).join('\n')}${AVOID}`;
  }

  // ── COMPARISON / DATA_GRID ──
  if (selectedTemplate === "COMPARISON" || selectedTemplate === "DATA_GRID") {
    return `Create a dark luxury comparison table infographic.

${baseRules}

${contentBlock}

STYLE:
- Dark background #0D1117
- Neon accent colors: blue #00B4FF, green #00D4AA, orange #FF8B00
- White text, high contrast
- Rounded card columns with subtle glow effects
- ${formatHint}
- No photos, no realistic elements

LAYOUT:
Header: White bold title "${ext.title}" on dark background. Small colored badge.

${Math.min(n, 3)} COLUMNS side by side:
${ext.points.slice(0, 3).map((point, i) => {
  const colors = ['#00B4FF', '#00D4AA', '#FF8B00'];
  return `Column ${i + 1}:
- Header badge color: ${colors[i]}
- Dark card background #161B22
- Content: "${point}"`;
}).join('\n\n')}

Bottom: Gradient bar (blue → green → orange).

AVOID: light background, photos, blur, cluttered.`;
  }

  // ── NOTEBOOK ──
  if (selectedTemplate === "NOTEBOOK") {
    return `Generate a single image of a physical spiral notebook page with hand-drawn colorful notes.

${baseRules}

${contentBlock}

CRUCIAL STYLE INSTRUCTIONS:
- MEDIUM: Must look like a photograph of a REAL spiral notebook page lying on a desk
- TEXTURE: All text written by hand with colored marker pens and highlighters
- Lines slightly imperfect and wobbly — real handwriting feel
- NO digital fonts — everything handwritten or hand-printed
- Metallic spiral binding at top (18 silver coils, 3D realistic)
- Faint blue ruled lines on warm white paper #FFFEF8
- Red vertical margin line on the left
- ${formatHint}

LAYOUT (top to bottom):

━━━ SPIRAL BINDING (top edge) ━━━
18 realistic metallic spiral coils across full width.

━━━ TITLE (top 15%) ━━━
Title "${ext.title}" in large colorful handwriting.
Each word in a different marker color (green, blue, orange, red).
Bouncy, energetic lettering.

━━━ CONTENT (70%) ━━━
${ext.points.map((point, i) => {
  const colors = ['blue marker', 'orange marker', 'green marker', 'purple marker'];
  return `Item ${i + 1}:
- Hand-drawn ${colors[i % colors.length]} oval number badge: "${i + 1}"
- Handwritten text: "${point}"
- Yellow highlighter on key words
- Small hand-drawn doodle icon (star, arrow, heart) in margin`;
}).join('\n\n')}

━━━ BOTTOM (15%) ━━━
Yellow sticky note (tilted -3 degrees, drop shadow) with key insight.
Handwritten: "Follow @${userName || 'supenli.io'} for more | Repost ♻️"

QUALITY: Must look like a real photograph of handwritten study notes. Warm, personal, creative, dense with information.${AVOID}`;
  }

  // ── FUNNEL ──
  if (selectedTemplate === "FUNNEL") {
    return `Create a conversion funnel flow infographic.

${baseRules}

${contentBlock}

STYLE:
- Warm off-white background #FFFEF5
- Large trapezoid funnel shape
- Hand-drawn irregular outlines
- ${formatHint}
- No photos, no 3D

LAYOUT:
Top: Title "${ext.title}" very large bold centered, thick underline.

FUNNEL (wide top → narrow bottom, ${Math.min(n, 5)} stages):
${ext.points.slice(0, 5).map((point, i) => {
  const colors = ['Red #D93025', 'Orange #FF6B35', 'Gold #F59E0B', 'Green #188038', 'Blue #1A73E8'];
  return `Stage ${i + 1} (${colors[i]}): White label box — "${point}"`;
}).join('\n')}

Side: Two red curved arrows flanking funnel. Gold sparkle stars.${AVOID}`;
  }

  // ── CTA_VISUAL ──
  if (selectedTemplate === "CTA_VISUAL") {
    return `Create a clean promotional infographic.

${baseRules}

${contentBlock}

STYLE:
- Light gray background #F5F5F5 with dot grid
- Orange accent #FF6B35
- Clean structured layout, rounded corners 8px
- ${formatHint}
- No photos, no 3D

LAYOUT:
Top: Large text "${ext.title}" with yellow highlight on key word.
Center: Minimalist icon (orange).
${Math.min(n, 4)} floating rounded folder cards (blue #4A90D9) connected by dotted lines.
${ext.points.slice(0, 4).map((point, i) => `Folder ${i + 1}: "${point.slice(0, 30)}"`).join('\n')}${AVOID}`;
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

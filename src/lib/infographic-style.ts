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

interface Section {
  header: string;
  bullets: string[];
}

interface ExtractionResult {
  title: string;
  badge: string;
  subtitle: string;
  points: Point[];
  sections: Section[];
  stats: string[];
  quotes: string[];
  contentType: string;
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
  const lines = content.split(/\n+/).map(l => l.trim()).filter(l => l.length > 5);

  const title = (lines[0] || "Key Insights")
    .replace(/^#+\s*/, '')
    .replace(/^\*+\s*/, '')
    .replace(/^Post \d+:\s*/i, '')
    .slice(0, 65);
  const badge = detectBadge(content);
  const subtitle = lines[1]?.slice(0, 100) || "";

  // Extract sections with headers and bullets
  const sections: Section[] = [];
  let currentSection: Section = { header: '', bullets: [] };

  for (const line of lines.slice(1)) {
    const cleanLine = line.replace(/^#+\s*/, '').replace(/^\*\*(.+)\*\*$/, '$1').trim();
    const isHeader = (
      /^(STEP|PROMPT|SECTION|PART|PHASE|RULE|TIP|WAY|METHOD)\s*\d*/i.test(cleanLine) ||
      /^[A-Z][A-Z\s]{8,}$/.test(cleanLine) ||
      /^\d+[\.\)]\s+[A-Z]/.test(cleanLine) ||
      (cleanLine.endsWith(':') && cleanLine.length < 50) ||
      line.startsWith('##')
    ) && cleanLine.length < 65;

    if (isHeader && currentSection.header) {
      sections.push({ ...currentSection });
      currentSection = { header: line.replace(/^#+\s*/, ''), bullets: [] };
    } else if (isHeader) {
      currentSection.header = line.replace(/^#+\s*/, '');
    } else if (line.length > 15 && !/^https?:\/\//.test(line)) {
      const cleaned = line
        .replace(/^[\d]+[\.\)\/]\s*/, '')
        .replace(/^[▸→•\-\*☑✦↳]\s*/, '')
        .replace(/\*\*/g, '')
        .trim();
      if (cleaned.length > 10) {
        currentSection.bullets.push(cleaned);
      }
    }
  }
  if (currentSection.bullets.length > 0 || currentSection.header) {
    sections.push(currentSection);
  }

  // Points (flat list fallback)
  const points: Point[] = [];
  const flatLines = lines.slice(1)
    .filter(l => l.length > 20 && !/^https?:\/\//.test(l))
    .map(l => l.replace(/^[\d]+[\.\)\/]\s*/, '').replace(/^[▸→•\-\*☑✦↳]\s*/, '').replace(/\*\*/g, '').trim())
    .filter(l => l.length > 15)
    .slice(0, 8);

  for (const text of flatLines) {
    const colonSplit = text.split(/[:—–]/);
    if (colonSplit.length >= 2) {
      points.push({ title: colonSplit[0].trim().slice(0, 50), body: colonSplit.slice(1).join(":").trim().slice(0, 200) });
    } else {
      points.push({ title: text.slice(0, 45), body: text.slice(45, 200).trim() });
    }
  }

  // Stats
  const stats = (content.match(
    /\d+[\.,]?\d*\s*(%|€|\$|K|M|x|×|days?|months?|years?|hours?|followers?|impressions?|views?|steps?|ways?)/gi,
  ) || []).slice(0, 4);

  // Quotes
  const quotes = (content.match(/["«»"]([^"«»"]{10,80})["«»"]/g) || [])
    .map(q => q.replace(/["«»"]/g, '').trim())
    .slice(0, 2);

  const contentType = detectContentType(content);
  const proTip = generateProTip(content);

  return { title, badge, subtitle, points: points.slice(0, 8), sections, stats, quotes, contentType, proTip };
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

// ─── Claude HTML prompt builder (generates complete HTML/CSS — legacy) ───

export function buildHtmlInfographicPrompt(
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

// ─── Infographic Architect prompt builder ───

export function buildInfographicPrompt(
  content: string,
  platform: string,
): string {
  const ext = extractKeyPoints(content);
  const extD = extractForDallE(content);

  const hasSections = ext.sections.length >= 2 && ext.sections.some(s => s.bullets.length > 0);
  const mainSections = hasSections
    ? ext.sections.slice(0, 4)
    : extD.points.slice(0, 4).map((p) => ({
        header: p.split(' ').slice(0, 5).join(' ').toUpperCase(),
        bullets: [p],
      }));

  const STYLES = [
    { color: 'Blue', bg: '#EBF3FF', border: '#4A90D9', icon: '⚙️' },
    { color: 'Green', bg: '#EDFAF1', border: '#5BA85B', icon: '🎓' },
    { color: 'Red', bg: '#FFEEF0', border: '#E05555', icon: '🚀' },
    { color: 'Orange', bg: '#FFF4E5', border: '#F5A623', icon: '💡' },
  ];

  const sectionsHTML = mainSections.map((section, i) => {
    const s = STYLES[i % STYLES.length];
    const bullets = (section.bullets || [])
      .slice(0, 4)
      .map(b => `• ${b.split(' ').slice(0, 10).join(' ')}`)
      .join('\n');
    return `SECTION ${i + 1} — ${s.color.toUpperCase()} CARD:
Background: ${s.bg}
Border: 2px solid ${s.border}
Icon: ${s.icon}
Title (bold, color ${s.border}): "${section.header}"
Content:
${bullets}`;
  }).join('\n\n');

  const allPoints = [...extD.points, ...mainSections.flatMap(s => s.bullets || [])]
    .filter((v, i, a) => a.indexOf(v) === i).slice(0, 6);

  const flashCards = allPoints.map((p, i) => {
    const icons = ['💬', '📅', '📊', '🎯', '⚡', '✅'];
    const label = p.split(' ').slice(0, 3).join(' ').toUpperCase();
    const body = p.split(' ').slice(0, 8).join(' ');
    return `Flash Card ${i + 1}: Icon ${icons[i % icons.length]} | Label: "${label}" | Text: "${body}"`;
  }).join('\n');

  const footerText = extD.stats.length > 0
    ? `KEY STAT: ${extD.stats[0]} | Save this. Apply this. Share this.`
    : 'Save this framework. Apply it. Share it with your network.';

  const pl = platform?.toLowerCase() || "";
  const platformNote = pl.includes('linkedin') ? 'LinkedIn vertical (4:5) — professional audience'
    : pl.includes('facebook') ? 'Facebook square (1:1) — engaging feed'
    : 'Vertical social media format (4:5)';

  return `Generate a PREMIUM infographic HTML file.

PLATFORM: ${platformNote}
CANVAS: 1080px × 1350px (fixed, no scrolling)

━━━ FONTS ━━━
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Caveat:wght@700;800&display=swap');
Titles: Caveat (hand-drawn feel). Body: Nunito (clean, readable).

━━━ HEADER ZONE (top 15%) ━━━
Background: #FAFAFA
Main title in Caveat font, 48px, bold, centered:
"${ext.title.toUpperCase()}"
Orange underline stroke below title.

━━━ MAIN SECTIONS ZONE (middle 60%) ━━━
${mainSections.length} colored cards stacked vertically, full width.
Each card: rounded corners 12px, left border accent, emoji icon top-left.

${sectionsHTML}

Small → arrows between cards (in section color, centered).

━━━ KEY INSIGHTS ZONE (20%) ━━━
Section title: "KEY INSIGHTS" — Caveat font, 28px, centered, underlined.
Layout: 2-3 column CSS grid of flash cards.

${flashCards}

Each flash card: white bg #FFFFFF, border 2px solid #E5E5E5, border-radius 8px, padding 16px, box-shadow 2px 2px 0 rgba(0,0,0,0.08).

━━━ FOOTER (5%) ━━━
Background: linear-gradient(135deg, #1A1A1B, #333)
Text: "${footerText}"
Color: white, bold, centered, Nunito.
Small: "Follow @supenli.io for more | Repost ♻️"

${extD.stats.length > 0 ? `━━━ STATS ━━━\nHighlight prominently: ${extD.stats.join(', ')}` : ''}

━━━ GLOBAL STYLE ━━━
body: margin 0, padding 40px, overflow hidden, background #FAFAFA.
All text: real human words, ZERO code as content.
Font sizes: Title 48px, Section titles 24px, Body 15px, Bullets 14px.
Line-height: 1.6. Padding on cards: min 20px.
High contrast: dark text #1A1A1B on light backgrounds.
All emojis: real Unicode characters.

OUTPUT: Complete self-contained HTML file. Start with <!DOCTYPE html>.`;
}

// Keep old name as alias for backward compatibility
export const buildDallEPrompt = buildInfographicPrompt;

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

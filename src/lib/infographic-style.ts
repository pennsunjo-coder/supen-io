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

FOOTER (bottom 7%):
- Separator: 0.5px #cccccc
- Text: "Follow @creator for more | Repost ↻" — Nunito Bold 20-22px
- Creator name: blue #2B4DAF bold underlined`;

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

FOOTER: "Follow @creator for more | Repost ↻" — Nunito Bold, #333333`;

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

FOOTER: "Follow @creator for more | Repost ↻" — Nunito Bold`;

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

FOOTER: "Follow @creator for more | Repost ↻"`;

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

FOOTER:
- Dark band #1a1a1a, height 48-56px
- Text: "Follow @creator for more" white Nunito Bold 16-18px
- Creator: light blue #93c5fd. "Repost ↻": light green #86efac`;
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
8. Footer ALWAYS: "Follow @supen for more | Repost ↺" Nunito Bold centered
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

CONTENU À INTÉGRER :
Titre : ${extraction.title}
Badge : ${extraction.badge}
${extraction.points.map((p, i) => `P${i+1}_TITLE: ${p.title}\nP${i+1}_BODY: ${p.body}`).join('\n')}
Pro tip : ${extraction.proTip}
Footer : Created with Supen.io

${customInstructions ? `Instructions supplémentaires : ${customInstructions}` : ""}

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



// ─── Gemini Image prompt builder v4.0 — pixel-precise forensic specs ───

function getForensicTemplateSpec(
  templateId: string,
  extraction: ExtractionResult,
  dims: { width: number; height: number },
): string {
  const W = dims.width;
  const H = dims.height;
  const pointCount = extraction.points.length;

  switch (templateId) {

    case "WHITEBOARD":
    case "UI_CARDS":
    case "CHEAT_SHEET":
    case "AWA_MASTERCLASS":
    case "DARK_TECH":
      return `
TEMPLATE: WHITEBOARD STUDY NOTES
(Pixel-perfect reference: "How to Master Claude in 2 Minutes" by Awa K Penn)

Canvas: ${W}×${H}px

PHYSICAL WHITEBOARD SURFACE:
- Background color: #f8f9f7 (measured — cool off-white, NOT pure white)
- Paper grain texture: random noise dots at 2-3% opacity
  Grain: ~1px scattered dots in #c0c0c0 and #d8d8d8
- 4 corner clips: dark gray metallic rectangles
  Size: 10px wide × 16px tall
  Color: #555555 (dark gray metal)
  Position: 6px inset from each corner
  Appearance: slight 3D bevel effect, like real metal clips
- Canvas border: 0.5px solid #e0e0e0 around entire perimeter

TITLE (top 8% = y:0 to y:${Math.round(H * 0.08)}):
- "[${extraction.title}]" with LITERAL square [ ] brackets
- Font rendering: EXTREMELY THICK marker-pen strokes
  The letter strokes must be approximately 8-10% of the character height
  Example: for a 48px character, each stroke is ~4-5px thick
  This creates the distinctive "permanent marker" look
  Slight irregularity in stroke weight — not perfectly uniform
- Size: 44-48px, color #111111, centered horizontally
- Below title: red underline spanning 80% of canvas width
  Color: #C0392B, thickness 2.5px, slightly wavy (hand-drawn feel)

YELLOW SECTION BANDS (mandatory dividers):
These are full-width bright yellow background strips that act as section dividers.
- Background: #FFEF5A (bright Stabilo-marker yellow)
- Height: 36-42px per band
- Text: black #111111, heavy bold ~20px, ALL CAPS, centered
- Include 3-4 of these bands distributed across the layout:
  Band 1 (at ~12%): "${extraction.points[0]?.title?.toUpperCase() || "KEY CONCEPTS"}"
  Band 2 (at ~40%): "FEATURES" or "KEY DETAILS"
  Band 3 (at ~65%): "${extraction.points[Math.min(4, pointCount - 1)]?.title?.toUpperCase() || "HOW TO APPLY"}"
  Band 4 (at ~85%): "LEARN FROM ${extraction.title.split(" ").slice(-1)[0] || "THIS"}"
- These bands look like someone drew a highlighter across the entire width

CONTENT ZONE (8% to 94% = y:${Math.round(H * 0.08)} to y:${Math.round(H * 0.94)}):
Organize into 10-15 content blocks. Use 2 columns where appropriate.
Left/right padding: 36px. Gap between columns: 24px.

For EACH of the ${Math.max(pointCount, 7)} sections:
- Colored section header: heavy bold 18-20px
  Color cycling: #C0392B → #2563EB → #4A8B35 → #F5922A → repeat
- 2px colored underline directly below header (same color as header)
- ★ orange star #F5922A icon before important section headers
- 2-4 bullet points with colored • dots (matching section color)
- Body text: handwritten Caveat-style, 15-17px, #111111 to #333333
  Slightly irregular letter spacing to look hand-written
- Per section: 1 KEY TERM gets a flat yellow #FFEF5A highlight behind it
- Numbers in hand-drawn oval badges: 2px stroke, slightly irregular oval shape
  NOT solid filled circles — transparent center with stroke outline

DECORATIVE MUST-HAVES:
- ✓ Red checkmarks: #C0392B, thick 2.5px stroke, hand-drawn style
- ★ Stars: #F5922A, drawn with irregular strokes, ~14px
- → Arrows: hand-drawn with slight curve, connecting related items
- Framework acronym badges: colored letter in small rounded square
  Example: [R] [T] [C] [R] [O] [S] — each letter in a colored box
  Box: 24×24px, rounded 4px, accent color background, white letter

FOOTER (bottom 6% = y:${Math.round(H * 0.94)} to y:${H}):
- Thin separator line: 0.5px #cccccc
- "Follow Awa K Penn for more amazing AI content | Repost ↺"
- Font: handwritten bold 18px
- "Awa K Penn": blue #2563EB, bold, underlined
- ↺ symbol: recycling/repost icon

DENSITY TARGET: Content must reach y:${Math.round(H * 0.94)} before footer.
Zero empty white space. If content ends before y:${Math.round(H * 0.80)}, ADD MORE SECTIONS.
`;

    case "NOTEBOOK":
      return `
TEMPLATE: SPIRAL NOTEBOOK
(Pixel-perfect reference: "9 Free Courses for Building AI Agents" by Awa K Penn)

Canvas: ${W}×${H}px

SPIRAL BINDING (y:0 to y:${Math.round(H * 0.06)} — top 6%):
- Exactly 20-22 metallic oval coils across full width
- Each coil: 36px wide × 26px tall, oval shape
- Coil color: #a39581 (aged silver-gray metal)
- 3D shading on EACH coil:
  Top-left highlight: #c8c0b0 (lighter, catching light)
  Bottom-right shadow: #7a7060 (darker, in shadow)
  Creates realistic metallic 3D cylindrical look
- Coils OVERLAP the paper edge: the bottom half of each coil
  appears to go BEHIND the paper while the top half is IN FRONT
- Even spacing between coils: ~${Math.round(W / 22)}px center-to-center
- The paper edge is visible between coils

PAGE TEXTURE (below spiral, y:${Math.round(H * 0.06)} to y:${H}):
- Background: #fffef8 (warm cream — like real notebook paper)
- Horizontal ruled lines across full width:
  Color: #dde8f0 (light blue)
  Weight: 0.5px
  Spacing: every 34px
  These must be visible across the ENTIRE page
- Red vertical margin line:
  Color: #E63946
  Weight: 1.5px
  Position: x=72px from left edge, full height
- Paper grain: subtle noise at 4% opacity

MULTI-COLOR TITLE (y:${Math.round(H * 0.06)} to y:${Math.round(H * 0.22)} — 16%):
EACH major word gets its OWN COLOR — this is the signature notebook style:
Title: "${extraction.title}"
Apply these color rules to the words:
- Any number/quantity word: GREEN #16A34A, extra large ~56px, Caveat Bold
- Key adjectives (Free, Best, Top, etc.): RED #C0392B + thick underline
- Main nouns (Courses, Tools, etc.): dark BLUE #1a3d7c, bold
- Tech terms (AI, Code, etc.): RED #C0392B text on YELLOW #FFEF5A background
- Font: handwritten bold marker-pen style (Caveat Bold 700)
  Stroke irregularity: slight wobble to look hand-drawn
  Size varies: important words 52-56px, connectors 36-40px
- After last word: draw a curved red arrow ↓ (hand-drawn, #C0392B)

CONTENT TABLE (y:${Math.round(H * 0.22)} to y:${Math.round(H * 0.85)} — 63%):
Data table with 5 columns:
- Header row: handwritten bold column labels, slightly larger
- Column 1 "#": hand-drawn oval number badges (01, 02, 03...)
  Oval: ~28×20px, 2px stroke #333333, slightly irregular shape
  Number: red #C0392B bold inside oval
- Column 2 "Provider": bold sans-serif, blue #2563EB
- Column 3 "Title/Topic": handwritten Caveat, dark #111111
- Column 4 "Detail/Duration": green #4A8B35
- Column 5 "Source/Author": alternating red/blue/green
- Row separator: thin lines matching ruled lines
- Alternating backgrounds: transparent / very light #f9f9f7
- Fill with ${Math.max(pointCount, 7)} rows of content

FOOTER (y:${Math.round(H * 0.85)} to y:${H} — bottom 15%):
- Two large curved decorative arrows:
  ↙ on left side, ↗ on right side
  Color: #C0392B or #2563EB, stroke 3px, hand-drawn curve
- "Follow Awa K Penn for more amazing AI content | Repost"
  Font: Caveat Bold, 24-28px
  "Awa K Penn": blue #2563EB, bold, underlined
  "Repost": with ↺ recycling symbol

DENSITY: Every ruled line on the page should have content near it.
No blank ruled lines at the bottom of the page.
`;

    case "COMPARISON":
      return `
TEMPLATE: 3-COLUMN COMPARISON
(Pixel-perfect reference: "Claude Opus 4.6 vs ChatGPT 5.4 vs Gemini 3.1 Pro")

Canvas: ${W}×${H}px

BACKGROUND: #f5f5f0 with paper grain texture 3% opacity
Subtle shadow/frame edge giving the impression of a photographed poster

TITLE (y:0 to y:${Math.round(H * 0.08)} — top 8%):
- "[${extraction.title}]" — with LITERAL square brackets
- Each compared item in its OWN color:
  Item 1: blue #2563EB, bold, underlined
  Item 2: green #4A8B35, bold, underlined
  Item 3: red #C0392B or orange #F5922A, bold, underlined
- "vs" between items: black #111111, regular weight, not underlined
- Font: heavy bold hand-drawn sans-serif, 28-32px
- Separator line below title: 1px #cccccc, full width

3-COLUMN LAYOUT (y:${Math.round(H * 0.08)} to y:${Math.round(H * 0.93)} — 85%):
Three equal columns, each ~${Math.round((W - 48) / 3)}px wide
Left padding: 16px, right padding: 16px, column gap: 8px
Column separator: vertical line 0.5px #cccccc between columns

Product/brand icon at top of each column (if applicable)

EACH COLUMN MUST HAVE ALL 6 SECTIONS (mandatory — measured from reference):

1. "Description:" — colored bold label 14px + underline
   Body: Caveat 12-13px, 3-5 lines of text

2. "When to use it:" — colored bold label 14px + underline
   Body: bullet points with → arrows, Caveat 12px
   3-4 bullet points minimum

3. "Use cases:" — colored bold label 14px + underline
   Body: bullet points, Caveat 12px
   3-4 use cases minimum

4. "Strengths:" — GREEN #4A8B35 bold label + underline
   Body: bullet points with ✓ checkmarks
   Key metrics: yellow #FFEF5A highlight (e.g., "128K context window")
   3-4 strengths minimum

5. "Weaknesses:" — RED #C0392B bold label + underline
   Body: bullet points with • red dots
   2-3 weaknesses minimum

6. "Pro Tip:" — label on yellow #FFEF5A background strip
   Body: Caveat italic-style 12px, 2-3 lines

Column accent colors:
- Column 1: blue #2563EB for all section labels
- Column 2: green #4A8B35 for all section labels
- Column 3: orange #F5922A for all section labels

FOOTER (bottom 5%):
- "Follow Awa K Penn for more amazing AI content | Repost ↺"
- "Awa K Penn" in blue #2563EB underlined

DENSITY: EVERY column packed from top to bottom. All 6 sections in EVERY column.
Each column should contain 120-180 words. Total: 400-550 words across all columns.
`;

    case "FUNNEL":
      return `
TEMPLATE: FUNNEL PROCESS FLOW
(Pixel-perfect reference: "The Personal Branding Funnel (2026)" by Awa K Penn)

Canvas: ${W}×${H}px

BACKGROUND: #f5f5f0 off-white with paper grain 3% opacity
The whole image must look like a hand-drawn whiteboard sketch

TITLE (y:0 to y:${Math.round(H * 0.12)} — top 12%):
- "${extraction.title}"
- Font: EXTREMELY thick hand-drawn marker-pen, 52-60px
  Stroke width ~10% of character height — very chunky
- Black #111111, centered
- Year in parentheses if present: e.g. "(2026)"

FUNNEL SHAPE (center-left, y:${Math.round(H * 0.14)} to y:${Math.round(H * 0.72)}):
- Position: centered horizontally or slightly left (leaving room for character)
- Width: top edge ~${Math.round(W * 0.55)}px, bottom edge ~${Math.round(W * 0.25)}px
- Shape: trapezoid narrowing from top to bottom
- Outline: hand-drawn IRREGULAR strokes — slightly wobbly, like freehand
  Stroke: black #333333, 2.5px
- Fill: warm cream/tan #f5e6c8, subtle gradient darker toward bottom
- Divided into ${Math.min(pointCount, 4)} horizontal sections by thin internal lines

SECTION LABELS (overlapping funnel sections):
${extraction.points.slice(0, 4).map((p, i) => `
Section ${i + 1}:
- White rectangle label: thin 1.5px red border #C0392B, white fill, slight shadow
- Text: "${i + 1}. ${p.title.toUpperCase()}" — heavy bold ALL CAPS, 16px
- Below label: 2-3 items with red ✓ checkmarks (#C0392B)
  Checkmarks: thick 2.5px hand-drawn ✓
  Text: handwritten Caveat 14px, #333333
  Items: ${p.body.split(/[,;.]/).slice(0, 3).map(s => s.trim()).filter(Boolean).join(" / ") || "Show up consistently / Stand out / Create curiosity"}`).join("")}

CHARACTER (right side, ~25% of canvas width):
- ESSENTIAL ELEMENT: Cartoon person in business casual attire
  - Blue collared shirt, gray/brown vest or jacket, glasses
  - Standing upright, pointing at the funnel with one hand
  - Friendly confident smile
  - Art style: bold black outlines 2-3px, flat color fills
  - Simple cartoon proportions (not realistic)
- Position: right third of canvas, vertically centered with funnel

DECORATIONS:
- 6-8 gold sparkle stars scattered around funnel:
  ✦ solid stars: #F5C518, 10-16px
  ★ outline stars: #E8B800, 8-14px
  Random positions, varying sizes
- Two large curved RED arrows flanking funnel:
  Left side: ↙ curving downward, #C0392B, 3-4px stroke
  Right side: ↘ curving downward, #C0392B, 3-4px stroke
  Hand-drawn style with slight irregularity

CTA BOX (y:${Math.round(H * 0.78)} to y:${Math.round(H * 0.88)}):
- Hand-drawn rectangle: slightly imperfect strokes, 1.5px black
- "Save this →" in bold + "${extraction.proTip.slice(0, 50)}..."
- Arrow: ← hand-drawn pointing to box

FOOTER (bottom 8%): discreet gray text, 12px, centered
`;

    case "DATA_GRID":
    case "STATS_IMPACT":
    case "AWA_BREAKING":
      return `
TEMPLATE: DENSE DATA REFERENCE POSTER
(Pixel-perfect reference: "The Complete Guide to Human Productivity Systems")

Canvas: ${W}×${H}px

BACKGROUND: #f5f5f0 with paper grain 2-3% opacity

TITLE (y:0 to y:${Math.round(H * 0.08)}):
- "${extraction.title}" — very heavy black ALL CAPS sans-serif, 40-48px
- Centered, color #111111
- Thin subtitle below: 14px #666666

SECTION 1 — FRAMEWORK MODEL (y:${Math.round(H * 0.08)} to y:${Math.round(H * 0.25)}):
- "SECTION 1 — THE CORE FRAMEWORK" header, 16px bold, colored underline
- Row of 3-4 colored rounded boxes (120×80px each):
  Colors: #4A8B35, #2563EB, #F5922A, #0D9488
  White bold text: category name, 14px
  Below: 2-line description, 11px, white

SECTION 2 — CONCEPT GRID (y:${Math.round(H * 0.25)} to y:${Math.round(H * 0.48)}):
- "SECTION 2 — KEY CONCEPTS" header with colored underline
- 2×3 grid of colored rounded boxes:
  Each box: 45% width × auto height, rounded 12px
  Pastel tinted backgrounds matching accent colors
  Bold title 14px + body 12px inside each box

SECTION 3 — APPLICATION TABLE (y:${Math.round(H * 0.48)} to y:${Math.round(H * 0.68)}):
- "SECTION 3 — APPLICATION" header
- Table: 3-4 rows with colored left borders
  Each row: concept title + description, 12px

SECTION 4 — COMPARISON TABLE (y:${Math.round(H * 0.68)} to y:${Math.round(H * 0.92)}):
- Full data table: 4 rows × 4 columns
- Header: colored backgrounds #C0392B, #2563EB, #4A8B35, #F5922A
- Alternating row backgrounds: #ffffff / #f9fafb
- Dense text in every cell

CONTENT:
${extraction.points.map((p, i) => `${i + 1}. ${p.title}: ${p.body}`).join("\n")}

FOOTER (bottom 5%): "Follow Awa K Penn for more amazing AI content"

DENSITY: 95%+ canvas fill. This is a reference poster — every cm² has content.
`;

    default: // AWA_CLASSIC
      return `
TEMPLATE: AWA CLASSIC FRAMED GUIDE
(Pixel-perfect reference: dense framed reference poster by Awa K Penn)

Canvas: ${W}×${H}px

OUTER FRAME:
- 28px thick border around entire canvas
- Color: dark brown #3d2b1a
- Subtle diagonal wood grain lines at 15% opacity
- Thin cream inset line: #f0e8d8, 2px, between frame and content

INNER CONTENT (background #FFFFF5 warm cream):

TITLE (top 15% of inner area):
- Dark brown pill badge: #3d2b1a bg, white text, ALL CAPS, 12px
- Title: "${extraction.title}" — heavy bold 42px, #111111, centered
- 2px brown underline #3d2b1a below title

7 ITEMS (15% to 88% — fills completely):
${extraction.points.slice(0, 7).map((p, i) => {
  const colors = ["#C0392B", "#2563EB", "#2E7D32", "#D4A017", "#8B5CF6", "#C0392B", "#0D9488"];
  return `Item ${i + 1} (${colors[i]}):
- Rounded square badge: ${colors[i]} bg, white "${i + 1}", 36×36px, rounded 8px
- Simple line-art doodle icon next to badge (NOT emoji)
  Draw: simple ink sketch ~24×24px matching topic
- Title: "${p.title}" — heavy bold 20px, #111111
- Body: "${p.body}" — handwritten Caveat 16px, #444444
- Left border: 1px rgba(61,43,26,0.15)`;
}).join("\n")}

PRO TIP:
- Dashed border 1.5px #C0392B, background #fffdf0
- "★ Pro Tip: ${extraction.proTip}"

FOOTER (bottom 8%):
- Border-top: 2px solid #3d2b1a
- "Follow for more | Repost ↺" — brown #3d2b1a, bold 16px
`;
  }
}

// ─── Retry/correction prompt for second Gemini attempts ───

export function buildGeminiRetryPrompt(
  originalPrompt: string,
  attemptNumber: number,
): string {
  return `${originalPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CORRECTION INSTRUCTIONS (attempt ${attemptNumber})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The previous generation likely had these common issues. Fix ALL of them:

CORRECTION 1 — FONT WEIGHT:
The title must be MUCH BOLDER. The letter strokes should be so thick
they appear almost to merge — like a Sharpie permanent marker.
Each stroke should be 8-10% of the character height.
If the title looks like a normal bold font, it is WRONG.

CORRECTION 2 — DENSITY:
The image likely has 30-50% empty white space at the bottom.
This is WRONG. Add MORE content to fill the canvas to 90%+.
Add more bullet points, more sections, more details, more text.
Content must reach within 6% of the bottom edge.

CORRECTION 3 — NO EMOJIS:
If any emojis (🤖 💡 📱 etc.) appeared, REMOVE THEM ALL.
Replace with simple hand-drawn ink sketch doodles, or nothing.

CORRECTION 4 — YELLOW HIGHLIGHTS:
Add yellow #FFEF5A highlights:
- 3-5 key terms in body text (flat background behind the word)
- 2-3 full-width yellow section bands across the layout

CORRECTION 5 — PHYSICAL ELEMENTS:
Ensure these are clearly visible:
- Corner clips (whiteboard) or spiral coils (notebook)
- Paper grain texture on the background
- Colored underlines under EVERY section header
- Hand-drawn oval number badges (stroke, not filled)

Apply all corrections and generate the COMPLETE image.`;
}

export function buildGeminiImagePrompt(
  content: string,
  platform: string,
  customPrompt?: string,
  forcedTemplate?: string,
): string {
  const extraction = extractKeyPoints(content);
  const analysis = analyzeContent(content, platform);
  const dims = FORMAT_DIMS[analysis.format];
  const selection = selectBestTemplate(content, platform, forcedTemplate);
  const templateId = selection.templateId;

  return `Generate an image that is VISUALLY IDENTICAL to the viral educational
infographics created by "Awa K Penn" on LinkedIn and Instagram.
I will describe every visual element with pixel-perfect precision.

Image dimensions: ${dims.width}×${dims.height}px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FONT RENDERING (the most distinctive visual feature)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TITLE FONT — like a thick permanent marker:
- Stroke width: approximately 8-12% of each character's height
  For a 48px tall letter, each stroke is 4-6px wide
- Slight irregularity in weight: not perfectly uniform, like real handwriting
- Very bold, very chunky — the strokes should almost touch each other
- Think of Nunito ExtraBold 900 or someone writing with a thick Sharpie
- Color: #111111 near-black
- Size: 44-56px depending on title length
- Letter-spacing: normal to slightly tight (-0.5px)
- Line-height: 1.1 (tight)

BODY TEXT — like a thin Sharpie marker:
- Handwritten appearance: slightly variable stroke width
- Letter forms slightly irregular, not geometrically perfect
- Like the Caveat font at 15-18px, but drawn by hand
- Color: #111111 to #333333
- Line-height: 1.35-1.45
- NEVER clean/digital looking — must have handwritten character

SECTION HEADERS — like a medium marker in color:
- Same heavy style as title but smaller: 18-22px
- Each header in a cycling accent color: #C0392B → #2563EB → #4A8B35 → #F5922A
- EVERY header has a 2-2.5px colored underline directly below it
- Underlines are slightly wavy/imperfect (hand-drawn feel)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXACT COLOR PALETTE (measured from reference images)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Background: #f8f9f7 (measured — cool off-white, NOT #ffffff)
Red: #C0392B (warm brownish red — headers, checkmarks, underlines)
Blue: #2563EB (confident medium blue — headers, names, links)
Green: #4A8B35 (natural forest green — headers, positive items)
Orange: #F5922A (warm tangerine — stars, tertiary accent)
Dark brown: #3d2b1a (frame borders on AWA_CLASSIC only)
Near-black: #111111 (primary text)
Cream: #fffef8 (notebook paper background)

YELLOW #FFEF5A — used EXACTLY two ways:
1. INLINE WORD HIGHLIGHTS: flat background behind 3-5 key terms per page
   Looks exactly like someone used a Stabilo Boss highlighter pen
   No rounded corners — flat rectangular background behind the word
   Height matches the text line height

2. FULL-WIDTH SECTION BANDS: yellow #FFEF5A background strips spanning
   the entire canvas width, containing bold black centered section titles
   Height: 36-42px per band
   Used as visual section dividers — like highlighting a whole line
   Include 2-4 of these bands per infographic

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT DENSITY — THE #1 MOST CRITICAL RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The canvas MUST be 85-95% filled with text and visual elements.

For a ${dims.width}×${dims.height}px canvas:
- Content must start at y ≈ ${Math.round(dims.height * 0.02)}px (near top edge)
- Content must reach y ≈ ${Math.round(dims.height * 0.94)}px before footer
- Footer occupies y ≈ ${Math.round(dims.height * 0.94)} to ${dims.height}px
- ZERO empty white space below the content

Achieve this density with:
- Minimum 7 distinct content sections (not 4 or 5)
- 2-4 bullet points per section
- Yellow highlight bands as section dividers
- Framework boxes, tables, or grids in the layout
- Sub-bullets and nested lists where appropriate
- Dense footer with decorative arrows
- Total readable text: 250-400 words

If the bottom 20% of the canvas is empty white space, the image FAILED.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HAND-DRAWN DECORATIVE ELEMENTS (never use emojis)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ABSOLUTELY NO EMOJI CHARACTERS (🤖 💡 🎯 📱 etc.)
Instead draw these as simple ink sketches with 1.5-2.5px strokes:

- Checkmarks ✓: thick hand-drawn check in #C0392B, 2.5px stroke
- Stars ★: 5-point star with irregular strokes, #F5922A, ~14px
- Arrows →: hand-drawn angled arrows with slight curve
- Number badges: slightly oval outline (NOT perfect circle)
  2px stroke #333333, transparent center, number inside
  Size: ~28×22px, hand-drawn irregularity
- Bullet dots •: solid colored circles 4-5px, matching section color
- Underlines: slightly wavy, not perfectly straight, 2-2.5px
- Brackets [ ]: drawn around title text in whiteboard templates

For icons (if needed): simple line-art doodles, like quick pen sketches
- Lightbulb: simple outline with radiating lines
- Target/bullseye: 2 concentric circles with center dot
- Brain: simplified wavy outline
- Arrow/pointer: simple geometric arrow
ALL drawn with 2px black strokes, minimal detail

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEMPLATE SPECIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${getForensicTemplateSpec(templateId, extraction, dims)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT TO RENDER IN THE INFOGRAPHIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Title: "${extraction.title}"
Category badge: "${extraction.badge}"

${extraction.points.map((p, i) =>
  `Section ${i + 1}: "${p.title}"
  → ${p.body}`
).join("\n\n")}

★ Pro tip: "${extraction.proTip}"

Footer: "Follow Awa K Penn for more amazing AI content | Repost ↺"

${customPrompt ? `\nUser instruction: ${customPrompt}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFERENCE IMAGES THIS SHOULD MATCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The exact visual target is infographics like:
- "How to Master Claude in 2 Minutes" (whiteboard with clips, dense sections)
- "9 Free Courses for Building AI Agents" (spiral notebook with data table)
- "The Personal Branding Funnel 2026" (funnel with character illustration)
- "Claude Opus 4.6 vs ChatGPT 5.4 vs Gemini 3.1 Pro" (3-column comparison)
These have been viral on LinkedIn/Instagram with 100K+ engagements.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL QUALITY GATE — VERIFY EVERY ITEM BEFORE OUTPUTTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[✓] Title strokes are EXTREMELY thick (8-10% of char height)
[✓] Body text looks handwritten with slight irregularity
[✓] Background is #f8f9f7 with paper grain — NOT pure white
[✓] 3-5 inline yellow #FFEF5A word highlights present
[✓] 2-4 full-width yellow section bands present (whiteboard/notebook)
[✓] Red #C0392B + Blue #2563EB + Green #4A8B35 accent colors used
[✓] EVERY section header has a colored underline below it
[✓] Numbers in hand-drawn oval badges (stroke style, not filled)
[✓] Content fills 85-95% of canvas — ZERO empty space at bottom
[✓] At least 7 distinct sections with 2+ bullets each
[✓] Physical elements present (clips OR spiral coils OR frame)
[✓] Footer with "Follow... | Repost ↺" at very bottom
[✓] NO emojis — only hand-drawn doodle icons
[✓] Looks like hand-crafted study notes, NOT corporate design

FINAL INSTRUCTIONS:
1. The image must look like it was created by a human designer, not AI
2. Every text element must be fully readable — no blurry or cut-off text
3. No text should be cut off at the edges of the canvas
4. The overall composition must feel balanced and intentional
5. Use the exact content provided — do not invent or summarize differently
6. The style must match EXACTLY the Awa K Penn references described above

ANTI-GENERIC CHECKLIST (fix before outputting):
- Is the title font extremely bold (weight 900+)? If not → make it bolder
- Does the background have a paper texture? If not → add subtle grain
- Are there at least 3 yellow highlights on key terms? If not → add them
- Is the canvas 80%+ filled with content? If not → add more detail

Generate the image now.`;
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

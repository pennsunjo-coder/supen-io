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

  const words = content.toLowerCase().split(/\s+/);
  const wordCount = words.length;

  const p = {
    hasNumberedList: /(\d+\.|①|②|③|étape|step|premier|first)/i.test(content),
    hasStats: /\d+[%km€$]|\d{4,}/i.test(content),
    hasComparison: /\bvs\b|versus|contre|avant.*après|before.*after|plutôt|better than|bad.*good|good.*great|niveau|level|compare/i.test(content),
    hasHowTo: /comment|how to|étape|step|guide|tutorial/i.test(content),
    hasTips: /conseil|tip|astuce|hack|trick|secret/i.test(content),
    isTech: /\bai\b|tech|digital|code|app|software|chatgpt|claude|ia/i.test(content),
    isBusiness: /business|argent|money|revenue|vente|sale|entrepreneur/i.test(content),
    isMarketing: /marketing|contenu|content|viral|audience|engagement/i.test(content),
  };

  const hasBreaking = /breaking|urgent|stop|dead|goodbye|end of|rip\b|game.?over|replaced/i.test(content);
  const hasMasterclass = /master|guide complet|cheat.?sheet|tout savoir|everything|complete guide/i.test(content);
  const hasFunnel = /funnel|entonnoir|processus|parcours|roadmap|pipeline|conversion|tunnel|étapes? du/i.test(content);
  const hasDataGrid = /framework|modèle|méthode|tableau|matrix|matrice|grille|ressources?|glossaire|outils?\s|comparison detailed/i.test(content);
  const has3Tier = /bad.*good.*great|good.*better.*best|niveau\s*1.*niveau\s*2|level\s*1.*level\s*2|débutant.*avancé|beginner.*advanced|bronze.*silver.*gold/i.test(content);

  let templateId: string;
  let reason: string;

  if (hasBreaking && wordCount < 200) {
    templateId = "AWA_BREAKING";
    reason = "Contenu urgent — mise en page choc";
  } else if (p.hasStats && wordCount < 200) {
    templateId = "STATS_IMPACT";
    reason = "Statistiques détectées — visuel chiffres clés";
  } else if (hasFunnel) {
    templateId = "FUNNEL";
    reason = "Processus/parcours — entonnoir progressif";
  } else if (has3Tier) {
    templateId = "UI_CARDS";
    reason = "Comparaison à 3 niveaux — cartes UI claires";
  } else if (p.hasComparison) {
    templateId = "UI_CARDS";
    reason = "Comparaison/avant-après — cartes UI claires";
  } else if (hasDataGrid) {
    templateId = "DATA_GRID";
    reason = "Framework/ressources — tableau structuré";
  } else if (hasMasterclass && wordCount > 200) {
    templateId = "AWA_MASTERCLASS";
    reason = "Masterclass/guide — apprentissage structuré";
  } else if (p.hasHowTo || p.hasTips || p.hasNumberedList) {
    templateId = "WHITEBOARD";
    reason = "Conseils/étapes — style tableau dessiné";
  } else if (p.isTech && !p.isMarketing) {
    templateId = "DARK_TECH";
    reason = "Contenu tech — glassmorphism sombre";
  } else if (wordCount > 300) {
    templateId = "CHEAT_SHEET";
    reason = "Contenu long — grille cheat sheet";
  } else {
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

// ─── Gemini prompt builder ───

interface TemplateStyleGuide {
  vibe: string;
  background: string;
  layout: string;
  typography: string;
  colors: string;
  structure: string;
}

const TEMPLATE_STYLE_GUIDES: Record<string, TemplateStyleGuide> = {
  UI_CARDS: {
    vibe: "Clean 3-tier comparison. Awa K Penn study notes aesthetic. Approachable, hand-crafted feel.",
    background: "#f8f9f7 off-white. NO heavy borders, NO frames.",
    layout: "Centered Nunito 900 title. 3 stacked cards (Avoid/Better/Best). Each card: border-left 5px colored accent + icon + Nunito title + Caveat body. Footer with Repost CTA.",
    typography: "Nunito 900 for title 48-52px. Nunito 800 for card titles 26px. Caveat 400 for body 19px. Yellow #E8F044 inline highlights.",
    colors: "Card 1 red: bg #fff5f5, border #c0392b. Card 2 orange: bg #fffbf0, border #F5922A. Card 3 green: bg #f2faf0, border #4A8B35. Badge: #111111. Highlights: #E8F044.",
    structure: "Strict 3-tier comparison. Card 1 = bad (red ✗). Card 2 = okay (orange ~). Card 3 = best (green ✓). 25-30 words per card body MAX.",
  },
  WHITEBOARD: {
    vibe: "Hand-crafted whiteboard bulletin. Paper clips at corners. LinkedIn educator energy. Study notes aesthetic.",
    background: "#f8f9f7 with paper grain 2-3% opacity. 1px #dddddd border. Corner clips #aaaaaa.",
    layout: "Top: Nunito 900 title + #c0392b underline. 7 numbered sections with colored left borders alternating #c0392b/#2B4DAF/#4A8B35. Circled numbers. Footer: Nunito Bold.",
    typography: "Nunito 900 titles 48px. Section headers Nunito 800 22px, colored. Body Caveat 400 18-20px #111111. Colored underlines under each header.",
    colors: "Borders: #c0392b, #2B4DAF, #4A8B35 rotating. Highlights: #E8F044 inline. Number circles: 2px #1a1a1a border. Gray separator: #e0e0e0.",
    structure: "7 bullet list items. Each: circled number + colored Nunito header + Caveat body. ONE keyword per section gets #E8F044 highlight.",
  },
  FUNNEL: {
    vibe: "Process flow funnel. Progressive narrowing stages. Warm ivory background. Hand-drawn energy.",
    background: "#fffef5 warm ivory. No heavy border.",
    layout: "Nunito 900 title centered. 5 progressively narrower stages (100%→46%). Number circles white on colored bg. ▼ arrows between stages. Footer CTA.",
    typography: "Nunito 900 title 48-56px. Stage titles Nunito 800 22px. Body Caveat 400 16-18px. Colored underlines per stage.",
    colors: "Stage 1: #c0392b. Stage 2: #F5922A. Stage 3: #EAB308. Stage 4: #4A8B35. Stage 5: #2B4DAF. Highlights: #E8F044. Arrows: #c0392b.",
    structure: "5 sequential stages filtering down. Stage 1 = widest (entry). Stage 5 = narrowest (goal). 2-4 word title + 12-18 word body per stage.",
  },
  DATA_GRID: {
    vibe: "Framework reference table. Knowledge worker study card. Clean structured data.",
    background: "#f8f9f7 off-white. No heavy borders.",
    layout: "Nunito 900 title + #E8F044 keyword highlight. 4-row × 3-column table (Concept/Description/Best For). Colored dots per row. Key Takeaway box with #c0392b border-left.",
    typography: "Nunito 900 title 44px. Header Nunito 900 13px uppercase. Cell names Nunito 800 16px. Descriptions Caveat 400 18px. Use cases Nunito 700 14px #4A8B35.",
    colors: "Header columns: #c0392b/#2B4DAF/#4A8B35. Row dots: #c0392b/#F5922A/#4A8B35/#2B4DAF. Highlights: #E8F044. Tip: #c0392b border, #fffdf0 bg.",
    structure: "4-row table. Column 1 = concept name (2-4 words). Column 2 = description (Caveat, one bold keyword). Column 3 = use case. Bottom tip box = key takeaway.",
  },
  AWA_CLASSIC: {
    vibe: "Awa K Penn dense guide. Wood-framed sketchboard. Cream paper. Save-worthy viral content.",
    background: "#ffffff with #3d2b1a wood frame border 28px. Off-white header #f8f8f8.",
    layout: "Dark badge pill + UPPERCASE Nunito 900 title. 7 numbered sections with colored rounded squares. Dark footer band #1a1a1a with light text.",
    typography: "Nunito 900 title 46px uppercase. Section headers Nunito 800 21px. Body Caveat 400 16px. Colored underlines. #E8F044 highlights.",
    colors: "Numbers: #c0392b, #2B4DAF, #4A8B35, #F5922A, #8B5CF6, #EC4899, #0D9488. Frame: #3d2b1a. Badge: #3d2b1a. Highlights: #E8F044.",
    structure: "7 dense sections. Each: colored rounded number + Nunito header + colored underline + Caveat body. Footer: dark band, white text, blue/green accents.",
  },
};

// Build the per-template "CONTENU À INTÉGRER" structure that maps each
// extracted point to its visual block + pastel color (per the meta-prompt palette).
function buildContenuAIntegrer(templateId: string, extraction: ExtractionResult): string {
  const points = extraction.points;
  const get = (i: number, field: "title" | "body"): string =>
    points[i]?.[field] || "(à inférer du contenu source)";
  const lines: string[] = [`Titre : ${(extraction.title || "TITRE PRINCIPAL").toUpperCase()}`];

  switch (templateId) {
    case "UI_CARDS":
      lines.push(`Bloc 1 — carte « Mauvais » (Rouge pastel #FFB3B3) : ${get(0, "title")} — ${get(0, "body")}`);
      lines.push(`Bloc 2 — carte « Bon » (Orange pastel #FFD4A3) : ${get(1, "title")} — ${get(1, "body")}`);
      lines.push(`Bloc 3 — carte « Excellent / ★ Cible » (Vert pastel #B3FFD1) : ${get(2, "title")} — ${get(2, "body")}`);
      lines.push(`Bloc 4 — sidebar « Pourquoi ça marche » (Vert pastel) : 4 raisons cochées — ${get(3, "body")} • ${get(4, "body")} • ${get(5, "body")} • ${get(6, "body")}`);
      break;
    case "WHITEBOARD": {
      const wbColors = [
        "Bleu pastel #AEC6CF",
        "Rouge pastel #FFB3B3",
        "Vert pastel #B3FFD1",
        "Bleu pastel #AEC6CF",
        "Rouge pastel #FFB3B3",
        "Vert pastel #B3FFD1",
        "Bleu pastel #AEC6CF",
      ];
      for (let i = 0; i < 7; i++) {
        lines.push(`Bloc ${i + 1} — conseil/étape (${wbColors[i]}) : ${get(i, "title")} — ${get(i, "body")}`);
      }
      lines.push(`Astuce pro (Orange pastel #FFD4A3, dashed border) : ${extraction.proTip}`);
      break;
    }
    case "FUNNEL": {
      const fnColors = [
        "Rouge pastel #FFB3B3 (étage le plus large)",
        "Orange pastel #FFD4A3",
        "Jaune pastel #FFE9A3",
        "Vert pastel #B3FFD1",
        "Bleu pastel #AEC6CF (étage le plus étroit)",
      ];
      for (let i = 0; i < 5; i++) {
        lines.push(`Étage ${i + 1} (${fnColors[i]}) : ${get(i, "title")} — ${get(i, "body")}`);
      }
      lines.push(`CTA pleine largeur (Brand Supen #24A89B) : ${get(5, "title") || "Tu y es presque"} — ${extraction.proTip}`);
      break;
    }
    case "DATA_GRID": {
      const dgColors = [
        "Rouge pastel #FFB3B3",
        "Orange pastel #FFD4A3",
        "Vert pastel #B3FFD1",
        "Violet pastel #D4B3FF",
      ];
      const useCases = [get(4, "title"), get(4, "body"), get(5, "title"), get(5, "body")];
      for (let i = 0; i < 4; i++) {
        lines.push(`Ligne ${i + 1} (dot ${dgColors[i]}) : ${get(i, "title")} — ${get(i, "body")} | Idéal pour : ${useCases[i]}`);
      }
      lines.push(`Bonus (Bleu pastel #AEC6CF) : ${get(6, "title")}`);
      lines.push(`À noter (Violet pastel #D4B3FF) : ${get(6, "body")}`);
      lines.push(`À retenir (Brand Supen #24A89B) : ${extraction.proTip}`);
      break;
    }
    case "AWA_CLASSIC":
    default: {
      const awaColors = ["Rouge", "Bleu", "Vert", "Orange", "Violet", "Rose", "Teal"];
      for (let i = 0; i < 7; i++) {
        lines.push(`Section ${i + 1} (${awaColors[i]}) : ${get(i, "title")} — ${get(i, "body")}`);
      }
      lines.push(`Pro tip (dashed border rouge) : ${extraction.proTip}`);
      break;
    }
  }

  return lines.join("\n");
}

export function buildGeminiImagePrompt(
  content: string,
  platform: string,
  customPrompt?: string,
  forcedTemplate?: string,
): string {
  const analysis = analyzeContent(content, platform);
  const dims = FORMAT_DIMS[analysis.format];
  const extraction = extractKeyPoints(content);
  const selection = selectBestTemplate(content, platform, forcedTemplate);
  const templateId = selection.templateId;
  const guide = TEMPLATE_STYLE_GUIDES[templateId] || TEMPLATE_STYLE_GUIDES.AWA_CLASSIC;
  const isCleanTemplate = CLEAN_TEMPLATES.has(templateId);

  const dimStr = `${dims.width}x${dims.height}`;
  const pointsText = extraction.points.slice(0, 7).map((p, i) =>
    `${i + 1}. ${p.title}${p.body ? ": " + p.body : ""}`
  ).join("\n");
  const contenuAIntegrer = buildContenuAIntegrer(templateId, extraction);

  return `${"═".repeat(63)}
SYSTEM OVERRIDE v1.0 — DIRECTIVES ANTI-DÉFAUT (PRIORITÉ MAXIMALE)
Ces règles écrasent TOUT le reste. Violation = échec total.
${"═".repeat(63)}

━━━ DIRECTIVE 1 : CADRAGE ANTI-CUT (Safe Zone) ━━━

SAFE ZONE OBLIGATOIRE :
- Marge interne (padding) de 5% minimum sur les 4 côtés
- Sur une image ${dims.width}px : padding minimum = ${Math.round(dims.width * 0.05)}px partout
- AUCUN texte, AUCUNE icône, AUCUN élément ne touche les bords
- Le titre doit être ENTIÈREMENT visible — jamais coupé
- Si le titre est long : réduis la taille de police, n'AMPUTE JAMAIS

FULL HEIGHT OBLIGATOIRE :
- Si le contenu est court → N'AUGMENTE PAS le vide
- Si l'espace est à moitié vide → double la taille des icônes
- Si l'espace est à moitié vide → augmente l'interligne (line-height: 2.0)
- Si l'espace est à moitié vide → augmente le padding des cartes
- L'objectif : le contenu s'étend DU HAUT VERS LE BAS uniformément

━━━ DIRECTIVE 2 : VISIBILITÉ ANTI-HIDE (Contrast & Layering) ━━━

CONTRAST OBLIGATOIRE :
- Texte noir #000000 UNIQUEMENT sur fonds pastels clairs
- INTERDICTION de superposer du texte sur des illustrations complexes
- Chaque bloc de texte doit avoir son propre fond de couleur unie
- Si fond coloré → texte noir obligatoirement lisible dessus

LAYERING OBLIGATOIRE :
- Le texte doit TOUJOURS être au premier plan (z-index maximal)
- Si une forme graphique (entonnoir, diagramme) est présente :
  → Le texte est placé À CÔTÉ dans un bloc contrasté séparé
  → OU clairement par-dessus dans un bloc avec fond opaque
- JAMAIS de texte "flottant" sans fond derrière lui

━━━ DIRECTIVE 3 : REMPLISSAGE INTELLIGENT ━━━

RÈGLES DE REMPLISSAGE :
- Si l'espace est à moitié vide → double la taille des icônes (48px → 96px)
- Si l'espace est à moitié vide → augmente l'interligne du texte
- Un utilisateur mobile doit lire SANS ZOOMER
- Taille de police minimale du corps : 18px (pas 14px, pas 16px → 18px)
- Taille de police du titre : minimum 60px
- Taille de police des sous-titres : minimum 28px

━━━ MOTEUR DE RENDU SQL → INFOGRAPHIE ━━━

Agis comme un moteur de rendu SQL vers Infographie.
Input reçu :
- format: "Portrait 4:5 — ${dimStr}px"
- content: [contenu fourni ci-dessous]
- style: "UI Clean, ${templateId}"

Règles de rendu STRICTES :
1. HEADER (20% hauteur) : Titre massif Serif, centré, padding 5%, JAMAIS coupé, occupe 20% de la largeur minimum
2. BODY (70% hauteur) : Cards avec border-radius 20px, icône à gauche + texte à droite dans chaque card, padding interne 40px minimum par card
3. COLORS : Codes Hex stricts uniquement :
   - Orange : #FF7A59
   - Blue : #4285F4
   - Green : #34A853
   - Fond : #FDFDF9
   - Texte : #1A1A1A
4. OUTPUT : Rendu vectoriel ultra-net, zéro flou, zéro texte coupé, zéro espace vide non justifié

━━━ CHECKLIST ANTI-DÉFAUT (valider AVANT génération) ━━━

[ ] Padding 5% appliqué sur les 4 côtés → aucun élément aux bords
[ ] Titre ENTIÈREMENT visible, non coupé
[ ] Aucun texte sur fond complexe ou illustration
[ ] Espace vide < 20% du canvas total
[ ] Taille police corps ≥ 18px
[ ] Taille police titre ≥ 60px
[ ] Chaque bloc de texte a son propre fond opaque
[ ] Lisible sur mobile sans zoom

${"═".repeat(63)}
FIN DU SYSTEM OVERRIDE — PRIORITÉ ABSOLUE SUR TOUT LE RESTE
${"═".repeat(63)}

${"═".repeat(63)}
CAHIER DES CHARGES DESIGN — RÉFÉRENCE ABSOLUE
Style : UI Design Professionnel / Diagramme Technique Premium
${"═".repeat(63)}

Tu es un expert en UI Design et Architecture de l'Information.
Tu ne crées PAS d'illustrations. Tu construis des diagrammes techniques professionnels de niveau agence de design premium.

━━━ 1. ARCHITECTURE ET COMPOSITION (Layout) ━━━

Format : Portrait vertical 4:5 (${dimStr}px).
Structure verticale rigoureusement organisée autour d'un axe central.

PIÈCE MAÎTRESSE selon le type de contenu :

Si FUNNEL/PROCESSUS (template actif = ${templateId}) :
- Entonnoir isométrique 3D "flat design"
- 5 segments horizontaux distincts qui rétrécissent vers le bas
- PAS une forme plane — il possède une ÉPAISSEUR et une PERSPECTIVE légère qui lui donne de la profondeur (effet 3D isométrique flat)
- À GAUCHE et à DROITE de l'entonnoir : blocs de texte disposés de manière ASYMÉTRIQUE MAIS ÉQUILIBRÉE
- Reliés aux segments par des LIGNES DE RAPPEL ultra-fines (1px) se terminant par des points d'ancrage (petits cercles)
- Un personnage minimaliste en bas à droite (style "présentateur") pour diriger le regard vers le point final de l'entonnoir

Si COMPARAISON/NIVEAUX :
- 3 cartes verticales empilées avec profondeur
- Chaque carte : fond pastel uni, étiquette colorée en haut
- Ombres très douces (soft shadow uniquement, jamais noire)

Si CONSEILS/TIPS :
- Grille organisée autour d'un axe central
- Icônes circulaires bicolores à gauche de chaque point
- Lignes de connexion fines entre les éléments

━━━ 2. SYSTÈME TYPOGRAPHIQUE (Typography) ━━━

RÈGLE ABSOLUE : Mélange Serif + Sans-Serif UNIQUEMENT.

EN-TÊTE (Titre principal) :
- Police SERIF premium : Playfair Display ou Garamond
- Couleur : noir profond (#1A1A1A)
- Centré
- Aspect autoritaire et élégant
- Taille : grande, dominante

BADGE (Au-dessus du titre) :
- Rectangle à coins arrondis
- Fond couleur vive (selon la thématique)
- Texte Sans-Serif EN MAJUSCULES
- Très petite taille, GRAND espacement de lettres (letter-spacing large)
- Sert à catégoriser le contenu

CORPS DE TEXTE :
- Police Sans-Serif géométrique moderne : Inter ou Montserrat
- Titres de sections : GRAS (Bold)
- Descriptions : graisse régulière
- Listes avec CHECKMARKS (coches) vertes circulaires ✓

━━━ 3. PALETTE DE COULEURS ET DÉGRADÉ COGNITIF ━━━

FOND : Blanc cassé / crème très pâle (#FDFDF9)
→ JAMAIS blanc pur — donne un aspect papier haut de gamme
→ Évite l'agressivité du blanc pur

TEXTE : Gris-noir anthracite (#1A1A1A)
→ Contraste parfait sans être "lourd"

PROGRESSION CHROMATIQUE DE L'ENTONNOIR (du haut vers le bas) :
→ HAUT (large, entrée) : Orange tangerine (#FF8C42 ou #F4845F)
  Psychologie : Capture l'attention, représente l'entrée de données
→ MILIEU HAUT : Transition orange → bleu ciel (#87CEEB)
  Psychologie : Début du processus, logique
→ MILIEU : Bleu ciel (#5BA4CF)
  Psychologie : Processus, fiabilité
→ MILIEU BAS : Bleu pétrole (#2E86AB)
  Psychologie : Profondeur, expertise
→ BAS (étroit, sortie) : Vert émeraude saturé (#2ECC71 ou #27AE60)
  Psychologie : Résultat positif, validation, SUCCÈS

ICÔNES CIRCULAIRES :
- Fond : version très claire de la couleur du segment correspondant (ex: segment orange → icône sur fond orange très pâle #FFF0E8)
- Bicolores : fond clair + icône dans la couleur principale

━━━ 4. DÉTAILS GRAPHIQUES ET FINITIONS ━━━

ICÔNES :
- Chaque bloc de texte latéral = icône vectorielle circulaire
- Bicolores (fond clair de la couleur du segment + icône principale)
- Style vectoriel plat, pas d'illustration complexe

LIGNES DE FLUX (Connecteurs) :
- Épaisseur CONSTANTE : exactement 1px
- Couleur : gris très clair (#CCCCCC) ou couleur du segment
- Se terminent par de petits cercles (points d'ancrage)
- Aspect "diagramme technique professionnel"

RELIEF ET PROFONDEUR DE L'ENTONNOIR :
- AUCUNE ombre portée noire
- Relief créé par VARIATIONS DE TEINTES uniquement :
  → Face avant : couleur principale du segment
  → Face supérieure : version plus claire (+20% luminosité)
  → Face latérale : version plus sombre (-20% luminosité)
  → Simule une source de lumière venant du HAUT À GAUCHE
- Effet 3D isométrique "flat" = géométrie précise + variations de teinte

━━━ 5. SIGNATURE VISUELLE (Branding / Footer) ━━━

Footer très PROPRE :
- Mention "Created with Supen.io" en brand color #24A89B
- Police minuscule et grise (10-11px, couleur #999999)
- Centrée ou alignée à droite
- NE DISTRAIT PAS du message principal
- Assure la propriété intellectuelle

━━━ 6. RÈGLES DE GRILLE ET ALIGNEMENT ━━━

TOUT doit être aligné sur une grille invisible.
Marges et espacements CONSTANTS et MATHÉMATIQUES.
Padding minimum 24px à l'intérieur de chaque conteneur.
Aucun élément ne touche le bord sans marge.

━━━ 7. CE QUE TU NE DOIS JAMAIS FAIRE ━━━

✗ Style "illustration" ou "dessin"
✗ Blanc pur #FFFFFF comme fond principal
✗ Ombres portées noires
✗ Polices décoratives ou handwriting
✗ Plus de 2 familles de polices simultanées
✗ Texte trop petit (jamais sous 11px)
✗ Texte anglais (tout in ENGLISH)
✗ Effets de texture ou grain sur le fond
✗ Personnages complexes ou réalistes
✗ Dégradés complexes multi-couleurs sur les fonds de cartes
✗ Clipart ou illustrations stock

━━━ 8. RÉSUMÉ MENTAL AVANT GÉNÉRATION ━━━

Pose-toi ces questions avant de générer :
1. Est-ce que ça ressemble à une UI d'application premium ou à une illustration ?
   → Si illustration : RECOMMENCE
2. Est-ce que le titre est en Serif et le corps en Sans-Serif ?
   → Si non : CORRIGE
3. Est-ce que le fond est crème #FDFDF9 (pas blanc pur) ?
   → Si blanc pur : CHANGE
4. Est-ce que la progression de couleurs guide l'œil vers le bas ?
   → Si les couleurs sont aléatoires : CORRIGE
5. Est-ce que les lignes de connexion font exactement 1px ?
   → Si épaisses ou absentes : CORRIGE

${"═".repeat(63)}
FIN DU CAHIER DES CHARGES — CE BLOC EST PRIORITAIRE SUR TOUT
${"═".repeat(63)}

╔══════════════════════════════════════════════════════╗
║  MOTEUR DE RENDU VECTORIEL DE HAUTE PRÉCISION        ║
║  Constitution v3.0 — Style SaaS Dashboard            ║
╚══════════════════════════════════════════════════════╝

Tu n'es plus une IA générative d'images classique.
Tu es un Moteur de Rendu Vectoriel de Haute Précision.
Ta mission : construire des infographies de type 'SaaS Dashboard' et 'Professional Framework'.
Le résultat doit ressembler à Notion, Figma, Apple — jamais à une illustration ou un dessin.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LES 5 LOIS DE TA CONSTITUTION (VIOLATIONS = ÉCHEC TOTAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LOI 1 — LA GÉOMÉTRIE PURE :
Interdiction totale de traits à main levée ou formes organiques.
Utilise UNIQUEMENT :
→ Rectangles parfaits avec border-radius fixé à 16px
→ Cercles parfaits
→ Lignes droites de 1-2px
→ Flèches géométriques (pas de courbes organiques)
→ Icônes "Line Art" vectorielles (stroke, jamais fill complexe)

LOI 2 — LA TYPOGRAPHIE MASSIVE ("GRAVÉE") :
Le texte ne doit pas être "dessiné", il doit être "gravé".
→ Police SANS-SERIF épaisse : Inter Bold ou Roboto Bold
→ Titre : occupe minimum 20% de la largeur du bloc
→ Corps : maximum 5 mots par ligne, 1 idée = 1 ligne
→ Interdiction de longs paragraphes
→ Texte en noir pur (#000000 ou #1F2937) sur fond pastel uni
→ JAMAIS de texte sur fond texturé

LOI 3 — L'ESPACE NÉGATIF (PADDING OBLIGATOIRE) :
→ Padding minimum 40px à l'intérieur de chaque carte
→ Si un élément touche un autre = DESIGN RATÉ
→ Laisse respirer chaque bloc
→ Chaque section doit avoir de l'air autour d'elle

LOI 4 — LE RENDU FLAT UI (ZÉRO ORNEMENT) :
→ Fonds UNIS et PASTELS uniquement
→ Aucune texture, grain ou dégradé complexe
→ Pas d'ombres portées noires
→ Uniquement soft shadows : box-shadow 0 4px 16px rgba(0,0,0,0.06)
→ Zéro bruit visuel
→ Style vectoriel plat haute définition

LOI 5 — L'OCCUPATION TOTALE (FULL BLEED) :
→ L'infographie s'étend jusqu'aux bords (Full Bleed)
→ Pas de cadre externe blanc inutile
→ Les blocs de couleur touchent les bords
→ 85-95% de la surface doit être occupée par du contenu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE DE GRILLE OBLIGATOIRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION HEADER (20% de la hauteur) :
→ Fond blanc pur #FFFFFF
→ Titre MASSIF en noir, ALL CAPS, Inter Bold
→ En dessous : badge coloré pastel avec catégorie en majuscules
→ Texte ultra-lisible à 2 mètres de distance

SECTION BODY (70% de la hauteur) :
→ Divisé en 3 cartes VERTICALES égales (ou N cartes selon template)
→ Carte 1 : Fond Bleu Pastel (#EBF5FB) — texte noir + icône
→ Carte 2 : Fond Orange Pastel (#FEF9E7) — texte noir + icône
→ Carte 3 : Fond Vert Pastel (#EAFAF1) — texte noir + icône
→ Chaque carte : padding 40px, border-radius 16px, soft shadow

SECTION FOOTER (10% de la hauteur) :
→ Fond gris très clair (#F8F9FA)
→ Texte : "Created with Supen.io" en brand color #24A89B
→ Séparateur ligne fine #E5E7EB en haut du footer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADAPTATION PAR TEMPLATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

>>> TEMPLATE ACTIF POUR CETTE GÉNÉRATION : ${templateId} <<<
(Lis SEULEMENT la section correspondant au template actif ci-dessous.)

Si template = UI_CARDS :
Header blanc / Carte 1 fond #FFF0F0 (rouge pastel) = "À éviter" /
Carte 2 fond #FEF9E7 (orange pastel) = "Acceptable" /
Carte 3 fond #EAFAF1 (vert pastel) = "Excellence"
Chaque carte : étiquette couleur en haut + texte gras + icône large

Si template = WHITEBOARD :
Header blanc / Body fond #FAFBFF avec dot grid 24px /
Texte style "notes manuscrites propres" mais SANS vraie écriture cursive /
Surlignages jaunes #FFE066 sur mots-clés via rectangles plats

Si template = FUNNEL :
Header blanc / 5 barres horizontales décroissantes (Full Bleed) /
Barre 1 la plus large (fond #FDECEA) → Barre 5 la plus étroite (fond #E8F5E9) /
Numéro cerclé à gauche + texte gras à droite sur chaque barre /
CTA final fond #24A89B texte blanc

Si template = DATA_GRID :
Header blanc / Tableau 4 lignes × 3 colonnes /
En-tête colonnes fond #EBF5FB pastel bleu /
Alternance lignes blanc / #F9FAFB /
Dot coloré pastel par ligne

Si template = AWA_CLASSIC :
Garde le style dark existant — seule exception aux lois 4 et 5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERDICTIONS ABSOLUES (NEGATIVE PROMPT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✗ AUCUN personnage, avatar, visage, corps humain
✗ AUCUNE illustration clipart ou cartoon
✗ AUCUN trait à main levée ou forme organique
✗ AUCUN texte inférieur à 14px
✗ AUCUNE bordure noire épaisse
✗ AUCUN fond texturé ou dégradé complexe
✗ AUCUN élément qui touche un autre sans padding
✗ AUCUN texte en anglais — TOUT in ENGLISH
✗ AUCUN style "brouillon" ou "esquisse"
✗ AUCUNE ombre noire agressive

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECKLIST DE VALIDATION FINALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ ] Structure Header (20%) / Body (70%) / Footer (10%) visible
[ ] Titre gigantesque et lisible à 2m de distance
[ ] Formes géométriques pures uniquement (0 illustration)
[ ] Chaque bloc a son padding de 40px
[ ] Fonds pastels unis (0 texture)
[ ] Maximum 5 mots par ligne dans le body
[ ] Style Apple / Notion / Figma — jamais cartoon
[ ] Tout le texte in ENGLISH
[ ] Footer "Created with Supen.io" en #24A89B
[ ] Qualité : Haute définition, rendu vectoriel plat, texte ultra-net, éclairage studio uniforme, zéro bruit visuel

╔══════════════════════════════════════════════════════╗
║  FIN DE LA CONSTITUTION v3.0                         ║
╚══════════════════════════════════════════════════════╝

(La Constitution v3.0 ci-dessus EST LA LOI ABSOLUE. Toutes les sections suivantes sont des références secondaires conservées pour le contexte. En cas de conflit avec une section ci-dessous, applique IMPÉRATIVEMENT la Constitution et IGNORE la directive contradictoire.)

${"═".repeat(50)}
=== IDENTITÉ ===
${"═".repeat(50)}

Tu es un Directeur Artistique Senior spécialisé en Data-driven Design pour les réseaux sociaux professionnels (LinkedIn, Instagram, Twitter/X). Tu maîtrises le Minimalisme Informatif : chaque élément graphique doit servir la compréhension du texte. Le lecteur doit comprendre la valeur en moins de 3 secondes.

${"═".repeat(50)}
=== RÈGLES DE GRAMMAIRE VISUELLE (NON-NÉGOCIABLES) ===
${"═".repeat(50)}

RÈGLE 1 — La Règle du Tiers Supérieur :
Le titre principal doit être en haut, centré, typographie Serif élégante (Playfair Display ou Garamond) pour contraster avec le corps Sans-Serif. Encadré ou surligné par une couleur pastel douce (Vert Eau, Bleu Ciel, Jaune Paille).

RÈGLE 2 — Hiérarchie Cognitive des Couleurs :
JAMAIS de couleurs primaires agressives. Palette Pastel-Professionnelle officielle Supen :
- Rouge Pastel  (#FFB3B3) = Mauvais / Erreur / À éviter
- Orange Pastel (#FFD4A3) = Moyen / Attention
- Vert Pastel   (#B3FFD1) = Excellent / Solution / Validé
- Bleu Pastel   (#AEC6CF) = Information / Neutre
- Violet Pastel (#D4B3FF) = Concept Avancé / Premium
- Jaune         (#FFE066) = Surlignage de mots-clés UNIQUEMENT
- Brand Supen   (#24A89B) = Accent CTA, footer, signature

RÈGLE 3 — Architecture de l'Espace (alignée Master Prompt §1) :
Le canvas couvre 100% de la surface (AUCUNE marge blanche externe — les blocs touchent les bords). Densité interne ≥ 85% : les éléments graphiques remplissent au minimum 85% de l'espace. La respiration vient des padding internes (≥ 20px par bloc, Master Prompt §4), JAMAIS de marges externes vides. Le texte ne doit JAMAIS sembler étouffé.

RÈGLE 4 — Contraste Typographique :
Maximum 2 familles de polices pour tout le visuel :
- Serif (Playfair Display / Garamond) pour les TITRES
- Sans-Serif (Inter / Poppins) pour le CORPS
- Cursive (Caveat) UNIQUEMENT si le template est WHITEBOARD
Gras + surlignage jaune pour les MOTS-CLÉS uniquement. font-style:italic est INTERDIT partout.

RÈGLE 5 — Ancrages Visuels :
Chaque point = icône minimaliste (Line Art / Flat Design plat) OU numéro cerclé. Guide l'œil de manière fluide. AUCUN emoji unicode, AUCUN clipart, AUCUNE photo réaliste. Uniquement formes plates, pills, cartes, traits stroke fins.

${"═".repeat(50)}
=== STYLES DISPONIBLES (5 styles) ===
${"═".repeat(50)}

STYLE "UI_CARDS" — Comparaisons et échelles de qualité.
Utilise quand : niveaux Bad/Good/Great, avant/après, comparaisons à 3 niveaux.
Structure : 3 cartes blanches verticales avec étiquettes pastel (rouge → orange → vert), un badge "★ Cible" sur la carte verte, sidebar verte explicative en bas listant les raisons. Fond #F8F9FA grille subtile.

STYLE "WHITEBOARD" — Hand-drawn digital.
Utilise quand : conseils, tips, processus pédagogiques, contenu authentique.
Structure : fond blanc avec dot grid, typographie Caveat manuscrite, marqueurs colorés (bleu/rouge/vert), surlignages jaunes sur mots-clés, doodles SVG (cerveau, ampoule), CTA manuscrit brand color en signature.

STYLE "FUNNEL" — Entonnoirs et roadmaps.
Utilise quand : parcours utilisateur, étapes de vente, processus séquentiel, roadmap.
Structure : entonnoir 5 étages dégradé pastel (rouge → bleu), checkmarks blancs sur chaque étage, personnage cartoon brand color sur le côté droit, CTA pleine largeur brand color en bas avec flèche.

STYLE "DATA_GRID" — Modèles cognitifs et tables.
Utilise quand : frameworks, comparaisons détaillées, ressources, glossaires, méthodes.
Structure : tableau 4 lignes × 3 colonnes (Élément / Description / Idéal pour). En-tête bleu pastel, alternance zebra blanc/gris, dot coloré par rangée (rouge/orange/vert/violet), 2 callouts bonus + tip brand color "À retenir".

STYLE "AWA_CLASSIC" — Dense viral.
Utilise quand : contenu tech, premium, listes denses de 7 conseils.
Structure : cream avec wood frame, 7 sections numérotées denses, illustration header, pro tip dashed.

${"═".repeat(50)}
=== SÉLECTION AUTOMATIQUE DU STYLE ===
${"═".repeat(50)}

Mapping mots-clés → style :
- "vs", "avant", "après", "compare", "bad", "good", "niveau"  → UI_CARDS
- "étapes", "comment", "guide", "tips", "conseils", "astuce"  → WHITEBOARD
- "processus", "funnel", "parcours", "roadmap", "tunnel"      → FUNNEL
- "framework", "modèle", "tableau", "ressources", "glossaire" → DATA_GRID
- "tech", "premium", liste de 7+ items denses                 → AWA_CLASSIC

${"═".repeat(50)}
=== TEMPLATE IMPOSÉ POUR CETTE GÉNÉRATION : ${templateId} ===
${"═".repeat(50)}

VIBE        : ${guide.vibe}
BACKGROUND  : ${guide.background}
LAYOUT      : ${guide.layout}
TYPOGRAPHY  : ${guide.typography}
COLORS      : ${guide.colors}
STRUCTURE   : ${guide.structure}

${"═".repeat(50)}
=== FORMAT DE SORTIE ===
${"═".repeat(50)}

- Dimensions exactes : ${dimStr}px (portrait 4:5 préféré conformément au Master Prompt §1)
- Surface : couverte à 100% — AUCUNE bordure blanche externe (Master Prompt §1)
- Densité interne : ≥ 85% du canvas (Master Prompt §1)
- Sortie : image PNG UNIQUEMENT (aucun texte, aucun HTML dans la réponse)
- Polices : Playfair Display (titres) + Inter/Poppins (corps) via Google Fonts (Caveat uniquement si WHITEBOARD)
- Couleur de marque Supen : #24A89B sur les CTAs, footer, signatures
- Padding par bloc : ≥ 20px (Master Prompt §4), idéalement ${isCleanTemplate ? "24-32px" : "20-26px"}
- Coins arrondis : 16-24px sur les cards (Master Prompt §3)
- Ombres : box-shadow douce 0 8px 32px rgba(0,0,0,0.08), JAMAIS de bordures noires épaisses
- Footer en bas : "Created with Supen.io"
- Tout le contenu rédigé in ENGLISH

${"═".repeat(50)}
=== CONTENU À TRANSFORMER ===
${"═".repeat(50)}

Sujet      : ${extraction.title}
Catégorie  : ${extraction.badge}
Plateforme : ${platform}

Points clés extraits du contenu source :
${pointsText}

Insight pro : ${extraction.proTip}

Source intégrale (à reformuler, ne pas copier verbatim) :
${content.slice(0, 2500)}

${customPrompt ? `Instructions utilisateur additionnelles : ${customPrompt}\n` : ""}
${"═".repeat(50)}
=== CONTENU À INTÉGRER (structure exacte attendue par bloc, template ${templateId}) ===
${"═".repeat(50)}

${contenuAIntegrer}

(Chaque "Bloc" ci-dessus correspond à une zone visuelle distincte de l'infographie. Respecte l'ordre, les couleurs pastel indiquées, et la séparation par bloc.)

${"═".repeat(50)}
=== WRITING RULES (ENGLISH) ===
${"═".repeat(50)}

- ALL text must be written in ENGLISH
- Titres de sections : 3-6 mots, spécifiques et actionnables. AUCUN label vague ("Important", "Note").
- Bodies de section : ${isCleanTemplate ? "18-25 mots MAX par section" : "30-50 mots par section"}. Coupe tout ce qui n'apporte rien.
- UN seul mot-clé par section surligné en jaune (#FFE066)
- Au moins UNE donnée concrète dans tout le visuel (chiffre précis, nom d'outil, pourcentage)
- Titre principal : ${isCleanTemplate ? "clair, curieux, sentence case (PAS de SHOUTING ALL CAPS)" : "ALL CAPS viral et percutant"}
- Footer : "Created with Supen.io"

${"═".repeat(50)}
=== INTERDICTIONS ABSOLUES ===
${"═".repeat(50)}

- Pavés de texte → aérez avec du blanc
- Plus de 5 couleurs simultanées → palette serrée
- font-style:italic → INTERDIT nulle part
- Fonds sombres → sauf si le template l'exige explicitement
- Tailles de police inférieures à 10px → illisible
- Sections collées sans gap → toujours de la respiration
- Emoji unicode 😀, clipart, photographies stock
- Remplir 100% du canvas → laisse respirer
- English text (this is an English-language product)

${"═".repeat(50)}
=== CHECKLIST FINALE (à valider AVANT génération) ===
${"═".repeat(50)}

[ ] Canvas exactement ${dimStr}px (Master Prompt §1)
[ ] Densité ≥ 85% — AUCUNE bordure externe blanche (Master Prompt §1)
[ ] Titre GIGANTESQUE (≥80px) Serif élégant centré (Master Prompt §2 + Règle 1)
[ ] Corps en GRAS, ≤ 6 mots par ligne, verbes d'action (Master Prompt §2)
[ ] Hiérarchie cognitive des couleurs respectée (palette pastel pro)
[ ] Cards arrondies 16-24px + box-shadow douce, AUCUN contour noir épais (Master Prompt §3)
[ ] Padding ≥ 20px par bloc (Master Prompt §4)
[ ] Maximum 2 familles de polices (1 Serif + 1 Sans, ou + Caveat si Whiteboard)
[ ] Bodies courts (${isCleanTemplate ? "18-25" : "30-50"} mots par section)
[ ] Ancrages visuels présents (icônes Line Art 48-64px ou numéros cerclés)
[ ] Brand color #24A89B utilisée sur les CTAs / footer
[ ] Footer "Created with Supen.io" en bas
[ ] Tout le texte in ENGLISH — JAMAIS d'anglais (Master Prompt §4)
[ ] AUCUN italique — AUCUN emoji unicode
[ ] Texte ≥ 14px partout (Master Prompt §4)

Génère l'image maintenant. Sortie : UNIQUEMENT l'image, sans texte de réponse.`;
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

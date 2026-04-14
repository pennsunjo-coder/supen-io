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

// ─── Gemini Image prompt builder (Awa K Penn forensic style) ───

const GEMINI_UNIVERSAL_STYLE_CONTEXT = `
STYLE CONTEXT — THIS IS THE MOST IMPORTANT INSTRUCTION:

You are generating a viral educational infographic image for social media.
The EXACT style to replicate is "Awa K Penn" — a popular educational
content creator whose infographics look like hand-crafted whiteboard notes.

MANDATORY VISUAL RULES — VIOLATING ANY OF THESE = FAILURE:

1. FONTS (critical):
   - Titles/headers: Nunito ExtraBold weight 900 — extremely bold, thick strokes
   - Body text: Caveat — handwritten, slightly irregular, casual marker-pen feel
   - These 2 fonts ONLY. No Arial, no Helvetica, no system fonts.

2. BACKGROUND: #f8f9f7 (slightly cool off-white, like a real whiteboard)
   NEVER pure white #ffffff
   NEVER dark backgrounds
   Add subtle 2% paper grain texture

3. COLORS — USE ONLY THESE EXACT HEX VALUES:
   - Red: #C0392B (warm brownish red)
   - Blue: #2563EB (medium confident blue)
   - Green: #4A8B35 (natural forest green)
   - Orange: #F5922A (warm tangerine)
   - Yellow #FFEF5A: ONLY as inline text highlighter behind specific words
     like a real Stabilo marker — flat, no border-radius, never as card color

4. VISUAL SIGNATURE ELEMENTS (all must be present):
   - Whiteboard templates: 4 small dark gray clips at each corner (12×18px)
   - Notebook templates: metallic spiral binding at top (20 silver coils, 3D)
   - Notebook templates: red vertical margin line at x=72px
   - Notebook templates: light blue horizontal ruled lines every 34px
   - Numbers in hand-drawn oval/circle badges (stroke style, not CSS)
   - Colored underlines under ALL section headers (2px, accent color)
   - Yellow #FFEF5A highlights on KEY TERMS inline
   - ✓ checkmarks in red #C0392B
   - → arrows between connected elements
   - Circled numbers ①②③④⑤⑥ for ordered lists

5. DENSITY: Pack content densely. Every infographic needs:
   - Minimum 5 distinct sections/points
   - At least 2-3 bullet points per section
   - Yellow highlights on 3-5 key terms
   - Footer: "Follow [creator] for more | Repost ↺"

6. NEVER USE:
   - Gradients on text
   - Dark section cards or dark backgrounds
   - More than 4 accent colors
   - Clean modern corporate slide aesthetic
   - Empty whitespace (fill the canvas)
   - Pale washed-out colors (use saturated, confident colors)
`;

function getGeminiTemplatePrompt(
  templateId: string,
  extraction: ExtractionResult,
  dims: { width: number; height: number },
): string {
  switch (templateId) {

    case "WHITEBOARD":
      return `
TEMPLATE: WHITEBOARD BULLET LIST
(Style: "How to Master Claude in 2 Minutes" by Awa K Penn)

Generate a whiteboard-style infographic at ${dims.width}×${dims.height}px.

CANVAS DETAILS:
- Background: #f8f9f7 with 2% paper grain
- 4 small dark gray rectangular clips at each corner (12×18px)
- Very thin border 0.5px #e0e0e0 around canvas
- Square brackets [ ] framing the title

TITLE BLOCK (top 12%):
- "[${extraction.title}]" with brackets
- Nunito ExtraBold 900, ~48px, black #111111, centered
- Red wavy underline below title: 2px #C0392B

CONTENT (12% to 90%):
Organize in 2 columns OR 1 column based on content density.
Left padding: 40px, right padding: 40px.

For each of the ${extraction.points.length} points, create a section with:
- Section header: Nunito Bold 20-24px, colored (#C0392B or #2563EB or #4A8B35)
- 2px colored underline under the header
- Bullet points: colored • symbols, Caveat 18-20px, black #111111
- Key terms highlighted: yellow #FFEF5A background, flat (no border-radius)
- Numbers in hand-drawn circle badges (stroke style)
- ✓ checkmarks in red for positive points

DECORATIVE ELEMENTS:
- Star ★ in orange #F5922A next to important sections
- → arrows between connected elements
- Circled numbers ①②③ for ordered items

FOOTER (bottom 8%):
- Thin separator 0.5px #cccccc
- "Follow @supen for more | Repost ↺"
- Nunito Bold 16px, centered, name in blue #2563EB underlined
      `;

    case "NOTEBOOK":
    case "COMPARISON":
      if (templateId === "NOTEBOOK") {
        return `
TEMPLATE: SPIRAL NOTEBOOK
(Style: "9 Free Courses for Building AI Agents" by Awa K Penn)

Generate a spiral notebook infographic at ${dims.width}×${dims.height}px.

CANVAS DETAILS:
- Background: #fffef8 (warm paper, slightly cream)
- Paper grain texture 4-5% opacity

SPIRAL BINDING (top 6% = ~${Math.round(dims.height * 0.06)}px):
- 20 metallic spiral coils across full width
- Each coil: oval shape ~36px wide, 26px tall
- Silver-gray color #a39581 with 3D shading
  * Light side: #c8c0b0, Shadow side: #7a7060
- Coils overlap paper edge (pass in front AND behind)

RULED LINES:
- Horizontal lines #dde8f0, 0.5px, every 34px, full width
- Left margin line: vertical #E63946, 1.5px, at x=72px

TITLE (below spiral, top 16%):
- Multi-color word treatment — each key word different color:
  * Numbers: green #4A8B35, very bold ~56px
  * Key adjectives: red #C0392B with underline
  * Main nouns: blue #1a3d7c bold
  * "AI" or tech terms: yellow #FFEF5A background, red text
- Font: Caveat Bold 700, ~52-56px
- Curved red arrow ↓ after title

CONTENT TABLE or LIST:
- If table: 5 columns, header #f5f5f5, alternating rows
  * Numbers in hand-drawn oval badges (01, 02, 03...)
  * Provider names: Nunito Bold, blue #2563EB
  * Course/item titles: Caveat, green #4A8B35
  * Key terms highlighted yellow #FFEF5A inline
- If list: numbered items with Caveat body text

FOOTER (bottom 13%):
- Curved arrows ↙ left and ↗ right (thick, Caveat Bold)
- "Follow for more | Repost ↺" Caveat Bold 24-28px
- Creator name: blue #2563EB bold underlined
        `;
      }
      return `
TEMPLATE: 3-COLUMN COMPARISON
(Style: "Claude vs ChatGPT vs Gemini" by Awa K Penn)

Generate a 3-column comparison infographic at ${dims.width}×${dims.height}px.

CANVAS:
- Background: #f9f9f6 (cool near-white)
- NO outer border or frame
- 3 equal vertical columns separated by thin lines #cccccc 0.5px

TITLE (top 10%):
- Bracket framing: [ ITEM A vs ITEM B vs ITEM C ]
- Nunito ExtraBold 900, ~32-36px
- Each item in own accent color, underlined
- "vs" in black regular weight
- Full-width separator below title

COLUMN HEADERS (5%):
- Each column header: Nunito Bold 22px, own color, underlined 2px
- Separator line below in column color

EACH COLUMN CONTENT:
1. "DESCRIPTION:" — bold underlined label + Caveat 13px body
2. "WHEN TO USE:" — 💡 icon + bullet points with → arrows
3. "USE CASES:" — 🧠 icon + bullet points
4. "STRENGTHS:" — GREEN #4A8B35 label + positive bullets
   Key numbers/metrics highlighted yellow #FFEF5A
5. "WEAKNESSES:" — RED #C0392B label + negative bullets
6. "PRO TIP:" — label on yellow #FFEF5A background + italic Caveat

FOOTER:
- Full-width separator #aaaaaa
- Background #f5f5f5
- Nunito Bold 16px centered
      `;

    case "FUNNEL":
      return `
TEMPLATE: FUNNEL PROCESS FLOW
(Style: "The Personal Branding Funnel 2026" by Awa K Penn)

Generate a funnel infographic at ${dims.width}×${dims.height}px.

CANVAS:
- Background: #fffef5 (warm ivory)
- Paper grain texture 5% opacity
- Feel: hand-illustrated sketch on whiteboard

TITLE (top 14%):
- Very large: Nunito 900 OR Caveat Bold, 52-64px, black #111111
- Year in parentheses if relevant
- Subtitle: italic 14px #666666, centered

FUNNEL SHAPE (center, 55% of height):
- Large trapezoid: wide top (~580px), narrow bottom (~260px)
- Outline: hand-drawn irregular strokes, black #333333, 2.5px
- Fill: warm cream/tan #f5e6c8, slightly darker at bottom
- Divided into ${Math.min(extraction.points.length, 5)} sections

EACH FUNNEL SECTION:
- Rectangle label box: thin red border #C0392B, white fill
  Format: "${extraction.points[0]?.title || "STAGE"}" Nunito Bold 16px
- Below label: 2-3 checkmarks ✓ in red #C0392B, Caveat 14px

SIDE ARROWS:
- Two large red arrows ↙ and ↘ flanking funnel
- Color: #C0392B, stroke 3-4px, slightly curved
- Indicating downward filtering flow

DECORATIVE STARS:
- 6-8 gold sparkles ✦ ★ scattered around funnel
- Colors: #F5C518 and #E8B800, mix solid/outline, 8-16px

CHARACTER (right side, optional):
- Simple line-art cartoon person pointing at funnel
- Business casual, friendly expression
- Bold outlines, flat colors

CTA BOX (bottom before footer):
- Hand-drawn rectangle (slightly imperfect, 1.5px black)
- "Save this →" bold + description text

FOOTER: Discreet, italic gray
      `;

    case "DATA_GRID":
      return `
TEMPLATE: DATA COMPARISON TABLE
(Style: dense educational reference by Awa K Penn)

Generate a data grid infographic at ${dims.width}×${dims.height}px.

CANVAS:
- Background: #f8f9f7
- Subtle paper grain 2%

TITLE BLOCK (top 18%):
- Badge: dark pill #111111, white text, Nunito 800, all caps
- Title: Nunito 900, ~48px, centered, underline #C0392B 2px below

TABLE (middle 70%):
- Full-width table with 3 columns
- Header row: #f5f5f5 background
  * "Concept" — Nunito Bold, red #C0392B
  * "Description" — Nunito Bold, blue #2563EB
  * "Best For" — Nunito Bold, green #4A8B35
- 4 data rows, alternating #ffffff / #f9fafb
- Row borders: 0.5px #e8e8e8
- Each row:
  * Concept: colored dot + Nunito Bold 16px
  * Description: Caveat 17px, key terms yellow #FFEF5A highlighted
  * Best For: Nunito Bold 14px, green #4A8B35

PRO TIP BOX:
- Border-left 4px #C0392B
- Background #fffdf0
- "★ KEY TAKEAWAY" Nunito Bold red uppercase
- Caveat italic body text

FOOTER: standard format
      `;

    default: // AWA_CLASSIC
      return `
TEMPLATE: AWA CLASSIC — 7 TIPS
(Style: dense framed guide by Awa K Penn)

Generate a 7-item tips infographic at ${dims.width}×${dims.height}px.

CANVAS:
- Outer wooden frame: 28px, dark brown #3d2b1a, wood grain texture
- Inner content: #FFFFF5 (warm cream)
- Thin cream border #f0e8d8 between frame and content

TITLE (top 17% inner area):
- Dark brown pill badge: background #3d2b1a, white text
- Title: Nunito 900, ~42px, centered
- Brown underline below title

7 ITEMS (main body):
Each item has:
- Colored square/rounded badge with number (1-7):
  Colors: #C0392B, #2563EB, #2E7D32, #D4A017, #8B5CF6, #C0392B, #0D9488
- Sketch-style icon next to number (hand-drawn SVG style)
- Item title: Nunito Bold 20px, #111111
- Item body: Caveat 17px, #444444
- Border-left: 1px rgba(61,43,26,0.15)

FOOTER:
- Border-top: 2px solid #3d2b1a
- Background: #FFFFF5
- Text: brown #3d2b1a, Nunito Bold
      `;
  }
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
  const dimStr = `${dims.width}×${dims.height}`;

  const templatePrompt = getGeminiTemplatePrompt(templateId, extraction, dims);

  return `${GEMINI_UNIVERSAL_STYLE_CONTEXT}

${templatePrompt}

CONTENT TO USE:
Title: ${extraction.title}
Badge/Category: ${extraction.badge}
${extraction.points.map((p, i) => `Point ${i + 1}: ${p.title} — ${p.body}`).join("\n")}
Pro tip: ${extraction.proTip}
Footer: Created with Supen.io | Follow for more

${customPrompt ? `Additional instructions: ${customPrompt}` : ""}

FINAL REMINDER:
- Nunito ExtraBold 900 for ALL titles and headers
- Caveat handwritten font for ALL body text
- Yellow #FFEF5A ONLY as inline highlighter on specific words
- Background #f8f9f7 (never pure white)
- Dense content — fill 80% of canvas
- Hand-crafted aesthetic, NOT corporate slide
- Dimensions: ${dimStr}px`;
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

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


// ─── Gemini Image prompt builder — forensic specs from 12 Awa K Penn references ───

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
(Exact reference: "How to Master ChatGPT in 2 Minutes" by Awa K Penn)

Canvas: ${W}×${H}px

PHYSICAL SURFACE:
- Background: #f8f9f7 off-white with visible paper grain texture (3-4% noise opacity)
- 4 small dark gray metallic rectangular clips at each corner (~12×18px, color #777777)
- Very subtle border: 0.5px #e0e0e0 around entire canvas edge
- Must look like a real physical whiteboard that's been photographed

TITLE ZONE (top 10%):
- "[${extraction.title}]" — with LITERAL square brackets
- Font: extremely thick hand-drawn marker pen (like Nunito Black weight 900)
- Size: ~48px, black #111111, centered
- Below title: 2px red underline spanning 80% width, color #C0392B

YELLOW SECTION BANDS:
- 2-3 full-width yellow #FFEF5A background strips across the layout
- Black bold text centered on each band (e.g., "STRUCTURE YOUR PROMPT", "FEATURES")
- These act as visual section dividers — like highlighting an entire line with a marker
- Height: ~30px per band

CONTENT ZONE (10% to 92% — MUST FILL):
Pack ${Math.max(pointCount, 7)} sections DENSELY. No empty space allowed.

For each section:
- Section header: heavy bold colored text, 20px
  Colors cycle: #C0392B → #2563EB → #4A8B35 → #F5922A → repeat
- 2px colored underline under EVERY header (matching header color)
- 2-4 bullet points per section with colored • markers
- Body text: handwritten casual style (Caveat-like), 15-17px, #111111
- Yellow #FFEF5A flat highlight behind 1 KEY TERM per section
- Hand-drawn circle/oval badge with number for each section (stroke style, not filled)

DECORATIVE MUST-HAVES:
- ✓ Red checkmarks #C0392B on positive items
- ★ Orange stars #F5922A next to important sections
- → Arrow symbols between connected elements
- Colored letter-in-square badges for any framework acronyms

FOOTER (bottom 5%):
- "Follow Awa K Penn for more amazing AI content | Repost ↺"
- Handwritten bold, 18px, creator name in blue #2563EB underlined

DENSITY RULE: Content MUST fill from title to footer with ZERO visible empty space.
The canvas should look like a dense study reference sheet, not a sparse slide.
`;

    case "NOTEBOOK":
      return `
TEMPLATE: SPIRAL NOTEBOOK
(Exact reference: "9 Free Courses for Building AI Agents" by Awa K Penn)

Canvas: ${W}×${H}px

SPIRAL BINDING (top 6% = ~${Math.round(H * 0.06)}px):
- 20 metallic oval spiral coils spanning full width
- Each coil: oval ~36px wide × 26px tall
- Color: silver-gray #a39581
- 3D shading: light side #c8c0b0, shadow side #7a7060
- CRITICAL: coils overlap paper edge — pass in FRONT and BEHIND the page
- This must look like a real spiral-bound notebook

PAGE TEXTURE (below spiral):
- Background: warm cream #fffef8 (like actual notebook paper)
- Horizontal ruled lines: #dde8f0, 0.5px, every 34px, spanning full width
- Red vertical margin line: #E63946, 1.5px, at x=72px from left edge
- Paper grain texture: 4-5% opacity

TITLE (top 16%, below spiral):
- Multi-color word treatment — EACH key word in a DIFFERENT accent color:
  * Numbers: GREEN #4A8B35, very bold, ~56px
  * Key adjectives: RED #C0392B with underline
  * Main nouns: dark BLUE #1a3d7c, bold
  * Tech terms (AI, etc.): yellow #FFEF5A background behind red text
- Font: handwritten bold (Caveat Bold 700), 52-56px
- Red curved arrow ↓ drawn after title

CONTENT (25% to 85%):
${pointCount >= 5 ? `Data table with columns:
- Column 1: "#" — hand-drawn oval number badges (01, 02, 03... in red)
- Column 2: "Provider" — Nunito Bold, blue #2563EB
- Column 3: "Course Title" / topic — Caveat style, dark
- Column 4: "Duration" / detail — green #4A8B35
- Column 5: "Instructor" / source — alternating colors
- Alternating row backgrounds: transparent / very light gray
- Thin horizontal lines between rows` :
`Numbered list:
- Each number in hand-drawn oval badge (stroke style)
- Item title: Nunito Bold 16px, green or blue
- Item body: Caveat 15px, black
- Key terms highlighted yellow #FFEF5A inline`}

FOOTER (bottom 10%):
- Curved decorative arrows ↙ left and ↗ right
- "Follow for more | Repost ↺" — Caveat Bold 26px
- Creator name: blue #2563EB, bold, underlined

DENSITY: Fill the notebook page completely. No blank ruled lines at bottom.
`;

    case "COMPARISON":
      return `
TEMPLATE: 3-COLUMN COMPARISON
(Exact reference: "Claude Opus 4.6 vs ChatGPT 5.4 vs Gemini 3.1 Pro" by Awa K Penn)

Canvas: ${W}×${H}px

BACKGROUND: #f5f5f0 with paper texture and very subtle shadow/frame edge

TITLE (top 8%):
- "[${extraction.title}]" with LITERAL square brackets
- Each item name in its OWN accent color, underlined:
  * Item 1: blue #2563EB
  * Item 2: green #4A8B35
  * Item 3: red/orange #C0392B
- "vs" in black regular weight between items
- Font: heavy hand-drawn sans-serif, 28-32px

COLUMN LAYOUT (8% to 92%):
- 3 equal vertical columns
- Thin separator lines between columns: #cccccc, 0.5px
- Product/brand icon at top of each column

EACH COLUMN HAS THESE EXACT SECTIONS (ALL MANDATORY):
1. "DESCRIPTION:" — bold colored label, underlined + Caveat body text 13px
2. "WHEN TO USE IT:" — bold colored label + bullet points with → arrows
3. "USE CASES:" — bold colored label + bullet points
4. "STRENGTHS:" — GREEN #4A8B35 label + positive bullet points
5. "WEAKNESSES:" — RED #C0392B label + negative bullet points
6. "PRO TIP:" — label on yellow #FFEF5A background + Caveat body

Column accent colors:
- Column 1: blue #2563EB for all headers
- Column 2: green #4A8B35 for all headers
- Column 3: orange #F5922A for all headers

KEY DETAILS:
- Yellow #FFEF5A highlights on specific metrics/numbers within text
- ✓ checkmarks for strengths, ✗ for weaknesses
- Body text: handwritten Caveat 12-14px
- Every section header is colored, bold, and underlined

FOOTER (bottom 5%):
- "Follow Awa K Penn for more amazing AI content | Repost ↺"

DENSITY: ALL 6 sections MUST appear in EVERY column. Columns filled top to bottom.
`;

    case "FUNNEL":
      return `
TEMPLATE: FUNNEL PROCESS FLOW
(Exact reference: "The Personal Branding Funnel (2026)" by Awa K Penn)

Canvas: ${W}×${H}px

BACKGROUND: light gray/off-white #f5f5f0 with subtle paper texture
The whole image should look like a whiteboard sketch

TITLE (top 12%):
- "${extraction.title}" — very heavy hand-drawn marker pen style
- Black #111111, 52-60px, centered
- Year in parentheses if present

FUNNEL SHAPE (center-left, occupying 50% width × 55% height):
- Large trapezoid narrowing from top to bottom
- Wide top: ~${Math.round(W * 0.55)}px, narrow bottom: ~${Math.round(W * 0.25)}px
- Outline: hand-drawn IRREGULAR strokes (slightly wobbly, like drawn freehand)
- Stroke: black #333333, 2.5px
- Fill: warm cream/tan #f5e6c8, gradient slightly darker toward bottom
- Divided into ${Math.min(pointCount, 4)} horizontal sections

SECTION LABELS (inside/overlapping funnel):
Each section has:
- White rectangle label box with thin red border #C0392B
- Bold ALL CAPS text: "1. ${extraction.points[0]?.title || "THEY NOTICE YOU"}"
- Below each label: 2-3 lines with red ✓ checkmarks + handwritten text (Caveat 14px)

CHARACTER (right side, ~25% of canvas):
- Cartoon man in business casual: blue shirt, gray vest, glasses
- Standing pose, pointing at the funnel with one hand
- Art style: bold line-art outlines, flat color fills
- Friendly, confident expression
- This character is ESSENTIAL to the Awa K Penn funnel style

DECORATIONS:
- 6-8 gold sparkle stars ✦ ★ scattered around funnel
  Colors: #F5C518 and #E8B800, mix solid/outline, 8-16px
- Two large curved RED arrows (↙ left side, ↘ right side) flanking funnel
  Color #C0392B, stroke 3-4px, hand-drawn curve style

CTA BOX (bottom 10%):
- Hand-drawn rectangle (slightly imperfect strokes, 1.5px black)
- "Save this →" in bold + brief description text
- Arrow drawn pointing to box from above

FOOTER: discreet gray text, small
`;

    case "DATA_GRID":
    case "STATS_IMPACT":
    case "AWA_BREAKING":
      return `
TEMPLATE: DENSE DATA REFERENCE POSTER
(Exact reference: "The Complete Guide to Human Productivity Systems" by Awa K Penn)

Canvas: ${W}×${H}px

BACKGROUND: #f5f5f0 off-white with paper texture

TITLE (top 8%):
- "${extraction.title}" — very heavy black ALL CAPS sans-serif
- 40-48px, centered
- Subtitle below: lighter weight, 14px, #666666

LAYOUT: Multi-section dense reference poster with 4+ distinct zones:

SECTION 1 — FRAMEWORK MODEL (top 20%):
- "SECTION 1 — THE CORE FRAMEWORK" header with colored underline
- Horizontal row of 3-4 colored rounded boxes representing pillars/categories
- Each box: colored background (#4A8B35, #2563EB, #F5922A, #0D9488)
- White text inside: category name + brief description

SECTION 2 — TOPIC GRID (20-45%):
- "SECTION 2 — KEY CONCEPTS" header with colored underline
- 2×3 or 3×3 grid of colored rounded boxes
- Each box: pastel background tint + bold title + body text
- Colors: blue, green, yellow, orange tints

SECTION 3 — BEHAVIORAL PATTERNS (45-65%):
- "SECTION 3 — APPLICATION" header
- Table or card layout with colored cells
- Each cell: colored left border + concept + description

SECTION 4 — COMPARISON TABLE (65-90%):
- Full data table: 4-5 rows × 4-5 columns
- Header row: colored backgrounds (#C0392B, #2563EB, #4A8B35...)
- Alternating row backgrounds
- Dense text filling every cell

CONTENT TO DISTRIBUTE:
${extraction.points.map((p, i) => `${i + 1}. ${p.title}: ${p.body}`).join("\n")}

FOOTER (bottom 5%):
- "Follow Awa K Penn for more amazing AI content"

DENSITY: This is the DENSEST template. 95%+ canvas fill. Like a reference poster.
Every square centimeter must contain useful content.
`;

    default: // AWA_CLASSIC
      return `
TEMPLATE: AWA CLASSIC FRAMED GUIDE
(Exact reference: dense framed reference poster by Awa K Penn)

Canvas: ${W}×${H}px

OUTER FRAME:
- 28px thick border around entire canvas
- Dark brown #3d2b1a with subtle diagonal wood grain lines (15% opacity)
- Thin cream separator #f0e8d8 (2px) between frame and inner content

INNER CONTENT (background #FFFFF5 warm cream):

TITLE (top 15% of inner area):
- Dark brown pill badge: #3d2b1a background, white text, uppercase
- Main title: heavy bold 42px, #111111, centered
- 2px brown underline below title

7 ITEMS (15% to 88% — must fill completely):
${extraction.points.slice(0, 7).map((p, i) => {
  const colors = ["#C0392B", "#2563EB", "#2E7D32", "#D4A017", "#8B5CF6", "#C0392B", "#0D9488"];
  return `Item ${i + 1} (${colors[i]}):
- Colored rounded square badge with "${i + 1}" in white Nunito Bold
- Hand-drawn sketch icon next to number (simple line-art doodle, NOT emoji)
- Title: "${p.title}" — heavy bold 20px, #111111
- Body: "${p.body}" — handwritten Caveat 16px, #444444
- Left border: 1px rgba(61,43,26,0.15)`;
}).join("\n")}

PRO TIP (below items):
- Dashed border, slight background tint
- "★ Pro Tip: ${extraction.proTip}"

FOOTER (bottom 8%):
- Border-top: 2px solid #3d2b1a
- Background #FFFFF5
- "Follow for more | Repost ↺" — brown #3d2b1a, bold

DENSITY: All 7 items must be visible. Content fills frame edge to edge.
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

  return `Generate an educational infographic image that looks EXACTLY like
the viral infographics created by "Awa K Penn" — a popular educational
content creator on social media. The style must replicate the hand-crafted
whiteboard/notebook study notes aesthetic pixel-perfectly.

Image dimensions: ${dims.width}×${dims.height}px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORENSIC STYLE SPECIFICATIONS (measured from 12 reference images)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[TYPOGRAPHY — THE MOST DISTINCTIVE FEATURE]

TITLES: Extremely thick hand-drawn marker-pen style font.
- Must look like someone wrote with a VERY thick permanent marker
- Weight 900+ — the strokes are chunky and bold, not thin or elegant
- Like Nunito ExtraBold, Poppins Black, or heavy marker lettering
- Size: 44-60px depending on length
- Color: #111111 near-black
- Often wrapped in square brackets: [TITLE HERE]

BODY TEXT: Handwritten casual style (like Caveat or Patrick Hand font).
- Slightly irregular letter spacing — like real handwriting
- Casual marker-pen feel, NOT clean/geometric
- Size: 14-18px
- Color: #111111 to #333333

SECTION HEADERS: Same heavy font as titles but smaller (18-24px).
- Each header in a DIFFERENT accent color (cycling through palette)
- EVERY header has a 2px colored underline below it

[EXACT COLOR PALETTE — USE ONLY THESE]

Background: #f8f9f7 (cool off-white — NEVER pure white #ffffff)
Red accent: #C0392B (warm brownish red — for headers, checkmarks, underlines)
Blue accent: #2563EB (confident medium blue — for headers, names, links)
Green accent: #4A8B35 (natural forest green — for headers, positive items)
Orange accent: #F5922A (warm tangerine — for stars, tertiary emphasis)
Yellow: #FFEF5A — used TWO ways:
  1. INLINE HIGHLIGHT: flat background behind specific key words (like a Stabilo marker)
  2. FULL-WIDTH SECTION BANDS: yellow background strips spanning the full canvas width
     with bold black centered text, used as section dividers
Frame brown: #3d2b1a (only for AWA_CLASSIC frame)

[BACKGROUND — PHYSICAL SURFACE FEEL]

- Off-white #f8f9f7 with visible paper grain/noise texture (3-5% opacity)
- Must look like a REAL PHYSICAL SURFACE — whiteboard, notebook, or poster board
- NEVER flat digital white
- The texture should be subtle but visible on close inspection

[CONTENT DENSITY — THE #1 MOST IMPORTANT RULE]

CRITICAL: The infographic must be EXTREMELY DENSE with content.
- Fill 85-95% of the canvas with text and visual elements
- ZERO empty space at the bottom — content fills from top edge to footer
- Minimum 7 distinct sections/points (not 4 or 5 — at least 7)
- Each section has 2-4 bullet points or sub-items
- 200-400 total words of readable text content
- If there's visible empty whitespace, the image has FAILED

Think of it like a dense study reference sheet or cheat sheet that a student
would pin to their wall — every square centimeter packed with useful information.

[DECORATIVE ELEMENTS — MUST BE PRESENT]

✓ Red checkmarks (#C0392B) — on positive/included items
★ Orange stars (#F5922A) — next to important sections
→ Arrows — between connected elements
① ② ③ Circled numbers — hand-drawn oval/circle badges with numbers (stroke style, NOT filled solid shapes — like drawn with a pen)
• Colored bullet dots — matching each section's accent color
[ ] Square brackets — around title in whiteboard templates

NEVER USE EMOJIS. No 🤖 💡 🎯 or any emoji characters.
Use simple hand-drawn sketch doodle icons instead, or no icons at all.

[WHAT THIS STYLE IS NOT]

NEVER create:
- Clean modern corporate slides with gradient backgrounds
- SaaS dashboard / Figma mockup aesthetic
- Dark backgrounds or dark section cards
- Thin or elegant fonts — the title must be CHUNKY and hand-drawn
- Sparse layouts with lots of empty space
- Emoji characters anywhere in the image
- Rounded pastel cards with drop shadows
- More than 4 accent colors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEMPLATE SPECIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${getForensicTemplateSpec(templateId, extraction, dims)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT TO RENDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Title: "${extraction.title}"
Category: "${extraction.badge}"

${extraction.points.map((p, i) =>
  `Section ${i + 1}: "${p.title}"
  Details: ${p.body}`
).join("\n\n")}

Pro tip: "${extraction.proTip}"

Footer: "Follow Awa K Penn for more amazing AI content | Repost ↺"

${customPrompt ? `\nUser instruction: ${customPrompt}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL QUALITY GATE — CHECK EVERY ITEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ ] Title is EXTREMELY thick/bold marker-pen style (weight 900+)
[ ] Body text looks handwritten (Caveat-style, slightly irregular)
[ ] Background is off-white #f8f9f7 with paper grain, NOT pure white
[ ] Yellow #FFEF5A highlights on 3-5 key terms + section bands
[ ] At least 3 accent colors used (red #C0392B, blue #2563EB, green #4A8B35)
[ ] EVERY section header has a colored underline
[ ] Numbers in hand-drawn oval/circle badges (stroke, not filled)
[ ] Content fills 85%+ of canvas — ZERO empty space at bottom
[ ] At least 7 distinct content sections visible
[ ] Footer present with "Follow... | Repost ↺"
[ ] NO emojis anywhere — only hand-drawn doodle icons or none
[ ] Overall feel: hand-crafted study notes, NOT corporate design

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

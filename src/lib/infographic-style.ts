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

  // Priority 1: 3-entity comparison → COMPARISON3 (3-column layout)
  if (has3Entities || hasMultiVs) {
    templateId = "COMPARISON3";
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
  // Priority 4: 2-entity comparison or tiers → COMPARISON_VS
  else if (p.hasComparison) {
    templateId = "COMPARISON_VS";
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

  // Pass 1: numbered/bulleted lines (look for many points)
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[\d\.\-•→\*▸☑✦↳]\s*/.test(trimmed)) {
      const text = trimmed.replace(/^[\d\.\-•→\*▸☑✦↳\s]+/, "").trim();
      if (text.length > 10 && points.length < 20) {
        const colonSplit = text.split(/[:—–]/);
        if (colonSplit.length >= 2) {
          points.push({ title: colonSplit[0].trim().slice(0, 60), body: colonSplit.slice(1).join(":").trim().slice(0, 250) });
        } else {
          // If no colon, try to split by first few words as title
          const words = text.split(/\s+/);
          if (words.length > 10) {
            points.push({ title: words.slice(0, 5).join(" ").slice(0, 50), body: words.slice(5).join(" ").slice(0, 250) });
          } else {
            points.push({ title: text.slice(0, 45), body: text.slice(0, 250).trim() });
          }
        }
      }
    }
  }

  // Pass 2: sentences (if we don't have enough points)
  if (points.length < 10) {
    const sentences = content.match(/[^.!?\n]+[.!?]+/g) || [];
    for (const s of sentences) {
      const trimmed = s.trim();
      if (trimmed.length > 30 && points.length < 20) {
        const words = trimmed.split(/\s+/);
        points.push({ title: words.slice(0, 5).join(" ").slice(0, 50), body: trimmed.slice(0, 250).trim() });
      }
    }
  }

  const proTip = generateProTip(content);

  // Build sections from points (aiming for 7-10 sections)
  const sections: Section[] = [];
  const finalPoints = points.slice(0, 20); // Extract up to 20 for density
  
  // Adaptive grouping: if we have many points, group by 2. If few, group by 1.
  const groupSize = finalPoints.length > 12 ? 2 : 1;
  
  for (let i = 0; i < finalPoints.length; i += groupSize) {
    const group = finalPoints.slice(i, i + groupSize);
    sections.push({
      header: group[0]?.title?.toUpperCase() || `SECTION ${sections.length + 1}`,
      bullets: group.map(p => {
        // Use specific symbols based on content
        const symbol = /step|étape/i.test(p.title) ? "→" : "☑";
        return `${symbol} ${p.title}${p.body && p.body !== p.title ? ` — ${p.body}` : ''}`;
      }),
    });
    if (sections.length >= 10) break; // Hard limit at 10 sections
  }

  return { title, badge, subtitle, points: finalPoints, sections, proTip };
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

  return { title, points: points || [], stats: stats || [], keywords: keywords || [], quotes: quotes || [], contentType: contentType || "general" };
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
- 4 metallic corner clips (12x20px, dark gray #555555) at each corner
- 1px border #dddddd around canvas, border-radius 6px
- Soft shadow: box-shadow 0 4px 24px rgba(0,0,0,0.08)

TITLE BLOCK (top 12% of canvas):
- Title: "${extraction.title}" — Nunito Black 900, 52-56px, #111111, centered
- [SQUARE BRACKETS] around title are mandatory
- Colored underline below title: 2-3px, color #C0392B, full width minus 40px margins

CONTENT (12% to 93% height):
- Left/right padding: 40px
- Each SECTION has:
  * SECTION BANDS: Full-width yellow #FFEF5A background strip with bold black text for major section labels
  * Section header: Nunito Bold 22-26px, colored (#C0392B or #2563EB or #4A8B35)
  * Colored underline 2.5px under header, same color
  * Bullets: colored • symbols, Caveat 500 18-20px, #111111
  * Key terms: yellow #FFEF5A background highlight (inline, flat, no rounded corners)
  * Tool/platform names: blue #2563EB bold underlined
  * Numbered badges: Hand-drawn oval circles with numbers (01, 02...)

DENSITY: 7-10 sections mandatory. 85-95% canvas fill. No empty space at bottom.
 
SECTIONS TO RENDER:
Badge: ${extraction.badge}
${extraction.sections.map(s => `\n### ${s.header}\n${s.bullets.join('\n')}`).join('\n')}
Pro tip: ${extraction.proTip}
 
FOOTER BAND (mandatory):
- Height: 65px at bottom
- Background: #111111 (dark)
- Text: "Follow for more AI systems | Repost ♻️" — Nunito Bold 16-18px, color #ffffff, centered
- Logo: Small white star symbol ✦ on left/right of text`;

    case "NOTEBOOK":
      return `Generate a NOTEBOOK infographic at ${dimStr}px.

CANVAS:
- Background: #fffef8 (warm cream)
- SPIRAL BINDING: 20-22 metallic coils at top edge, 70px tall
- RULED LINES: horizontal #dde8f0, 0.5px, every 34px
- RED MARGIN: vertical #E63946, 1.5px, at x=72px

CONTENT:
- Title: "${extraction.title}" — Caveat Bold 52-56px, each word in different color (#C0392B, #2563EB, #4A8B35)
- Sections: 7-10 sections
- Point numbers: Blue #2563EB Nunito Bold, 01, 02...
- Bullet text: Caveat 500, 16-18px
- Key terms: yellow #FFEF5A inline highlight

SECTIONS:
${extraction.sections.map(s => `\n### ${s.header}\n${s.bullets.join('\n')}`).join('\n')}
Pro tip: ${extraction.proTip}

NO footer. End with "Follow for more | Repost ↺" in center.`;

    case "COMPARISON3":
      return `Generate a 3-COLUMN COMPARISON infographic at ${dimStr}px.

CANVAS: Background #f5f5f0, dot grid bg.

LAYOUT:
- 3 equal vertical columns with thin #cccccc separators
- Column 1 (Blue #2563EB), Column 2 (Green #4A8B35), Column 3 (Red #C0392B)
- Each column header: Bold ALL CAPS in matching color, underlined

CONTENT:
- Title: "${extraction.title}" in [SQUARE BRACKETS]
- Body: Caveat 500, 14-16px
- Use yellow #FFEF5A highlights on key metrics/numbers

SECTIONS:
${extraction.sections.map(s => `\n### ${s.header}\n${s.bullets.join('\n')}`).join('\n')}
Pro tip: ${extraction.proTip}`;

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
- Minimum 7-10 distinct sections per infographic (never less)
- Each section must have a title AND 2-4 sub-bullets
- An infographic with less than 7 sections will be REJECTED
- Content must fill 85-95% of the canvas visually
- NO empty zones at the bottom — content must stretch top to bottom
- NO emojis anywhere in the text ( forbidden in this style)
- NO placeholder text like "lorem ipsum"
- Every point must be specific and actionable

RAPPEL FINAL :
- Nunito 900 pour TOUS les titres (Bold Marker style)
- Caveat pour TOUT le corps de texte (Handwritten style)
- ZERO EMOJI — use symbols like • → ✓ ★ instead
- Styles INLINE uniquement (style="...")
- Background off-white (#f8f9f7 or #fffef8)
- Generate ONLY the complete HTML code
- Commence par <!DOCTYPE html> et termine par </html>
- All visible text must be in ENGLISH
- Fill the entire canvas! Density is key.`;
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
  // template parameter is preserved for back-compat with call sites but no
  // longer drives branching — the layout is auto-picked from the content.
  void template;

  const rawExt = extractForDallE(content);
  const ext = {
    title: rawExt?.title || "Key Insights",
    points: rawExt?.points || [],
    stats: rawExt?.stats || [],
    keywords: rawExt?.keywords || [],
    quotes: rawExt?.quotes || [],
    contentType: rawExt?.contentType || "general",
  };
  const pl = platform?.toLowerCase() || "";

  let formatHint = "Portrait format.";
  if (pl.includes("linkedin")) formatHint = "Portrait (1024x1536). LinkedIn-optimized.";
  else if (pl.includes("facebook")) formatHint = "Square (1080x1080). Facebook-optimized.";
  else if (pl.includes("instagram")) formatHint = "Portrait (1024x1536). Instagram-optimized.";
  else if (pl.includes("twitter") || pl.includes("x (")) formatHint = "Landscape (1536x1024). X/Twitter-optimized.";

  const isFacebook = pl.includes("facebook");
  const isLinkedIn = pl.includes("linkedin");

  // Hard typography quality control — runs for ALL platforms.
  // Image generators (Gemini Nano Banana, Imagen, etc.) frequently
  // invent words, drop accents, truncate, or render gibberish letter
  // shapes. We can't OCR the output cheaply, so the only lever is to
  // make these rules screamingly explicit at the start of the prompt.
  const typographyQualityControl = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEXT QUALITY CONTROL — NON-NEGOTIABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every word that appears in the image MUST be a real word from the
text I provide below. Treat the provided text as SACRED — copy it
character-for-character into the corresponding cell.

ABSOLUTE RULES:
- ZERO invented words. ZERO made-up letter shapes. ZERO gibberish.
- ZERO typos. Every word must be spell-correct in standard English.
- ZERO truncation. Words must fit fully inside their cell — if a word
  doesn't fit, REDUCE THE FONT SIZE rather than break or cut letters.
- ZERO repeated words on the canvas (no "Save Save", "the the", "and
  and"). If you see a duplicate while drafting, fix it before render.
- ZERO orphan letters / dangling syllables. A word that starts must end.
- PRESERVE accents and special characters EXACTLY as written
  (é, è, ê, à, ñ, ç, ü, ö — never strip them, never replace with the
  base letter).
- PRESERVE punctuation: apostrophes, quotation marks, commas, periods,
  colons, dashes — they belong where I put them.
- NEVER add bonus words "to fill space". Empty space is acceptable;
  fake words are not.

When in doubt:
1. Cut content rather than corrupt it.
2. Use fewer cells with more legible text rather than more cells with
   garbled text.
3. The text I give you below is the only source of truth. Anything
   not in that block must NOT appear in the image.

If you cannot render a specific word cleanly at the chosen size,
RESIZE OR REPOSITION until you can. Do not approximate the shapes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const facebookRules = isFacebook ? `

FACEBOOK SPECIFIC RULES (override defaults — non-negotiable):
- Square format 1080x1080px (NOT portrait, NOT landscape)
- Larger text than LinkedIn — Facebook readers scroll faster, type must be bigger
  (titles 44-56px, body 22-28px — increase by ~30% vs LinkedIn)
- Maximum 5 sections (NOT 8) — fewer, denser blocks
- Every word spell-checked — zero typos, zero hallucinated words
- No repeated words anywhere on the canvas (no "Save Save", no "the the")
- Complete sentences only — no truncated phrases, no orphan fragments
- High contrast text on background — dark text on light, or vice-versa
  (target WCAG AA: contrast ratio ≥ 4.5:1 for body, ≥ 3:1 for titles)
- Single visual focal point per section — don't compete for attention
- Square layout: 2x2 or 1+3 grid only (never 3+ rows of small text)` : "";

  // LinkedIn premium enrichment — kicks the visual creativity up a notch
  // for the platform where infographic engagement is highest.
  // Adds asymmetry, depth, layered backgrounds, prominent pull quotes,
  // and varied highlight styles on top of the base matrix dashboard.
  const linkedinPremiumBlock = isLinkedIn ? `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LINKEDIN PREMIUM ENRICHMENT — go beyond the matrix
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LinkedIn rewards infographics that look DESIGNED, not just structured.
Apply these enrichments on top of the matrix dashboard rules:

LAYOUT NUANCE:
- Asymmetry over symmetry — at least one cell breaks the strict grid
  (e.g. a wide horizontal cell at the top OR a tall featured cell on
  one side). Pure 2×3 grids look like spreadsheets; broken grids
  look like editorial layouts.
- Layered background — under the cells, place ONE soft graphic
  element (a hand-drawn circle, a torn-paper edge, a faint grid, a
  geometric blob) at low opacity. It anchors the composition without
  competing.
- Visual depth — use soft drop shadows on 1-2 hero cells, while
  flatter cells stay shadow-free. The shadow draws the eye to the
  insight that matters most.

TYPOGRAPHY POLISH:
- Mix font weights MORE: have at least one oversized stat (96-144px)
  contrasted with body text at 22-28px. Big number = scroll-stopper.
- Use italic AND bold variations, not just bold.
- Custom underlines (wavy, double, brush-stroke) on the title and
  one key noun per cell — never simple straight lines.

PULL QUOTE TREATMENT:
- If the content has a strong one-liner, give it its OWN feature cell
  with: oversized opening quote mark in accent color, italic body,
  small attribution line below ("— from the post"). This cell should
  feel like a magazine pull quote, not just a text block.

COLOR / HIGHLIGHT VARIATION:
- Beyond yellow highlighter: use ALSO blue underline, pink scribble
  circle, green checkmark accent. Three different highlight styles
  across the canvas — never the same treatment twice.
- Background tint VARIATION: 2-3 of the cells should have a faint
  pastel fill (cream, sage, lavender, peach) while others stay on
  the main background. This adds depth without breaking cohesion.

DECORATIVE ELEMENTS (sparse, premium):
- 1-2 hand-drawn arrows or doodle elements (not in every cell — that
  becomes noise).
- One small "stamp" or "seal" graphic in a corner (e.g. "PROVEN",
  "2026 EDITION") — adds editorial credibility.
- Subtle grain or paper texture on the background — never glossy,
  never flat-vector clean.

DENSITY TARGET (LinkedIn specifically):
- LinkedIn users dwell longer than other platforms. Push to 6-7
  cells with rich content per cell rather than 4-5 sparse cells.
- Each cell must reward a 3-second pause: a real insight, a real
  number, a real action. No filler.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : "";

  const AVOID = "blurry, cluttered, messy layout, more than 4 accent colors, realistic photo, 3D render, low resolution, bad typography, misaligned text, dark background, pastel SaaS rounded cards, generic stock photo, emojis (🤖💡📚 etc.), gradients, lorem ipsum, repeated bullets, truncated words.";

  // ─────────────────────────────────────────────────────────────────
  // AWA K. PENN PROMPT BUILDER FOR GEMINI 2.5 FLASH IMAGE (Nano Banana)
  // ─────────────────────────────────────────────────────────────────
  // Auto-picks one of 3 layout families based on the user's content,
  // then injects pixel-precise spec + verbatim text + a worked
  // reference example. Specs sourced from infographic-reference-specs.ts
  // (12 references analyzed at pixel level).
  // ─────────────────────────────────────────────────────────────────
  {
    type AwaLayout = "DENSE_WHITEBOARD" | "HIGHLIGHT_BOX" | "CHEAT_SHEET";

    // ── Layout family auto-selection ──
    const sectionsCount = ext.points.length;
    const hasComparison = /\bvs\.?\b|\bversus\b|compared\s+to|column\s+\d|table/i.test(content);
    const hasFramework = /\b(framework|formula|blueprint|matrix|cheat\s*sheet|templates?|playbook|method)\b/i.test(content);
    const hasPlaceholders = /\[[A-Z][^\]]{1,40}\]/.test(content); // [FOLDER NAME] style
    const verbLed = /^[\s\-•*\d.)]*\s*(create|build|connect|use|find|setup|configure|enable|learn|browse|search|access|design|launch|automate|master|generate|repurpose)\b/im.test(content);

    let awaLayout: AwaLayout;
    if (hasFramework || hasComparison || hasPlaceholders || sectionsCount >= 8) awaLayout = "CHEAT_SHEET";
    else if (verbLed && sectionsCount >= 3 && sectionsCount <= 5) awaLayout = "HIGHLIGHT_BOX";
    else awaLayout = "DENSE_WHITEBOARD";

    // ── Background variation ──
    const backgrounds = ["warm cream #f8f9f7", "off-white #fffef8", "paper white #f5f5f0", "light cream #fefcf6"];
    const bgChoice = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    // ── Verbatim content block (used by all 3 layouts) ──
    const sourceTextBlock = `MAIN TITLE (display verbatim, no rephrasing): "${ext.title}"
${ext.points.length > 0 ? `\nSECTIONS / BULLETS (use VERBATIM — do not paraphrase, do not invent extras):\n${ext.points.map((p, i) => `  ${i + 1}. "${p}"`).join("\n")}` : ""}
${ext.stats.length > 0 ? `\nKEY NUMBERS (display as oversized callouts inside their cell):\n${ext.stats.map((s) => `  → ${s}`).join("\n")}` : ""}
${ext.keywords.length > 0 ? `\nKEY TERMS (paint flat yellow #FFEF5A highlighter under each):\n  ${ext.keywords.slice(0, 6).join(", ")}` : ""}
${ext.quotes.length > 0 ? `\nPULL QUOTE (give its own card with oversized opening quote mark):\n  "${ext.quotes[0]}"` : ""}`;

    const handle = userName ? userName.replace(/^@/, "").replace(/\s+/g, "").toLowerCase() : "awakpenn";

    // ── SHARED STYLE BIBLE — Awa K. Penn whiteboard DNA ──
    const styleBible = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AWA K. PENN VISUAL DNA — every rule is non-negotiable
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CANVAS:
- Background: ${bgChoice}, with a subtle paper grain at 3-5% opacity (visible texture, not noisy).
- 4 metallic corner clips (12px wide × 18px tall, dark gray #555555, slight 3D bevel) inset 6px from each corner. They look like real whiteboard mounting clips.
- Hand-drawn imperfections everywhere — wobbly lines, slightly irregular strokes, NEVER perfectly geometric.

TYPOGRAPHY (TWO fonts only — no third):
- Title: extremely heavy hand-drawn sans-serif, like a thick black permanent marker.
  Size 48-56px. Weight 900+. Stroke width 8-12% of letter height. Slight stroke-weight variation.
- Body: handwritten casual (Caveat / Patrick Hand feel). Size 14-18px. Weight 400-500. Slightly irregular letter spacing — like a real Sharpie marker on paper.
- Section headers: same heavy sans-serif but smaller (18-22px), with 2px slightly wavy colored underline matching the section accent.
- All text in ENGLISH. ZERO truncation. ZERO invented words. PRESERVE accents and punctuation EXACTLY.

PALETTE (5 colors max — never more):
- Red    #C0392B  warm brownish red — headers, ✓ checkmarks, warnings, underlines
- Blue   #2563EB  medium confident blue — headers, names, links, creator handle
- Green  #4A8B35  natural forest green — positive items, headers
- Orange #F5922A  warm tangerine — tertiary accent, ★ stars
- Yellow #FFEF5A  HIGHLIGHTER ONLY — flat rectangular background behind specific words OR full-width section bands

YELLOW HIGHLIGHTER — exactly two valid uses:
  1. Inline word highlight: flat yellow rectangle behind a key noun (NO rounded corners, looks like a Stabilo Boss marker stroke). 3-5 instances total.
  2. Section bands: full-width yellow strip ~36-42px tall with bold black centered ALL-CAPS text inside. Use 2-4 of these to group sections.
NEVER use yellow as a card background, border color, or decorative fill.

SKETCH ICONS (NOT emojis):
- Hand-drawn black line-art icons (single weight ~2px stroke), like a quick whiteboard marker drawing.
- Topics: graduation cap, books stacked, gears, lightbulb, calendar, magnifying glass, megaphone, file folder, mailbox, person silhouette, t-shirt, sofa/room, coin/dollar, smartphone, clock, receipt, globe, etc.
- Each section gets ONE small thematic illustration (60-100px) on the right side OR above the section text. Match the section topic — not a generic icon.
- ZERO emojis (🤖, 💡, 📚 etc.). ZERO 3D / photo-realistic icons.

DECORATIVE ELEMENTS (used sparingly, premium feel):
- Hand-drawn arrows (curved or straight) connecting related sections, with tiny micro-copy near them ("then →", "leads to").
- Small ★ stars in #F5922A near important callouts.
- ✓ red checkmarks for positive items.
- Hand-drawn rectangular borders around sections — wobbly, NOT perfectly straight.
- [SQUARE BRACKETS] sometimes wrap the main title.

DENSITY TARGET (THE most important metric):
- 85-95% of canvas filled with ink. Less than 5% empty space at the bottom.
- 7-10 distinct content units (sections + sub-modules).
- 200-400 words of actual content total.
- Every cm² rewards a 2-second pause: a real number, a real tool name, a real action, a concrete example.

FOOTER (bottom 6-8% of canvas):
- Hand-drawn horizontal divider line spanning the canvas.
- "Follow @${handle} for more amazing AI content | Repost ↻" — handwritten bold 22px.
- The handle (@${handle}) in blue #2563EB, bold, underlined.
- Small curved hand-drawn arrow doodle (↗ or ↙) flanking the text on one side.

INSTANT REJECTION (do not produce):
- Pure white #ffffff backgrounds
- Dark backgrounds or dark cards
- Gradients on text or backgrounds
- Emojis anywhere
- Pastel SaaS-dashboard rounded cards with drop shadows
- Photography or 3D-rendered icons
- More than 4 accent colors
- Thin/light font weights for titles
- Lorem ipsum, vague filler ("this is important", "this is essential")
- Repeated section headers, duplicate bullets
- Cut-off / truncated / orphan letters
${typographyQualityControl}
${facebookRules}
${linkedinPremiumBlock}`;

    // ──────────────────────────────────────────────────────────────
    // LAYOUT 1 — DENSE WHITEBOARD (numbered sections + yellow bands)
    // Matches: "Make Money With Nano Banana 2026", "Master Claude in 2 Minutes",
    //          most Awa K. Penn whiteboard cheat-sheets
    // ──────────────────────────────────────────────────────────────
    if (awaLayout === "DENSE_WHITEBOARD") {
      return `Generate ONE high-quality infographic image. Fill the canvas top-to-bottom and edge-to-edge.

${formatHint}
${styleBible}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT — DENSE WHITEBOARD (Awa K. Penn signature)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build the canvas top → bottom in this exact order:

[1] 4 corner clips (mandatory).

[2] TITLE BLOCK (top 12% of canvas):
    - Heavy black marker title centered, ALL CAPS. Often inside [SQUARE BRACKETS].
    - 1-2 key words wrapped in flat yellow #FFEF5A highlighter strokes.
    - Subtitle below in italic handwritten 14-16px, dark gray #555.
    - 2-3px slightly wavy red underline #C0392B below the subtitle, full-width minus 60px margins.

[3] CONTENT GRID (12% to 88% of canvas height):
    - 5-7 numbered sections, stacked vertically (or 2 columns if many short sections).
    - INSERT 2-3 full-width YELLOW BANDS (#FFEF5A, ~38-42px tall) between sections to label thematic groups (e.g., "TOP MODELS", "WORKFLOW", "GET CLIENTS"). Bold black centered ALL-CAPS text inside each band. These bands are visual oxygen — DO NOT skip them.
    - Each section module:
        a. Hand-drawn oval/circle badge top-left (~40px), with the section number 01/02/03... in handwritten style, badge color rotates Red→Blue→Green→Orange→Purple→Teal.
        b. Section header (Nunito 800, 22px) with a 2px slightly wavy underline in the section color.
        c. 2-4 bullet sub-points in handwritten body 16-18px, dark text. Each bullet starts with a small colored • dot in the section color.
        d. 3-5 inline yellow highlights on key nouns inside the bullets (across the whole canvas).
        e. ONE small thematic SKETCH ICON (60-90px black line-art) on the RIGHT side of the section. The icon MUST match the section topic — graduation cap for "learn", gears for "automate", magnifying glass for "research", megaphone for "marketing", t-shirt for "print on demand", room with sofa for "real estate staging", folder for "organize", calendar for "schedule".

[4] FOOTER (bottom 6-8%):
    - Hand-drawn horizontal divider line.
    - "Follow @${handle} for more amazing AI content | Repost ↻" — handwritten bold 22px.
    - @${handle} in blue #2563EB bold underlined. Small curved arrow doodle flanking it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT TO RENDER (verbatim — do not paraphrase, do not invent)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sourceTextBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WORKED REFERENCE EXAMPLE — match this density and module mix
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Below is the kind of layout we expect. Copy the DENSITY, the YELLOW BANDS, the NUMBERED BADGES, and the SKETCH ICONS. Use YOUR content from above — do NOT reuse these words.

[Cream paper #f8f9f7, 4 metal clips at corners.]
[Title centered: "[THE ULTIMATE GUIDE TO MAKING MONEY WITH NANO BANANA (2026)]" in heavy black marker. The words "NANO BANANA" wrapped in a yellow highlighter stroke. Subtitle below in italic 14px: "From AI Image Generator to Scalable Business Engine".]

[Yellow band #FFEF5A ~40px tall, full-width: "TOP BUSINESS MODELS FOR 2026"]

  Section 01 (red badge + red header) — "Print-on-Demand (Passive Route)"
    • Strategy: Market Research (Etsy/Amazon)
    • Recreate Style (Avoid Copyright)
    • Nano Banana Lifestyle Mockups (e.g., hoodie in coffee shop)
    Sketch icon on the right: hand-drawn t-shirt with a small label tag.

  Section 02 (blue badge + blue header) — "High-End Real Estate Virtual Staging"
    • Service: Empty Room Photo → Nano Banana Adds Furniture
    • Neutral colors, soft natural light
    Sketch icon: line-drawn living room with a sofa and a lamp.

  Section 03 (green badge + green header) — "Digital Products & Ed Resources"
    • Kids' Books / Coloring Pages (Zoo theme, 10 pages, Canva PDF on Etsy)
    • Prompt Engineering Packs (Restaurant Marketing Prompts)
    Sketch icon: a stack of small books and a folder.

[Yellow band: "ADVANCED WORKFLOW LEVELS"]

  Section 04 (orange) — "Level 1: Beginner — One-off prompting in Gemini/AI Studio"
  Section 05 (purple) — "Level 2: Expert — Custom Gems / Style Reference for consistency"
  Section 06 (teal)   — "Level 3: Builder — Connect Nano Banana to APIs (Zapier, Replit) for automation"
  Sketch icon for this group: a small 3-tier pyramid sketch.

[Yellow band: "GET YOUR FIRST CLIENTS"]

  Section 07 (red) — "Local SEO + Sample Edits + Content Arbitrage"
    • Offer free sample edit to a local business
    • Reach out to bakeries, gyms — they need daily content
    • Record screen while editing → post on TikTok/Reels for authority
    Sketch icon: pin on a map + tiny phone screen.

[Hand-drawn divider. Footer: "Follow @awakpenn for more amazing AI content | Repost ↻", handle in blue and underlined, curved arrow doodle next to it.]

End of reference. Now generate ONE image for the user's content above, imitating this DENSITY, YELLOW BANDS, NUMBERED BADGES, and SKETCH ICONS. Use the user's actual title, sections, and bullets — do NOT keep the example's topic.

QUALITY GUARANTEES:
- Every word in the image comes from the CONTENT TO RENDER block above. ZERO invented words.
- 5-7 numbered sections, each fully populated.
- 2-3 yellow bands as section dividers.
- Each section has its own thematic sketch icon — no two icons identical.
- Footer includes the creator handle in blue, underlined.

AVOID: ${AVOID}`;
    }

    // ──────────────────────────────────────────────────────────────
    // LAYOUT 2 — HIGHLIGHT BOX (3-5 colored category boxes + arrows)
    // Matches: "Three Ways to Master Any Skill/Subject With Claude"
    // ──────────────────────────────────────────────────────────────
    if (awaLayout === "HIGHLIGHT_BOX") {
      return `Generate ONE high-quality infographic image. Fill the canvas top-to-bottom and edge-to-edge.

${formatHint}
${styleBible}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT — HIGHLIGHT-BOX CARD STACK ("Three Ways" template)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build the canvas top → bottom in this exact order:

[1] 4 corner clips. Cream/off-white background.

[2] TITLE BLOCK (top 14%):
    - Heavy black marker title centered, ALL CAPS, 2-3 lines max.
    - 1-2 key words wrapped in flat yellow highlighter strokes.
    - Optional red wavy underline below.

[3] STACK OF ${Math.min(Math.max(sectionsCount, 3), 5)} HIGHLIGHT-BOX ROWS (15% → 75%):
    Each row is a horizontal module spanning ~88% canvas width. Each row consists of THREE elements arranged left → right:

    a. CATEGORY BOX (LEFT 25-30% of row width)
       - Big rounded-corner rectangle (corners slightly hand-drawn, ~12px radius).
       - Pastel fill rotating per row: light blue #E3F2FD, light green #E6F4DD, light pink #FCE4EC, light yellow #FFF7C2, light orange #FFE3CC.
       - Inside the box: the category label in heavy black marker, ALL CAPS, 24-32px, possibly multi-line.
       - Tiny sketch decoration below the label (gears, book, graduation cap, etc.) matching the topic.

    b. HAND-DRAWN ARROW (MIDDLE)
       - Big colored hand-drawn arrow → pointing from the category box to the bullets.
       - Arrow color = the row's accent (blue, green, pink, yellow, orange — match the box).
       - Arrow length 120-180px, with a wobbly hand-drawn shaft and chunky arrowhead.

    c. BULLETS + SKETCH ICON (RIGHT 60-65% of row width)
       - 2-4 bullets in dark handwritten body 16-18px.
       - Each bullet starts with a small colored • dot.
       - Inline yellow highlights on key nouns (1-2 per bullet).
       - At the FAR right of the row: a small THEMATIC SKETCH ICON (60-100px black line-art) matching the topic (e.g., chat bubble + skill badge for "create skill", open book for "learning style", stacked books + connector for "Udemy").

[4] OPTIONAL "PROMPT TEMPLATES" SUB-GRID (75% → 90%):
    - If the user's content includes example prompts or sub-templates, render a 2×3 grid of small bordered boxes here.
    - Each small box: a heavily-highlighted title (rotate yellow / green / pink / orange highlights) + 1-3 short italic prompts in 12-14px.
    - Above the grid: a thin hand-drawn divider line + the meta-label "LEARN FROM CLAUDE" or similar (use the user's own meta-label if present).

[5] FOOTER (bottom 6-8%):
    - Hand-drawn divider + "Follow @${handle} for more amazing AI content | Repost ↻".
    - @${handle} in blue #2563EB bold underlined.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT TO RENDER (verbatim — do not paraphrase, do not invent)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sourceTextBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WORKED REFERENCE EXAMPLE — match the highlight-box stack
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Below is the kind of layout we expect. Copy the STACK STRUCTURE, the BOX COLORS, the ARROWS, and the SKETCH ICONS. Use YOUR content above — do NOT reuse these words.

[Cream paper, 4 metal clips. Title: "THREE WAYS TO MASTER ANY SKILL/SUBJECT WITH CLAUDE", with "CLAUDE" highlighted in flat yellow.]

Row 1:
  [Light blue rounded box — "CREATE CLAUDE SKILLS" — bold marker, 3 lines. Tiny gears icon below the label.]
  → Hand-drawn blue arrow →
  [Bullets:
    • You can create Claude skills about a certain topic that teach you a skill step by step.
    • Go to Settings → Capabilities → toggle on Skill Creator. Then type "I want to create a skill on [topic]" and follow the instructions.]
  [Far right: line-art chat bubble with a small "skill" badge inside.]

Row 2:
  [Light green rounded box — "USE CLAUDE'S LEARNING STYLE". Open-book icon below.]
  → Hand-drawn green arrow →
  [Bullets:
    • Topic: Use the built-in learning mode.
    • Log in → open the drop-down "Use Style" → select "Learning". Then start prompting.
    • Claude will respond as a learning guide and structure answers to help you understand and practice.]
  [Far right: line-art open book with a graduation cap on top.]

Row 3:
  [Light pink rounded box — "CONNECT UDEMY BUSINESS". Tiny stacked-books icon below.]
  → Hand-drawn pink arrow →
  [Bullets:
    • Access courses directly inside Claude.
    • Settings → Connectors → search "Udemy Business" → Connect.
    • Pull lessons, topics, and skills into your prompts.]
  [Far right: line-art stack of books with a small Udemy-style mark.]

[Hand-drawn divider line. Sub-section label centered: "LEARN FROM CLAUDE".]
[2×3 grid of small bordered prompt boxes:
  - "EXPLAIN" (highlighted blue): "I want to understand [topic] so that I can explain it to others. Break it down like I am 10 years old. Use one clear example."
  - "CREATE A COURSE" (highlighted green): "I want to build a crash study plan for [subject] so that I can use it in real projects..."
  - "INSTRUCTIONAL GUIDES" (highlighted green): "I want to learn how to [topic] so that I can do it myself..."
  - "LEARN + DEVELOP A SKILL" (highlighted green): "I want to learn [desired skill]..."
  - "ENHANCE PROBLEM-SOLVING" (highlighted orange): "I want to solve [specific problem]..."
  - "80/20 LEARN FASTER" (highlighted pink): "I want to learn about [topic] fast. Identify the most important 20%..."]

[Footer: "Follow @awakpenn for more amazing AI content | Repost ↻", handle in blue underlined, curved arrow doodle.]

End of reference. Now generate ONE image for the user's content above, using the highlight-box stack with their actual category labels and bullets.

QUALITY GUARANTEES:
- Every word from CONTENT TO RENDER above. ZERO invented words.
- ${Math.min(Math.max(sectionsCount, 3), 5)} highlight-box rows minimum, each fully populated.
- Each row has: pastel category box (LEFT) + colored hand-drawn arrow (MIDDLE) + bullets + sketch icon (RIGHT).
- The arrow color matches the box color.
- No two sketch icons identical.

AVOID: ${AVOID}`;
    }

    // ──────────────────────────────────────────────────────────────
    // LAYOUT 3 — CHEAT SHEET (2×3 framework grid / template grid)
    // Matches: "Claude Cowork Templates", framework references with
    //          [PLACEHOLDERS], comparisons, tables, 8+ sections
    // ──────────────────────────────────────────────────────────────
    return `Generate ONE high-quality infographic image. Fill the canvas top-to-bottom and edge-to-edge.

${formatHint}
${styleBible}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYOUT — CHEAT-SHEET DENSE GRID (frameworks / templates)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build the canvas top → bottom in this exact order:

[1] 4 corner clips. Cream/off-white background.

[2] TITLE BLOCK (top 10-12%):
    - Heavy black/red/blue marker title centered, 1-2 lines.
    - First half of title in one color (e.g., red), second half in another (e.g., blue) — like a 2-color marker title. OR all black with 1 word in yellow highlight.
    - Subtitle in italic handwritten 14-16px below, dark gray.

[3] DENSE 2-COLUMN MODULE GRID (12% to 92%):
    - 2 columns × 3 rows = 6 modules MINIMUM (8 if content is rich enough, 4 if it's lean).
    - Each cell is a self-contained module:
        a. Numbered title in heavy marker style at the top of the cell — e.g., "1. The 'Digital Cleanup' (File Management)". Number in red #C0392B, rest in black.
        b. Below the title: small thematic SKETCH ICON (40-60px black line-art) related to the cell topic — folder, calendar, mailbox, megaphone, magnifying glass, receipt, globe, clock.
        c. Below the icon: a bordered TEMPLATE BOX (~60-65% of cell height). Border 2-3px in a rotating color: green #4A8B35, orange #F5922A, red #C0392B, blue #2563EB. Inside the box: the prompt or template text in italic handwritten 12-14px. ALL [PLACEHOLDERS] inside the prompt have a flat yellow #FFEF5A highlight behind them.
        d. Below the bordered box: a small "What happens:" line in red #C0392B bold underlined, followed by a 1-2 sentence explanation in handwritten body 13-15px.
    - Cells separated by hand-drawn vertical line in the middle of the canvas + horizontal lines between rows. The lines are wobbly, not perfectly straight.

[4] OPTIONAL FULL-WIDTH YELLOW BAND between row 1 and row 2 (or above row 3) if the content has a clear meta-grouping label (e.g., "RULES", "CHECKLIST", "PRO TIPS").

[5] FOOTER (bottom 6-8%):
    - Hand-drawn divider + "Follow @${handle} for more amazing AI content | Repost ↻".
    - @${handle} in blue #2563EB bold underlined. Curved arrow doodle.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT TO RENDER (verbatim — do not paraphrase, do not invent)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sourceTextBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WORKED REFERENCE EXAMPLE — match the cheat-sheet 2×3 grid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Below is the kind of layout we expect. Copy the GRID STRUCTURE, the BORDERED TEMPLATE BOXES, the YELLOW [PLACEHOLDERS], and the "What happens" lines. Use YOUR content above — do NOT reuse these words.

[Cream paper, 4 metal clips. Title: "CLAUDE COWORK TEMPLATES" (in red marker) "TO AUTOMATE YOUR LIFE" (in blue marker). Subtitle below italic: "Six set-and-forget routines for your AI co-worker."]

[2 columns × 3 rows = 6 modules:]

Module 1 (top-left):
  Title: "1. The 'Digital Cleanup' (File Management)" — number in red.
  Folder sketch icon.
  Green-bordered box, italic prompt:
    "Scan my [FOLDER NAME]. Create a new folder named [NEW FOLDER NAME]. Find every file related to [TOPIC/PROJECT], move them there, and rename them all to [NAME FORMAT, e.g., Date_Filename]. Finally, write a Summary.txt listing exactly what you moved."
  (All bracketed placeholders highlighted yellow.)
  "What happens:" — "Claude acts as a digital intern, physically organizing your messy desktop or downloads folder."

Module 2 (top-right):
  Title: "2. The 'Receipt-to-Spreadsheet' (Accounting)"
  Receipt sketch icon.
  Orange-bordered box: "Go through every file in [FOLDER WITH RECEIPTS]. Extract the [DATA POINTS, e.g., Vendor, Date, Total]. Create a new Excel file named [FILENAME.xlsx] with these columns and add a total sum formula at the bottom."
  "What happens:" — "Claude uses Vision to 'read' your receipts and Python to build a functional, formula-ready spreadsheet on your drive."

Module 3 (mid-left):
  Title: "3. The 'Meeting Recap' (Project Management)"
  Clock sketch icon.
  Green-bordered box: "Read all transcripts and notes in [MEETING FOLDER]. Synthesize them into a Word doc called [FILENAME.docx]. Use three headings: [SECTION 1, e.g., Decisions], [SECTION 2, e.g., Blockers], [SECTION 3, e.g., Action Items]."
  "What happens:" — "It analyzes multiple text files simultaneously, identifies patterns, and writes a professional summary for your team."

Module 4 (mid-right):
  Title: "4. The 'Competitor Intelligence' (Market Research)"
  Globe sketch icon.
  Green-bordered box: "Search the web for the top [NUMBER] competitors in the [INDUSTRY] space. Find their [KEY METRIC, e.g., Pricing or Top Product]. Use this data to create a [NUMBER]-slide PowerPoint with a consistent layout."
  "What happens:" — "Claude spawns sub-agents: one to browse the web for data, another to generate the actual .pptx file."

Module 5 (bottom-left):
  Title: "5. The 'Inbox Watchdog' (Email Routine)"
  Mailbox sketch icon.
  Yellow-bordered box: "/schedule every *[TIME/DAY]** Search my Gmail for unread emails from [NAME/COMPANY]. Summarise them in a bulleted list. If an email is about *[SPECIFIC TOPIC]*, draft a polite reply and move it to my drafts folder."
  "What happens:" — "This is a 'set and forget' routine. Claude checks your mail on a timer and has the work waiting for you when you log in."

Module 6 (bottom-right):
  Title: "6. The 'Content Repurposer' (Social Media)"
  Megaphone sketch icon.
  Blue-bordered box: "In [FOLDER], find the video [FILENAME.mp4]. Find the most [VIBE, e.g., energetic/insightful] 60-second segment and save it as a new clip. Then, write a [PLATFORM, e.g., LinkedIn/X] post based on that clip."
  "What happens:" — "Claude analyzes the video/audio stream, uses a sub-agent to 'clip' the file, and generates the copy to match."

[Hand-drawn divider. Footer: "Follow @awakpenn for more amazing AI content | Repost ↻", handle blue underlined, curved arrow doodle.]

End of reference. Now generate ONE image for the user's content above, in this 2×N cheat-sheet grid format. Use the user's actual modules.

QUALITY GUARANTEES:
- Every word from CONTENT TO RENDER above. ZERO invented words.
- 2×3 (or 2×2 / 2×4) module grid filling the canvas.
- Every module has: numbered title + sketch icon + colored bordered template box + "What happens:" line.
- Bordered box colors rotate (green, orange, red, blue, yellow) — never two adjacent cells the same color.
- All [PLACEHOLDERS] inside template prompts have flat yellow highlight behind them.
- Footer with creator handle in blue underlined.

AVOID: ${AVOID}`;
  }
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

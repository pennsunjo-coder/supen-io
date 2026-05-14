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
  square: { width: 1024, height: 1024 },
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

/**
 * ASYNC VETTER: Distills raw content into a high-quality "Sacred Text Map"
 * using Claude. This ensures the infographic text is coherent, 
 * hierarchical, and "square for the brain".
 */
export async function distillInfographicContent(
  content: string, 
  platform: string,
  callClaude: (system: string, messages: any[]) => Promise<string>
): Promise<EnhancedExtraction & { quotes: string[]; contentType: string; proTip: string }> {
  const system = `You are a content extractor for infographics.
Your ONLY job is to EXTRACT the key information from the source text. 
DO NOT invent, add, or generalize anything.

RULES:
1. Use ONLY words, numbers, and facts that appear in the source.
2. Keep the same language as the source (if French, write French. If English, write English. NEVER mix languages).
3. Be brief and punchy. Each point max 50 characters.
4. Extract 5-7 key points maximum.

OUTPUT FORMAT (exactly):
TITLE: [Short catchy title from the source, max 40 chars]
POINT 1: [Key fact or tip from source]
POINT 2: [Key fact or tip from source]
POINT 3: [Key fact or tip from source]
POINT 4: [Key fact or tip from source]
POINT 5: [Key fact or tip from source]
PRO TIP: [Best actionable advice from the source]
DOODLES: [3-4 simple object names in English: brain, laptop, etc.]`;

  const prompt = `Extract the key points from this ${platform} post. Do NOT add anything that isn't in the source:\n\n${content}`;
  
  try {
    const raw = await callClaude(system, [{ role: "user", content: prompt }]);
    
    const titleMatch = raw.match(/TITLE:\s*(.*)/i);
    const points = raw.match(/POINT\s*\d+:\s*(.*)/gi)?.map(p => p.replace(/POINT\s*\d+:\s*/i, "").trim()) || [];
    const proTipMatch = raw.match(/PRO TIP:\s*(.*)/i);
    const proTip = proTipMatch ? proTipMatch[1].trim() : "Apply this today.";
    const doodlesMatch = raw.match(/DOODLES:\s*(.*)/i);
    const doodles = doodlesMatch
      ? doodlesMatch[1].split(",").map(d => d.trim()).filter(Boolean).slice(0, 4)
      : [];

    return {
      title: titleMatch ? titleMatch[1].trim() : "Key Insights",
      points: points.slice(0, 7),
      stats: [],
      keywords: [],
      quotes: [],
      contentType: detectContentType(content),
      proTip,
      doodles
    } as any;
  } catch (err) {
    console.warn("[Distiller] Claude extraction failed, using regex fallback:", err);
    const regexExt = extractForDallE(content);
    return {
      ...regexExt,
      proTip: "Start implementing today.",
      doodles: []
    } as any;
  }
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
    .map(l => l.length > 65 ? l.slice(0, 62).trim() + "..." : l)
    .slice(0, 9); // Increased from 5 to 9 for 85-95% density

  // Stats/numbers
  const stats = (content.match(
    /\d+[\.,]?\d*\s*(%|€|\$|K|M|x|×|fois|days?|jours?|months?|mois|years?|ans?|hours?|heures?|minutes?|followers?|impressions?|views?)/gi,
  ) || []).slice(0, 5); // Increased from 3 to 5

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
  distilled?: EnhancedExtraction & { quotes: string[]; contentType: string; proTip: string }
): string {
  const UNIVERSAL_STYLE_CONTEXT = `
STYLE CONTEXT — READ THIS FIRST AND APPLY TO EVERYTHING:

MANDATORY AESTHETIC RULES — NO EXCEPTIONS:
1. Background: ALWAYS #f8f9f7 to #fffef8 — NEVER dark backgrounds.
2. FULL BLEED: The content MUST touch the edges of the canvas. 100% fill.
3. TWO fonts ONLY:
   - Titles/headers: Nunito ExtraBold weight 900.
   - Body/bullets: Caveat Regular/Bold (handwritten feel).
   - Load: https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap
4. ORGANIC FEEL:
   - Rotate headers and surligneurs by random small amounts (-1.5deg to 1.5deg).
   - Use border-radius: 2px 12px 4px 15px to avoid perfect digital corners.
5. Yellow ONLY as inline highlighter: background:#FFEF5A; padding: 2px 8px; mix-blend-mode: multiply; transform: rotate(-0.5deg);
6. Max 4 accent colors:
   - Red: #C0392B (warm)
   - Blue: #2563EB
   - Green: #4A8B35
   - Orange: #F5922A
7. Dense information — 90-95% canvas fill. Zero empty space at bottom.
8. NO footer, NO signature, NO watermark.
9. ALL CSS MUST BE INLINE (style="...") — Critical for PNG export.`;

  const analysis = analyzeContent(content, platform);
  const dims = FORMAT_DIMS[analysis.format];
  const selection = selectBestTemplate(content, platform, forcedTemplate);
  const templateId = selection.templateId;
  
  // Use distilled content if provided, otherwise fallback to local extraction
  const extraction = distilled ? {
    title: distilled.title,
    badge: distilled.contentType.toUpperCase(),
    subtitle: distilled.quotes[0] || "",
    points: distilled.points.map(p => ({ title: p, body: "" })),
    sections: [{ header: "Core System", bullets: distilled.points }],
    proTip: distilled.proTip
  } : extractKeyPoints(content);

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
- Caveat pour TOUT le corps
`;
}

export function buildDallEPrompt(
  content: string,
  platform: string,
  template?: string,
  userName?: string,
  distilled?: EnhancedExtraction & { quotes: string[]; contentType: string; proTip?: string }

): string {
  void template;

  const rawExt = distilled || extractForDallE(content);
  const handle = userName ? userName.replace(/^@/, "").replace(/\s+/g, "").toLowerCase() : "gamaliettankeu";

  const pointsText = rawExt.points
    .slice(0, 7)
    .map((p, i) => `${i + 1}. ${p}`)
    .join("\n");

  const title = rawExt.title || "Key Insights";
  const proTip = (distilled as any)?.proTip || "";

  // Determine aspect ratio based on platform
  let formatString = "Portrait (4:5 aspect ratio, exactly 1080x1350 pixels, ideal for LinkedIn/Instagram feeds)";
  if (platform.toLowerCase().includes("tiktok") || platform.toLowerCase().includes("reel") || platform.toLowerCase().includes("short")) {
    formatString = "Vertical (9:16 aspect ratio, exactly 1080x1920 pixels)";
  } else if (platform.toLowerCase().includes("twitter") || platform.toLowerCase().includes("x")) {
    formatString = "Square or Landscape (1:1 or 16:9 aspect ratio)";
  }

  return `Generate a flat digital graphic infographic with a hand-drawn marker aesthetic. 
Do NOT generate a photograph of a physical notebook sitting on a desk. The image itself MUST BE the infographic, filling the entire canvas from edge to edge with a clean white or off-white background.

Crucial Style Instructions (Read First):
Medium: Digital graphic mimicking a physical whiteboard or blank paper. The background should be flat and clean. No desks, no shadows, no hands, no 3D objects around it.
Texture: All elements must look created by hand using colored marker pens (black, blue, red, green) and highlighters (yellow/orange).
No Digital Fonts: All text, headings, and bullet points must appear handwritten or hand-printed in marker pen.

Format & Layout:
- Format: ${formatString}
- The content must flow perfectly and fill the canvas.
- Title at the top: "${title}" written in large bold marker.
- Content sections below, each with a colored marker heading and bullet points.
- Use multi-colored markers for emphasis.
- Keep text large and legible.

Content to render:
${pointsText}
${proTip ? `\nPro Tip: ${proTip}` : ""}

Use simple language. Avoid technical terms unless necessary.
Do not explain too much.
Make it easy to scan in less than 10 seconds.
Use a consistent structure across all sections.
Make use of realistic hand-drawn icons (brain, lightbulb, rocket, etc.).

Always include the handwritten text "Follow @${handle} for more amazing AI content | Repost ♻️" at the bottom of the image, in the same hand-drawn marker style.`;
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

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

export function buildInfographicPrompt(
  content: string,
  platform: string,
  customInstructions?: string,
  forcedTemplate?: string,
): string {
  regenerationCounter++;
  const analysis = analyzeContent(content, platform);
  const dims = FORMAT_DIMS[analysis.format];
  const selection = selectBestTemplate(content, platform, forcedTemplate);

  // On regeneration, rotate to a different template — UNLESS the user forced a style.
  let templateId = selection.templateId;
  if (regenerationCounter > 1 && !forcedTemplate) {
    const alternatives = TEMPLATE_IDS.filter(id => id !== templateId);
    templateId = alternatives[(regenerationCounter - 2) % alternatives.length];
  }

  const templateFn = TEMPLATE_REGISTRY[templateId];
  let templateHtml = templateFn(dims.width, dims.height);
  const extraction = extractKeyPoints(content);

  // Pre-fill SVG icons into the template (deterministic, no-op if no placeholder)
  const sectionColors = ["#E53E3E", "#3182CE", "#38A169", "#DD6B20", "#9B59B6", "#EC4899", "#00897B"];
  for (let i = 0; i < 7; i++) {
    const pointText = extraction.points[i]?.title || "";
    const iconName = selectIcon(pointText, i);
    const color = sectionColors[i % sectionColors.length];
    const iconSvg = getIconSvg(iconName, color, 20);
    templateHtml = templateHtml.replace(`{{P${i + 1}_ICON}}`, iconSvg);
  }

  // Pre-fill main illustration into header (if template supports it)
  if (templateHtml.includes("{{MAIN_ILLUSTRATION}}")) {
    const illustName = selectIllustration(analysis.contentType, templateId, content);
    const illustSvg = getIllustrationSvg(illustName, 100);
    templateHtml = templateHtml.replace("{{MAIN_ILLUSTRATION}}", illustSvg);
  }

  const extra = customInstructions ? `\nInstructions utilisateur : ${customInstructions}` : "";
  const isCleanTemplate = CLEAN_TEMPLATES.has(templateId);
  const bodyLength = isCleanTemplate ? "18-30 mots" : "30-50 mots";
  const titleStyle = isCleanTemplate
    ? "Titre clair, 4-8 mots, sentence case (PAS de ALL CAPS), un mot encadré dans <span>"
    : "Titre ALL CAPS viral, 4-8 mots, un mot encadré dans <span>";

  const templateHints: Record<string, string> = {
    UI_CARDS: "Comparaison à 3 niveaux. P1=mauvaise version (à éviter), P2=version correcte, P3=meilleure version. P4-P7 = 4 raisons courtes (10-15 mots) qui justifient pourquoi le niveau Excellent fonctionne, format <span class=\"a\">Mot-clé</span> + explication. PRO_TIP non utilisé visuellement.",
    WHITEBOARD: "Tableau dessiné. P1-P7 = 7 conseils/étapes courts. Chaque body = 18-25 mots avec UN mot-clé entouré de <span class=\"a\">. PRO_TIP = astuce finale (20-30 mots).",
    FUNNEL: "Entonnoir séquentiel à 5 étapes. P1-P5 = 5 étapes progressives (P1=large/début, P5=précis/fin), title 2-4 mots ALL CAPS, body 12-18 mots. P6_TITLE = label CTA (3-5 mots, ex: 'Tu y es presque'). PRO_TIP = phrase CTA actionnable (10-15 mots). P7 non utilisé.",
    DATA_GRID: "Tableau framework. P1-P4 = 4 concepts (title=nom 2-4 mots, body=description 15-25 mots avec un <span class=\"a\">mot-clé</span>). P5_TITLE/P5_BODY/P6_TITLE/P6_BODY = 4 cas d'usage 'Idéal pour' (3-6 mots chacun, un par concept). P7_TITLE = bonus (15-20 mots), P7_BODY = à noter (15-20 mots). PRO_TIP = à retenir (20-30 mots).",
  };
  const templateNote = templateHints[templateId] || "";

  const pointHints = extraction.points.map((p, i) =>
    `${i + 1}. "${p.title}" — ${p.body}`
  ).join("\n");

  // Regeneration variation instruction
  const regenInstruction = regenerationCounter > 1
    ? `\n\nREGENERATION #${regenerationCounter}
The previous design was rejected. You MUST use a COMPLETELY DIFFERENT approach:
- Different title angle and wording
- Different emphasis on content points
- Suggested layout style: ${LAYOUT_VARIATIONS[(regenerationCounter - 1) % LAYOUT_VARIATIONS.length]}
Make it significantly better.\n`
    : "";

  return `TASK: Find-and-replace {{PLACEHOLDERS}} in the HTML below. Output the complete HTML with replacements. Nothing else.
${regenInstruction}
TEMPLATE: ${templateId}
${templateNote}

STRICT RULES:
1. Output the ENTIRE HTML document from <!DOCTYPE html> to </html>
2. ONLY replace text inside {{double curly braces}} — change NOTHING else
3. Do NOT delete any HTML tags, divs, sections, or SVG elements
4. Do NOT add any new tags, styles, classes, or attributes
5. Do NOT add emoji characters (no unicode emoji — the SVG icons are already embedded)
6. Do NOT use font-style:italic anywhere
7. Every {{Pn_BODY}} must be ${bodyLength}
8. Write all content in FRENCH (this is a French-language product)

REPLACEMENTS:
{{BADGE}} → "${extraction.badge}"
{{TITLE}} → ${titleStyle}
{{P1_TITLE}} through {{P7_TITLE}} → 3-6 word section header in French, specific and actionable
{{P1_BODY}} through {{P7_BODY}} → ${bodyLength} each, structured as:
  "<span class=\\"a\\">Phrase clé</span> détail explicatif${isCleanTemplate ? "" : " • Second sous-point avec un chiffre précis • Troisième détail concret avec nom d'outil"}"
{{PRO_TIP}} → ${isCleanTemplate ? "20-30" : "30-50"} word actionable tip in French
{{FOOTER}} → "Créé avec Supen.io · Suivez pour plus"

BODY EXAMPLE:
"<span class=\\"a\\">Claude + Cursor</span> écrivent du code 10x plus vite que le manuel${isCleanTemplate ? "" : " • Économise 3.2h par jour en moyenne • 87% des startups YC 2025 utilisent cette stack"}"

KEY POINTS FROM SOURCE:
${pointHints}
Pro tip hint: ${extraction.proTip}

SOURCE CONTENT:
${content.slice(0, 2500)}

Platform: ${platform}${extra}

HTML TO FILL:
${templateHtml}

OUTPUT: The complete filled HTML only. No explanation, no markdown fences.`;
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
    vibe: "Clean SaaS landing page meets editorial magazine. Apple/Notion/Linear aesthetic. Sophisticated, never loud.",
    background: "Soft #F8F9FA off-white background. NO heavy borders, NO frames, NO patterns. Pure breathing room.",
    layout: "Centered serif title at top with a small uppercase kicker label above. 3 stacked white cards taking the main vertical space (each card ~equal height, flex:1). Each card has a colored category pill at the top-left ('Mauvais' / 'Bon' / 'Excellent'), then a serif card title, then sans-serif body. 4-cell insight grid at the bottom for supporting points.",
    typography: "Title in Playfair Display 900, 32px, sentence case (NOT all caps). Card titles in Playfair 700, 17px. Card bodies in Inter 400, 13px, color #4B5563, line-height 1.5. Insight titles 11px Inter 700. Generous white space.",
    colors: "Pastel pills — red #FFE5E5/text #E03131 for 'Mauvais', amber #FFF1DC/text #D97706 for 'Bon', green #E5F7E8/text #2BA84A for 'Excellent'. Card left borders match (4px). Yellow #FFE066 highlighter underline behind one keyword per card body.",
    structure: "Strict 3-tier comparison. Card 1 = the worst/wrong/bad version (red). Card 2 = the okay/standard version (orange). Card 3 = the best/expert version (green). Each card body 25-30 words MAX. Bottom 4 insights are short 'why it works' takeaways, 12-18 words each.",
  },
  WHITEBOARD: {
    vibe: "Friendly hand-drawn whiteboard. Smart consultant's notebook page. LinkedIn educator vibe. Approachable, not corporate.",
    background: "Pure white #FFFFFF with very subtle dotted grid pattern (radial-gradient dots at 24px spacing, color #E8EAED). NO frames, NO heavy borders.",
    layout: "Top header: small uppercase blue kicker + big handwritten title (with one keyword highlighted in yellow). 7 sections below in vertical flow, each = hand-drawn marker symbol on the left (→, ★, ✓, !) + content on the right. Dashed separators between sections. Bottom: 'Astuce pro' callout box with dashed orange border.",
    typography: "Title in Caveat handwritten font, 42px, weight 700, normal style. Section titles in Caveat 24px, weight 700. Marker symbols in Caveat 30px. Body text in Inter 400, 13px, color #4B5563. The mix of handwritten + clean sans-serif = teacher's whiteboard energy.",
    colors: "Marker accents rotating: blue #4DABF7, red #FF6B6B, green #51CF66. Yellow highlighter #FFE066 behind important words (linear-gradient bottom-half background trick). Subtle gray separators #F1F3F5. Pro tip box uses orange #FFB347 dashed border on #FFFAF0 background.",
    structure: "7 short tips/steps. Each section: 3-6 word handwritten title + 18-25 word body in Inter. ONE keyword per section gets the yellow highlighter <span class='a'>treatment</span>. Pro tip at bottom is the single most actionable takeaway.",
  },
  FUNNEL: {
    vibe: "Modern strategy framework. McKinsey-meets-Linear. Visual progression that pulls the eye downward through sequential stages.",
    background: "Soft vertical gradient from #FFF8F0 (warm top) to #F0F4FF (cool bottom). Clean, no border, no pattern.",
    layout: "Centered uppercase title at top with a dark kicker pill above. 5 funnel stages stacked vertically, each progressively narrower (96%, 84%, 72%, 60%, 48% width). Each stage = colored gradient pill with a number circle on the left + uppercase stage title + body description. Small ▼ arrows between stages. Bottom: 2 side-by-side note cards (purple + cyan accents).",
    typography: "Title in Inter 900, 28-32px, ALL CAPS, letter-spacing -0.5px. Stage titles in Inter 800, 13-15px, ALL CAPS. Stage bodies in Inter 500, 11-12px, opacity 0.95 on colored bg. Note titles 11px uppercase. All sans-serif, no italic.",
    colors: "Funnel gradient progression (warm → cool): stage 1 red #EF4444→#F87171, stage 2 orange #F97316→#FB923C, stage 3 amber #F59E0B→#FBBF24, stage 4 emerald #10B981→#34D399, stage 5 blue #3B82F6→#60A5FA. Notes use purple #9333EA and cyan #0891B2 left borders.",
    structure: "5 sequential stages of a process/framework/funnel, each building on the previous. Stage 1 = entry/awareness (largest), stage 5 = goal/conversion (smallest). Each stage: 2-4 word title + 12-18 word body. Bottom 2 notes = 'common pitfall' (purple) + 'expert tip' (cyan), 10-15 words each.",
  },
  DATA_GRID: {
    vibe: "Notebook framework table. Knowledge worker reference card. Notion / consulting deliverable energy. Sober, structured, immediately scannable.",
    background: "White #FFFFFF with very subtle 32px squared notebook grid (rgba(0,0,0,0.018)). NO heavy borders.",
    layout: "Centered serif title (with one yellow-highlighted word) + small pastel-blue uppercase kicker. Below: a 4-row × 3-column table (Élément / Description / Idéal pour) with a pastel blue header row. Each row has a colored dot (red/orange/green/violet) next to the concept name. Bottom: 2 small bonus cards side-by-side. Below: a single brand-color #24A89B 'À retenir' tip box with star icon.",
    typography: "Title in Playfair Display 900, 28-32px, sentence case. Kicker 10px Inter 800 uppercase. Header row 10px Inter 800 uppercase. Body cells 11-12px Inter 400 (description) / 700 (concept name and use case). NO italic.",
    colors: "Header pill bg #AEC6CF (pastel blue) text #1F2937. Row dots: #FFB3B3 / #FFD4A3 / #B3FFD1 / #D4B3FF (rouge/orange/vert/violet pastels). Use case arrow #24A89B. Yellow #FFE066 highlighter underline behind one keyword per description. Tip box: brand #24A89B left border + #E8F8F6 background.",
    structure: "Strict 4-row table. Each row = ONE framework concept (P1-P4). Column 1 = name (2-4 words). Column 2 = description (15-25 words, one bold keyword). Column 3 = 'Idéal pour' use case (3-6 words). Bottom: 2 tiny bonus cards using P7 + a brand-color tip box for the single most important takeaway.",
  },
  AWA_CLASSIC: {
    vibe: "Awa K. Penn viral infographic. Dense, scannable, save-worthy. Cream paper with wood frame.",
    background: "Cream #FFFFF5 with 6px solid #5D3A1A wood-tone border.",
    layout: "Header: badge pill + ALL CAPS title (left) + contextual illustration (right). 7 numbered sections below in a tight vertical flow. Pro tip box at bottom with dashed border.",
    typography: "Poppins. Title 28px weight 900 ALL CAPS letter-spacing -0.5px. Section headers 13px weight 700. Body 11px weight 400 line-height 1.35.",
    colors: "Section colors rotating: #E53E3E, #3182CE, #38A169, #DD6B20, #9B59B6, #EC4899, #00897B. Pro tip uses red #E53E3E dashed border.",
    structure: "7 dense sections, each 30-50 words with sub-bullets and one accent-colored bold keyword. Pro tip 30-50 words actionable.",
  },
};

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

  return `=== IDENTITÉ ===

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

RÈGLE 3 — Architecture de l'Espace (White Space) :
L'espace vide = clarté. Grille invisible. Marges généreuses. Le texte ne doit JAMAIS sembler étouffé. Le canvas respire à ${isCleanTemplate ? "65-75%" : "85-92%"} de remplissage maximum — JAMAIS 100%.

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

- Dimensions exactes : ${dimStr}px (carré 1080×1080 ou portrait 1080×1350)
- Sortie : image PNG UNIQUEMENT (aucun texte, aucun HTML dans la réponse)
- Polices : Playfair Display + Inter/Poppins via Google Fonts (Caveat seulement si WHITEBOARD)
- Couleur de marque Supen : #24A89B sur les CTAs, footer, signatures
- Padding : ${isCleanTemplate ? "32-40px" : "22-28px"} sur tous les bords
- Gap entre sections : ${isCleanTemplate ? "12-18px (respiration généreuse)" : "7-9px (compact mais lisible)"}
- Footer en bas : "Créé avec Supen.io"
- Tout le contenu rédigé en FRANÇAIS

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
=== RÈGLES D'ÉCRITURE (FRANÇAIS) ===
${"═".repeat(50)}

- TOUT le texte est rédigé en FRANÇAIS (le produit est francophone)
- Titres de sections : 3-6 mots, spécifiques et actionnables. AUCUN label vague ("Important", "Note").
- Bodies de section : ${isCleanTemplate ? "18-25 mots MAX par section" : "30-50 mots par section"}. Coupe tout ce qui n'apporte rien.
- UN seul mot-clé par section surligné en jaune (#FFE066)
- Au moins UNE donnée concrète dans tout le visuel (chiffre précis, nom d'outil, pourcentage)
- Titre principal : ${isCleanTemplate ? "clair, curieux, sentence case (PAS de SHOUTING ALL CAPS)" : "ALL CAPS viral et percutant"}
- Footer : "Créé avec Supen.io"

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
- Texte en anglais → produit francophone

${"═".repeat(50)}
=== CHECKLIST FINALE (à valider AVANT génération) ===
${"═".repeat(50)}

[ ] Canvas exactement ${dimStr}px
[ ] Titre = élément le plus proéminent (Règle du Tiers Supérieur)
[ ] Hiérarchie cognitive des couleurs respectée (palette pastel pro)
[ ] White space généreux (${isCleanTemplate ? "65-75%" : "85-92%"} de remplissage)
[ ] Maximum 2 familles de polices (1 Serif + 1 Sans, ou + Caveat si Whiteboard)
[ ] Bodies courts (${isCleanTemplate ? "18-25" : "30-50"} mots par section)
[ ] Ancrages visuels présents (icônes ou numéros cerclés)
[ ] Brand color #24A89B utilisée sur les CTAs / footer
[ ] Footer "Créé avec Supen.io" en bas
[ ] Tout le texte en FRANÇAIS
[ ] AUCUN italique
[ ] AUCUN emoji unicode

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
    { label: "Has sections", pass: /<div class="section/.test(html) || /<div class="(stat|card|block|row)/.test(html) },
    { label: "No placeholders left", pass: !html.includes("{{") },
    { label: "Has footer", pass: /<div class="footer">/.test(html) && !html.includes("{{FOOTER}}") },
    { label: "Correct dimensions", pass: html.includes(`${dims.width}px`) && html.includes(`${dims.height}px`) },
    { label: "Font loaded", pass: html.includes("fonts.googleapis.com") },
    { label: "No italic", pass: !html.includes("font-style:italic") && !html.includes("font-style: italic") },
    { label: "No emoji characters", pass: !/[\u{1F300}-\u{1F9FF}]/u.test(html) },
    { label: "Has SVG icons", pass: html.includes("<svg") },
    { label: "Overflow hidden", pass: html.includes("overflow:hidden") || html.includes("overflow: hidden") },
    { label: "Has pro tip", pass: html.includes("pro-tip") || html.includes("what-now") || html.includes("verdict") || html.includes("bonus") || html.includes("class=\"tip\"") },
    { label: "Has inline emphasis", pass: html.includes('class="a"') || html.includes("class='a'") },
    { label: "Has header illustration", pass: html.includes("header-illust") },
  ];

  const passed = checks.filter(c => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);

  return { score, checks };
}

// ─── Reset regeneration counter (call when modal opens fresh) ───

export function resetRegenerationCounter(): void {
  regenerationCounter = 0;
}

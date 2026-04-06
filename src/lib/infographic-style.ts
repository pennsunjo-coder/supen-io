/**
 * Intelligent infographic engine.
 * Auto-analyzes content → selects template → builds prompt.
 */

import { TEMPLATE_REGISTRY, TEMPLATE_IDS } from "./infographic-templates";
import { selectIcon, getIconSvg } from "./infographic-icons";

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

export function selectBestTemplate(content: string, platform: string): TemplateSelection {
  const words = content.toLowerCase().split(/\s+/);
  const wordCount = words.length;

  const p = {
    hasNumberedList: /(\d+\.|①|②|③|étape|step|premier|first)/i.test(content),
    hasStats: /\d+[%km€$]|\d{4,}/i.test(content),
    hasComparison: /\bvs\b|versus|contre|avant.*après|before.*after|plutôt|better than/i.test(content),
    hasHowTo: /comment|how to|étape|step|guide|tutorial/i.test(content),
    hasTips: /conseil|tip|astuce|hack|trick|secret/i.test(content),
    isTech: /\bai\b|tech|digital|code|app|software|chatgpt|claude|ia/i.test(content),
    isBusiness: /business|argent|money|revenue|vente|sale|entrepreneur/i.test(content),
    isMarketing: /marketing|contenu|content|viral|audience|engagement/i.test(content),
  };

  let templateId: string;
  let reason: string;

  if (p.hasStats && wordCount < 200) {
    templateId = "STATS_IMPACT";
    reason = "Key statistics detected — large numbers visual";
  } else if (p.hasComparison) {
    templateId = "COMPARISON_VS";
    reason = "Comparison content — two-column VS layout";
  } else if (p.hasHowTo || p.hasNumberedList) {
    templateId = "AWA_CLASSIC";
    reason = "How-to/steps — classic Awa Penn numbered sections";
  } else if (p.hasTips && !p.isTech) {
    templateId = "VIRAL_TIPS";
    reason = "Tips content — clean modern numbered design";
  } else if (p.isTech && !p.isMarketing) {
    templateId = "DARK_TECH";
    reason = "Tech content — dark modern glassmorphism";
  } else if (wordCount > 300) {
    templateId = "CHEAT_SHEET";
    reason = "Long content — multi-section grid cheat sheet";
  } else {
    templateId = "AWA_CLASSIC";
    reason = "General content — Awa Penn viral style";
  }

  return { templateId, reason };
}

// ─── Key point extraction ───

function detectBadge(content: string): string {
  const lower = content.toLowerCase();
  if (/how to|comment/i.test(lower)) return "HOW-TO GUIDE";
  if (/tip|astuce|conseil/i.test(lower)) return "TOP TIPS";
  if (/\bvs\b|versus|compar/i.test(lower)) return "COMPARISON";
  if (/\d+%|\d+k/i.test(lower)) return "KEY STATS";
  if (/learn|education|cours/i.test(lower)) return "LEARNING";
  if (/ai\b|tech|software/i.test(lower)) return "AI & TECH";
  if (/business|money|revenue/i.test(lower)) return "BUSINESS";
  return "KEY INSIGHTS";
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
      if (text.length > 10 && points.length < 7) {
        const colonSplit = text.split(/[:—–]/);
        if (colonSplit.length >= 2) {
          points.push({ title: colonSplit[0].trim().slice(0, 50), body: colonSplit.slice(1).join(":").trim().slice(0, 120) });
        } else {
          points.push({ title: text.slice(0, 45), body: text.slice(45, 160).trim() });
        }
      }
    }
  }

  // Pass 2: if not enough, split by sentences
  if (points.length < 3) {
    const sentences = content.match(/[^.!?\n]+[.!?]+/g) || [];
    for (const s of sentences) {
      const trimmed = s.trim();
      if (trimmed.length > 20 && points.length < 5) {
        points.push({ title: trimmed.slice(0, 45), body: trimmed.slice(45, 140).trim() });
      }
    }
  }

  // Pass 3: last resort — chunk paragraphs
  if (points.length < 3) {
    const chunks = content.split(/\n\n+/).filter(c => c.trim().length > 20);
    for (const chunk of chunks) {
      if (points.length < 5) {
        const t = chunk.trim();
        points.push({ title: t.slice(0, 45), body: t.slice(45, 140).trim() });
      }
    }
  }

  return { title, badge, subtitle, points: points.slice(0, 7) };
}

// ─── Emoji assignment ───

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

export function buildInfographicPrompt(content: string, platform: string, customInstructions?: string): string {
  regenerationCounter++;
  const analysis = analyzeContent(content, platform);
  const dims = FORMAT_DIMS[analysis.format];
  const selection = selectBestTemplate(content, platform);

  // On regeneration, rotate to a different template
  let templateId = selection.templateId;
  if (regenerationCounter > 1) {
    const alternatives = TEMPLATE_IDS.filter(id => id !== templateId);
    templateId = alternatives[(regenerationCounter - 2) % alternatives.length];
  }

  const templateFn = TEMPLATE_REGISTRY[templateId];
  let templateHtml = templateFn(dims.width, dims.height);
  const extraction = extractKeyPoints(content);

  // Pre-fill SVG icons into the template (deterministic, not left to Claude)
  const sectionColors = ["#E53E3E", "#3182CE", "#38A169", "#DD6B20", "#9B59B6", "#EC4899", "#00C9B1"];
  for (let i = 0; i < 7; i++) {
    const pointText = extraction.points[i]?.title || "";
    const iconName = selectIcon(pointText, i);
    const color = sectionColors[i % sectionColors.length];
    const iconSvg = getIconSvg(iconName, color, 24);
    templateHtml = templateHtml.replace(`{{P${i + 1}_ICON}}`, iconSvg);
  }

  const variationSeed = Math.random().toString(36).substring(2, 8);
  const extra = customInstructions ? `\nAdditional user instructions: ${customInstructions}` : "";

  // Build placeholder hints (text only — icons are pre-filled)
  const pointHints = extraction.points.map((p, i) =>
    `Point ${i + 1}: title="${p.title}", body="${p.body}"`
  ).join("\n");

  return `You are filling an infographic HTML template with real content.
Template: ${templateId} (${selection.reason})
Variation seed: ${variationSeed}

YOUR TASK:
1. Read the CONTENT below and extract the most impactful key points
2. Fill the HTML template by replacing ALL {{PLACEHOLDERS}} (text only — SVG icons are already filled in)
3. Keep ALL HTML structure, CSS, and SVG icons EXACTLY as-is — only replace text placeholders
4. Make titles PUNCHY and VIRAL (Awa K. Penn style)
5. Do NOT add emojis — professional SVG icons are already embedded
6. Output ONLY the filled HTML — no markdown, no explanation

PLACEHOLDER MAP:
{{BADGE}} → "${extraction.badge}"
{{TITLE}} → Create a viral punchy title from content. Wrap ONE key word with <span> for accent color. Max 60 chars.
{{FOOTER}} → "Created with Supen.io · Follow for more 🔄"

EXTRACTED KEY POINTS (use these — do NOT invent):
${pointHints}

For points not covered (P5, P6, P7 etc): if the template has them but content doesn't have enough points, either fill with relevant content from below OR remove that section's HTML div entirely.

TEMPLATE TO FILL:
${templateHtml}

CONTENT TO EXTRACT FROM:
${content.slice(0, 2500)}

Platform: ${platform}
${extra}

OUTPUT: Only the filled HTML starting with <!DOCTYPE html>. Nothing else.`;
}

// ─── Gemini prompt builder ───

export function buildGeminiImagePrompt(content: string, platform: string): string {
  const analysis = analyzeContent(content, platform);
  const dims = FORMAT_DIMS[analysis.format];
  const selection = selectBestTemplate(content, platform);
  const extraction = extractKeyPoints(content);

  const styleMap: Record<string, string> = {
    AWA_CLASSIC: "Handwritten sketchnote on cream paper with brown wood border frame",
    DARK_TECH: "Modern dark tech style with cyan accents on dark navy background",
    CHEAT_SHEET: "Notebook cheat sheet with colored section headers on white",
    VIRAL_TIPS: "Clean white modern design with large colorful numbered circles",
    STATS_IMPACT: "Data visualization with large hero numbers on cream background",
    COMPARISON_VS: "Two-column VS comparison chart on light background",
  };

  return `Create a professional infographic image.
Style: ${styleMap[selection.templateId] || styleMap.AWA_CLASSIC}
Format: ${dims.width}x${dims.height}px square

Title: ${extraction.title}
Key points:
${extraction.points.slice(0, 5).map((p, i) => `${i + 1}. ${p.title}: ${p.body}`).join("\n")}

Requirements:
- Exact format: ${dims.width}x${dims.height}px
- Numbered sections with colored circles
- Professional line icons (NOT emojis) before sections
- Footer: "Created with Supen.io | Follow for more"
- Professional, viral-worthy design

Platform: ${platform}`;
}

// ─── Reset regeneration counter (call when modal opens fresh) ───

export function resetRegenerationCounter(): void {
  regenerationCounter = 0;
}

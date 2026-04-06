/**
 * Intelligent infographic style engine.
 * Analyzes content automatically and builds the optimal prompt.
 */

// ─── Content analysis ───

type ContentType = "howto" | "tips" | "comparison" | "stats" | "quote" | "general";
type ColorTheme = "tech" | "business" | "health" | "education" | "default";

export interface ContentAnalysis {
  contentType: ContentType;
  colorTheme: ColorTheme;
  format: "square" | "portrait";
  wordCount: number;
}

export function analyzeContent(content: string, _platform: string): ContentAnalysis {
  const wordCount = content.split(/\s+/).length;
  const hasSteps = /étape|step|premier|first|ensuite|then|how to|\d\.\s/i.test(content);
  const hasComparison = /\bvs\b|versus|contre|compared|plutôt|rather|difference|better than/i.test(content);
  const hasStats = /\d+%|\d+k|\d+m|\d+x|million|thousand|billion|revenue|growth/i.test(content);
  const hasQuote = /["«»"]|said|dit|quote|—\s/i.test(content) && wordCount < 100;
  const hasList = /[•\-\*→]/.test(content) || /\d+[\.\)]\s/g.test(content);

  let contentType: ContentType;
  if (hasSteps) contentType = "howto";
  else if (hasComparison) contentType = "comparison";
  else if (hasStats) contentType = "stats";
  else if (hasQuote) contentType = "quote";
  else if (hasList) contentType = "tips";
  else contentType = "general";

  const isTech = /\bai\b|tech|digital|code|app|software|\bia\b|machine learning|api|cloud|saas/i.test(content);
  const isBusiness = /business|money|revenue|profit|sales|entrepreneur|startup|marketing/i.test(content);
  const isHealth = /health|fitness|wellness|santé|sport|workout|nutrition|mental/i.test(content);
  const isEducation = /learn|study|education|cours|formation|student|university|skill/i.test(content);

  let colorTheme: ColorTheme;
  if (isTech) colorTheme = "tech";
  else if (isBusiness) colorTheme = "business";
  else if (isHealth) colorTheme = "health";
  else if (isEducation) colorTheme = "education";
  else colorTheme = "default";

  const format = wordCount > 300 ? "portrait" : "square";

  return { contentType, colorTheme, format, wordCount };
}

// ─── Palettes ───

interface Palette {
  bg: string;
  title: string;
  accent: string;
  secondary: string;
  text: string;
  border: string;
  font: string;
}

const PALETTES: Record<ColorTheme, Palette> = {
  tech: { bg: "#0F172A", title: "#F1F5F9", accent: "#00C9B1", secondary: "#3B82F6", text: "#94A3B8", border: "none", font: "Inter" },
  business: { bg: "#FFFBEB", title: "#1A1A1A", accent: "#D69E2E", secondary: "#38A169", text: "#2D3748", border: "8px solid #92400E", font: "Patrick Hand" },
  health: { bg: "#F0FFF4", title: "#1A1A1A", accent: "#48BB78", secondary: "#ED8936", text: "#2D3748", border: "8px solid #276749", font: "Patrick Hand" },
  education: { bg: "#FAF5FF", title: "#1A1A1A", accent: "#9B59B6", secondary: "#3182CE", text: "#2D3748", border: "8px solid #553C9A", font: "Patrick Hand" },
  default: { bg: "#FFF8F0", title: "#1A1A1A", accent: "#E53E3E", secondary: "#3182CE", text: "#2D3748", border: "8px solid #5D3A1A", font: "Patrick Hand" },
};

// ─── Layouts ───

const LAYOUTS: Record<ContentType, string> = {
  howto: `LAYOUT — How-To Guide:
- Vertical numbered steps with LARGE colored circles (40px)
- Each step: bold action title + 1-2 lines description
- Arrow → connecting steps for visual flow
- Single column, top to bottom`,

  tips: `LAYOUT — Top Tips:
- 2-column grid (CSS grid: grid-template-columns: 1fr 1fr; gap: 14px)
- Each tip: emoji + bold title + 1-line description
- Subtle colored card background (rgba of accent, 0.06)
- Max 6 tips to fit`,

  comparison: `LAYOUT — Comparison:
- 2 columns side by side (CSS grid: 1fr 1fr)
- Left = Option A (accent color), Right = Option B (secondary color)
- VS badge in center between columns
- Aligned rows for each criteria`,

  stats: `LAYOUT — Key Stats:
- Large hero numbers (64px, bold, accent color) as focal points
- Each stat: big number → label → short context below
- Mix layout: 2x2 grid or stacked
- Subtle background shapes behind numbers`,

  quote: `LAYOUT — Quote Card:
- Large ❝ quotation mark (80px, accent color, 0.3 opacity) at top
- Quote text: 28px, centered, italic feel
- Author: "— Name" in accent color, 20px
- Minimal design, lots of breathing room (80px padding)
- Decorative accent bar above and below quote`,

  general: `LAYOUT — Numbered Sections:
- 4-5 numbered sections, vertical flow
- Each: colored circle number + emoji + bold title + body text
- Sub-points with → arrows
- Colors rotate per section: accent, secondary, #38A169, #DD6B20, #9B59B6`,
};

// ─── Format dimensions ───

const FORMAT_DIMS = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
} as const;

export function getFormatDimensions(format: "square" | "portrait") {
  return FORMAT_DIMS[format];
}

// ─── Prompt builder ───

export function buildInfographicPrompt(content: string, platform: string, customInstructions?: string): string {
  const analysis = analyzeContent(content, platform);
  const palette = PALETTES[analysis.colorTheme];
  const layout = LAYOUTS[analysis.contentType];
  const dims = FORMAT_DIMS[analysis.format];
  const extra = customInstructions ? `\n\nAdditional user instructions: ${customInstructions}` : "";

  const isPortrait = analysis.format === "portrait";
  const maxSections = isPortrait ? 6 : 5;
  const titleSize = "48px";
  const bodySize = analysis.wordCount > 250 ? "13px" : "15px";
  const padding = "48px";

  const isDark = analysis.colorTheme === "tech";
  const borderStyle = palette.border === "none" ? "border: none;" : `border: ${palette.border};`;
  const footerColor = isDark ? palette.text : "#5D3A1A";
  const footerBorder = isDark ? `1px solid ${palette.accent}33` : "2px solid #5D3A1A";
  const shadowStyle = isDark
    ? "box-shadow: none;"
    : "box-shadow: inset 0 0 60px rgba(0,0,0,0.04);";

  return `You are an expert viral infographic designer.
Analyze this content and create a stunning ${dims.width}x${dims.height}px infographic.

DETECTED CONTENT TYPE: ${analysis.contentType}
DETECTED THEME: ${analysis.colorTheme}
WORD COUNT: ${analysis.wordCount}

${layout}

COLOR PALETTE (use exactly):
- Background: ${palette.bg}
- Title color: ${palette.title}
- Accent color: ${palette.accent}
- Secondary accent: ${palette.secondary}
- Body text: ${palette.text}
- Border: ${palette.border}
- Font family: ${palette.font}

MANDATORY RULES:
1. Exact dimensions: body { width: ${dims.width}px; height: ${dims.height}px; overflow: hidden; }
2. ALL content must fit — no scrolling. overflow: hidden is mandatory.
3. Maximum ${maxSections} sections. Reduce content if needed.
4. If content is long, use font-size: 13px for body and reduce gaps.
5. Title: ${titleSize}, weight 900, UPPERCASE, centered, line-height 1.1
   — Color key words with accent color ${palette.accent}
6. Section numbers: colored circles (36px), white number inside
   Colors rotate: ${palette.accent}, ${palette.secondary}, #38A169, #DD6B20, #9B59B6
7. Large emojis (28px) before section titles
8. Sub-points use → arrows in accent color
9. Footer: "Created with Supen.io | Follow for more 🔄"
   — centered, 14px bold, color ${footerColor}, border-top: ${footerBorder}
10. Professional, viral-worthy design
11. ONLY output HTML. No markdown. No explanation. Start with <!DOCTYPE html>.

GOOGLE FONTS:
<link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">

HTML TEMPLATE:
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: ${dims.width}px; height: ${dims.height}px;
  background: ${palette.bg};
  font-family: '${palette.font}', ${isDark ? "sans-serif" : "cursive"};
  ${borderStyle}
  padding: ${padding};
  overflow: hidden;
  ${shadowStyle}
  display: flex; flex-direction: column;
}
.title {
  font-size: ${titleSize}; font-weight: 900; text-align: center;
  color: ${palette.title}; margin-bottom: 24px; line-height: 1.1;
  text-transform: uppercase; letter-spacing: -0.5px;
}
.title .accent { color: ${palette.accent}; }
.sections { flex: 1; display: flex; flex-direction: column; gap: 16px; }
.section { display: flex; align-items: flex-start; gap: 14px; }
.number {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 900; font-size: 16px;
  flex-shrink: 0; margin-top: 2px;
}
.section-content { flex: 1; }
.section-title { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
.section-body { font-size: ${bodySize}; color: ${palette.text}; line-height: 1.5; }
.emoji { font-size: 28px; margin-right: 6px; vertical-align: middle; }
.footer {
  text-align: center; font-size: 14px; font-weight: 700;
  color: ${footerColor}; margin-top: auto; padding-top: 16px;
  border-top: ${footerBorder};
}
</style>
</head>
<body>
  [GENERATE CONTENT FOLLOWING THE LAYOUT ABOVE]
  <div class="footer">Created with Supen.io | Follow for more 🔄</div>
</body>
</html>

CONTENT TO TRANSFORM:
${content.slice(0, 2500)}

Platform: ${platform}
${extra}

OUTPUT: ONLY the complete HTML code. No markdown fences. No explanation. Start with <!DOCTYPE html>.`;
}

// ─── Gemini prompt builder (for image generation) ───

export function buildGeminiImagePrompt(content: string, platform: string): string {
  const analysis = analyzeContent(content, platform);
  const palette = PALETTES[analysis.colorTheme];
  const dims = FORMAT_DIMS[analysis.format];

  return `Create a professional infographic image.
Style: ${analysis.colorTheme === "tech" ? "Modern dark theme" : "Handwritten sketchnote/whiteboard"}
Type: ${analysis.contentType}
Format: ${dims.width}x${dims.height}px

Content to visualize:
${content.slice(0, 2000)}

Requirements:
- Background: ${palette.bg}
${palette.border !== "none" ? `- Border frame: ${palette.border}` : "- No border"}
- Accent color: ${palette.accent}
- Font style: ${palette.font === "Inter" ? "Clean modern sans-serif" : "Handwritten/Patrick Hand style"}
- Numbered sections with colored circles
- Large emojis before sections
- Arrow symbols (→) for sub-points
- Footer: "Created with Supen.io | Follow for more 🔄"
- Square format ${dims.width}x${dims.height}px
- Professional, viral-worthy design

Platform: ${platform}`;
}

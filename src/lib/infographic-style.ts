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
  const dims = FORMAT_DIMS[analysis.format];
  const extra = customInstructions ? `\n\nAdditional user instructions: ${customInstructions}` : "";

  // Variation seed forces different output on regeneration
  const variationSeed = Math.random().toString(36).substring(2, 8);

  // Extract key points from content to guide the AI
  const lines = content.split("\n").filter(l => l.trim().length > 10);
  const keyPoints = lines.slice(0, 5).map((l, i) => `${i + 1}. ${l.trim().slice(0, 120)}`);
  const extractedPoints = keyPoints.length > 0
    ? `\nEXTRACTED KEY POINTS (use these as your sections):\n${keyPoints.join("\n")}\n\nDo NOT invent new points. Use ONLY these extracted points.\n`
    : "";

  const isDark = analysis.colorTheme === "tech";
  const borderCSS = palette.border === "none" ? "" : `border: ${palette.border};`;
  const shadowCSS = isDark ? "box-shadow: inset 0 0 80px rgba(0,200,180,0.05);" : "box-shadow: inset 0 0 80px rgba(0,0,0,0.03);";
  const badgeTextColor = isDark ? "#000" : "#fff";
  const titleSize = analysis.wordCount > 200 ? "38px" : "46px";
  const sectionGap = analysis.format === "portrait" ? "22px" : "18px";
  const sectionBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";
  const footerBorderCSS = `2px solid ${palette.accent}40`;

  return `You are an expert viral infographic designer for social media.

CONTENT ANALYSIS:
- Type: ${analysis.contentType}
- Theme: ${analysis.colorTheme}
- Words: ${analysis.wordCount}
- Platform: ${platform}

YOUR TASK:
Create a stunning, professional infographic as a single HTML file.
Extract the KEY POINTS from the content (max 5 points).
Each point needs: an emoji, a bold title, and 1-2 lines of text.

EXACT HTML TEMPLATE TO USE — replace ALL [PLACEHOLDERS] with real content:

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Patrick+Hand:wght@400&family=Poppins:wght@400;700;900&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: ${dims.width}px;
    height: ${dims.height}px;
    background: ${palette.bg};
    font-family: '${palette.font}', cursive, sans-serif;
    ${borderCSS}
    padding: 52px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    ${shadowCSS}
  }

  .header {
    text-align: center;
    margin-bottom: 36px;
    padding-bottom: 24px;
    border-bottom: 3px solid ${palette.accent};
  }

  .badge {
    display: inline-block;
    background: ${palette.accent};
    color: ${badgeTextColor};
    font-size: 13px;
    font-weight: 700;
    padding: 6px 16px;
    border-radius: 20px;
    margin-bottom: 16px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .title {
    font-size: ${titleSize};
    font-weight: 900;
    color: ${palette.title};
    line-height: 1.15;
    font-family: 'Poppins', sans-serif;
  }

  .title span { color: ${palette.accent}; }

  .sections {
    display: flex;
    flex-direction: column;
    gap: ${sectionGap};
    flex: 1;
  }

  .section {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px 20px;
    background: ${sectionBg};
    border-radius: 12px;
    border-left: 4px solid var(--color);
  }

  .number {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--color);
    color: white;
    font-size: 18px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-family: 'Poppins', sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .emoji {
    font-size: 32px;
    flex-shrink: 0;
    line-height: 1;
    margin-top: 4px;
  }

  .section-content { flex: 1; }

  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--color);
    margin-bottom: 6px;
    font-family: 'Poppins', sans-serif;
  }

  .section-body {
    font-size: 14px;
    color: ${palette.text};
    line-height: 1.5;
  }

  .section-body .arrow {
    color: ${palette.accent};
    font-weight: bold;
  }

  .footer {
    text-align: center;
    margin-top: 28px;
    padding-top: 20px;
    border-top: ${footerBorderCSS};
    font-size: 14px;
    font-weight: 700;
    color: ${palette.accent};
    font-family: 'Poppins', sans-serif;
  }

  .s1 { --color: #E53E3E; }
  .s2 { --color: #3182CE; }
  .s3 { --color: #38A169; }
  .s4 { --color: #DD6B20; }
  .s5 { --color: #9B59B6; }
</style>
</head>
<body>

  <div class="header">
    <div class="badge">[TOPIC BADGE - 2-3 words]</div>
    <div class="title">[MAIN TITLE - make it viral and punchy, highlight KEY WORD with <span>]</div>
  </div>

  <div class="sections">

    <div class="section s1">
      <div class="number">1</div>
      <div class="emoji">[RELEVANT EMOJI]</div>
      <div class="section-content">
        <div class="section-title">[POINT 1 TITLE]</div>
        <div class="section-body">[POINT 1 DETAIL - max 2 lines]</div>
      </div>
    </div>

    <div class="section s2">
      <div class="number">2</div>
      <div class="emoji">[RELEVANT EMOJI]</div>
      <div class="section-content">
        <div class="section-title">[POINT 2 TITLE]</div>
        <div class="section-body">[POINT 2 DETAIL - max 2 lines]</div>
      </div>
    </div>

    <div class="section s3">
      <div class="number">3</div>
      <div class="emoji">[RELEVANT EMOJI]</div>
      <div class="section-content">
        <div class="section-title">[POINT 3 TITLE]</div>
        <div class="section-body">[POINT 3 DETAIL - max 2 lines]</div>
      </div>
    </div>

    <div class="section s4">
      <div class="number">4</div>
      <div class="emoji">[RELEVANT EMOJI]</div>
      <div class="section-content">
        <div class="section-title">[POINT 4 TITLE]</div>
        <div class="section-body">[POINT 4 DETAIL - max 2 lines]</div>
      </div>
    </div>

    <!-- ADD SECTION 5 ONLY IF CONTENT HAS 5+ KEY POINTS -->

  </div>

  <div class="footer">Created with Supen.io · Follow for more 🔄</div>

</body>
</html>

INSTRUCTIONS:
1. Replace ALL [PLACEHOLDERS] with real content extracted from below
2. Keep the EXACT CSS — do not modify styles, classes, or structure
3. Make the title VIRAL and punchy (like Awa K. Penn style)
4. Choose RELEVANT emojis that match each section topic
5. Keep body text SHORT (max 2 lines per section)
6. Output ONLY the complete HTML. No markdown. No explanation. Start with <!DOCTYPE html>

VARIATION SEED: ${variationSeed}
IMPORTANT: Create a UNIQUE design. Vary the title wording, emoji choices, and content emphasis.
${extractedPoints}
CONTENT TO TRANSFORM:
${content.slice(0, 2500)}

Platform: ${platform}
${extra}`;
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

/**
 * Visual DNA extracted from Awa K. Penn's viral infographics.
 * Analyzed from 12 reference images in /public/style-references/.
 */

export const AWA_PENN_STYLE = {
  background: "#FFF8F0",
  border: "8px solid #5D3A1A",
  fonts: {
    title: { family: "Patrick Hand", size: "48px", weight: "900", transform: "uppercase" },
    section: { family: "Patrick Hand", size: "20px", weight: "700" },
    body: { family: "Patrick Hand", size: "15px", weight: "400" },
    footer: { family: "Patrick Hand", size: "14px", weight: "700" },
  },
  colors: {
    primary: "#E53E3E",
    secondary: "#3182CE",
    tertiary: "#38A169",
    quaternary: "#DD6B20",
    quinary: "#9B59B6",
    senary: "#E91E8C",
    text: "#1A1A1A",
    body: "#2D3748",
    frame: "#5D3A1A",
    background: "#FFF8F0",
    highlight: "#FEFCBF",
  },
  sectionColors: ["#E53E3E", "#3182CE", "#38A169", "#DD6B20", "#9B59B6", "#E91E8C"],
  sections: {
    numberCircle: { size: "36px", style: "circle" },
    spacing: "20px",
    maxSections: 6,
  },
  elements: {
    arrows: "→",
    checkmarks: "✓",
    bullets: "•",
    emojis: true,
    emojiSize: "28px",
    frame: true,
    highlighter: true,
  },
  footer: {
    text: "Follow @awakpenn for more amazing AI content | Repost 🔄",
    borderTop: "2px solid #5D3A1A",
  },
  format: { width: "1080px", height: "1080px" },
} as const;

// ─── Formats ───

export interface FormatConfig {
  id: string;
  label: string;
  size: string;
  desc: string;
  icon: string;
  width: number;
  height: number;
}

export const FORMATS: FormatConfig[] = [
  { id: "square", label: "Square", size: "1080×1080", desc: "Instagram / Facebook", icon: "⬛", width: 1080, height: 1080 },
  { id: "portrait", label: "Portrait", size: "1080×1350", desc: "Instagram Stories / TikTok", icon: "📱", width: 1080, height: 1350 },
  { id: "landscape", label: "Landscape", size: "1200×630", desc: "LinkedIn / Twitter", icon: "🖥️", width: 1200, height: 630 },
];

// ─── Templates ───

export interface TemplateConfig {
  id: string;
  label: string;
  emoji: string;
  desc: string;
}

export const TEMPLATES: TemplateConfig[] = [
  { id: "howto", label: "How-To Guide", emoji: "📋", desc: "Step-by-step instructions" },
  { id: "tips", label: "Top Tips", emoji: "💡", desc: "List of tips and tricks" },
  { id: "comparison", label: "Comparison", emoji: "⚖️", desc: "Compare options side by side" },
  { id: "stats", label: "Key Stats", emoji: "📊", desc: "Data and statistics visual" },
  { id: "quotes", label: "Quote Card", emoji: "💬", desc: "Inspirational quote design" },
  { id: "checklist", label: "Checklist", emoji: "✅", desc: "Action items checklist" },
];

// ─── Accent colors ───

export const ACCENT_COLORS = [
  { id: "red", hex: "#E53E3E", label: "Red" },
  { id: "blue", hex: "#3182CE", label: "Blue" },
  { id: "green", hex: "#38A169", label: "Green" },
  { id: "orange", hex: "#DD6B20", label: "Orange" },
  { id: "purple", hex: "#9B59B6", label: "Purple" },
  { id: "pink", hex: "#E91E8C", label: "Pink" },
  { id: "teal", hex: "#319795", label: "Teal" },
  { id: "indigo", hex: "#5B21B6", label: "Indigo" },
];

// ─── Template-specific layout instructions ───

const TEMPLATE_LAYOUTS: Record<string, string> = {
  howto: `LAYOUT — How-To Guide:
- Vertical numbered steps with LARGE step numbers (48px circles)
- Each step is a clear action with a short description
- Use arrows (→) between steps to show progression
- Steps flow top to bottom, one column
- Bold action verb at the start of each step`,

  tips: `LAYOUT — Top Tips:
- Use a 2-column grid layout for the tips
- Each tip has a number badge + emoji + title + 1-line description
- Tips are in colored cards with subtle background (rgba of accent color, 0.06)
- Compact layout to fit more tips
- CSS grid: grid-template-columns: 1fr 1fr; gap: 14px;`,

  comparison: `LAYOUT — Comparison:
- Split into 2 columns side by side
- Left column: Option A with its own accent color
- Right column: Option B with a different accent color
- Header row with option names in large bold text
- Rows for each comparison criteria aligned across both columns
- Use VS divider in the middle or a vertical border
- CSS grid: grid-template-columns: 1fr 1fr;`,

  stats: `LAYOUT — Key Stats:
- Large hero numbers (64px, bold, colored) as the focal point
- Each stat has: big number → label underneath → short context
- Use a mix of layouts: some stats in a row, featured stat larger
- Add subtle background circles or shapes behind key numbers
- Color each stat number with a different accent color`,

  quotes: `LAYOUT — Quote Card:
- Large quotation marks "❝" at the top (80px, accent color, opacity 0.3)
- Quote text centered, large (28px), italic-style, color #1A1A1A
- Author name below quote: "— Author Name" in accent color, 20px
- Minimal sections — the quote IS the content
- Extra padding (80px) for breathing room
- Decorative line or accent bar above and below the quote`,

  checklist: `LAYOUT — Checklist:
- Each item has a checkbox-style indicator: ✅ or ☐
- Items are in a single column, well-spaced
- Each item has a bold title + optional short description
- Alternate subtle background colors for rows (transparent / rgba accent 0.04)
- Checkmark circles instead of number circles`,
};

// ─── Prompt builder ───

export interface InfographicOptions {
  format: FormatConfig;
  template: string;
  accentColor: string;
  brandName: string;
  sectionCount: number;
  showFrame: boolean;
  customInstructions?: string;
}

export function buildInfographicPrompt(content: string, platform: string, options: InfographicOptions): string {
  const { format, template, accentColor, brandName, sectionCount, showFrame, customInstructions } = options;
  const extra = customInstructions ? `\n\nAdditional user instructions: ${customInstructions}` : "";
  const templateLayout = TEMPLATE_LAYOUTS[template] || TEMPLATE_LAYOUTS.howto;
  const frameStyle = showFrame ? `border: 8px solid #5D3A1A;` : `border: none;`;
  const footerText = brandName
    ? `Follow ${brandName} for more amazing content | Repost 🔄`
    : AWA_PENN_STYLE.footer.text;

  // Adapt max sections for landscape (less vertical space)
  const maxSections = format.id === "landscape" ? Math.min(sectionCount, 4) : sectionCount;

  // Adapt font sizes for landscape
  const titleSize = format.id === "landscape" ? "36px" : "48px";
  const bodySize = format.id === "landscape" ? "13px" : "15px";
  const padding = format.id === "landscape" ? "32px 40px" : "48px";

  return `You are an expert infographic designer who replicates the EXACT visual style of Awa K. Penn's viral social media infographics.

VISUAL DNA (extracted from 12 reference images):
${JSON.stringify(AWA_PENN_STYLE, null, 2)}

FORMAT: ${format.width}x${format.height}px (${format.label} — ${format.desc})
TEMPLATE: ${template}
ACCENT COLOR: ${accentColor} (use this as the primary/dominant accent color)

${templateLayout}

MANDATORY RULES — follow these EXACTLY:
1. Background: warm cream #FFF8F0
2. Outer frame: ${showFrame ? "8px solid #5D3A1A (wooden/brown border)" : "NONE — no border"}
3. Font: Patrick Hand (Google Fonts) for ALL text — no exceptions
4. Title: ${titleSize}, weight 900, UPPERCASE, centered, color #1A1A1A, line-height 1.1
   — Color key words using the accent color ${accentColor}
5. Section numbers: colored circles (36px diameter, white bold number centered inside)
   Primary accent: ${accentColor}, then rotate through other section colors
6. Section titles: 20px bold, SAME color as the number circle
7. Body text: ${bodySize} Patrick Hand, color #2D3748, line-height 1.5
8. Sub-points: use → arrows in the accent color
9. Large emojis (28px) before each section title
10. Footer: "${footerText}" — centered, 14px bold, color #5D3A1A
11. Format: EXACTLY ${format.width}x${format.height}px, overflow hidden
12. Subtle inner shadow: box-shadow: inset 0 0 60px rgba(0,0,0,0.04)
13. Padding: ${padding}

CRITICAL — CONTENT MUST FIT:
- ALL content MUST fit within ${format.width}x${format.height}px. No scrolling — overflow: hidden.
- Maximum ${maxSections} sections.
- If content is long, reduce body font-size to 13px and section gap to 12px.
- Reduce title to 40px if needed. Every element must be visible without scrolling.

HTML TEMPLATE:
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: ${format.width}px; height: ${format.height}px;
  background: #FFF8F0;
  font-family: 'Patrick Hand', cursive;
  ${frameStyle}
  padding: ${padding};
  overflow: hidden;
  box-shadow: inset 0 0 60px rgba(0,0,0,0.04);
  display: flex; flex-direction: column;
}
.title {
  font-size: ${titleSize}; font-weight: 900; text-align: center;
  color: #1A1A1A; margin-bottom: 24px; line-height: 1.1;
  text-transform: uppercase; letter-spacing: -0.5px;
}
.title .accent { color: ${accentColor}; }
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
.section-body { font-size: ${bodySize}; color: #2D3748; line-height: 1.5; }
.emoji { font-size: 28px; margin-right: 6px; vertical-align: middle; }
.footer {
  text-align: center; font-size: 14px; font-weight: 700;
  color: #5D3A1A; margin-top: auto; padding-top: 16px;
  border-top: 2px solid #5D3A1A;
}
</style>
</head>
<body>
  [GENERATE CONTENT FOLLOWING THE TEMPLATE LAYOUT ABOVE]
  <div class="footer">${footerText}</div>
</body>
</html>

Content to transform:
${content.slice(0, 3000)}

Platform: ${platform}
${extra}

OUTPUT: ONLY the complete HTML code. No markdown fences. No explanation. Start with <!DOCTYPE html>.`;
}

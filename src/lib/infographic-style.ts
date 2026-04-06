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

export function buildInfographicPrompt(content: string, platform: string, customInstructions?: string): string {
  const extra = customInstructions ? `\n\nAdditional user instructions: ${customInstructions}` : "";

  return `You are an expert infographic designer who replicates the EXACT visual style of Awa K. Penn's viral social media infographics.

VISUAL DNA (extracted from 12 reference images):
${JSON.stringify(AWA_PENN_STYLE, null, 2)}

MANDATORY RULES — follow these EXACTLY:
1. Background: warm cream #FFF8F0
2. Outer frame: 8px solid #5D3A1A (wooden/brown border)
3. Font: Patrick Hand (Google Fonts) for ALL text — no exceptions
4. Title: 48px, weight 900, UPPERCASE, centered, color #1A1A1A, line-height 1.1
   — If the title has key words, color them: first keyword red, second blue, third green
5. Section numbers: colored circles (36px diameter, white bold number centered inside)
   Circle colors rotate: 1→#E53E3E, 2→#3182CE, 3→#38A169, 4→#DD6B20, 5→#9B59B6, 6→#E91E8C
6. Section titles: 20px bold, SAME color as the number circle, on the same line
7. Body text: 15px Patrick Hand, color #2D3748, line-height 1.5
8. Sub-points: use → arrows in the accent color, indented
9. Large emojis (28px) placed before each section title for visual appeal
10. Checkmarks ✓ for list items where appropriate
11. Footer: "Follow @awakpenn for more amazing AI content | Repost 🔄"
    — centered, 14px bold, color #5D3A1A, with a 2px solid #5D3A1A border-top above it
12. Format: EXACTLY 1080x1080px, overflow hidden
13. Subtle inner shadow: box-shadow: inset 0 0 60px rgba(0,0,0,0.04)
14. Padding: 48px on all sides

HTML TEMPLATE (use this exact structure):
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px; height: 1080px;
  background: #FFF8F0;
  font-family: 'Patrick Hand', cursive;
  border: 8px solid #5D3A1A;
  padding: 48px;
  overflow: hidden;
  box-shadow: inset 0 0 60px rgba(0,0,0,0.04);
  display: flex; flex-direction: column;
}
.title {
  font-size: 48px; font-weight: 900; text-align: center;
  color: #1A1A1A; margin-bottom: 28px; line-height: 1.1;
  text-transform: uppercase; letter-spacing: -0.5px;
}
.title .red { color: #E53E3E; }
.title .blue { color: #3182CE; }
.title .green { color: #38A169; }
.subtitle {
  text-align: center; font-size: 16px; color: #5D3A1A;
  margin-bottom: 28px; font-weight: 600;
}
.sections { flex: 1; display: flex; flex-direction: column; gap: 18px; }
.section { display: flex; align-items: flex-start; gap: 14px; }
.number {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 900; font-size: 16px;
  flex-shrink: 0; margin-top: 2px;
}
.section-content { flex: 1; }
.section-title { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
.section-body { font-size: 15px; color: #2D3748; line-height: 1.5; }
.section-body .arrow { font-weight: bold; margin-right: 4px; }
.emoji { font-size: 28px; margin-right: 6px; vertical-align: middle; }
.footer {
  text-align: center; font-size: 14px; font-weight: 700;
  color: #5D3A1A; margin-top: auto; padding-top: 18px;
  border-top: 2px solid #5D3A1A;
}
</style>
</head>
<body>
  <div class="title">[TITLE WITH <span class="red">COLORED</span> <span class="blue">KEY</span> <span class="green">WORDS</span>]</div>
  <div class="sections">
    <!-- Repeat 4-6 sections -->
    <div class="section">
      <div class="number" style="background: #E53E3E;">1</div>
      <div class="section-content">
        <div class="section-title" style="color: #E53E3E;"><span class="emoji">🎯</span> Section Title</div>
        <div class="section-body">
          <span class="arrow" style="color: #E53E3E;">→</span> Point one<br>
          <span class="arrow" style="color: #E53E3E;">→</span> Point two
        </div>
      </div>
    </div>
    <!-- More sections with rotating colors... -->
  </div>
  <div class="footer">Follow @awakpenn for more amazing AI content | Repost 🔄</div>
</body>
</html>

Content to transform into an infographic:
${content.slice(0, 3000)}

Platform: ${platform}
${extra}

OUTPUT: ONLY the complete HTML code. No markdown fences. No explanation. Start with <!DOCTYPE html>.`;
}

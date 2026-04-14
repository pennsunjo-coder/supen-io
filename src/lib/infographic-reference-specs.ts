/**
 * Forensic visual specifications extracted from 12 Awa K. Penn reference images.
 * Source: public/style-references/
 *
 * These specs are the SINGLE SOURCE OF TRUTH for all Gemini image generation prompts.
 * Every measurement was taken directly from the reference images.
 *
 * ANALYSIS DATE: 2026-04-14
 * IMAGES ANALYZED: 12 reference infographics from Awa K. Penn's social media
 */

// ─── Template categories identified across 12 references ───

export const TEMPLATE_TYPES = {
  WHITEBOARD: "whiteboard",       // 5 images: clips at corners, dense bullet/section layout
  NOTEBOOK: "notebook",           // 2 images: spiral binding, ruled lines, red margin
  COMPARISON: "comparison",       // 2 images: 3-column side-by-side with structured sections
  FUNNEL: "funnel",               // 1 image: trapezoid funnel with character illustration
  DENSE_GRID: "dense_grid",       // 1 image: cheat sheet with tables, grids, multi-section
  GUIDE: "guide",                 // 1 image: multi-method structured guide
} as const;

// ─── GLOBAL VISUAL DNA (present in ALL 12 references) ───

export const GLOBAL_SPECS = {
  // Background
  background: {
    color: "#f5f5f0 to #fffef8",  // Never pure white. Warm off-white/cream.
    texture: "Visible paper grain/noise at 3-5% opacity",
    feel: "Like a real physical surface (whiteboard, notebook page, poster board)",
  },

  // Typography measured from references
  typography: {
    title: {
      font: "Extremely heavy hand-drawn sans-serif (like Nunito Black 900+ or marker pen)",
      weight: "900+ — the strokes are VERY thick, almost like permanent marker",
      size: "44-60px depending on title length",
      color: "#111111 (near-black)",
      style: "Often ALL CAPS, sometimes with square brackets [TITLE]",
      multiColor: "In notebook templates, each word can be a different accent color",
    },
    sectionHeader: {
      font: "Same heavy sans-serif but slightly smaller",
      weight: "800-900",
      size: "18-24px",
      colors: "Rotating through #C0392B, #2563EB, #4A8B35, #F5922A",
      underline: "2px colored underline matching header color, always present",
    },
    body: {
      font: "Handwritten casual (Caveat-like) — slightly irregular letter spacing",
      weight: "400-500",
      size: "14-18px",
      color: "#111111 to #333333",
      feel: "Like written with a thin marker pen on paper",
    },
    footer: {
      text: "\"Follow Awa K Penn for more amazing AI content | Repost ↺\"",
      font: "Same handwritten style, bold",
      size: "16-20px",
      creatorName: "Blue #2563EB, bold, underlined",
    },
  },

  // Color palette measured from references
  colors: {
    red: "#C0392B",          // Warm brownish red — headers, checkmarks, underlines
    blue: "#2563EB",         // Confident medium blue — headers, links, names
    green: "#4A8B35",        // Natural forest green — headers, positive items
    orange: "#F5922A",       // Warm tangerine — tertiary accent, stars
    yellow: "#FFEF5A",       // Highlighter ONLY — behind specific words, or full-width section bands
    darkBrown: "#3d2b1a",   // Frame color on AWA_CLASSIC template
    nearBlack: "#111111",    // Primary text
    offWhite: "#f8f9f7",     // Standard background
    warmCream: "#fffef8",    // Notebook background
  },

  // Yellow highlight usage (CRITICAL — measured across all references)
  yellowHighlight: {
    inlineWords: "Yellow #FFEF5A flat background behind 3-5 KEY TERMS per infographic",
    sectionBands: "Full-width yellow background bands used as section dividers/labels",
    sectionBandText: "Black text, heavy bold, centered on yellow band",
    neverUsedAs: "Card background, border color, or decorative fill",
    appearance: "Looks exactly like a physical Stabilo highlighter was dragged over the word",
  },

  // Content density (THE MOST CRITICAL SPEC)
  density: {
    canvasFill: "85-95% of canvas must be filled with content",
    minimumSections: 7,
    sectionsWithSubBullets: "Each section has 2-4 bullet points or sub-items",
    hierarchy: "3 levels: Section header → Sub-header/key term → Body bullet",
    emptySpace: "NEVER more than 5% empty space at bottom. Content fills top to bottom.",
    wordsPerInfographic: "200-400 words of actual content",
  },

  // Decorative elements found in references
  decorativeElements: {
    checkmarks: "✓ in red #C0392B — used for positive/included items",
    stars: "★ in orange #F5922A — next to important items",
    arrows: "→ between connected elements, ↺ for repost icon",
    circledNumbers: "Hand-drawn oval/circle badges with numbers inside (stroke style)",
    bulletDots: "Colored • bullet markers matching section color",
    brackets: "Square brackets [ ] around main titles in whiteboard templates",
    frameworks: "Acronym-style frameworks (R.T.C.R.O.S., F.R.A.M.E.) with letter badges",
  },

  // What references NEVER have
  neverPresent: [
    "Emojis (🤖, 💡, etc.) — references use hand-drawn sketch icons or none",
    "Gradients on backgrounds or text",
    "Dark backgrounds or dark cards",
    "Thin/light font weights for titles",
    "More than 4 accent colors",
    "Corporate slide aesthetic",
    "Large empty whitespace zones",
    "Rounded pastel cards with shadows (SaaS dashboard style)",
    "Photography or realistic illustrations",
    "Pure white #ffffff backgrounds",
  ],
};

// ─── TEMPLATE-SPECIFIC SPECS ───

export const WHITEBOARD_SPECS = {
  // Found in: 632270914, 648369041, 651738166, 638788206, 651183217
  background: "#f8f9f7 with paper grain texture 3-4% opacity",
  cornerClips: {
    present: true,
    count: 4,
    position: "One at each corner of the canvas",
    appearance: "Small dark gray/metallic rectangular clips (~12×18px)",
    color: "#666666 to #888888",
  },
  border: "Very subtle 0.5px #e0e0e0 border around canvas edge",
  title: {
    brackets: true,  // [TITLE] with literal square brackets
    font: "Extremely heavy hand-drawn sans-serif",
    underline: "Red wavy or straight underline 2px #C0392B below title",
  },
  sectionDividers: {
    yellowBands: true,
    bandDescription: "Full-width yellow #FFEF5A background strip with black bold text centered",
    usedFor: "Major section labels like 'FEATURES', 'SHOW AS (FORMAT)', 'STRUCTURE YOUR PROMPT'",
  },
  contentStructure: {
    type: "Multi-section dense grid, sometimes 2 columns",
    sections: "7-10 distinct sections with colored headers",
    subBullets: "2-4 bullet points per section",
    frameworks: "Often uses acronym frameworks (letter in colored square + definition)",
  },
  footerFormat: "\"Follow Awa K Penn for more amazing AI content\" — single line, centered",
};

export const NOTEBOOK_SPECS = {
  // Found in: 626404547, 656233797
  background: "#fffef8 warm cream, like actual notebook paper",
  spiralBinding: {
    present: true,
    position: "Top edge, spanning full width",
    coilCount: 20,
    coilShape: "Oval, ~36px wide × 26px tall",
    coilColor: "Silver-gray #a39581",
    coil3D: "Light side #c8c0b0, Shadow side #7a7060",
    overlap: "Coils pass in front of AND behind paper edge (3D effect)",
    heightPercent: 6, // top 6% of canvas
  },
  ruledLines: {
    present: true,
    color: "#dde8f0",
    weight: "0.5px",
    spacing: "Every 34px across full width",
  },
  marginLine: {
    present: true,
    color: "#E63946",
    weight: "1.5px",
    position: "Vertical at x=72px from left edge",
  },
  title: {
    multiColor: true,
    description: "Each key word in a different accent color",
    numberColor: "#4A8B35 (green, very large ~56px)",
    adjectiveColor: "#C0392B (red, with underline)",
    nounColor: "#1a3d7c (dark blue, bold)",
    techTerms: "Yellow #FFEF5A background with red text",
    font: "Handwritten Caveat Bold 700, 52-56px",
  },
  contentFormat: {
    type: "Data table OR numbered list",
    tableColumns: "4-5 columns with colored headers",
    numberBadges: "Hand-drawn oval badges with numbers (01, 02, 03...)",
    providerNames: "Blue #2563EB Nunito Bold",
    itemTitles: "Green #4A8B35 or dark, Caveat style",
  },
  footer: {
    curvedArrows: true,
    text: "\"Follow for more | Repost ↺\"",
    font: "Caveat Bold 24-28px",
    creatorName: "Blue #2563EB bold underlined",
  },
};

export const COMPARISON_SPECS = {
  // Found in: 649266641, 649999648
  background: "#f5f5f0 with subtle paper texture and slight shadow/frame",
  layout: {
    columns: 3,
    separator: "Thin vertical lines between columns, #cccccc 0.5px",
  },
  title: {
    brackets: true,  // [ITEM A vs ITEM B vs ITEM C]
    eachItemColor: "Each product/item name in its own accent color",
    vsText: "\"vs\" in black, regular weight",
    font: "Heavy sans-serif, 28-36px",
  },
  columnStructure: {
    icon: "Product/brand icon at top of each column",
    sections: [
      "DESCRIPTION:",
      "WHEN TO USE IT:",
      "USE CASES:",
      "STRENGTHS:",
      "WEAKNESSES:",
      "PRO TIP:",
    ],
    sectionLabels: "Bold, colored, underlined — matching column accent color",
    sectionBody: "Handwritten Caveat style, 12-14px",
  },
  columnColors: {
    column1: "#2563EB (blue)",
    column2: "#4A8B35 (green)",
    column3: "#C0392B or #F5922A (red or orange)",
  },
  yellowHighlights: "On specific metrics, numbers, key terms within body text",
  density: "EXTREMELY dense — every column filled top to bottom",
};

export const FUNNEL_SPECS = {
  // Found in: 612147737
  background: "#f5f5f0 light gray/white with paper texture, whiteboard feel",
  title: {
    font: "Very heavy hand-drawn marker-pen style",
    size: "52-64px",
    color: "#111111",
    yearInParentheses: true,
  },
  funnelShape: {
    position: "Center-left of canvas",
    widthPercent: 55,
    heightPercent: 55,
    shape: "Trapezoid narrowing top to bottom",
    outline: "Hand-drawn irregular black strokes 2-3px",
    fill: "Warm cream/tan #f5e6c8",
    sections: 4,
  },
  sectionLabels: {
    style: "Rectangle boxes with thin red border #C0392B, white fill",
    font: "Heavy bold sans-serif, ALL CAPS",
    numbering: "1. 2. 3. 4. prefix",
    checkmarks: "Red ✓ checkmarks before each bullet point",
    bulletFont: "Handwritten Caveat 14px",
  },
  character: {
    present: true,
    position: "Right side of funnel",
    style: "Cartoon man, business casual (blue shirt, gray vest, glasses)",
    action: "Pointing at the funnel",
    artStyle: "Line-art with bold outlines, flat fills, friendly expression",
  },
  decorations: {
    goldSparkles: "6-8 stars ✦ ★ scattered around, #F5C518 and #E8B800",
    redArrows: "Large curved arrows flanking funnel, #C0392B, 3-4px stroke",
  },
  ctaBox: {
    present: true,
    style: "Hand-drawn rectangle, slightly imperfect strokes",
    text: "\"Save this\" with arrow →",
  },
};

export const DENSE_GRID_SPECS = {
  // Found in: 587950544
  background: "#f5f5f0 with paper texture",
  title: {
    font: "Very heavy black sans-serif ALL CAPS",
    size: "36-44px",
    subtitle: "Lighter weight, 14px, descriptive",
  },
  layout: {
    type: "Multi-section with tables, grids, and model diagrams",
    sections: "4+ major sections, each with different structures",
    sectionHeaders: "Numbered (SECTION 1, SECTION 2...) with colored underlines",
  },
  contentTypes: {
    pillarModel: "Horizontal row of colored boxes representing pillars",
    typographyGrid: "2×3 or 3×3 grid of colored rounded boxes with topics",
    comparisonTable: "Full data table with colored headers and rows",
    behavioralList: "Colored cards with text descriptions",
  },
  density: "THE DENSEST TEMPLATE — 95%+ fill, like a reference poster",
};

// ─── GAP ANALYSIS: Generated vs References ───

export const CRITICAL_GAPS = [
  {
    gap: "DENSITY",
    severity: "CRITICAL",
    reference: "85-95% canvas fill, 200-400 words, 7-10 sections",
    generated: "40-50% canvas fill, 50-100 words, 4-5 sections",
    fix: "Triple the content volume. Add sub-bullets, frameworks, examples.",
  },
  {
    gap: "YELLOW SECTION BANDS",
    severity: "HIGH",
    reference: "Full-width yellow #FFEF5A bands as section dividers with bold black text",
    generated: "No section bands at all",
    fix: "Add 2-3 full-width yellow highlight bands for major section labels",
  },
  {
    gap: "EMOJIS vs SKETCH ICONS",
    severity: "HIGH",
    reference: "Hand-drawn doodle icons or no icons — NEVER emojis",
    generated: "Uses actual emojis (🤖, 🎬, etc.)",
    fix: "Remove all emojis. Use hand-drawn sketch-style icons only.",
  },
  {
    gap: "CORNER CLIPS / SPIRAL BINDING",
    severity: "MEDIUM",
    reference: "4 metallic corner clips on whiteboard, 20 spiral coils on notebook",
    generated: "Neither present",
    fix: "Must draw physical mounting hardware on the canvas",
  },
  {
    gap: "CONTENT HIERARCHY",
    severity: "HIGH",
    reference: "3 levels: Header → Sub-header → Bullets → Sub-bullets",
    generated: "1 level: Header → Brief description",
    fix: "Add framework acronyms, multi-level bullet lists, example boxes",
  },
  {
    gap: "TITLE FONT WEIGHT",
    severity: "MEDIUM",
    reference: "EXTREMELY heavy, marker-pen thick strokes, weight 900+",
    generated: "Bold but not heavy enough",
    fix: "Emphasize 'extremely thick hand-drawn marker pen' in prompt",
  },
  {
    gap: "RULED LINES + MARGIN",
    severity: "MEDIUM",
    reference: "Light blue ruled lines every 34px, red margin at x=72px",
    generated: "Absent on notebook template",
    fix: "Explicitly describe ruled lines and margin in prompt",
  },
  {
    gap: "BOTTOM EMPTY SPACE",
    severity: "CRITICAL",
    reference: "Content fills to bottom, footer at very bottom edge",
    generated: "30-40% empty space at bottom below content",
    fix: "Explicitly state: 'Content must fill from top to bottom. Zero empty space.'",
  },
];

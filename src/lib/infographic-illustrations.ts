/**
 * Complex SVG illustrations for infographics.
 * Based on visual analysis of 12 Awa K. Penn reference images.
 *
 * These are NOT simple icons — they are rich, multi-element SVGs
 * that add visual weight and credibility to infographic headers.
 *
 * Reference patterns observed:
 * - Pyramids/funnels with colored tiers (Images 2, 3)
 * - Process flows with connected boxes (Image 1)
 * - Growth curves with data points (stats content)
 * - Checklist blocks (Image 3)
 * - Smartphone mockups (social media context)
 * - Brain/circuit diagrams (AI/tech context)
 * - Bar charts (data visualization)
 * - Decorative quote marks (quote content)
 * - Sparkle/star decorations (Image 2)
 */

// ─── Types ───

export type IllustrationName =
  | "pyramid"
  | "funnel"
  | "growthChart"
  | "processFlow"
  | "checklist"
  | "barChart"
  | "smartphone"
  | "brainCircuit"
  | "quoteMarks"
  | "sparkles"
  | "comparisonArrows"
  | "targetBullseye";

interface IllustrationConfig {
  width: number;
  height: number;
  svg: string;
}

// ─── Color palettes matching templates ───

const COLORS = {
  red: "#E53E3E",
  blue: "#3182CE",
  green: "#38A169",
  orange: "#DD6B20",
  purple: "#9B59B6",
  pink: "#EC4899",
  teal: "#00897B",
  cyan: "#00C9B1",
  amber: "#F59E0B",
  dark: "#1A1A1A",
};

// ─── Illustration SVGs ───

const ILLUSTRATIONS: Record<IllustrationName, IllustrationConfig> = {
  // 1. PYRAMID — 3-tier skill pyramid (seen in reference Image 3)
  // Gold/amber gradient with labeled tiers
  pyramid: {
    width: 120,
    height: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none">
<polygon points="60,4 95,34 25,34" fill="${COLORS.green}" opacity="0.9"/>
<polygon points="25,34 95,34 108,60 12,60" fill="${COLORS.orange}" opacity="0.9"/>
<polygon points="12,60 108,60 118,86 2,86" fill="${COLORS.red}" opacity="0.9"/>
<line x1="25" y1="34" x2="95" y2="34" stroke="#fff" stroke-width="1.5"/>
<line x1="12" y1="60" x2="108" y2="60" stroke="#fff" stroke-width="1.5"/>
<text x="60" y="24" text-anchor="middle" font-family="Poppins,sans-serif" font-size="8" font-weight="700" fill="#fff">PRO</text>
<text x="60" y="50" text-anchor="middle" font-family="Poppins,sans-serif" font-size="8" font-weight="700" fill="#fff">EXPERT</text>
<text x="60" y="77" text-anchor="middle" font-family="Poppins,sans-serif" font-size="8" font-weight="700" fill="#fff">BEGINNER</text>
</svg>`,
  },

  // 2. FUNNEL — 4-tier narrowing funnel (seen in reference Image 2)
  funnel: {
    width: 110,
    height: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 90" fill="none">
<polygon points="5,2 105,2 95,22 15,22" fill="${COLORS.amber}" rx="3"/>
<polygon points="15,24 95,24 85,44 25,44" fill="${COLORS.orange}"/>
<polygon points="25,46 85,46 75,66 35,66" fill="#E57C3A"/>
<polygon points="35,68 75,68 65,88 45,88" fill="${COLORS.red}"/>
<text x="55" y="15" text-anchor="middle" font-family="Poppins,sans-serif" font-size="7" font-weight="700" fill="#fff">AWARENESS</text>
<text x="55" y="37" text-anchor="middle" font-family="Poppins,sans-serif" font-size="7" font-weight="700" fill="#fff">INTEREST</text>
<text x="55" y="59" text-anchor="middle" font-family="Poppins,sans-serif" font-size="7" font-weight="700" fill="#fff">DESIRE</text>
<text x="55" y="81" text-anchor="middle" font-family="Poppins,sans-serif" font-size="7" font-weight="700" fill="#fff">ACTION</text>
</svg>`,
  },

  // 3. GROWTH CHART — Upward trending line with data points
  growthChart: {
    width: 120,
    height: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" fill="none">
<rect x="2" y="2" width="116" height="76" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
<line x1="15" y1="10" x2="15" y2="68" stroke="#CBD5E0" stroke-width="0.75"/>
<line x1="15" y1="68" x2="112" y2="68" stroke="#CBD5E0" stroke-width="0.75"/>
<line x1="15" y1="50" x2="112" y2="50" stroke="#EDF2F7" stroke-width="0.5" stroke-dasharray="3,3"/>
<line x1="15" y1="32" x2="112" y2="32" stroke="#EDF2F7" stroke-width="0.5" stroke-dasharray="3,3"/>
<path d="M20,62 L38,55 L56,48 L74,38 L92,22 L108,12" stroke="${COLORS.cyan}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M20,62 L38,55 L56,48 L74,38 L92,22 L108,12 L108,68 L20,68 Z" fill="${COLORS.cyan}" opacity="0.08"/>
<circle cx="20" cy="62" r="3" fill="${COLORS.cyan}"/>
<circle cx="38" cy="55" r="3" fill="${COLORS.cyan}"/>
<circle cx="56" cy="48" r="3" fill="${COLORS.cyan}"/>
<circle cx="74" cy="38" r="3" fill="${COLORS.blue}"/>
<circle cx="92" cy="22" r="3.5" fill="${COLORS.blue}"/>
<circle cx="108" cy="12" r="4" fill="${COLORS.green}"/>
<text x="108" y="9" text-anchor="middle" font-family="Poppins,sans-serif" font-size="6" font-weight="700" fill="${COLORS.green}">+</text>
</svg>`,
  },

  // 4. PROCESS FLOW — Connected circles with arrows (seen in Image 1)
  processFlow: {
    width: 120,
    height: 50,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 50" fill="none">
<circle cx="18" cy="25" r="14" fill="${COLORS.red}" opacity="0.9"/>
<circle cx="60" cy="25" r="14" fill="${COLORS.blue}" opacity="0.9"/>
<circle cx="102" cy="25" r="14" fill="${COLORS.green}" opacity="0.9"/>
<text x="18" y="28" text-anchor="middle" font-family="Poppins,sans-serif" font-size="9" font-weight="900" fill="#fff">1</text>
<text x="60" y="28" text-anchor="middle" font-family="Poppins,sans-serif" font-size="9" font-weight="900" fill="#fff">2</text>
<text x="102" y="28" text-anchor="middle" font-family="Poppins,sans-serif" font-size="9" font-weight="900" fill="#fff">3</text>
<path d="M34,25 L44,25" stroke="#64748B" stroke-width="1.5" marker-end="url(#arrow)"/>
<path d="M76,25 L86,25" stroke="#64748B" stroke-width="1.5" marker-end="url(#arrow)"/>
<defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#64748B"/></marker></defs>
</svg>`,
  },

  // 5. CHECKLIST — 4 items with colored checkboxes (seen in Image 3)
  checklist: {
    width: 110,
    height: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 80" fill="none">
<rect x="2" y="2" width="106" height="76" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
<rect x="10" y="10" width="14" height="14" rx="3" fill="${COLORS.green}"/>
<polyline points="13,17 16,20 23,14" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="30" y="13" width="68" height="6" rx="2" fill="#E2E8F0"/>
<rect x="10" y="30" width="14" height="14" rx="3" fill="${COLORS.blue}"/>
<polyline points="13,37 16,40 23,34" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="30" y="33" width="58" height="6" rx="2" fill="#E2E8F0"/>
<rect x="10" y="50" width="14" height="14" rx="3" fill="${COLORS.orange}"/>
<polyline points="13,57 16,60 23,54" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="30" y="53" width="72" height="6" rx="2" fill="#E2E8F0"/>
</svg>`,
  },

  // 6. BAR CHART — 5 colored vertical bars
  barChart: {
    width: 120,
    height: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" fill="none">
<rect x="2" y="2" width="116" height="76" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
<line x1="15" y1="68" x2="112" y2="68" stroke="#CBD5E0" stroke-width="0.75"/>
<rect x="18" y="48" width="14" height="20" rx="2" fill="${COLORS.blue}" opacity="0.8"/>
<rect x="38" y="35" width="14" height="33" rx="2" fill="${COLORS.green}" opacity="0.8"/>
<rect x="58" y="20" width="14" height="48" rx="2" fill="${COLORS.orange}" opacity="0.8"/>
<rect x="78" y="28" width="14" height="40" rx="2" fill="${COLORS.purple}" opacity="0.8"/>
<rect x="98" y="12" width="14" height="56" rx="2" fill="${COLORS.red}" opacity="0.9"/>
<text x="25" y="45" text-anchor="middle" font-family="Poppins,sans-serif" font-size="6" font-weight="700" fill="${COLORS.blue}">20%</text>
<text x="65" y="17" text-anchor="middle" font-family="Poppins,sans-serif" font-size="6" font-weight="700" fill="${COLORS.orange}">65%</text>
<text x="105" y="10" text-anchor="middle" font-family="Poppins,sans-serif" font-size="6" font-weight="700" fill="${COLORS.red}">90%</text>
</svg>`,
  },

  // 7. SMARTPHONE MOCKUP — Simple phone frame for social media context
  smartphone: {
    width: 60,
    height: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 90" fill="none">
<rect x="4" y="2" width="52" height="86" rx="8" fill="#1A1A1A" stroke="#333" stroke-width="1.5"/>
<rect x="8" y="12" width="44" height="62" rx="2" fill="#F8FAFC"/>
<circle cx="30" cy="80" r="3" stroke="#555" stroke-width="1" fill="none"/>
<rect x="22" y="6" width="16" height="3" rx="1.5" fill="#333"/>
<rect x="12" y="18" width="36" height="4" rx="1" fill="${COLORS.blue}" opacity="0.3"/>
<rect x="12" y="26" width="28" height="3" rx="1" fill="#E2E8F0"/>
<rect x="12" y="33" width="36" height="3" rx="1" fill="#E2E8F0"/>
<rect x="12" y="40" width="20" height="3" rx="1" fill="#E2E8F0"/>
<rect x="12" y="48" width="36" height="18" rx="2" fill="${COLORS.cyan}" opacity="0.15"/>
<rect x="16" y="52" width="14" height="3" rx="1" fill="${COLORS.cyan}" opacity="0.4"/>
<rect x="16" y="58" width="24" height="3" rx="1" fill="${COLORS.cyan}" opacity="0.3"/>
</svg>`,
  },

  // 8. BRAIN CIRCUIT — Stylized brain with connection nodes (AI/tech)
  brainCircuit: {
    width: 100,
    height: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" fill="none">
<path d="M40,12 C28,8 16,16 16,28 C16,36 20,40 20,44 C20,52 24,58 32,62 C38,64 44,66 50,66 C56,66 62,64 68,62 C76,58 80,52 80,44 C80,40 84,36 84,28 C84,16 72,8 60,12 C54,14 48,14 40,12 Z" fill="${COLORS.cyan}" opacity="0.12" stroke="${COLORS.cyan}" stroke-width="1.5"/>
<circle cx="35" cy="28" r="4" fill="${COLORS.cyan}" opacity="0.8"/>
<circle cx="55" cy="22" r="4" fill="${COLORS.blue}" opacity="0.8"/>
<circle cx="68" cy="32" r="4" fill="${COLORS.purple}" opacity="0.8"/>
<circle cx="50" cy="42" r="5" fill="${COLORS.cyan}"/>
<circle cx="32" cy="48" r="3.5" fill="${COLORS.blue}" opacity="0.7"/>
<circle cx="62" cy="52" r="3.5" fill="${COLORS.green}" opacity="0.7"/>
<line x1="35" y1="28" x2="50" y2="42" stroke="${COLORS.cyan}" stroke-width="1" opacity="0.5"/>
<line x1="55" y1="22" x2="50" y2="42" stroke="${COLORS.blue}" stroke-width="1" opacity="0.5"/>
<line x1="68" y1="32" x2="50" y2="42" stroke="${COLORS.purple}" stroke-width="1" opacity="0.5"/>
<line x1="32" y1="48" x2="50" y2="42" stroke="${COLORS.blue}" stroke-width="1" opacity="0.5"/>
<line x1="62" y1="52" x2="50" y2="42" stroke="${COLORS.green}" stroke-width="1" opacity="0.5"/>
<line x1="35" y1="28" x2="55" y2="22" stroke="${COLORS.cyan}" stroke-width="0.75" opacity="0.3" stroke-dasharray="2,2"/>
<line x1="32" y1="48" x2="62" y2="52" stroke="${COLORS.blue}" stroke-width="0.75" opacity="0.3" stroke-dasharray="2,2"/>
</svg>`,
  },

  // 9. QUOTE MARKS — Large decorative quotation marks
  quoteMarks: {
    width: 80,
    height: 60,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60" fill="none">
<path d="M8,38 C8,24 16,14 30,10 L32,16 C22,20 18,26 18,32 L26,32 C30,32 34,36 34,40 C34,48 30,52 24,52 C14,52 8,46 8,38 Z" fill="${COLORS.red}" opacity="0.15"/>
<path d="M46,38 C46,24 54,14 68,10 L70,16 C60,20 56,26 56,32 L64,32 C68,32 72,36 72,40 C72,48 68,52 62,52 C52,52 46,46 46,38 Z" fill="${COLORS.red}" opacity="0.15"/>
<path d="M8,38 C8,24 16,14 30,10 L32,16 C22,20 18,26 18,32 L26,32 C30,32 34,36 34,40 C34,48 30,52 24,52 C14,52 8,46 8,38 Z" stroke="${COLORS.red}" stroke-width="1.5" fill="none"/>
<path d="M46,38 C46,24 54,14 68,10 L70,16 C60,20 56,26 56,32 L64,32 C68,32 72,36 72,40 C72,48 68,52 62,52 C52,52 46,46 46,38 Z" stroke="${COLORS.red}" stroke-width="1.5" fill="none"/>
</svg>`,
  },

  // 10. SPARKLES — Decorative stars (seen in Image 2, scattered around content)
  sparkles: {
    width: 100,
    height: 60,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" fill="none">
<path d="M20,12 L22,8 L24,12 L28,14 L24,16 L22,20 L20,16 L16,14 Z" fill="${COLORS.amber}" opacity="0.7"/>
<path d="M75,8 L77,4 L79,8 L83,10 L79,12 L77,16 L75,12 L71,10 Z" fill="${COLORS.amber}" opacity="0.5"/>
<path d="M50,45 L52,40 L54,45 L59,47 L54,49 L52,54 L50,49 L45,47 Z" fill="${COLORS.amber}" opacity="0.6"/>
<path d="M10,40 L11,37 L12,40 L15,41 L12,42 L11,45 L10,42 L7,41 Z" fill="${COLORS.orange}" opacity="0.4"/>
<path d="M88,35 L89,32 L90,35 L93,36 L90,37 L89,40 L88,37 L85,36 Z" fill="${COLORS.orange}" opacity="0.4"/>
<circle cx="40" cy="6" r="1.5" fill="${COLORS.amber}" opacity="0.5"/>
<circle cx="65" cy="50" r="1.5" fill="${COLORS.amber}" opacity="0.5"/>
<circle cx="92" cy="20" r="1" fill="${COLORS.orange}" opacity="0.4"/>
</svg>`,
  },

  // 11. COMPARISON ARROWS — Before/After with central arrow
  comparisonArrows: {
    width: 120,
    height: 50,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 50" fill="none">
<rect x="2" y="8" width="42" height="34" rx="6" fill="${COLORS.red}" opacity="0.1" stroke="${COLORS.red}" stroke-width="1.5"/>
<rect x="76" y="8" width="42" height="34" rx="6" fill="${COLORS.green}" opacity="0.1" stroke="${COLORS.green}" stroke-width="1.5"/>
<text x="23" y="20" text-anchor="middle" font-family="Poppins,sans-serif" font-size="7" font-weight="700" fill="${COLORS.red}">BEFORE</text>
<text x="97" y="20" text-anchor="middle" font-family="Poppins,sans-serif" font-size="7" font-weight="700" fill="${COLORS.green}">AFTER</text>
<line x1="12" y1="28" x2="34" y2="28" stroke="${COLORS.red}" stroke-width="1" opacity="0.4"/>
<line x1="12" y1="34" x2="28" y2="34" stroke="${COLORS.red}" stroke-width="1" opacity="0.3"/>
<line x1="86" y1="28" x2="108" y2="28" stroke="${COLORS.green}" stroke-width="1" opacity="0.4"/>
<line x1="86" y1="34" x2="102" y2="34" stroke="${COLORS.green}" stroke-width="1" opacity="0.3"/>
<path d="M48,25 L68,25" stroke="#64748B" stroke-width="2" marker-end="url(#arr2)"/>
<defs><marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#64748B"/></marker></defs>
</svg>`,
  },

  // 12. TARGET BULLSEYE — Concentric circles with arrow
  targetBullseye: {
    width: 80,
    height: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
<circle cx="40" cy="40" r="34" fill="${COLORS.red}" opacity="0.08" stroke="${COLORS.red}" stroke-width="1"/>
<circle cx="40" cy="40" r="24" fill="${COLORS.orange}" opacity="0.1" stroke="${COLORS.orange}" stroke-width="1"/>
<circle cx="40" cy="40" r="14" fill="${COLORS.amber}" opacity="0.15" stroke="${COLORS.amber}" stroke-width="1"/>
<circle cx="40" cy="40" r="5" fill="${COLORS.red}" opacity="0.8"/>
<line x1="58" y1="18" x2="43" y2="37" stroke="${COLORS.dark}" stroke-width="1.5"/>
<polygon points="42,38 46,34 58,16 60,20" fill="${COLORS.dark}" opacity="0.7"/>
<line x1="56" y1="14" x2="62" y2="14" stroke="${COLORS.dark}" stroke-width="1"/>
<line x1="62" y1="14" x2="62" y2="20" stroke="${COLORS.dark}" stroke-width="1"/>
</svg>`,
  },
};

// ─── Illustration selection logic ───

/**
 * Select the best illustration based on content type and template.
 * Maps content signals to the most visually appropriate illustration.
 */
export function selectIllustration(
  contentType: string,
  templateId: string,
  content: string
): IllustrationName {
  const lower = content.toLowerCase();

  // Content-specific overrides
  if (/funnel|entonnoir|pipeline|étape.*convert/i.test(lower)) return "funnel";
  if (/pyramid|pyramide|level|niveau|tier|hierarchy/i.test(lower)) return "pyramid";
  if (/checklist|check.?list|to.?do|todolist|vérif/i.test(lower)) return "checklist";
  if (/before.*after|avant.*après|transformation|résultat/i.test(lower)) return "comparisonArrows";
  if (/quote|citation|dit|said|«|»/i.test(lower)) return "quoteMarks";
  if (/phone|mobile|smartphone|app|application/i.test(lower)) return "smartphone";
  if (/brain|cerveau|neural|neuron|ai|intelligence artificielle/i.test(lower)) return "brainCircuit";
  if (/goal|objectif|target|cible|bullseye/i.test(lower)) return "targetBullseye";

  // Template-based defaults
  const templateMap: Partial<Record<string, IllustrationName>> = {
    STATS_IMPACT: "barChart",
    COMPARISON_VS: "comparisonArrows",
    AWA_BREAKING: "targetBullseye",
    AWA_MASTERCLASS: "processFlow",
    CHEAT_SHEET: "checklist",
  };

  if (templateMap[templateId]) return templateMap[templateId];

  // Content type defaults
  const typeMap: Record<string, IllustrationName> = {
    comparison: "comparisonArrows",
    stats: "barChart",
    howto: "processFlow",
    quote: "quoteMarks",
    tips: "checklist",
    general: "growthChart",
  };

  return typeMap[contentType] || "growthChart";
}

/**
 * Get the full inline SVG HTML for an illustration.
 * Returns sized SVG ready for embedding in templates.
 */
export function getIllustrationSvg(name: IllustrationName, maxWidth?: number): string {
  const illust = ILLUSTRATIONS[name];
  if (!illust) return "";

  const w = maxWidth || illust.width;
  const scale = w / illust.width;
  const h = Math.round(illust.height * scale);

  return illust.svg
    .replace(/viewBox="([^"]*)"/, `viewBox="$1" width="${w}" height="${h}"`);
}

/**
 * Get sparkle decorations SVG — can be overlaid on headers for visual flair.
 */
export function getSparklesSvg(width: number = 100): string {
  return getIllustrationSvg("sparkles", width);
}

/**
 * Get all available illustration names.
 */
export function getIllustrationNames(): IllustrationName[] {
  return Object.keys(ILLUSTRATIONS) as IllustrationName[];
}

/**
 * Generate an editorial illustration image for a social media post via Gemini.
 * Called from StudioWizard when user clicks the "Image" button on a variation.
 * Uses VITE_GEMINI_API_KEY + gemini-2.5-flash-image.
 *
 * Returns base64-encoded image data (no "data:" prefix) or null on failure.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-image";
const IS_DEV = import.meta.env.DEV;

// ─── Public API ───

export async function generateContentImage(
  content: string,
  platform: string,
  niche?: string,
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt = buildIllustrationPrompt(content, platform, niche);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000); // 2 min

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (IS_DEV) {
        const errText = await response.text().catch(() => "");
        console.warn("[image-generator] Gemini HTTP", response.status, errText);
      }
      return null;
    }

    const data = await response.json();
    // Pick the part whose inlineData is an image — ignore text parts.
    const imagePart = data.candidates?.[0]?.content?.parts
      ?.find((p: { inlineData?: { mimeType?: string; data?: string } }) =>
        p.inlineData?.mimeType?.startsWith("image/"));
    const base64 = imagePart?.inlineData?.data;

    return base64 || null;
  } catch (err) {
    clearTimeout(timeoutId);
    if (IS_DEV) console.warn("[image-generator] Error:", err);
    return null;
  }
}

// Alias for clarity at call sites
export const generateIllustration = generateContentImage;

// ─── Prompt builder ───

/**
 * Build an illustration prompt from the actual post content.
 *
 * Key design decisions:
 * - Written in English (Gemini image model is English-first)
 * - Passes the FULL post excerpt (300 chars) as subject context, not just keywords
 * - Explicitly forbids text, infographic format, and busy layouts
 * - Asks for ONE clear visual metaphor tied to the post's main idea
 * - Lets Gemini choose the style within clean aesthetic guardrails
 */
function buildIllustrationPrompt(content: string, platform: string, niche?: string): string {
  const excerpt = content.slice(0, 400).trim();
  const platformHint = platform === "LinkedIn"
    ? "professional, editorial illustration suitable for a business-oriented LinkedIn feed"
    : platform === "Instagram"
      ? "vibrant, visually striking illustration suitable for an Instagram feed"
      : platform === "X (Twitter)"
        ? "clean, punchy illustration suitable for an X/Twitter post"
        : platform === "TikTok"
          ? "bold, attention-grabbing illustration suitable for a TikTok thumbnail"
          : platform === "Facebook"
            ? "warm, relatable illustration suitable for a Facebook post"
            : "clean social-media illustration";

  return `Create a high-quality editorial illustration image for a ${platformHint}.
${niche ? `The creator's niche is: ${niche}.` : ""}

THE POST (use this to pick the right visual metaphor):
"""
${excerpt}
"""

Analyze the post above and generate ONE clear visual metaphor that represents
its main idea or emotion. Think like an editorial illustrator working for
The New Yorker, Wired, or a premium SaaS brand.

STRICT VISUAL RULES:
- Square format (1:1 aspect ratio)
- Clean modern flat-design or soft-gradient illustration
- Exactly ONE focal subject / metaphor — no cluttered scenes
- Warm off-white background (#FDFDF9 to #F8F9F7) OR subtle matching gradient
- Soft professional color palette (blues, greens, warm neutrals, soft oranges)
- Subtle depth via soft shadows only — no hard drop shadows
- High-quality vector-like rendering, suitable for print

ABSOLUTELY FORBIDDEN:
- NO text, NO letters, NO words, NO typography anywhere in the image
- NO infographic layout, NO numbered sections, NO charts or tables
- NO realistic photography look — stay illustrated
- NO busy backgrounds, NO multiple focal points
- NO clipart, NO stock-photo aesthetic
- NO generic symbols like light bulbs, rockets, or gears unless genuinely relevant
- NO human faces with detailed features (if a person is needed, keep them abstract/silhouette)

GOAL: a single striking visual that could be paired with the post as its feature image.
It should communicate the post's core idea at a glance, without any words needed.

Generate the image now.`;
}

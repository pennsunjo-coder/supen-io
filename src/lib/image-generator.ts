/**
 * Generate an editorial illustration image for a social media post via Gemini.
 * Called from StudioWizard when user clicks the "Image" button on a variation.
 * Uses a secure Supabase Edge Function to protect the Gemini API Key.
 *
 * Returns base64-encoded image data (no "data:" prefix) or null on failure.
 */

import { supabase } from "@/lib/supabase";

const IS_DEV = import.meta.env.DEV;

// ─── Public API ───

export async function generateContentImage(
  content: string,
  platform: string,
  niche?: string,
): Promise<string | null> {
  const prompt = buildIllustrationPrompt(content, platform, niche);

  try {
    const { data, error } = await supabase.functions.invoke("generate-gemini-image", {
      body: { prompt },
    });

    if (error) {
      if (IS_DEV) console.warn("[image-generator] Edge Function error:", error);
      return null;
    }

    if (data?.error) {
      if (IS_DEV) console.warn("[image-generator] API error:", data.error);
      return null;
    }

    return data?.image || null;
  } catch (err) {
    if (IS_DEV) console.warn("[image-generator] Error:", err);
    return null;
  }
}

// Alias for clarity at call sites
export const generateIllustration = generateContentImage;

// ─── Custom-prompt image generation ───

export async function generateImageFromPrompt(
  userPrompt: string,
  platform?: string,
): Promise<string | null> {
  const cleaned = userPrompt.trim();
  if (cleaned.length < 4) return null;

  const wrappedPrompt = buildCustomPromptWrapper(cleaned, platform);

  try {
    const { data, error } = await supabase.functions.invoke("generate-gemini-image", {
      body: { prompt: wrappedPrompt },
    });

    if (error || data?.error) return null;
    return data?.image || null;
  } catch (err) {
    if (IS_DEV) console.warn("[image-generator] custom prompt error:", err);
    return null;
  }
}

function buildCustomPromptWrapper(userPrompt: string, platform?: string): string {
  const platformHint = platform === "LinkedIn"
    ? "Square format, professional editorial look suitable for a LinkedIn feed."
    : platform === "Instagram"
      ? "Square format (1:1), vivid and feed-friendly for Instagram."
      : platform === "X (Twitter)"
        ? "Square format, clean and punchy for X/Twitter."
        : platform === "TikTok"
          ? "Square format, bold and attention-grabbing for a TikTok thumbnail."
          : platform === "Facebook"
            ? "Square format, warm and relatable for a Facebook post."
            : "Square format (1:1), social-media-ready.";

  return `Generate a single high-quality image based on the user's description below.

USER DESCRIPTION (follow this verbatim — this is the creative direction):
"""
${userPrompt}
"""

OUTPUT REQUIREMENTS:
- ${platformHint}
- ONE clear focal subject — no cluttered, multi-scene compositions.
- High-quality rendering. Clean composition. Premium aesthetic.

ABSOLUTELY FORBIDDEN:
- NO text, letters, words, captions, or watermarks anywhere in the image.
- NO infographic layout, charts, tables, or numbered sections.
- NO realistic human faces with identifiable features (use silhouette / abstract / from behind if a person is needed).
- NO copyrighted logos or brand marks unless the user explicitly named a real public-domain reference.
- NO sexual, violent, or harmful content.

Generate the image now.`;
}

// ─── Prompt builder ───

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

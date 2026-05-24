/**
 * Visual eligibility (infographic AND image) — single source of truth.
 *
 * Visuals may ONLY be generated for:
 *   - LinkedIn posts
 *   - Facebook posts
 *
 * Every other content type is excluded — including THREADS (Facebook and X),
 * which never get a visual. Also excluded: tweets, captions, scripts, reels,
 * and Instagram / TikTok / YouTube posts.
 *
 * Accepts either a platform id ("linkedin", "facebook", "x") or its display
 * name ("LinkedIn", "X (Twitter)") — matching is case-insensitive.
 */
export function canGenerateInfographic(
  platform?: string | null,
  format?: string | null,
): boolean {
  const pl = (platform || "").toLowerCase();
  const fmt = (format || "").toLowerCase();
  const isThread = fmt.includes("thread");
  if (isThread) return false; // threads never get visuals
  const isPost = fmt.includes("post");
  const isPostPlatform = pl.includes("linkedin") || pl.includes("facebook");
  return isPost && isPostPlatform;
}

/**
 * Threads get NO visuals at all — neither infographic nor image.
 * Used to hide image-generation buttons (which are otherwise allowed for
 * reels, captions, etc.) specifically for Thread content.
 */
export function isThreadFormat(format?: string | null): boolean {
  return (format || "").toLowerCase().includes("thread");
}

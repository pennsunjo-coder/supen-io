/**
 * Infographic eligibility — single source of truth.
 *
 * Infographics may be generated for:
 *   - LinkedIn posts
 *   - Facebook posts
 *   - Threads (Facebook and X)
 *
 * Every other content type is excluded: tweets, captions, scripts, reels,
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
  const isPost = fmt.includes("post");
  const isPostPlatform = pl.includes("linkedin") || pl.includes("facebook");
  return isThread || (isPost && isPostPlatform);
}

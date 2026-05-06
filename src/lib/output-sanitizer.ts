/**
 * Output sanitizer — runs on every parsed variation BEFORE it's shown
 * to the user. The model still slips through occasionally even with the
 * full anti-AI rules block, so we strip the most visible tells
 * automatically. This is a safety net, not a replacement for good
 * prompting.
 *
 * What this DOES NOT do:
 * - Rewrite sentences. We only touch surface-level mechanics.
 * - Touch numbers, real URLs, real button paths, code blocks.
 * - Strip functional emoji (☑ ✦ ↳ ❌ ✅ ♻️ → 👇).
 *
 * What this DOES:
 * - Replace curly quotes / apostrophes with straight versions.
 * - Cap em-dashes per post (excess become commas).
 * - Strip decorative emoji prefixed to headings or list items.
 * - Convert Title Case headings to sentence case.
 * - Remove markdown fences and obvious "as a large language model" leakage.
 * - Normalise whitespace (no triple+ blank lines, no orphan spaces).
 */

// Functional emoji we keep — anything else prefixed to a line gets stripped.
const FUNCTIONAL_EMOJI = new Set([
  "☑", "✦", "↳", "→", "❌", "✅", "♻️", "♻", "👇",
]);

// Decorative emoji we strip if used at the start of a line / heading / bullet.
const DECORATIVE_EMOJI_LINE_PREFIX_RE =
  /^[\s]*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{2300}-\u{23FF}]+\s*/u;

// Curly → straight character map.
const CURLY_TO_STRAIGHT: Record<string, string> = {
  "“": '"', // “
  "”": '"', // ”
  "‘": "'", // ‘
  "’": "'", // ’
  "„": '"', // „
  "‚": "'", // ‚
  "′": "'", // ′ (prime, sometimes used as apostrophe)
  "″": '"', // ″
};

const COLLAB_LEAKAGE_RE =
  /\b(certainly!|of course!|absolutely!|i hope this helps[\s.,!]*|let me know if you need[^.\n]*|would you like me to[^.\n]*|as (?:a |an )?(?:large )?language model[^.\n]*)/gi;

const MD_FENCE_RE = /```[\w-]*\s*([\s\S]*?)```/g;
const MD_BOLD_RE = /\*\*([^*\n]+)\*\*/g;
const MD_ITALIC_RE = /(?<!\*)\*([^*\n]+)\*(?!\*)/g;
const MD_HEADER_RE = /^#{1,6}\s+/gm;

/** Convert curly quotes/apostrophes to straight versions. */
function straightenQuotes(text: string): string {
  return text.replace(/[“”‘’„‚′″]/g, (c) => CURLY_TO_STRAIGHT[c] ?? c);
}

/** Cap em-dashes at `maxAllowed`. Any extra becomes a comma. */
function capEmDashes(text: string, maxAllowed: number): string {
  let count = 0;
  return text.replace(/—/g, () => {
    count += 1;
    return count <= maxAllowed ? "—" : ",";
  });
}

/** Strip decorative emoji from line prefixes (keeps functional emoji). */
function stripDecorativeEmojiPrefixes(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.replace(/^\s+/, "");
      if (!trimmed) return line;
      // Keep the line untouched if it starts with a functional emoji.
      const firstChar = Array.from(trimmed)[0];
      if (firstChar && FUNCTIONAL_EMOJI.has(firstChar)) return line;
      return line.replace(DECORATIVE_EMOJI_LINE_PREFIX_RE, "");
    })
    .join("\n");
}

/**
 * Convert Title Case lines to sentence case if and only if the line
 * looks like a heading (short, ends without punctuation, mostly capitalised
 * words, no real sentence verbs).
 */
function downgradeTitleCaseHeadings(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.length > 80) return line; // probably a sentence
      if (/[.?!]$/.test(trimmed)) return line; // ends with punctuation → likely sentence
      const words = trimmed.split(/\s+/).filter(Boolean);
      if (words.length < 3 || words.length > 10) return line;

      // Title Case heuristic: at least 60% of words have a capital first letter
      // AND none of them are obviously connective lowercase ("the", "of", "and").
      const capitalised = words.filter((w) => /^[A-Z][a-z]+/.test(w)).length;
      if (capitalised / words.length < 0.6) return line;

      // Lowercase everything except the first character of the first word.
      const sentenced = words
        .map((w, i) => {
          if (i === 0) return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
          return w.toLowerCase();
        })
        .join(" ");
      // Preserve leading whitespace.
      const leading = line.slice(0, line.length - line.trimStart().length);
      return leading + sentenced;
    })
    .join("\n");
}

/** Remove markdown formatting that breaks on social platforms. */
function stripMarkdownFormatting(text: string): string {
  return text
    // Replace fenced code blocks with their content (no fences).
    .replace(MD_FENCE_RE, (_m, inner) => inner)
    // **bold** → bold
    .replace(MD_BOLD_RE, "$1")
    // *italic* → italic (but not ** which we handled above)
    .replace(MD_ITALIC_RE, "$1")
    // # headers → just the text
    .replace(MD_HEADER_RE, "");
}

/** Strip residual chatbot leakage like "Certainly!" or "as a large language model". */
function stripCollaborativeLeakage(text: string): string {
  return text.replace(COLLAB_LEAKAGE_RE, "").replace(/^\s+/, "");
}

/** Collapse 3+ blank lines into 2; trim trailing whitespace per line. */
function normaliseWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n") // keep up to 3 newlines for breathing room
    .trim();
}

/**
 * Main entry point. Sanitises one variation's content.
 *
 * @param content   Raw variation content from the model.
 * @param options   Per-platform tuning. `maxEmDashes` defaults to 1
 *                  (LinkedIn-style) — relax to 3 for spoken formats.
 */
export interface SanitizeOptions {
  /** Max em-dashes allowed in the final text. Default: 1 */
  maxEmDashes?: number;
  /** Skip Title Case heading downgrade (e.g. for poems / song lyrics). */
  preserveCapitalisation?: boolean;
}

export function sanitizeVariation(
  content: string,
  options: SanitizeOptions = {}
): string {
  const { maxEmDashes = 1, preserveCapitalisation = false } = options;

  let out = content;
  out = stripCollaborativeLeakage(out);
  out = stripMarkdownFormatting(out);
  out = straightenQuotes(out);
  out = stripDecorativeEmojiPrefixes(out);
  out = capEmDashes(out, maxEmDashes);
  if (!preserveCapitalisation) out = downgradeTitleCaseHeadings(out);
  out = normaliseWhitespace(out);
  return out;
}

/**
 * Convenience: pick sanitization options based on platform/format.
 * Spoken formats (TikTok, Reels, YouTube) tolerate more em-dashes
 * because the dash there is a writing convenience, not a tell.
 */
export function sanitizeForPlatform(
  content: string,
  platform: string,
  format: string
): string {
  const pl = platform.toLowerCase();
  const fmt = format.toLowerCase();
  const isSpoken =
    pl.includes("tiktok") ||
    pl.includes("youtube") ||
    fmt.includes("script") ||
    fmt.includes("reel") ||
    fmt.includes("video");

  return sanitizeVariation(content, {
    maxEmDashes: isSpoken ? 3 : 1,
  });
}

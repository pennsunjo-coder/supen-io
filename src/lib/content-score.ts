/**
 * Per-chunk content quality score (0.0 – 1.0).
 *
 * Runs in milliseconds with no LLM call. Used at upload time to mark
 * boilerplate chunks (TOC, copyright, navigation, page headers, biblio-
 * graphies) and at retrieval time to bias the RAG ranking toward high-
 * signal content (specific numbers, named tools, real URLs, quoted
 * prompts, action verbs).
 *
 * Design notes:
 * - Heuristic only. Claude-grade scoring would be more accurate but at
 *   ~$0.01-0.05 per chunk it's not worth it — and Claude already
 *   distills the source as a whole via distill-source. This is the
 *   complementary CHEAP per-chunk gate.
 * - Score 0.5 = neutral / unscored. Existing rows pre-migration keep
 *   this default and behave like average chunks.
 * - Anything below 0.3 should be dropped from retrieval entirely.
 * - The function is deterministic — same text → same score. No locale-
 *   sensitive operations.
 */

// ─── Boilerplate detection ───
// If the chunk smells like front-matter / back-matter, score it near zero
// without bothering to run the positive-signal pass. These shapes appear
// in the first / last pages of nearly every PDF the platform ingests.
const BOILERPLATE_PATTERNS = [
  /\btable of contents\b/i,
  /\b(copyright|all rights reserved|©)\b/i,
  /\bISBN[-\s]?(?:10|13)?[:\s]/i,
  /\bprinted in (the )?(united states|the usa|china|canada|uk)\b/i,
  /\b(acknowledg(e)?ments?|foreword|preface)\b\s*$/im,
  /\b(bibliography|references|works cited|index)\b\s*$/im,
  /^\s*(page|chapter)\s+\d+\s*$/im,
  /\bclick here to (sign in|continue|accept)\b/i,
  /\b(privacy policy|terms of service|cookie policy)\b/i,
  /\bsubscribe to our newsletter\b/i,
];

const HEADER_NAVIGATION_PATTERNS = [
  /^\s*home\s*>\s*\w+/i, // breadcrumb
  /^\s*menu\s*$/im,
  /skip to (main )?content/i,
];

// ─── Positive signal patterns (count occurrences for additive scoring) ───

// Numbers with units that signal concreteness ("47%", "$10k", "90 days",
// "1,608 followers", "30 minutes", "2.5x"). NOT bare integers — those
// alone are too noisy (page numbers, dates).
const NUMBER_WITH_UNIT_RE =
  /\b\d[\d,.]*\s*(?:%|x|×|k|K|m|M|b|B|fps|fps?|\$|€|£|usd|eur|gbp|followers|subs(?:cribers)?|views|likes|comments|shares|hours?|mins?|minutes?|seconds?|days?|weeks?|months?|years?|impressions?|leads?|sales?|clients?|customers?|words?|pages?|slides?|posts?)\b/g;
const DOLLAR_AMOUNT_RE = /\$[\d,]+(?:\.\d{1,2})?(?:\s*(?:\/mo|\/month|\/yr|\/year|k|m|million|billion))?/g;

// Named entities (capitalized multi-word OR known tech names) — cheap
// proxy for "specific tool / brand / person mentioned by name". Avoid
// matching common sentence-starting capitalized words by requiring
// multi-word OR a known-token presence.
const NAMED_ENTITY_HINT_RE =
  /\b(?:NotebookLM|Claude|ChatGPT|Gemini|GPT(?:-\d+)?|OpenAI|Anthropic|Google|Notion|Linear|Stripe|Vercel|Supabase|Cursor|Replit|Loom|Canva|Figma|Slack|Discord|Tavily|Manus|Pomelli|Cluely|Veo|Sora|HeyGen|InVideo|Beehiiv|Gumroad|Etsy|Shopify|Printify|ElevenLabs|Ideogram|Adobe|MrBeast|YouTube|TikTok|Instagram|LinkedIn|Facebook|Threads|Twitter|Reddit|Pinterest|Spotify|Apple|Microsoft|Meta|Amazon|Tesla|SpaceX|NVIDIA)\b/g;
const MULTIWORD_PROPER_NOUN_RE = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g;

// Real URL or path-like reference
const URL_OR_PATH_RE = /(?:https?:\/\/\S+|[a-z][\w-]*\.(?:com|io|ai|app|google|notion|figma|stripe|youtube|tiktok|instagram)\b\S*|\b\w+\s*→\s*\w+)/gi;

// Quoted material (verbatim prompts, citations) — strong signal of
// concreteness and reusability.
const QUOTE_RE = /["'`]([^"'`\n]{15,300})["'`]/g;
const TRIPLE_QUOTE_RE = /```[\s\S]+?```/g;

// Numbered or bulleted list markers signal "structured advice" — high
// signal density.
const LIST_MARKER_RE = /(?:^|\n)\s*(?:\d+\.\s|\d+\)\s|—\s|✦\s|☑\s|✅\s|•\s|-\s)\S/g;

// Specific time anchors (commitable to memory)
const TIME_ANCHOR_RE =
  /\b(?:Q[1-4]\s*20\d{2}|20\d{2}|[Jj]an(?:uary)?|[Ff]eb(?:ruary)?|[Mm]ar(?:ch)?|[Aa]pr(?:il)?|[Mm]ay|[Jj]un(?:e)?|[Jj]ul(?:y)?|[Aa]ug(?:ust)?|[Ss]ep(?:tember)?|[Oo]ct(?:ober)?|[Nn]ov(?:ember)?|[Dd]ec(?:ember)?)\s+20\d{2}\b/g;

// Direct-address pronouns mid-text signal coaching / how-to voice — the
// kind of source that's reusable as content material. Pronoun in line 1
// is a hook tell; we count occurrences across the chunk.
const DIRECT_ADDRESS_RE = /\b(?:you'(?:re|ll|ve|d)|your|you)\b/gi;

// ─── Negative signal patterns ───

// All-caps prose (>50% of words) usually means a header/title page
function fractionAllCaps(text: string): number {
  const words = text.match(/\b[A-Z]{2,}\b/g);
  if (!words) return 0;
  const total = text.split(/\s+/).filter(Boolean).length;
  if (total === 0) return 0;
  return words.length / total;
}

// Average sentence length — extremely long sentences signal academic /
// legal prose (low viral utility); extremely short signal nav / TOC.
function avgSentenceLen(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  const words = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0);
  return words / sentences.length;
}

/**
 * Score a chunk's quality as content-generation source material.
 * Returns a value clamped to [0, 1].
 *
 * 0.0-0.3  → boilerplate / nav / front-matter. Drop from retrieval.
 * 0.3-0.5  → low signal. Keep but de-rank.
 * 0.5-0.7  → average.
 * 0.7-1.0  → high signal. Boost in retrieval ranking.
 */
export function scoreContent(text: string): number {
  if (!text || text.trim().length < 50) return 0.1; // tiny chunks = bad

  const trimmed = text.trim();
  const len = trimmed.length;

  // ── Negative gates: if boilerplate fires, bail early near zero ──
  for (const re of BOILERPLATE_PATTERNS) {
    if (re.test(trimmed)) return 0.1;
  }
  for (const re of HEADER_NAVIGATION_PATTERNS) {
    if (re.test(trimmed)) return 0.1;
  }
  if (fractionAllCaps(trimmed) > 0.5) return 0.15;

  // ── Positive signal counts ──
  const count = (re: RegExp): number => {
    re.lastIndex = 0;
    const m = trimmed.match(re);
    return m ? m.length : 0;
  };

  const numbers = count(NUMBER_WITH_UNIT_RE) + count(DOLLAR_AMOUNT_RE);
  const namedTech = count(NAMED_ENTITY_HINT_RE);
  const properNouns = count(MULTIWORD_PROPER_NOUN_RE);
  const urls = count(URL_OR_PATH_RE);
  const quotes = count(QUOTE_RE) + count(TRIPLE_QUOTE_RE) * 2;
  const listMarkers = count(LIST_MARKER_RE);
  const timeAnchors = count(TIME_ANCHOR_RE);
  const youAddress = count(DIRECT_ADDRESS_RE);

  // ── Density normalization (per 1000 chars) ──
  // Long chunks with 1 number aren't more signal-rich than short ones.
  const per1k = (n: number) => (n * 1000) / len;

  // ── Additive scoring ──
  // Start from a low baseline and let positive signals lift the score.
  // Density of numbers + named tech are the strongest signals for
  // viral-content source material based on the PDFs we trained on.
  let score = 0.30;

  // High-value signals
  if (numbers > 0) score += Math.min(0.20, per1k(numbers) * 0.04);
  if (namedTech > 0) score += Math.min(0.20, per1k(namedTech) * 0.05);
  if (urls > 0) score += Math.min(0.10, per1k(urls) * 0.05);
  if (quotes > 0) score += Math.min(0.10, per1k(quotes) * 0.05);

  // Medium-value signals
  if (properNouns >= 2) score += 0.05;
  if (listMarkers >= 3) score += 0.05;
  if (timeAnchors > 0) score += Math.min(0.05, per1k(timeAnchors) * 0.04);
  if (youAddress >= 3) score += 0.05;

  // ── Sentence-length penalty ──
  const avgLen = avgSentenceLen(trimmed);
  if (avgLen > 40) score -= 0.10; // academic / legal
  if (avgLen < 4 && len > 200) score -= 0.10; // nav / TOC / fragmented

  return Math.max(0, Math.min(1, score));
}

/**
 * Drop boilerplate chunks entirely before insert. Returns chunks with
 * their computed scores; caller can filter further by threshold.
 */
export function scoreChunks(chunks: string[]): Array<{ content: string; content_score: number }> {
  return chunks.map((content) => ({
    content,
    content_score: scoreContent(content),
  }));
}

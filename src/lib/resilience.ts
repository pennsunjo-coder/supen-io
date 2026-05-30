/**
 * Production resilience utilities.
 * Retry with backoff, offline detection, HTML sanitization, timeouts.
 */

// ─── Offline detection ───

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export function assertOnline(): void {
  if (isOffline()) {
    throw new Error("No internet connection. Check your connection and try again.");
  }
}

// ─── Retry with exponential backoff ───

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  onRetry?: (attempt: number, delayMs: number) => void;
}

export function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message;
  const status = (err as { status?: number }).status;
  if (status && status >= 500 && status < 600) return true;
  return /\b(429|500|502|503|504|520|521|522|523|524)\b/.test(msg)
    || /rate.?limit|too.?many|overloaded|529/i.test(msg)
    || /network|fetch|load.?failed|aborterror|connection|timeout/i.test(msg)
    || /Edge Function returned a non-2xx/i.test(msg); // Supabase wrapper wraps 5xx as this
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 2, baseDelayMs = 2000, onRetry } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      if (!isTransientError(err) || attempt >= maxRetries) {
        throw err;
      }
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      if (onRetry) onRetry(attempt + 1, delayMs);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("Max retries reached");
}

/**
 * Retry wrapper for Supabase methods that return `{ data, error }` instead
 * of throwing. Transient errors (Cloudflare 522, network, rate limit) get
 * retried with exponential backoff; user errors (wrong password, etc.)
 * pass through untouched.
 *
 * Default: 4 attempts at 600ms / 1.8s / 5.4s / 16s — total wall-time ~24s
 * worst case. Good for "Supabase Auth blipped on us" hiding.
 */
export async function withSupabaseRetry<T extends { error: unknown }>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 600, onRetry } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      if (!result.error || !isTransientError(result.error) || attempt >= maxRetries) {
        return result;
      }
      const delayMs = baseDelayMs * Math.pow(3, attempt);
      if (onRetry) onRetry(attempt + 1, delayMs);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (err) {
      // Some Supabase methods throw on hard failures (e.g. signInWithOAuth
      // when the redirect itself fails). Funnel those through the same
      // transient check so we don't bail too eagerly.
      if (!isTransientError(err) || attempt >= maxRetries) throw err;
      const delayMs = baseDelayMs * Math.pow(3, attempt);
      if (onRetry) onRetry(attempt + 1, delayMs);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Max retries reached");
}

// ─── Timeout wrapper ───

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = "The request took too long. Try again.",
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then((result) => { clearTimeout(timer); resolve(result); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

// ─── HTML sanitization for infographic iframes ───

export function sanitizeInfographicHtml(html: string): string {
  let safe = html;

  // Remove all <script> tags and their content
  safe = safe.replace(/<script[\s\S]*?<\/script>/gi, "");

  // Remove event handlers (onclick, onerror, onload, etc.)
  safe = safe.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  safe = safe.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");

  // Remove javascript: URLs
  safe = safe.replace(/javascript\s*:/gi, "blocked:");

  // Remove data: URLs in href/src (except data:image for infographic base64)
  safe = safe.replace(/(?:href|src)\s*=\s*["']data:(?!image\/)/gi, 'data-blocked="');

  // Remove <iframe>, <object>, <embed>, <form> tags
  safe = safe.replace(/<(iframe|object|embed|form|applet|base|link\s+rel=["']import)[\s\S]*?(?:\/>|<\/\1>)/gi, "");

  return safe;
}

// ─── User validation ───

export function assertUserId(userId: string | undefined | null, context: string): asserts userId is string {
  if (!userId) {
    throw new Error(`Not logged in (${context}). Please sign in again.`);
  }
}

// ─── Friendly error messages ───

export function friendlyError(err: unknown): string {
  if (!(err instanceof Error)) return "Unknown error. Try again.";

  const msg = err.message.toLowerCase();

  if (msg.includes("429") || msg.includes("rate") || msg.includes("too many")) {
    return "Rate limit reached (60 generations/hour). Wait a few minutes and try again.";
  }
  if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("invalid api key")) {
    return "API authentication error. Check that OPENAI_API_KEY is set correctly on the server.";
  }
  if (msg.includes("overloaded") || msg.includes("529")) {
    return "OpenAI servers overloaded — try again in 30 seconds.";
  }
  if (msg.includes("timeout") || msg.includes("took too long")) {
    return "Generation took too long (>2 min). Try with fewer sources or a shorter topic.";
  }
  if (msg.includes("context_length_exceeded") || msg.includes("maximum context length")) {
    return "Sources too long for one generation. Uncheck some PDFs and retry.";
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("load failed")) {
    return "Network error. Check your internet connection.";
  }
  if (msg.includes("internet connection")) {
    return err.message;
  }

  // Handle stringified JSON from Supabase Edge Functions
  if (err.message.includes('{"error":')) {
    try {
      const parsed = JSON.parse(err.message.substring(err.message.indexOf('{')));
      if (parsed.error) return typeof parsed.error === "string" ? parsed.error : JSON.stringify(parsed.error);
    } catch { /* ignore */ }
  }

  return err.message.length > 200 ? err.message.slice(0, 200) + "..." : err.message;
}

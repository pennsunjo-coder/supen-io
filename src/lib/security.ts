/**
 * Security utilities for Supenli.ai
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

const HTML_ESCAPE_RE = /[&<>"'/]/g;

/**
 * Sanitise un input utilisateur :
 * - Trims whitespace
 * - Escapes dangerous HTML characters (XSS prevention)
 * - Removes invisible control characters (except newlines and tabs)
 * - Limits length
 */
export function sanitizeInput(
  input: string,
  maxLength: number = 5000
): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const cleaned = trimmed
    // Supprime les caractères de contrôle sauf \n et \t
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .slice(0, maxLength);

  return cleaned.replace(HTML_ESCAPE_RE, (char) => HTML_ESCAPE_MAP[char]);
}

/**
 * Valide un format d'email.
 */
export function validateEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  // RFC 5322 simplifié — couvre 99%+ des emails réels
  const emailRe =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRe.test(trimmed);
}

/**
 * Client-side rate limiter based on a sliding window.
 * Returns an object with `canProceed()` and `getRemainingTime()`.
 */
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const timestamps: number[] = [];

  function cleanup() {
    const now = Date.now();
    while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
      timestamps.shift();
    }
  }

  return {
    /** Check and record an attempt. Returns true if allowed. */
    canProceed(): boolean {
      cleanup();
      if (timestamps.length >= maxRequests) {
        return false;
      }
      timestamps.push(Date.now());
      return true;
    },

    /** Milliseconds until the next slot frees up. 0 if available. */
    getRemainingTime(): number {
      cleanup();
      if (timestamps.length < maxRequests) return 0;
      return Math.max(0, timestamps[0] + windowMs - Date.now());
    },

    /** Number of remaining requests in the current window. */
    getRemainingRequests(): number {
      cleanup();
      return Math.max(0, maxRequests - timestamps.length);
    },
  };
}

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
    throw new Error("Pas de connexion internet. Verifie ta connexion et reessaie.");
  }
}

// ─── Retry with exponential backoff ───

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  onRetry?: (attempt: number, delayMs: number) => void;
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
      const isRateLimit = err instanceof Error && (
        err.message.includes("429") ||
        err.message.includes("rate") ||
        err.message.includes("Too many") ||
        (err as { status?: number }).status === 429
      );

      const isRetryable = isRateLimit || (
        err instanceof Error && (
          err.message.includes("overloaded") ||
          err.message.includes("529") ||
          err.message.includes("500") ||
          err.message.includes("503") ||
          err.message.includes("network") ||
          err.message.includes("fetch") ||
          err.message.includes("Load failed")
        )
      );

      if (!isRetryable || attempt >= maxRetries) {
        throw err;
      }

      const delayMs = baseDelayMs * Math.pow(2, attempt);
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
  message = "La requete a pris trop de temps. Reessaie.",
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
    throw new Error(`Utilisateur non connecte (${context}). Reconnecte-toi.`);
  }
}

// ─── Friendly error messages ───

export function friendlyError(err: unknown): string {
  if (!(err instanceof Error)) return "Erreur inconnue. Reessaie.";

  const msg = err.message.toLowerCase();

  if (msg.includes("429") || msg.includes("rate") || msg.includes("too many")) {
    return "Trop de requetes. Attends quelques secondes et reessaie.";
  }
  if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("invalid api key")) {
    return "Erreur d'authentification API. Contacte le support.";
  }
  if (msg.includes("overloaded") || msg.includes("529")) {
    return "Le serveur IA est surcharge. Reessaie dans quelques secondes.";
  }
  if (msg.includes("timeout") || msg.includes("pris trop de temps")) {
    return "La generation a pris trop de temps. Reessaie avec un sujet plus court.";
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("load failed")) {
    return "Erreur reseau. Verifie ta connexion internet.";
  }
  if (msg.includes("connexion internet")) {
    return err.message;
  }

  return err.message.length > 150 ? err.message.slice(0, 150) + "..." : err.message;
}

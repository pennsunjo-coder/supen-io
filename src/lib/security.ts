/**
 * Utilitaires de sécurité pour Supen.io
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
 * - Trim les espaces
 * - Échappe les caractères HTML dangereux (prévention XSS)
 * - Supprime les caractères de contrôle invisibles (sauf newlines et tabs)
 * - Limite la longueur
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
 * Rate limiter côté client basé sur une fenêtre glissante.
 * Retourne un objet avec `canProceed()` et `getRemainingTime()`.
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
    /** Vérifie et enregistre une tentative. Retourne true si autorisé. */
    canProceed(): boolean {
      cleanup();
      if (timestamps.length >= maxRequests) {
        return false;
      }
      timestamps.push(Date.now());
      return true;
    },

    /** Millisecondes avant que le prochain slot se libère. 0 si disponible. */
    getRemainingTime(): number {
      cleanup();
      if (timestamps.length < maxRequests) return 0;
      return Math.max(0, timestamps[0] + windowMs - Date.now());
    },

    /** Nombre de requêtes restantes dans la fenêtre actuelle. */
    getRemainingRequests(): number {
      cleanup();
      return Math.max(0, maxRequests - timestamps.length);
    },
  };
}

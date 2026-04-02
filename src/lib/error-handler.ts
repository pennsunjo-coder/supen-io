/**
 * Gestion d'erreurs centralisée pour Supen.io.
 */

export function handleApiError(error: unknown): string {
  if (error instanceof TypeError && error.message === "Load failed") {
    return "Erreur réseau. Vérifie ta connexion internet.";
  }
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return "Impossible de contacter le serveur. Réessaie.";
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("rate limit") || msg.includes("429") || msg.includes("limite")) {
      return "Trop de requêtes. Attends quelques minutes.";
    }
    if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("session")) {
      return "Session expirée. Reconnecte-toi.";
    }
    if (msg.includes("timeout") || msg.includes("aborted")) {
      return "La requête a pris trop de temps. Réessaie.";
    }
    if (msg.includes("500") || msg.includes("internal")) {
      return "Erreur serveur. Réessaie dans un instant.";
    }
    return error.message;
  }
  return "Erreur inattendue. Réessaie.";
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // Ne pas retry sur les erreurs client (4xx)
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        if (msg.includes("401") || msg.includes("403") || msg.includes("429")) throw err;
      }
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delay * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  ms: number = 30000
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout : la requête a pris trop de temps")), ms)
    ),
  ]);
}

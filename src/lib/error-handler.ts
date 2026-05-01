/**
 * Centralized error handling for Supenli.io.
 */

export function handleApiError(error: unknown): string {
  if (error instanceof TypeError && error.message === "Load failed") {
    return "Network error. Check your internet connection.";
  }
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return "Unable to reach the server. Please try again.";
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("rate limit") || msg.includes("429") || msg.includes("limite")) {
      return "Too many requests. Wait a few minutes.";
    }
    if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("session")) {
      return "Session expired. Please sign in again.";
    }
    if (msg.includes("timeout") || msg.includes("aborted")) {
      return "Request took too long. Please try again.";
    }
    if (msg.includes("500") || msg.includes("internal")) {
      return "Server error. Please try again shortly.";
    }
    return error.message;
  }
  return "Unexpected error. Please try again.";
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
      // Don't retry on client errors (4xx)
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
      setTimeout(() => reject(new Error("Timeout: request took too long")), ms)
    ),
  ]);
}

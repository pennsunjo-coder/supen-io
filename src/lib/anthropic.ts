import { supabase } from "@/lib/supabase";

/**
 * Secure AI API proxy — all calls go through the "chat" Edge Function.
 * The system now uses OpenAI (GPT-4o) as the primary engine for better reliability.
 * The API key lives server-side only (OPENAI_API_KEY secret in Supabase).
 */

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeResponse {
  text: string;
}

/**
 * Stream Claude response via the secure "chat" Edge Function.
 * Yields text chunks as they arrive.
 */
export async function* streamClaude(
  system: string,
  messages: ClaudeMessage[],
  options?: { maxTokens?: number; model?: string },
): AsyncGenerator<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        system,
        messages,
        max_tokens: options?.maxTokens || 2048,
        model: options?.model,
        stream: true,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader available");

  const decoder = new TextEncoder().encode(""); // just to get a decoder
  const utf8Decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield utf8Decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

export async function callClaude(
  system: string,
  messages: ClaudeMessage[],
  options?: { maxTokens?: number; model?: string },
): Promise<string> {
  let { data, error } = await supabase.functions.invoke("chat", {
    body: {
      system,
      messages,
      max_tokens: options?.maxTokens || 2048,
      model: options?.model,
    },
  });

  // FALLBACK: If Anthropic fails with 404 (Model not found), try OpenAI
  if (error && (error.message?.includes("404") || error.message?.includes("model") || error.message?.includes("not_found"))) {
    console.warn("[callClaude] Anthropic model not found, falling back to OpenAI...");
    const openaiRes = await supabase.functions.invoke("openai", {
      body: {
        system,
        messages,
        model: "gpt-4o-mini", // Use mini as a safe, fast fallback
        max_tokens: options?.maxTokens || 2048,
      },
    });
    data = openaiRes.data;
    error = openaiRes.error;
  }

  if (error) {
    console.error("[callClaude] Final Error:", error);
    
    // Attempt to extract error message from response body if available
    let detailedError = error.message;
    if (error instanceof Error && "context" in error) {
      try {
        const response = (error as any).context;
        if (response && typeof response.json === 'function') {
          const body = await response.json();
          if (body && body.error) detailedError = typeof body.error === 'string' ? body.error : JSON.stringify(body.error);
        }
      } catch { /* ignore parsing errors */ }
    }
    
    throw new Error(detailedError || "AI service currently unavailable");
  }

  if (data?.error) {
    throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
  }

  return data?.text || "";
}

export const SYSTEM_PROMPT = `You are a social media content creation expert, integrated into Supenli.ai. Your voice is that of a smart, direct friend. You are helpful but zero-fluff.

Strict rules:
- Always respond in English.
- Get straight to the point. No "Sure!", "I'd be happy to", "Here is...", or "Absolutely!".
- NO DASHES (-) for lists. Use full sentences or simple numbered lists (1. 2. 3.).
- No bold, no italic, no markdown headings.
- Write like a human texting a smart friend: vary sentence length, use simple words, be decisive.
- BANNED WORDS: delve, pivotal, tapestry, underscore, bolster, meticulous, vibrant, testament, garner, intricate, intricacies, interplay, showcase, foster, emphasize, resonate, enhance, crucial, landscape, realm, facilitate, seamless, robust, leverage, unlock, empower, elevate, revolutionary, game-changing.
- NO ROBOTIC INTROS. Do not say "I understand" or "That's a great question".
- Cut the fluff. If a sentence doesn't add value, delete it.`;

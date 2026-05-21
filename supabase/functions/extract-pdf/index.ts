import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PROMPT =
  "Extract ALL the visible text from this PDF, in reading order. " +
  "Preserve paragraphs but drop headers/footers and page numbers. " +
  "Return ONLY the raw text - no commentary, no markdown, no code fences.";

// Strip non-printable control chars without embedding them as literals in source.
const CONTROL_CHARS_REGEX = new RegExp(
  "[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\uFFFE\\uFFFF]",
  "g",
);

type Strategy = { name: string; run: () => Promise<string> };

async function tryAnthropic(base64: string, apiKey: string, model: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
          { type: "text", text: PROMPT },
        ],
      }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic ${model} ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  const text: string = (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");

  if (!text) throw new Error(`Anthropic ${model} returned empty content`);
  return text;
}

async function tryGemini(base64: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: "application/pdf", data: base64 } },
            { text: PROMPT },
          ],
        }],
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Gemini returned empty content");
  return text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[extract-pdf] file=${file.name} size=${file.size}`);

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    if (!anthropicKey && !geminiKey) {
      return new Response(
        JSON.stringify({ error: "No extraction API key configured (need ANTHROPIC_API_KEY or GEMINI_API_KEY)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const base64 = encode(bytes);
    console.log(`[extract-pdf] base64 length=${base64.length}`);

    // Try strategies in order. Anthropic first when its key is set; collect each error
    // so the client sees exactly what every attempt returned.
    const strategies: Strategy[] = [];
    if (anthropicKey) {
      strategies.push({ name: "claude-sonnet-4-5",  run: () => tryAnthropic(base64, anthropicKey, "claude-sonnet-4-5") });
      strategies.push({ name: "claude-haiku-4-5",   run: () => tryAnthropic(base64, anthropicKey, "claude-haiku-4-5-20251001") });
      strategies.push({ name: "claude-3-5-sonnet",  run: () => tryAnthropic(base64, anthropicKey, "claude-3-5-sonnet-20241022") });
    }
    if (geminiKey) {
      strategies.push({ name: "gemini-2.0-flash",   run: () => tryGemini(base64, geminiKey) });
    }

    const failures: string[] = [];
    let text = "";

    for (const s of strategies) {
      try {
        console.log(`[extract-pdf] trying ${s.name}...`);
        text = await s.run();
        console.log(`[extract-pdf] ${s.name} OK (${text.length} chars)`);
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[extract-pdf] ${s.name} failed:`, msg);
        failures.push(msg);
      }
    }

    const sanitized = text.replace(CONTROL_CHARS_REGEX, "").trim();

    if (!sanitized || sanitized.length < 10) {
      const detail = failures.join(" || ") || "All strategies returned empty text.";
      console.error("[extract-pdf] FAIL:", detail);
      return new Response(
        JSON.stringify({ error: `PDF extraction failed: ${detail}` }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ text: sanitized, pages: 1 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[extract-pdf] fatal:", msg);
    return new Response(
      JSON.stringify({ error: `Fatal: ${msg}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Configuration error: Missing keys." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Bypass any rate limiting or database checks for now to restore service
    const body = await req.json().catch(() => ({}));
    const { prompt, size, isRawContent } = body;
    
    let finalPrompt = prompt;

    // --- Content Architect (Gemini) ---
    if (isRawContent && GEMINI_API_KEY) {
      try {
        const architectResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Transform into infographic script. Title, 7-9 Sections, Pro Tip. RAW: ${prompt}` }] }],
            }),
          }
        );
        if (architectResponse.ok) {
          const data = await architectResponse.json();
          finalPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
        }
      } catch (e) { console.warn("Architect error", e); }
    }

    // --- Image Generation (OpenAI) ---
    const genSize = size?.includes("1792") || size?.includes("1350") ? "1024x1792" : "1024x1024";

    const oaResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `Premium Whiteboard Infographic. Tight zoom, no margins. SCRIPT: ${finalPrompt}`,
        n: 1,
        size: genSize,
        response_format: "b64_json",
      }),
    });

    if (!oaResponse.ok) {
      const errText = await oaResponse.text();
      return new Response(JSON.stringify({ error: errText }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const oaData = await oaResponse.json();
    const base64 = oaData.data?.[0]?.b64_json;

    return new Response(JSON.stringify({ image: base64, provider: "openai" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

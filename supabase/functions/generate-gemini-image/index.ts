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

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Configuration error: Missing API keys." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const { prompt, size, isRawContent } = body;
    
    let finalPrompt = prompt;

    // --- Content Architect (Gemini 1.5 Flash) ---
    if (isRawContent && GEMINI_API_KEY) {
      try {
        const architectResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `You are the INFOGRAPHIC ARCHITECT. Transform this into a dense, educational whiteboard infographic script. Use Title, 8 Sections, and 1 Pro Tip. RAW CONTENT: ${prompt}` }] }],
            }),
          }
        );
        if (architectResponse.ok) {
          const architectData = await architectResponse.json();
          finalPrompt = architectData.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
        }
      } catch (e) {
        console.warn("Architect failed:", e);
      }
    }

    // --- Image Generation (OpenAI DALL-E 3) ---
    console.log("[generate-gemini-image] Generating with OpenAI DALL-E 3...");
    
    // Support for LinkedIn portrait (1024x1792) or Square
    const genSize = size?.includes("1536") || size?.includes("1792") || size?.includes("1080") ? "1024x1792" : "1024x1024";

    const oaResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `
          Create a premium educational whiteboard infographic.
          STYLE: Professional Marker Sketch (Awa K. Penn style). High contrast black/blue markers on clean white paper.
          
          STRICT FILL & ZOOM RULE:
          - The content must occupy the ENTIRE canvas.
          - NO margins, no desk, no background.
          - Tight zoom on the whiteboard surface.
          
          SCRIPT TO RENDER:
          ${finalPrompt}
        `,
        n: 1,
        size: genSize,
        response_format: "b64_json",
      }),
    });

    if (!oaResponse.ok) {
      const errText = await oaResponse.text();
      throw new Error(`OpenAI Error: ${errText}`);
    }

    const oaData = await oaResponse.json();
    const base64 = oaData.data?.[0]?.b64_json;

    return new Response(JSON.stringify({ image: base64, provider: "openai" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[generate-gemini-image] Global error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

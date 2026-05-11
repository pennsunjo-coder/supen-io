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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Server configuration error: Missing API keys." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rate limit
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY!);
    const { data: allowed } = await adminClient.rpc("check_rate_limit", {
      p_user_id: user.id, p_function: "generate-gemini-image", p_max_requests: 15, p_window_hours: 1,
    });
    
    if (allowed === false) {
      return new Response(JSON.stringify({ error: "Generation limit reached (15 per hour)." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const { prompt, size, isRawContent } = body;
    
    let finalPrompt = prompt;

    // --- STEP 1: CONTENT ARCHITECT (Gemini 1.5 Flash for text expansion) ---
    // We keep Gemini for text expansion as it's very fast and reliable for text.
    if (isRawContent && GEMINI_API_KEY) {
      try {
        const architectResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Transform this into an infographic script. Title, 7-9 Sections, Pro Tip. RAW CONTENT: ${prompt}` }] }],
            }),
          }
        );
        if (architectResponse.ok) {
          const architectData = await architectResponse.json();
          const expandedText = architectData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (expandedText) finalPrompt = expandedText;
        }
      } catch (e) {
        console.warn("Architect failed:", e);
      }
    }

    // --- STEP 2: IMAGE GENERATION (OpenAI DALL-E 3) ---
    // Forcing OpenAI as it is more stable for image generation in this environment.
    console.log("[generate-gemini-image] Generating with OpenAI DALL-E 3...");
    
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
          Create a high-density educational infographic.
          STYLE: Premium Whiteboard / Marker Sketch (Awa K. Penn Forensic Style).
          
          STRICT FILL & ZOOM RULE:
          - CLOSE-UP: Zoom in tightly. No white margins. Content must fill the entire canvas.
          - NO BACKGROUND: Only the whiteboard/paper texture visible.
          
          SCRIPT:
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

    if (!base64) throw new Error("No image data returned from OpenAI.");

    return new Response(JSON.stringify({ image: base64, provider: "openai" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[generate-gemini-image] Global error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!OPENAI_API_KEY) return new Response(JSON.stringify({ error: "Missing keys" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const { prompt, size, isRawContent } = body;
    
    let finalPrompt = prompt;

    // --- 1. THE ARCHITECT (Gemini 1.5 Flash) ---
    if (isRawContent && GEMINI_API_KEY) {
      try {
        const architectResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `
                You are the INFOGRAPHIC ARCHITECT (Awa K. Penn style).
                GOAL: Transform the raw post into a DENSE, HIGH-VALUE infographic script.
                
                STRICT QUALITY RULES:
                1. SYMBIOSIS: Every point must expand the source content with logical depth.
                2. OCR OPTIMIZATION: Use high-impact, simple words.
                3. STRUCTURE: 1 Title, 7-9 numbered Sections (S1-S9), 6 Grid Items (G1-G6), 1 Pro Tip.
                
                CONTENT:
                ${prompt}
              ` }] }],
            }),
          }
        );
        if (architectResponse.ok) {
          const architectData = await architectResponse.json();
          finalPrompt = architectData.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
        }
      } catch (e) { console.warn("Architect error", e); }
    }

    // --- 2. THE VISUAL ENGINE (OpenAI DALL-E 3) ---
    const genSize = size?.includes("1792") || size?.includes("1350") ? "1024x1792" : "1024x1024";

    const oaResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `
          Create a high-density professional educational infographic.
          STYLE: Premium Whiteboard / Marker Sketch (Awa K. Penn Forensic Style).
          
          VISUAL ARCHITECTURE:
          1. [ZONE_HEADER]: Render [TITLE] in huge, ultra-bold black marker font inside [SQUARE BRACKETS].
          2. [ZONE_BODY]: Render sections S1-S9 vertically. Each has a colored hand-drawn border and a simple icon.
          3. [ZONE_POWER_GRID]: Create a 3x2 grid of boxes. Render G1-G6 inside with yellow #FFEF5A highlight on labels.
          4. [ZONE_FOOTER]: Render PRO_TIP in a distinct box at the bottom with a red ✓ symbol.
          
          STRICT FILL & ZOOM RULE:
          - CLOSE-UP: Zoom in tightly on the paper. 
          - FULL BLEED: The drawing MUST touch the edges of the canvas. 
          - NO BACKGROUND: No desk, no walls, no realistic room.
          
          SCRIPT:
          ${finalPrompt}
        `,
        n: 1,
        size: genSize,
        response_format: "b64_json",
      }),
    });

    if (!oaResponse.ok) {
      const err = await oaResponse.text();
      return new Response(JSON.stringify({ error: err }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const oaData = await oaResponse.json();
    const base64 = oaData.data?.[0]?.b64_json;

    return new Response(JSON.stringify({ image: base64, provider: "openai" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

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

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OpenAI Key" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const { prompt, size, isRawContent } = body;
    
    if (!prompt) return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let finalPrompt = prompt;

    // --- EXPERT ARCHITECT (Gemini 1.5 Flash) ---
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
                
                STRUCTURE:
                - [TITLE]: High-impact catchy title.
                - [ZONE_BODY]: 7-9 numbered sections S1-S9.
                - [ZONE_POWER_GRID]: 6 expert tips G1-G6.
                - [ZONE_FOOTER]: 1 Pro Tip.
                
                CONTENT:
                ${prompt}
              ` }] }],
            }),
          }
        );
        if (architectResponse.ok) {
          const architectData = await architectResponse.json();
          const expanded = architectData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (expanded) finalPrompt = expanded;
        }
      } catch (e) { console.warn("Architect error", e); }
    }

    // --- VISUAL ENGINE (OpenAI DALL-E 3) ---
    const genSize = size?.includes("1792") || size?.includes("1350") ? "1024x1792" : "1024x1024";

    console.log(`[generate-gemini-image] Rendering with DALL-E 3...`);

    const oaResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `
          Create a high-density educational whiteboard infographic.
          STYLE: Professional Marker Sketch on clean white paper (Awa K. Penn style).
          
          STRICT VISUAL ARCHITECTURE:
          - TOP: [TITLE] in huge bold black marker inside [SQUARE BRACKETS].
          - MIDDLE: Sections S1-S9 vertically with colored hand-drawn borders.
          - GRID: 3x2 grid for G1-G6 with yellow highlights.
          - BOTTOM: PRO_TIP in a distinct box with a red checkmark.
          
          STRICT FILL & ZOOM RULE:
          - CLOSE-UP: Zoom in tightly on the paper texture. 
          - FULL BLEED: The drawing MUST touch all 4 edges of the canvas. 
          - NO WHITE MARGINS: Use every pixel. NO desk or room visible.
          
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

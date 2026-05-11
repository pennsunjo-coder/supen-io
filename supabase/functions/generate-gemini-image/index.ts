const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) return new Response(JSON.stringify({ error: "Missing Gemini Key" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const { prompt, isRawContent } = body;
    
    if (!prompt) return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // --- 1. ARCHITECT (Gemini 2.0 Flash) ---
    // Expertly structure the content for the visual engine
    const archUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    let finalPrompt = prompt;
    if (isRawContent) {
      try {
        const archResp = await fetch(archUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `
              You are the INFOGRAPHIC ARCHITECT (Awa K. Penn style).
              Transform this post into a structured infographic script:
              - [TITLE]: High-impact title.
              - [BODY]: 7-9 numbered sections S1-S9.
              - [GRID]: 6 expert tips G1-G6.
              - [FOOTER]: 1 Pro Tip.
              
              CONTENT:
              ${prompt}
            ` }] }]
          })
        });
        if (archResp.ok) {
          const data = await archResp.json();
          finalPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
        }
      } catch (e) { console.warn("Architect error", e); }
    }

    // --- 2. IMAGE GENERATION (Gemini 2.0 Flash) ---
    console.log("[generate-gemini-image] Generating Premium Infographic with Gemini 2.0 Flash...");
    
    const response = await fetch(archUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `
              Create a professional educational whiteboard infographic. 
              STYLE: Awa K. Penn Forensic Marker Style. 
              VISUAL: Spiral notebook background with lined paper.
              LAYOUT: Title in brackets, S1-S9 sections, 6 grid items with yellow highlights, 1 pro tip box at bottom.
              
              INSTRUCTIONS: High density, fill the entire canvas, zoom in on the paper, no white margins.
              SCRIPT: ${finalPrompt}
            `
          }]
        }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      return new Response(JSON.stringify({ error: `Gemini Error: ${response.status}`, details: errBody }), { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const base64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

    if (!base64) {
      return new Response(JSON.stringify({ error: "Gemini returned no image data", raw: data }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ image: base64, provider: "gemini-2.0-new-key" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

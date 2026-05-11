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
    const { prompt, size, isRawContent } = body;
    
    let finalPrompt = prompt;

    // --- 1. ARCHITECT (Gemini 2.0 Flash) ---
    if (isRawContent) {
      const archResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `
            You are the INFOGRAPHIC ARCHITECT (Awa K. Penn style).
            Transform the following content into a structured infographic script:
            - TITLE in [SQUARE BRACKETS]
            - Sections S1-S9 with clear titles
            - 6 Power Grid items G1-G6
            - 1 Pro Tip at the bottom
            
            CONTENT:
            ${prompt}
          ` }] }]
        })
      });
      if (archResp.ok) {
        const data = await archResp.json();
        finalPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
      }
    }

    // --- 2. IMAGE GENERATION (Gemini 2.0 Flash) ---
    // Back to the original engine that worked
    const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log("[generate-gemini-image] Restoring Gemini 2.0 Flash Image Generation...");
    
    const imagenResp = await fetch(imagenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a professional educational whiteboard infographic. 
            STYLE: Awa K. Penn Forensic Marker Style. 
            SCRIPT: ${finalPrompt}. 
            LAYOUT: High density, vertical orientation, fill the entire canvas, zoom in on paper texture, no white margins.`
          }]
        }]
      })
    });

    if (!imagenResp.ok) {
      const err = await imagenResp.text();
      return new Response(JSON.stringify({ error: `Gemini Error: ${err}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await imagenResp.json();
    const base64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

    if (!base64) {
      return new Response(JSON.stringify({ error: "Gemini returned no image data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ image: base64, provider: "gemini-original" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

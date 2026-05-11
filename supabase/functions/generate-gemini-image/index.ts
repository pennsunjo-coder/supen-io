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

    // --- 1. ARCHITECT (Using the advanced 2.5 model discovered) ---
    // Note: Use gemini-2.5-flash-native-audio-latest as discovered in ListModels
    const modelId = "gemini-2.5-flash-native-audio-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`;
    
    let finalPrompt = prompt;
    if (isRawContent) {
      try {
        const archResp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `
              You are the INFOGRAPHIC ARCHITECT (Awa K. Penn style).
              Transform this content into a dense, high-value infographic script:
              - TITLE in [SQUARE BRACKETS]
              - Sections S1-S9
              - 6 Grid items G1-G6
              - 1 Pro Tip
              
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

    // --- 2. IMAGE GENERATION (Using the same 2.5 model which supports multimodal output) ---
    console.log(`[generate-gemini-image] Using Next-Gen ${modelId} for Image Generation...`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a professional educational whiteboard infographic on a SPIRAL NOTEBOOK with LINED PAPER. 
            STYLE: Awa K. Penn Forensic Marker Style. 
            LAYOUT: Title in brackets, S1-S9 sections, 6 grid items with yellow highlights, 1 pro tip box at bottom.
            INSTRUCTIONS: High density, fill the entire canvas, zoom in on paper, no white margins.
            SCRIPT: ${finalPrompt}`
          }]
        }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      return new Response(JSON.stringify({ error: `Gemini 2.5 Error: ${response.status}`, details: errBody }), { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    
    // Attempt to find image in multimodal parts
    const base64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

    if (!base64) {
      return new Response(JSON.stringify({ 
        error: "Model did not return an image. Try again or check if generation is enabled for this model.",
        raw: data 
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ image: base64, provider: "gemini-2.5-flash" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

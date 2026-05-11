const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    const body = await req.json().catch(() => ({}));
    const { prompt, size, isRawContent } = body;
    
    // 1. ARCHITECT (Gemini 1.5 Flash for text)
    let finalPrompt = prompt;
    if (isRawContent && GEMINI_API_KEY) {
      const archResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Transform into an Awa K. Penn infographic script. Use [TITLE], Sections S1-S9, 6 Grid items, 1 Pro Tip. CONTENT: ${prompt}` }] }]
        })
      });
      if (archResp.ok) {
        const data = await archResp.json();
        finalPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
      }
    }

    // 2. IMAGE GENERATION (RESTORING GEMINI IMAGEN)
    console.log("[generate-gemini-image] Attempting Gemini Imagen generation...");
    
    // We use the most stable Gemini model for images
    const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const imagenResp = await fetch(imagenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a professional educational whiteboard infographic. 
            STYLE: Awa K. Penn Forensic Marker Style. 
            SCRIPT: ${finalPrompt}. 
            LAYOUT: High density, fill the entire canvas, zoom in on the paper texture, NO margins.`
          }]
        }],
        generationConfig: {
          // We remove aspectRatio to avoid the previous non-2xx errors
          temperature: 0.4,
          topP: 0.8,
          topK: 40
        }
      })
    });

    if (imagenResp.ok) {
      const data = await imagenResp.json();
      const base64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
      if (base64) {
        return new Response(JSON.stringify({ image: base64, provider: "gemini" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // FALLBACK TO OPENAI IF GEMINI STILL FAILS (But with better prompt)
    console.warn("Gemini Image failed, falling back to OpenAI...");
    const oaResp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `High-density premium whiteboard infographic. Style: Awa K. Penn. Script: ${finalPrompt}. Fill entire canvas.`,
        n: 1,
        size: size?.includes("1792") ? "1024x1792" : "1024x1024",
        response_format: "b64_json"
      })
    });

    const oaData = await oaResp.json();
    return new Response(JSON.stringify({ image: oaData.data?.[0]?.b64_json, provider: "openai-fallback" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

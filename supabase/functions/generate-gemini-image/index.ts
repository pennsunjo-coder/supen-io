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

    // --- USE STABLE GEMINI 1.5 FLASH ---
    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log(`[generate-gemini-image] Calling stable ${model}...`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `
              You are the INFOGRAPHIC ARCHITECT (Awa K. Penn style).
              Create a structured infographic design.
              STYLE: Professional whiteboard marker sketch.
              LAYOUT: Title in brackets, S1-S9 sections, 6 grid items, 1 pro tip.
              CONTENT TO VISUALIZE: ${prompt}
              
              Note: Generate the image data directly if possible.
            `
          }]
        }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`Google API Error (${response.status}):`, errBody);
      return new Response(JSON.stringify({ 
        error: `Google API Error: ${response.status}`,
        details: errBody 
      }), { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    
    // Check for image in response (multimodal)
    const base64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

    if (!base64) {
      // If no image, maybe it's just text? 
      // Some regions don't support direct image generation via Gemini models yet.
      return new Response(JSON.stringify({ 
        error: "No image data returned. Your Gemini region might not support direct Imagen generation.",
        textResponse: data.candidates?.[0]?.content?.parts?.[0]?.text
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ image: base64, provider: "gemini-stable" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

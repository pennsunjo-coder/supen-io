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
    
    let finalPrompt = prompt;

    // --- 1. ARCHITECT (Gemini 1.5 Flash) ---
    // We need a simple, structured script like in the "good" capture
    if (isRawContent && GEMINI_API_KEY) {
      try {
        const archResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `
              Transform this post into a simple step-by-step infographic script.
              - 1 Clear Title at the top.
              - 5 to 7 numbered Steps (Step 1, Step 2, etc.) with brief text.
              - A "Metric" section at the bottom.
              - 1 Pro Tip at the very bottom.
              
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

    // --- 2. IMAGE GENERATION (RESTORING THE NOTEBOOK STYLE) ---
    // This prompt is specifically designed to match the "good" capture
    const imagenPrompt = `
      A professional vertical infographic on a realistic SPIRAL NOTEBOOK with LINED PAPER background.
      STYLE: Clean marker drawing (Awa K. Penn style). 
      
      LAYOUT:
      - TOP: Huge bold title inside a thick black rectangle.
      - MIDDLE: 5-7 distinct boxes for "Step 1", "Step 2", etc. Each box has a different colored border (blue, green, red).
      - BOTTOM: A grid of yellow metric boxes labeled "METRIC 1", "METRIC 2", etc.
      - FOOTER: A red box at the bottom for "PRO TIP".
      
      VISUAL: Close-up zoom on the notebook, no white margins, fill the entire portrait canvas.
      
      SCRIPT TO RENDER:
      ${finalPrompt}
    `;

    console.log("[generate-gemini-image] Generating Notebook Style with Gemini...");
    
    const imagenResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: imagenPrompt }] }],
        generationConfig: { temperature: 0.4, topP: 0.9 }
      })
    });

    if (imagenResp.ok) {
      const data = await imagenResp.json();
      const base64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
      if (base64) {
        return new Response(JSON.stringify({ image: base64, provider: "gemini-notebook" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // SILENT FALLBACK TO OPENAI WITH THE SAME NOTEBOOK PROMPT
    console.warn("Gemini failed, falling back to OpenAI Notebook...");
    const oaResp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: imagenPrompt,
        n: 1,
        size: "1024x1792",
        response_format: "b64_json"
      })
    });

    const oaData = await oaResp.json();
    return new Response(JSON.stringify({ image: oaData.data?.[0]?.b64_json, provider: "openai-notebook-fallback" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

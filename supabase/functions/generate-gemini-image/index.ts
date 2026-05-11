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
      return new Response(JSON.stringify({ error: "Missing OpenAI API Key" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const { prompt, size, isRawContent } = body;
    
    let finalPrompt = prompt || "Educational infographic about AI and productivity";

    // 1. Text Expansion (Optional Gemini)
    if (isRawContent && GEMINI_API_KEY) {
      try {
        const archResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Create a dense infographic script for: ${prompt}. Sections S1-S8, Pro Tip.` }] }],
            }),
          }
        );
        if (archResp.ok) {
          const data = await archResp.json();
          finalPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
        }
      } catch (e) { console.error("Architect fail:", e); }
    }

    // 2. Image Generation (OpenAI)
    // We use a fixed size logic that always works with DALL-E 3
    const genSize = (size?.includes("1792") || size?.includes("1350")) ? "1024x1792" : "1024x1024";

    console.log(`[generate-gemini-image] Generating ${genSize} with OpenAI...`);

    const oaResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `A high-density educational whiteboard infographic. Premium marker sketch style. High contrast. The content covers: ${finalPrompt}. ZOOM IN: Fill the entire canvas, no white borders.`,
        n: 1,
        size: genSize,
        response_format: "b64_json",
      }),
    });

    if (!oaResponse.ok) {
      const err = await oaResponse.text();
      return new Response(JSON.stringify({ error: `OpenAI rejected: ${err}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const oaData = await oaResponse.json();
    const base64 = oaData.data?.[0]?.b64_json;

    if (!base64) {
      return new Response(JSON.stringify({ error: "OpenAI returned no data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ image: base64, provider: "openai" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Unknown server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // 1. Handle Preflight
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY");
      return new Response(JSON.stringify({ error: "Server missing OpenAI Key" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const { prompt, size } = body;
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("[generate-gemini-image] Calling DALL-E 3 directly...");

    // Standard portrait size for LinkedIn or square
    const genSize = (size?.includes("1792") || size?.includes("1350")) ? "1024x1792" : "1024x1024";

    const oaResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `A high-density educational whiteboard infographic. Premium marker sketch style. SCRIPT: ${prompt}. FULL BLEED: Zoom in, no white borders.`,
        n: 1,
        size: genSize,
        response_format: "b64_json",
      }),
    });

    if (!oaResponse.ok) {
      const errText = await oaResponse.text();
      return new Response(JSON.stringify({ error: `OpenAI rejected: ${errText}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const oaData = await oaResponse.json();
    const base64 = oaData.data?.[0]?.b64_json;

    return new Response(JSON.stringify({ image: base64, provider: "openai" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Global crash:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

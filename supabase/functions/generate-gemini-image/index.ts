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
    const { prompt, size } = body;
    
    if (!prompt) return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // --- DIRECT IMAGE GENERATION (Gemini 2.5 Flash Image) ---
    // No "Architect" middle-layer. The prompt arrives pre-built from the client.
    const imageUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log("[generate-gemini-image] Direct generation with Gemini 2.5 Flash Image. Prompt length:", prompt.length);

    // Map size to Gemini aspect ratio
    const sizeMap: Record<string, string> = {
      "1024x1024": "1:1",
      "1080x1350": "3:4",
      "1200x627": "16:9",
    };
    const aspectRatio = sizeMap[size] || "3:4";
    
    const response = await fetch(imageUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          aspectRatio: aspectRatio,
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      const overloaded = response.status === 529 || /overload|unavailable|busy/i.test(errBody);
      const message = overloaded
        ? `Provider overloaded (529): ${errBody.slice(0, 200)}`
        : `Gemini Image Error (${response.status}): ${errBody.slice(0, 200)}`;
      return new Response(
        JSON.stringify({ error: message }),
        { status: overloaded ? 529 : response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const base64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

    if (!base64) {
      return new Response(JSON.stringify({ error: "No image returned by gemini-2.5-flash-image" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ image: base64, provider: "gemini-2.5-flash-image" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

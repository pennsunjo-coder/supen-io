const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, aspectRatio = "3:4" } = await req.json();
    if (!prompt) return json({ error: "Missing: prompt" }, 400);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    // Inject format instructions into prompt
    const formatInstruction = aspectRatio === "1:1"
      ? "IMAGE FORMAT: Perfect square format (1:1). Fill entire square canvas."
      : aspectRatio === "16:9"
        ? "IMAGE FORMAT: Wide landscape format (16:9). Fill entire wide canvas."
        : "IMAGE FORMAT: Tall vertical format (3:4 portrait like A4). Fill entire tall canvas.";

    const fullPrompt = `${prompt}

${formatInstruction}
CRITICAL: Fill the ENTIRE canvas with the design. No brown table background. No notebook props. No wooden surface. Pure white or warm white background only. The infographic IS the canvas — edge to edge.`;

    const MODEL = "gemini-2.0-flash-exp";
    console.log("[generate-image] Calling Gemini", MODEL, "| aspect:", aspectRatio, "| prompt:", fullPrompt.length, "chars");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[generate-image] Gemini error:", response.status, errText.slice(0, 300));
      return json({ error: `Gemini error (${response.status}): ${errText.slice(0, 200)}` }, response.status);
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts
      ?.find((p: { inlineData?: { mimeType?: string; data?: string } }) =>
        p.inlineData?.mimeType?.startsWith("image/"));
    const base64 = imagePart?.inlineData?.data;

    if (!base64) {
      console.error("[generate-image] No image in response:", JSON.stringify(data).slice(0, 300));
      throw new Error("No image returned from Gemini");
    }

    console.log("[generate-image] Success, base64 length:", base64.length);
    return json({ image: base64 });
  } catch (err) {
    console.error("[generate-image]", err);
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});

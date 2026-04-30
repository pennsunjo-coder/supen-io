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

// System prompt — prepended to every generation request
const SYSTEM_PROMPT = `You are an expert information designer and UI/UX specialist for social media.

ROLE: Transform provided text into a premium, instantly readable visual infographic.

VISUAL STYLE — MANDATORY:
- Professional hand-drawn style with clean crisp lines
- All information in neat colored boxes/containers with clear borders
- White clean background #FFFFFF
- Dynamic color palette: blue #4A90D9, green #5BA85B, red #E05555, orange #F5A623

STRICT RULES — NO EXCEPTIONS:
1. FORBIDDEN: raw CSS code, layout percentages, black placeholder squares, Lorem Ipsum
2. REQUIRED: Every text section has a clear icon (gear, graduation cap, book, robot, arrow)
3. REQUIRED: Text in clear human language — short, punchy, maximum 8 words per bullet
4. REQUIRED: Colored containers with black outlines for every section
5. REQUIRED: Visible directional arrows between left boxes and right content
6. REQUIRED: Bottom conclusion/footer zone with key takeaway
7. REQUIRED: All text 100% readable, never cut off, minimum font size 16px
8. FORBIDDEN: Dark backgrounds, 3D renders, realistic photos, watermarks`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return json({ error: "Missing required field: prompt" }, 400);
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    // Combine system prompt + user prompt
    const fullPrompt = `${SYSTEM_PROMPT}\n\n---\n\n${prompt}`;

    const MODEL = "gemini-2.0-flash-exp";
    console.log("[generate-image] Calling Gemini", MODEL, "prompt length:", fullPrompt.length);

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

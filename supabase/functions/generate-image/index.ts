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
    const { prompt, size, quality } = await req.json();

    if (!prompt) {
      return json({ error: "Missing required field: prompt" }, 400);
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    console.log("[generate-image] Calling gpt-image-1, size:", size || "1024x1536");

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: size || "1024x1536",
        quality: quality || "high",
        output_format: "b64_json",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[generate-image] OpenAI error:", response.status, errText.slice(0, 300));
      return json({ error: `OpenAI error (${response.status}): ${errText.slice(0, 200)}` }, response.status);
    }

    const data = await response.json();
    const base64 = data.data?.[0]?.b64_json;

    if (!base64) {
      throw new Error("No image returned from gpt-image-1");
    }

    console.log("[generate-image] Success, base64 length:", base64.length);
    return json({ image: base64 });
  } catch (err) {
    console.error("[generate-image]", err);
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});

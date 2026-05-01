import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Auth — require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "Invalid session" }, 401);

    // Rate limit — 10 images per hour
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: allowed } = await adminClient.rpc("check_rate_limit", {
      p_user_id: user.id, p_function: "generate-image", p_max_requests: 10, p_window_hours: 1,
    });
    if (!allowed) return json({ error: "Image generation limit reached (10/h). Please try again later." }, 429);

    // Validate input
    const { prompt, size, quality } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return json({ error: "Prompt must be at least 10 characters" }, 400);
    }

    if (prompt.length > 10000) {
      return json({ error: "Prompt too long (max 10000 characters)" }, 400);
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Validate size parameter
    const validSizes = ["1024x1024", "1536x1024", "1024x1536"];
    const finalSize = validSizes.includes(size) ? size : "1024x1536";

    console.log("[generate-image] User:", user.id, "size:", finalSize);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: prompt.slice(0, 10000),
        n: 1,
        size: finalSize,
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

    console.log("[generate-image] Success for user:", user.id);
    return json({ image: base64 });
  } catch (err) {
    console.error("[generate-image]", err);
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});

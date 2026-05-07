import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Rate limit
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: allowed } = await adminClient.rpc("check_rate_limit", {
      p_user_id: user.id, p_function: "generate-gemini-image", p_max_requests: 10, p_window_hours: 1,
    });
    if (!allowed) return new Response(JSON.stringify({ error: "Image generation limit reached." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Prompt must be at least 10 characters" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (prompt.length > 16000) {
      return new Response(JSON.stringify({ error: "Prompt too long (max 16000 characters)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    console.log("[generate-gemini-image] User:", user.id, "prompt length:", prompt.length);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[generate-gemini-image] Gemini error:", response.status, errText.slice(0, 300));
      return new Response(JSON.stringify({ error: `Gemini error (${response.status}): ${errText.slice(0, 300)}` }), { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find((p: { inlineData?: { mimeType?: string; data?: string } }) => p.inlineData?.mimeType?.startsWith("image/"));
    const base64 = imagePart?.inlineData?.data;

    if (!base64) {
      const finishReason = data.candidates?.[0]?.finishReason;
      const safetyMsg = finishReason === "SAFETY" ? "Content blocked by Gemini safety filters." : "No image returned by Gemini.";
      console.error("[generate-gemini-image] Empty image response. finishReason:", finishReason);
      return new Response(JSON.stringify({ error: safetyMsg }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("[generate-gemini-image] Success for user:", user.id);
    return new Response(JSON.stringify({ image: base64 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

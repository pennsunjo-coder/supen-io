import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["gamalielkelman@gmail.com", "pennsunjo@gmail.com"];
// Monthly image credits per plan (each generation/regeneration = 1).
const IMAGE_LIMITS: Record<string, number> = { plus: 50, pro: 300 };
const FREE_IMAGE_LIMIT = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) return new Response(JSON.stringify({ error: "Missing Gemini Key" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // --- Auth + per-plan monthly image quota (each generation = 1 credit) ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (!ADMIN_EMAILS.includes(user.email ?? "")) {
      const { data: profile } = await userClient.from("user_profiles").select("plan, plan_expires_at").eq("user_id", user.id).maybeSingle();
      const plan = profile?.plan as string | undefined;
      const expiresAt = profile?.plan_expires_at ? new Date(profile.plan_expires_at).getTime() : 0;
      const isPaying = (plan === "plus" || plan === "pro") && expiresAt > Date.now();

      // Free plan: no infographics at all. Bounce with paywall code so the
      // client can pop the upgrade modal instead of a generic error.
      if (!isPaying) {
        return new Response(
          JSON.stringify({
            error: "Infographics are not available on the Free plan. Upgrade to Plus or Pro to unlock visuals.",
            code: "free_no_infographic",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Paying user — enforce monthly cap.
      const monthly = IMAGE_LIMITS[plan ?? ""] ?? FREE_IMAGE_LIMIT;
      const { data: allowed } = await userClient.rpc("check_rate_limit", {
        p_user_id: user.id, p_function: "images_monthly", p_max_requests: monthly, p_window_hours: 720,
      });
      if (!allowed) {
        const next = plan === "plus" ? "Pro" : "Plus";
        return new Response(
          JSON.stringify({ error: `Monthly image limit reached (${monthly}). Upgrade to ${next} for more images.` }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const { prompt, size } = body;

    if (!prompt) return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const imageUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;

    console.log("[generate-gemini-image] Direct generation with Gemini 2.5 Flash Image. Prompt length:", prompt.length);

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
          responseModalities: ["IMAGE"]
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

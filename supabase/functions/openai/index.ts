import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.28.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "Invalid session" }, 401);

    // 2. Rate limit (OpenAI can be expensive) — 30 requests per hour
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: allowed } = await adminClient.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function: "openai",
      p_max_requests: 30,
      p_window_hours: 1,
    });
    if (!allowed) return json({ error: "Rate limit reached for AI features." }, 429);

    // 3. Payload
    const { messages, system, temperature, max_tokens, model } = await req.json();

    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });

    // 4. Call OpenAI
    const response = await openai.chat.completions.create({
      model: model || "gpt-4o",
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        ...messages,
      ],
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? 2048,
    });

    return json({ text: response.choices[0].message.content });
  } catch (err) {
    console.error("[openai]", err);
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: "Session invalide" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Rate limit
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: allowed } = await adminClient.rpc("check_rate_limit", {
      p_user_id: user.id, p_function: "chat", p_max_requests: 30, p_window_hours: 1,
    });
    if (!allowed) return new Response(JSON.stringify({ error: "Limite de requêtes atteinte. Réessaie dans quelques minutes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Body
    const { messages, system } = await req.json();
    if (!messages || !system) return new Response(JSON.stringify({ error: "messages et system requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Claude
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system,
      messages,
    });

    const text = response.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");

    return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

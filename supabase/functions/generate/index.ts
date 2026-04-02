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
      p_user_id: user.id, p_function: "generate", p_max_requests: 20, p_window_hours: 1,
    });
    if (!allowed) return new Response(JSON.stringify({ error: "Limite de générations atteinte (20/h). Réessaie plus tard." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Body
    const { platform, format, sourceText, sourceMode, activeSourceIds } = await req.json();
    if (!platform || !format || !sourceText) return new Response(JSON.stringify({ error: "platform, format et sourceText requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // RAG — sources utilisateur
    let userSection = "";
    if (activeSourceIds && activeSourceIds.length > 0) {
      const { data: userRefs } = await supabase.rpc("search_user_sources", {
        query_text: sourceText.slice(0, 500),
        source_ids: activeSourceIds,
        match_count: 5,
      });
      if (userRefs && userRefs.length > 0) {
        userSection = "\n\n## CONTEXTE UTILISATEUR\n" +
          userRefs.map((r: { type: string; title: string; content: string }) => `### [${r.type.toUpperCase()}] ${r.title}\n${r.content}`).join("\n\n");
      }
    }

    // RAG — viral
    let viralSection = "";
    const { data: viralRefs } = await supabase.rpc("match_viral_references", {
      query_text: sourceText.slice(0, 300),
      match_count: 3,
      filter_platform: platform,
      filter_format: format,
    });
    if (viralRefs && viralRefs.length > 0) {
      viralSection = "\n\n## MODÈLES VIRAUX\n" +
        viralRefs.map((r: { content: string }, i: number) => `### Modèle ${i + 1}\n${r.content}`).join("\n\n");
    }

    const modeLabel = sourceMode === "document" ? "Document source à transformer"
      : sourceMode === "idea" ? "Idée à développer" : "Sujet / mot-clé";

    const isDocMode = sourceMode === "document";

    const systemPrompt = `## IDENTITÉ
Tu es un expert en création de contenu viral pour les réseaux sociaux.${userSection}${viralSection}

## INSTRUCTIONS
Plateforme : ${platform}
Format : ${format}

Règles :
1. Génère exactement 5 variations séparées par ---VARIATION---
2. Angles dans l'ordre : Éducatif, Storytelling, Provocation, Pratique, Débat
3. Hook ultra fort en première ligne (max 10 mots)
4. Écriture directe, humaine, niveau CM2. Phrases courtes.
5. JAMAIS de formules enthousiastes artificielles.
6. Adapte le ton à ${platform} + ${format}.
7. Réponds UNIQUEMENT avec les 5 variations. Rien d'autre.
8. Réponds toujours en français.${isDocMode ? "\n9. Base le contenu UNIQUEMENT sur les sources fournies." : ""}`;

    // Claude
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: `${modeLabel} :\n\n${sourceText.slice(0, 5000)}` }],
    });

    const text = response.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");

    // Sauvegarder
    let parts = text.split(/---VARIATION---/).map((s: string) => s.trim()).filter((s: string) => s.length > 20);
    if (parts.length < 2) parts = text.split(/\n\s*(?=\d\.\s)/).map((v: string) => v.replace(/^\d\.\s*/, "").trim()).filter((v: string) => v.length > 20);
    if (parts.length === 0) parts = [text.trim()];

    const angles = ["Éducatif", "Storytelling", "Provocation", "Pratique", "Débat"];
    const variations = parts.map((content: string, idx: number) => ({
      angle: angles[idx % 5],
      content,
      words: content.split(/\s+/).length,
      score: Math.min(72 + ((content.length * 7 + idx * 13) % 23), 94),
    }));

    // Save to DB
    const inserts = variations.map((v: { content: string; score: number }) => ({
      user_id: user.id,
      platform,
      format,
      content: v.content,
      viral_score: v.score,
      source_ids: activeSourceIds || [],
    }));
    await supabase.from("generated_content").insert(inserts);

    return new Response(JSON.stringify({ variations }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

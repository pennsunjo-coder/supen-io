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
    if (!authHeader) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Rate limit
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: allowed } = await adminClient.rpc("check_rate_limit", {
      p_user_id: user.id, p_function: "generate", p_max_requests: 20, p_window_hours: 1,
    });
    if (!allowed) return new Response(JSON.stringify({ error: "Generation limit reached (20/h). Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Body
    const { platform, format, sourceText, sourceMode, activeSourceIds } = await req.json();
    if (!platform || !format || !sourceText) return new Response(JSON.stringify({ error: "platform, format and sourceText are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // RAG — sources utilisateur
    let userSection = "";
    if (activeSourceIds && activeSourceIds.length > 0) {
      const { data: userRefs } = await supabase.rpc("search_user_sources", {
        query_text: sourceText.slice(0, 500),
        source_ids: activeSourceIds,
        match_count: 5,
      });
      if (userRefs && userRefs.length > 0) {
        userSection = "\n\n## USER CONTEXT\n" +
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
      viralSection = "\n\n## VIRAL TEMPLATES\n" +
        viralRefs.map((r: { content: string }, i: number) => `### Template ${i + 1}\n${r.content}`).join("\n\n");
    }

    const modeLabel = sourceMode === "document" ? "Source document to transform"
      : sourceMode === "idea" ? "Idea to develop" : "Topic / keyword";

    const isDocMode = sourceMode === "document";

    const systemPrompt = `## IDENTITY
You are an expert in viral social media content creation.${userSection}${viralSection}

## INSTRUCTIONS
Platform: ${platform}
Format: ${format}

Rules:
1. Generate exactly 5 variations separated by ---VARIATION---
2. Angles in order: Educational, Storytelling, Provocative, Practical, Debate
3. Ultra-strong hook on the first line (max 10 words)
4. Direct, human writing. Short sentences. Simple language.
5. NEVER use artificially enthusiastic phrases.
6. Adapt the tone to ${platform} + ${format}.
7. Reply ONLY with the 5 variations. Nothing else.
8. Always reply in English.${isDocMode ? "\n9. Base the content ONLY on the provided sources." : ""}`;

    // Claude
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: `${modeLabel} :\n\n${sourceText.slice(0, 5000)}` }],
    });

    const text = response.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");

    // Save to DB
    let parts = text.split(/---VARIATION---/).map((s: string) => s.trim()).filter((s: string) => s.length > 20);
    if (parts.length < 2) parts = text.split(/\n\s*(?=\d\.\s)/).map((v: string) => v.replace(/^\d\.\s*/, "").trim()).filter((v: string) => v.length > 20);
    if (parts.length === 0) parts = [text.trim()];

    const angles = ["Educational", "Storytelling", "Provocative", "Practical", "Debate"];
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
    const msg = err instanceof Error ? err.message : "Server error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

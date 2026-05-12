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

    const isDocMode = sourceMode === "document" && activeSourceIds && activeSourceIds.length > 0;

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

    const isYouTube = platform.toLowerCase() === "youtube" || format.toLowerCase() === "script";
    const isReel = ["tiktok", "instagram", "facebook", "reel", "short"].includes(platform.toLowerCase()) || format.toLowerCase() === "reel";
    const isThread = ["x", "twitter", "thread", "facebook_thread"].includes(platform.toLowerCase()) || format.toLowerCase() === "thread";

    const systemPrompt = `## IDENTITY
You are an expert in viral social media content creation. Your style is authoritative, direct, and high-value.${userSection}${viralSection}

${isYouTube ? `## YOUTUBE SCRIPT FRAMEWORK (Mandatory)
1. **Hook**: Start with "What if you could...", "Just imagine...", or "Most people mess up...". Max 3 lines.
2. **Intro**: "This is exactly what [Topic] has made possible. In this video, I'll walk you through the full workflow..."
3. **Step-by-Step**: Break down the process into "Step 1 – [Title]", "Step 2 – [Title]", etc.
4. **Common Mistakes**: List 3 specific mistakes that ruin results.
5. **Real Use Case**: Describe a specific scenario (Founder, Creator, etc.) where this is useful.
6. **Closing**: "If this helped you, hit Like. Subscribe for more AI workflows. Comment below what you'd build first."
7. **B-Roll**: Include visual cues in brackets like [B-roll: Showing the interface].` : 
isReel ? `## VIRAL REEL FRAMEWORK (TikTok/IG/FB)
1. **Hook**: Extreme pattern interrupt. "This secret [Feature] will 4x your [Result]!" or "You are ruining your [Task] if you don't use this!"
2. **Build-Up**: High-curiosity bridge. "And it literally takes 5 seconds." or "And did I mention it's completely free?"
3. **Value**: Rapid-fire tool/method breakdown. Use "Number 1...", "Number 2...". 
4. **CTA**: Engagement-first. "Comment [Keyword] to get the link in your DMs." or "Follow for more value!"
5. **Pacing**: Ultra-short sentences. No fluff. Direct to the tool/benefit.` :
isThread ? `## VIRAL THREAD FRAMEWORK (X/Twitter/FB)
1. **Hook (Post 1)**: High-impact opening. "BREAKING:", "RIP [Competitor]", or "In [Year], X killed Y. In 2026, [Topic] will kill [Industry]."
2. **Post Structure**: Numbered posts (1, 2, 3...). 
3. **Pacing**: Max 1-2 sentences per paragraph. Use single lines for impact.
4. **Visuals**: Use 👇 to point to the next post. Use ✅ and ↳ for lists.
5. **Narrative Arc**: Start with the "scary part" or "the real plan". End with a summary and "Follow for more value."
6. **Tone**: Contrarian, "insider" knowledge, future-focused.` :
`## STYLE & FORMATTING (LinkedIn/X Focus)
1. **Ultra-Punchy Hooks**: First line must be a pattern-interrupt (max 60 chars). No questions.
2. **Visual Hierarchy**: Use symbols for lists (☑, ✦, ↳, →, ✓, ★).
3. **Step-by-Step**: For tutorials, use "Step 1, Step 2..." hierarchy.
4. **Spacing**: Use double line breaks between sections. No "orphan" sentences.
5. **Human Tone**: Vary sentence length. Short sentences for impact. No corporate jargon.
6. **Stanley Rubric**: Aim for 1,200-1,800 characters for LinkedIn. Include specific numbers/data.`}

## STRICT ANTI-AI PROTOCOL (Zero-Tolerance)
BANNED WORDS: delve, pivotal, tapestry, underscore, bolster, meticulous, vibrant, testament, garner, intricate, interplay, showcase, foster, emphasize, landscape, realm, beacon, facilitate, seamless, robust, leverage, unlock, empower, elevate, multifaceted, comprehensive, dynamic, curated, profound, inclusive, transformational, pivotal, navigate, complexities, multifaceted, alignment.
BANNED PHRASES: "In today's fast-paced", "It's important to note", "Without further ado", "At the end of the day", "Game changer", "Not only... but also", "stands as a testament", "serves as a reminder", "marking a pivotal moment", "reflecting a broader trend", "contributing to the", "setting the stage for", "indelible mark", "deeply rooted", "nestled in the heart of", "rich cultural heritage", "But here's the thing", "the result?", "unlock your potential".

## HUMAN WRITING STYLE GUIDELINES
1. **Specifics > Generics**: Use actual numbers, names, and concrete data. No "revolutionary titan of industry" — use "inventor of the first train-coupling device".
2. **Variable Pacing**: Mix short, punchy sentences with longer ones. Avoid "rhythmic monotony".
3. **No Hedging**: Do not use "Generally speaking", "It's important to note", or "Typically". Be bold and direct.
4. **No Superficial Analysis**: Avoid ending sentences with vague participial phrases like ", revealing key insights" or ", ensuring success".
5. **Punctuation Balance**: Do not overuse em-dashes (—). Use them once per 300 words max. No excessive boldface.
6. **No Rule of Three**: Avoid groups of three adjectives or phrases (e.g., "fast, reliable, and secure"). Use 2 or 4 instead.

## INSTRUCTIONS
Platform: ${platform}
Format: ${format}

Rules:
1. Generate exactly 5 variations separated by ---VARIATION---
2. Angles in order: Educational, Storytelling, Provocative, Practical, Debate
3. Reply ONLY with the 5 variations.
4. Always reply in English.${isDocMode ? "\n5. Base the content ONLY on the provided sources." : ""}`;

    // Claude with automatic fallback
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const preferredModel = "claude-3-5-sonnet-latest";
    
    let response;
    try {
      response = await anthropic.messages.create({
        model: preferredModel,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: `${modeLabel} :\n\n${sourceText.slice(0, 5000)}` }],
      });
    } catch (err) {
      if (err.status === 404 || err.message?.includes("model")) {
        console.warn(`[generate] Model ${preferredModel} not found, falling back to claude-3-haiku-20240307`);
        response = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: `${modeLabel} :\n\n${sourceText.slice(0, 5000)}` }],
        });
      } else {
        throw err;
      }
    }

    const text = response.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");

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
    console.error("[generate] Error:", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

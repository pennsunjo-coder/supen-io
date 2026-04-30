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
    const { prompt } = await req.json();
    if (!prompt) return json({ error: "Missing: prompt" }, 400);

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    console.log("[generate-image] Generating HTML infographic...");

    const systemPrompt = `You are an elite infographic designer specializing in viral LinkedIn content and personal branding.

YOUR EXPERTISE:
- "Minimalisme Informatif": every graphic element serves content comprehension
- "Hand-drawn Digital" style: marker-on-whiteboard aesthetic, human and authentic
- Cognitive hierarchy: color zoning, visual anchoring, scan patterns (F and Z reading)

YOUR MISSION:
Transform any text into a PREMIUM, instantly readable HTML infographic.

STRICT RULES:
1. Output ONLY valid HTML starting with <!DOCTYPE html> — zero explanations, zero markdown
2. FORBIDDEN: raw CSS as visible text, placeholder squares, Lorem Ipsum, code snippets shown as content
3. REQUIRED: Real human-readable text only — short, punchy, maximum 10 words per bullet
4. REQUIRED: Google Fonts imported (Nunito + Caveat) in a <style> tag
5. REQUIRED: Fixed canvas 1080×1350px with body { width:1080px; height:1350px; margin:0; padding:40px; overflow:hidden; box-sizing:border-box; }
6. REQUIRED: Every section has emoji icon + bold colored title + bullet points
7. REQUIRED: Generous white space (min 20px padding in all cards)
8. REQUIRED: Box-shadow on all cards: 3px 3px 0 rgba(0,0,0,0.15)
9. REQUIRED: Border on all elements: 2px solid #1A1A1B
10. REQUIRED: High contrast — dark text (#1A1A1B) on light backgrounds only
11. Font sizes: Main title 48px Caveat, section titles 24px Nunito 800, body 15px Nunito 400, bullets 14px`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: prompt
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[generate-image] Claude error:", response.status, err.slice(0, 300));
      throw new Error(`Claude API error (${response.status})`);
    }

    const data = await response.json();
    const rawHtml = data.content?.[0]?.text || "";

    // Clean markdown fences if present
    const html = rawHtml
      .replace(/```html\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
      console.error("[generate-image] Invalid HTML:", html.slice(0, 200));
      throw new Error("Claude did not return valid HTML");
    }

    console.log("[generate-image] HTML generated, length:", html.length);
    return json({ html, type: "html" });
  } catch (err) {
    console.error("[generate-image]", err);
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});

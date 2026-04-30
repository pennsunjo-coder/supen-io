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

    console.log("[generate-image] Generating HTML via Claude, prompt length:", prompt.length);

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
        system: `You are an elite infographic designer specializing in LinkedIn viral content.
Your ONLY job: generate complete, self-contained HTML files for premium infographics.
Style reference: Hand-drawn professional style (like popular LinkedIn carousels).
NEVER output explanations. NEVER output markdown. Output ONLY valid HTML starting with <!DOCTYPE html>.`,
        messages: [{
          role: "user",
          content: `${prompt}

TECHNICAL REQUIREMENTS:
- Return ONLY the complete HTML file. Start with <!DOCTYPE html>
- Canvas: 1080px wide, 1350px tall, fixed dimensions
- Import fonts: @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Caveat:wght@700&display=swap')
- Font: Nunito for body text, Caveat for titles (hand-drawn feel)
- Background: #FAFAFA (warm white)
- Use CSS box-shadow: 3px 3px 0px rgba(0,0,0,0.15) on all cards (hand-drawn depth)
- Use border: 2.5px solid #1A1A1B on all elements (marker outline feel)
- Use border-radius: 12px on cards, 8px on boxes
- Section colors: Blue #4A90D9, Green #5BA85B, Red #E05555, Orange #F5A623
- All text: real human-readable words, NO code, NO CSS properties as text
- Minimum font-size: 14px for body, 28px for section titles, 48px for main title
- Arrows between left boxes and right content: use CSS border or Unicode arrows
- Include emoji icons inline in HTML
- Bottom grid: 2-3 columns of insight cards
- Footer: colored strip with white bold text
- Everything inline — no external CSS files
- ALL styles in a single <style> tag in <head>
- body must have: width:1080px; height:1350px; margin:0; padding:40px; overflow:hidden; box-sizing:border-box;`
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

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

const SYSTEM = `You are an elite digital infographic designer for LinkedIn and social media.

CRITICAL CONTEXT SHIFT:
You generate FLAT DIGITAL NATIVE documents — NOT photographs of physical objects.
NO notebook simulation, NO spiral bindings, NO table surfaces, NO camera perspective.
The output IS the document itself — a clean, downloadable graphic file.

OUTPUT: ONLY valid HTML starting with <!DOCTYPE html>. Zero explanations.

MANDATORY DESIGN SYSTEM:
1. Canvas: body { width:1080px; height:1350px; margin:0; padding:48px; overflow:hidden; box-sizing:border-box; background:#F8F8F8; }
2. Fonts: @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Caveat:wght@700&display=swap');
   - Titles: Caveat 700 (warm hand-lettered feel)
   - Body: Nunito 400/700/800 (clean, professional)
3. Color System:
   - Background: #F8F8F8 (warm off-white, NOT pure white)
   - Section titles: alternate Indigo #4338CA, Emerald #059669, Rose #E11D48, Amber #D97706
   - Body text: #1E293B (dark slate, NOT pure black)
   - Highlight: #FEF08A background on key terms (clean digital highlighter)
   - Cards: white #FFFFFF with border:2px solid #E2E8F0, border-radius:12px, box-shadow:0 2px 8px rgba(0,0,0,0.06)
4. Header: Dedicated banner zone with subtle gradient background, large Caveat title centered
5. Sections: Numbered with SEMANTIC icons (parsed from content), positioned in anchor zones next to numbers
6. Footer: Solid color banner (#1E293B dark), white bold text, CTA centered
7. NO physical simulation: no shadows on tables, no ring bindings, no paper texture, no camera angle
8. ALL text must be fully readable, min 14px, proper line-height 1.5+
9. Generous white space — min 20px padding inside all cards
10. Every emoji/icon: real Unicode characters, semantically matched to content`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt) return json({ error: "Missing: prompt" }, 400);

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    console.log("[generate-image] Generating HTML infographic via Claude...");

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
        system: SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[generate-image] Claude error:", response.status, err.slice(0, 300));
      throw new Error(`Claude error (${response.status})`);
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "";
    const html = raw.replace(/```html\n?/gi, "").replace(/```\n?/g, "").trim();

    if (!html.includes("<!DOCTYPE") && !html.includes("<html")) {
      throw new Error("Invalid HTML returned");
    }

    console.log("[generate-image] HTML generated:", html.length, "chars");
    return json({ html, type: "html" });
  } catch (err) {
    console.error("[generate-image]", err);
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});

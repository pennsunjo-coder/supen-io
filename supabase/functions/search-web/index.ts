const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { query, max_results } = await req.json();
    if (!query) return json({ error: "No query" }, 400);

    const TAVILY_KEY = Deno.env.get("TAVILY_API_KEY");
    if (!TAVILY_KEY) return json({ error: "Tavily API key not configured" }, 500);

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query,
        max_results: typeof max_results === "number" && max_results > 0 ? Math.min(max_results, 10) : 3,
        include_answer: true,
      }),
    });

    if (!response.ok) return json({ error: `Tavily HTTP ${response.status}` }, 422);

    const data = await response.json();

    let content = "";
    if (data.answer) content += `${data.answer}\n\n`;
    if (data.results) {
      for (const r of data.results) {
        content += `— ${r.title}\n${r.url}\n${r.content?.slice(0, 500) ?? ""}\n\n`;
      }
    }

    const title = `Recherche : ${query.slice(0, 100)}`;

    // Return both formatted content (for source insertion) AND raw results (for trends)
    return json({
      title,
      content: content.trim(),
      results: data.results || [],
      answer: data.answer || "",
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});

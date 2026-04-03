const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérification basique du token (pas de JWT strict)
    const authHeader = req.headers.get("authorization") || req.headers.get("apikey");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder("latin1");
    const pdfString = decoder.decode(uint8Array);

    const textParts: string[] = [];

    // Extraire les strings Tj (opérateur texte PDF)
    const tjMatches = pdfString.matchAll(/\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g);
    for (const match of tjMatches) {
      const text = match[1]
        .replace(/\\n/g, " ")
        .replace(/\\r/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\")
        .trim();
      if (text.length > 1) textParts.push(text);
    }

    // Extraire les arrays TJ
    const tjArrayMatches = pdfString.matchAll(/\[([^\]]+)\]\s*TJ/gi);
    for (const match of tjArrayMatches) {
      const stringMatches = match[1].matchAll(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g);
      for (const sm of stringMatches) {
        const text = sm[1].trim();
        if (text.length > 1) textParts.push(text);
      }
    }

    const extractedText = textParts.join(" ").trim();
    const pageCount = (pdfString.match(/\/Type\s*\/Page[^s]/g) || []).length || 1;

    if (!extractedText || extractedText.length < 20) {
      return new Response(
        JSON.stringify({ error: "Ce PDF ne contient pas de texte extractible." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ text: extractedText, pages: pageCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("extract-pdf error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

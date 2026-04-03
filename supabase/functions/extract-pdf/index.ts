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
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const text = extractPdfText(data);
    const pageCount = countPages(data);

    if (!text || text.length < 30) {
      return new Response(
        JSON.stringify({ error: "Ce PDF ne contient pas de texte extractible. Il est peut-��tre scanné ou protégé." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ text, pages: pageCount }),
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

function countPages(data: Uint8Array): number {
  const str = new TextDecoder("latin1").decode(data);
  return (str.match(/\/Type\s*\/Page[^s]/g) || []).length || 1;
}

function extractPdfText(data: Uint8Array): string {
  const pdfStr = new TextDecoder("latin1").decode(data);
  const texts: string[] = [];

  // Trouver tous les streams de contenu
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let streamMatch;

  while ((streamMatch = streamRegex.exec(pdfStr)) !== null) {
    const streamContent = streamMatch[1];

    // Blocs BT...ET (blocs de texte PDF)
    const btEtRegex = /BT([\s\S]*?)ET/g;
    let btMatch;

    while ((btMatch = btEtRegex.exec(streamContent)) !== null) {
      const block = btMatch[1];

      // Tj operator : (text) Tj
      const tjRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        const t = decodePdfString(tjMatch[1]);
        if (t.trim().length > 0) texts.push(t);
      }

      // TJ operator : [(text) num (text)] TJ
      const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
      let tjArrayMatch;
      while ((tjArrayMatch = tjArrayRegex.exec(block)) !== null) {
        const innerStrings = tjArrayMatch[1].matchAll(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g);
        for (const s of innerStrings) {
          const t = decodePdfString(s[1]);
          if (t.trim().length > 0) texts.push(t);
        }
      }

      // Td + Tj pattern
      const tdTjRegex = /Td\s+\(([^)]+)\)\s*Tj/g;
      let tdTjMatch;
      while ((tdTjMatch = tdTjRegex.exec(block)) !== null) {
        const t = decodePdfString(tdTjMatch[1]);
        if (t.trim().length > 0) texts.push(t);
      }
    }

    // Textes en dehors des BT/ET
    const standaloneTj = /\(([^)\\]{2,}(?:\\.[^)\\]*)*)\)\s*Tj/g;
    let stMatch;
    while ((stMatch = standaloneTj.exec(streamContent)) !== null) {
      const t = decodePdfString(stMatch[1]);
      if (t.trim().length > 1 && /[a-zA-ZÀ-ÿ]/.test(t)) {
        texts.push(t);
      }
    }
  }

  return [...new Set(texts)].join(" ").replace(/\s+/g, " ").trim();
}

function decodePdfString(s: string): string {
  return s
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{3})/g, (_, oct) => {
      const code = parseInt(oct, 8);
      return code > 31 && code < 128 ? String.fromCharCode(code) : " ";
    });
}

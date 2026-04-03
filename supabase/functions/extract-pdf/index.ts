const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // Preflight — Safari exige status 200 avec tous les headers
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return jsonResponse({ error: "No file provided" }, 400);

    const data = new Uint8Array(await file.arrayBuffer());
    const text = extractPdfText(data);
    const pages = countPages(data);

    if (!text || text.length < 30) {
      // Vérifier si c'est un PDF compressé
      const pdfStr = new TextDecoder("latin1").decode(data);
      const hasCompressed = /\/Filter\s*\/FlateDecode/i.test(pdfStr);

      if (hasCompressed) {
        return jsonResponse({
          error: "Ce PDF utilise une compression (FlateDecode). Copie le texte manuellement ou convertis en PDF/A.",
        }, 422);
      }

      return jsonResponse({
        error: "Ce PDF ne contient pas de texte extractible. Il est peut-être scanné.",
      }, 422);
    }

    return jsonResponse({ text, pages });
  } catch (err) {
    console.error("extract-pdf error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});

function countPages(data: Uint8Array): number {
  const str = new TextDecoder("latin1").decode(data);
  return (str.match(/\/Type\s*\/Page[^s]/g) || []).length || 1;
}

function extractPdfText(data: Uint8Array): string {
  const pdfStr = new TextDecoder("latin1").decode(data);
  const texts: string[] = [];

  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let sm;
  while ((sm = streamRegex.exec(pdfStr)) !== null) {
    const stream = sm[1];

    // Skip streams compressés (premiers bytes non-ASCII)
    if (stream.charCodeAt(0) > 127) continue;

    // Blocs BT...ET
    const btRegex = /BT([\s\S]*?)ET/g;
    let bt;
    while ((bt = btRegex.exec(stream)) !== null) {
      const block = bt[1];

      // (text) Tj
      const tjR = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
      let tj;
      while ((tj = tjR.exec(block)) !== null) {
        const t = decode(tj[1]);
        if (t.trim()) texts.push(t);
      }

      // [(text) num] TJ
      const tjAR = /\[([\s\S]*?)\]\s*TJ/g;
      let tja;
      while ((tja = tjAR.exec(block)) !== null) {
        const inner = tja[1].matchAll(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g);
        for (const s of inner) {
          const t = decode(s[1]);
          if (t.trim()) texts.push(t);
        }
      }
    }

    // Standalone Tj hors BT/ET
    const stR = /\(([^)\\]{2,}(?:\\.[^)\\]*)*)\)\s*Tj/g;
    let st;
    while ((st = stR.exec(stream)) !== null) {
      const t = decode(st[1]);
      if (t.trim().length > 1 && /[a-zA-ZÀ-ÿ]/.test(t)) texts.push(t);
    }
  }

  return [...new Set(texts)].join(" ").replace(/\s+/g, " ").trim();
}

function decode(s: string): string {
  return s
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{3})/g, (_, o) => {
      const c = parseInt(o, 8);
      return c > 31 && c < 128 ? String.fromCharCode(c) : " ";
    });
}

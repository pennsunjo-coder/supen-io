const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return jsonResponse({ error: "No file provided" }, 400);

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pages = countPages(uint8Array);

    // ── Strategy 1: Claude Vision PDF reading ──
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (anthropicKey) {
      try {
        const base64 = uint8ArrayToBase64(uint8Array);

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 4000,
            messages: [{
              role: "user",
              content: [
                {
                  type: "document",
                  source: { type: "base64", media_type: "application/pdf", data: base64 },
                },
                {
                  type: "text",
                  text: "Extract ALL text content from this PDF. Return only the raw text, preserving structure. No commentary.",
                },
              ],
            }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.content
            ?.filter((b: { type: string }) => b.type === "text")
            ?.map((b: { text: string }) => b.text)
            ?.join("") || "";

          if (text.length > 20) {
            return jsonResponse({ text, pages });
          }
        } else {
          console.warn("Claude API error:", response.status, await response.text().catch(() => ""));
        }
      } catch (err) {
        console.warn("Claude Vision failed:", err);
      }
    }

    // ── Strategy 2: Native PDF text extraction ──
    try {
      const text = await extractPdfText(uint8Array);
      if (text.length > 30) {
        return jsonResponse({ text, pages });
      }
    } catch (err) {
      console.warn("Native extraction failed:", err);
    }

    return jsonResponse({
      error: "No text could be extracted from this PDF. It may be scanned or protected.",
    }, 422);

  } catch (err) {
    console.error("extract-pdf error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});

// ─── Helpers ───

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function countPages(data: Uint8Array): number {
  const str = new TextDecoder("latin1").decode(data);
  return (str.match(/\/Type\s*\/Page[^s]/g) || []).length || 1;
}

// ─── Native PDF text extraction (fallback) ───

async function decompressStream(data: Uint8Array): Promise<string> {
  try {
    const ds = new DecompressionStream("deflate-raw");
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    writer.write(data);
    writer.close();

    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const total = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
    return new TextDecoder("latin1").decode(result);
  } catch {
    return "";
  }
}

async function extractPdfText(data: Uint8Array): Promise<string> {
  const pdfStr = new TextDecoder("latin1").decode(data);
  const texts: string[] = [];

  const objRegex = /(\d+\s+\d+\s+obj[\s\S]*?)\bstream\r?\n([\s\S]*?)\r?\nendstream/g;
  let objMatch;

  while ((objMatch = objRegex.exec(pdfStr)) !== null) {
    const header = objMatch[1];
    const streamData = objMatch[2];
    let content = "";

    if (/\/Filter\s*\/FlateDecode/i.test(header) || /\/Filter\s*\[.*?FlateDecode.*?\]/i.test(header)) {
      const bytes = new Uint8Array(streamData.length);
      for (let i = 0; i < streamData.length; i++) bytes[i] = streamData.charCodeAt(i) & 0xff;
      content = await decompressStream(bytes);
    } else if (!/\/Filter/i.test(header)) {
      content = streamData;
    }

    if (content) extractTextOps(content, texts);
  }

  const raw = [...new Set(texts)]
    .filter((t) => t.trim().length > 1)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  // Clean PDF artifacts
  return raw
    .replace(/\/(Type|Font|Page|Catalog|Encoding|BaseFont)\b/g, " ")
    .replace(/<<[^>]*>>/g, " ")
    .replace(/\d+\s+\d+\s+obj/g, " ")
    .replace(/endobj|endstream|stream/g, " ")
    .replace(/[0-9a-fA-F]{20,}/g, " ")
    .split(" ")
    .filter((word) => {
      if (word.length < 2) return false;
      const alpha = (word.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
      return alpha / Math.max(word.length, 1) > 0.3;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTextOps(content: string, texts: string[]) {
  const btRegex = /BT([\s\S]*?)ET/g;
  let bt;
  while ((bt = btRegex.exec(content)) !== null) {
    const block = bt[1];
    const tjR = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
    let tj;
    while ((tj = tjR.exec(block)) !== null) {
      const t = decode(tj[1]);
      if (t.trim()) texts.push(t);
    }
    const tjAR = /\[([\s\S]*?)\]\s*TJ/g;
    let tja;
    while ((tja = tjAR.exec(block)) !== null) {
      for (const s of tja[1].matchAll(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g)) {
        const t = decode(s[1]);
        if (t.trim()) texts.push(t);
      }
    }
  }
}

function decode(s: string): string {
  return s
    .replace(/\\n/g, " ").replace(/\\r/g, " ").replace(/\\t/g, " ")
    .replace(/\\\(/g, "(").replace(/\\\)/g, ")").replace(/\\\\/g, "\\")
    .replace(/\\(\d{3})/g, (_, o) => {
      const c = parseInt(o, 8);
      return c > 31 && c < 128 ? String.fromCharCode(c) : " ";
    });
}

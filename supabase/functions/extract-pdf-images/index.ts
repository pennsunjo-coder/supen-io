// extract-pdf-images
// Batched OCR of pre-rendered PDF pages. The client (use-sources.ts) renders
// each page to a JPEG via pdfjs canvas and uploads small batches here. We
// call Gemini Vision on every page IN PARALLEL inside a single batch, so a
// 5-page batch finishes in roughly the time of one page (~3-5s) instead of
// 25s sequential.
//
// The client orchestrates batch concurrency (currently 3 batches in flight),
// so this function only has to think about ONE batch at a time.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const PROMPT =
  "Extract ALL the visible text from this page, in reading order. " +
  "Preserve paragraphs but drop headers/footers and page numbers. " +
  "Return ONLY the raw text — no commentary, no markdown, no code fences.";

// Strip non-printable control chars (matches the cleaner used in extract-pdf).
const CONTROL_CHARS_REGEX = new RegExp(
  "[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\uFFFE\\uFFFF]",
  "g",
);

async function ocrOnePage(base64: string, apiKey: string, model: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: "image/jpeg", data: base64 } },
            { text: PROMPT },
          ],
        }],
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return text.replace(CONTROL_CHARS_REGEX, "").trim();
}

interface PageInput { pageNum: number; base64: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) return json({ error: "GEMINI_API_KEY not configured" }, 500);

    const { images } = await req.json() as { images?: PageInput[] };
    if (!Array.isArray(images) || images.length === 0) {
      return json({ error: "images[] required" }, 400);
    }
    if (images.length > 10) {
      return json({ error: "batch too large (max 10 images per call)" }, 400);
    }

    // Parallel OCR of the whole batch. If one page fails we still return
    // a per-page entry with an empty string so the client can stitch the
    // PDF back together without losing track of page order.
    const results = await Promise.all(
      images.map(async (img) => {
        try {
          // 2.5-flash for the fast path; 2.5-pro is the quality fallback if
          // flash returns empty (rare, but happens on dense pages).
          let text = await ocrOnePage(img.base64, geminiKey, "gemini-2.5-flash");
          if (!text) {
            text = await ocrOnePage(img.base64, geminiKey, "gemini-2.5-pro").catch(() => "");
          }
          return { pageNum: img.pageNum, text, ok: true as const };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[extract-pdf-images] page ${img.pageNum} failed:`, msg);
          return { pageNum: img.pageNum, text: "", ok: false as const, error: msg };
        }
      }),
    );

    return json({ pages: results });
  } catch (err) {
    console.error("[extract-pdf-images] unexpected:", err);
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});

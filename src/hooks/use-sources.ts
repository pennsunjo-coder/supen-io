import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-profile";
import { getCache, setCache, invalidateCache } from "@/lib/cache";
import { embedSource, embedAllExistingSources } from "@/lib/embeddings";
import { distillSource } from "@/lib/distill-source";
import { getPlanLimits, upgradeMessage } from "@/lib/plan-limits";
import * as pdfjsLib from "pdfjs-dist";
import type { Source } from "@/types/database";

// pdfjs-dist 5.x ships an ESM worker. We host the .mjs file from /public,
// shipped via Vite's static asset pipeline. This MUST be set before any
// getDocument() call, otherwise pdf.js falls back to a (slow) main-thread
// renderer and prints a console warning.
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const IS_DEV = import.meta.env.DEV;

const CHUNK_SIZE = 400; // words per chunk (target 300-500)
const CHUNK_OVERLAP = 50; // overlap words

/**
 * Splits text into chunks of CHUNK_SIZE words with CHUNK_OVERLAP overlap words.
 * Returns an array of strings. If the text is short (<= CHUNK_SIZE), returns [text].
 */
function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length <= CHUNK_SIZE) return [text.trim()];

  const chunks: string[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end >= words.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

/**
 * Extracts the main text from an HTML page by removing
 * script, style, nav, header, footer tags and ads.
 */
function extractTextFromHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove non-content elements
  const selectorsToRemove = [
    "script", "style", "nav", "header", "footer",
    "iframe", "noscript", "aside",
    "[role='navigation']", "[role='banner']", "[role='contentinfo']",
    ".ad", ".ads", ".advertisement", ".sidebar", ".menu", ".cookie",
  ];
  for (const sel of selectorsToRemove) {
    doc.querySelectorAll(sel).forEach((el) => el.remove());
  }

  // Find main content
  const main = doc.querySelector("article") || doc.querySelector("main") || doc.querySelector("[role='main']") || doc.body;
  const text = (main?.textContent || "")
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, 30000);
}

/**
 * Render a single PDF page to a JPEG base64 string (no "data:" prefix). Used
 * by Strategy 2 below when the PDF has no text layer and we need OCR.
 *
 * Scale 1.3 + quality 0.75 keeps the JPEG around 200-400 KB even for dense
 * pages (vs. the ~1 MB we got at scale 1.5 / quality 0.85). That matters
 * because Supabase Edge Functions cap request bodies at ~6 MB total —
 * batches of 3 pages now stay comfortably under that.
 */
async function renderPdfPageToJpegBase64(
  pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]>,
  pageNum: number,
): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.3 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
  // Free GPU/CPU memory immediately — these canvases can hit 4-6 MB each.
  canvas.width = 0;
  canvas.height = 0;
  return dataUrl.split(",")[1] ?? "";
}

// Tuned conservatively. 3 pages × ~300 KB JPEG ≈ 1 MB request body — well
// inside Supabase's 6 MB cap. 4 parallel batches keeps the throughput up.
const OCR_BATCH_SIZE = 3;        // pages per server call
const OCR_PARALLEL_BATCHES = 4;  // server calls in flight simultaneously
const OCR_MAX_PAGES = 150;       // refuse PDFs bigger than this — costs spiral and timing gets messy

/**
 * OCR fallback for image-only / scanned PDFs. Renders each page to a JPEG
 * client-side then ships them to the extract-pdf-images edge function in
 * small parallel batches. Inside each batch the server fans out to Gemini
 * Vision again, so a 50-page scan finishes in roughly the time of one
 * single-page OCR call rather than fifty sequential ones.
 */
async function extractViaImageBatchOCR(
  pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]>,
  totalPages: number,
  onProgress?: (page: number, total: number) => void,
): Promise<string> {
  if (totalPages > OCR_MAX_PAGES) {
    throw new Error(
      `PDF too large for OCR (${totalPages} pages, max ${OCR_MAX_PAGES}). ` +
      `Split the document and re-upload, or paste the content as a note.`,
    );
  }

  // Build the batch shape we send to the edge function. Render lazily so
  // we never hold more than ONE batch worth of JPEGs in memory at a time.
  const batches: { pageNum: number }[][] = [];
  for (let i = 1; i <= totalPages; i += OCR_BATCH_SIZE) {
    const batch: { pageNum: number }[] = [];
    for (let p = i; p < Math.min(i + OCR_BATCH_SIZE, totalPages + 1); p++) {
      batch.push({ pageNum: p });
    }
    batches.push(batch);
  }

  let donePages = 0;
  const pageTexts: { pageNum: number; text: string }[] = [];

  // Process N batches at a time. The semaphore is just a sliding window
  // over the batches array.
  for (let i = 0; i < batches.length; i += OCR_PARALLEL_BATCHES) {
    const concurrent = batches.slice(i, i + OCR_PARALLEL_BATCHES);
    const batchResults = await Promise.all(
      concurrent.map(async (batch) => {
        // Render this batch's images now (sequential render inside the
        // batch to keep canvas memory bounded), then ship them.
        const images: { pageNum: number; base64: string }[] = [];
        for (const { pageNum } of batch) {
          const base64 = await renderPdfPageToJpegBase64(pdf, pageNum);
          images.push({ pageNum, base64 });
        }
        const { data, error } = await supabase.functions.invoke("extract-pdf-images", {
          body: { images },
        });
        if (error) {
          // supabase.functions.invoke wraps non-2xx responses; the real
          // error JSON is hidden on `error.context`. Dig it out so the
          // user sees "GEMINI_API_KEY not configured" instead of the
          // useless "Edge Function returned a non-2xx status code".
          let detail = error.message || "extract-pdf-images failed";
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            try {
              const body = await ctx.json();
              if (body?.error) detail = String(body.error);
            } catch { /* ignore */ }
          }
          throw new Error(detail);
        }
        if (!data?.pages) throw new Error("extract-pdf-images returned no pages");
        donePages += images.length;
        onProgress?.(donePages, totalPages);
        return data.pages as { pageNum: number; text: string }[];
      }),
    );
    for (const arr of batchResults) pageTexts.push(...arr);
  }

  pageTexts.sort((a, b) => a.pageNum - b.pageNum);
  return pageTexts.map((r) => r.text).filter(Boolean).join("\n\n").replace(/\s+/g, " ").trim();
}

/**
 * Extracts text from a PDF.
 *
 * Strategy order, fastest-first:
 *   1. pdfjs-dist client-side text extraction — handles 95% of PDFs in
 *      1-5 sec, no server call.
 *   2. Parallel image-batch OCR — for image/scanned PDFs, render pages to
 *      JPEG and OCR in parallel via Gemini Vision. ~30-60 sec for 80 pages.
 *   3. Legacy single-call Edge Function (Claude/Gemini on the full PDF) —
 *      kept as safety net but slow (30-300 sec) and chokes on big files.
 *   4. latin1 regex parsing — last-resort hack on the raw bytes.
 *
 * Strategy 2 is the NotebookLM-grade speed path: instead of asking one
 * model to read 80 pages in a single 30-MB payload, we ship 5-page JPEG
 * batches in parallel and stitch the results back together.
 */
async function extractTextFromPdf(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<{ text: string; pages: number }> {

  console.log("=== PDF EXTRACT v3 ===", file.name, file.size, file.type);

  // Load the PDF once and reuse the handle across S1 (text) and S2 (image
  // OCR). Both strategies live on the same pdf.js document instance.
  let pdfInstance: Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]> | null = null;
  let totalPagesCached = 0;
  try {
    const buffer = await file.arrayBuffer();
    pdfInstance = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    totalPagesCached = pdfInstance.numPages;
  } catch (e) {
    console.warn("[PDF] pdf.js failed to open the document:", e instanceof Error ? e.message : e);
  }

  // Strategy 1: pdfjs-dist text layer (fast path, no server round-trip).
  if (pdfInstance) {
    try {
      console.log("[PDF] S1: pdfjs text layer...");
      const pdf = pdfInstance;
      const totalPages = totalPagesCached;
      // Extract all pages in parallel for max speed.
      const pageTexts = await Promise.all(
        Array.from({ length: totalPages }, async (_, i) => {
          const page = await pdf.getPage(i + 1);
          const content = await page.getTextContent();
          const text = content.items
            .map((item) => ("str" in item ? (item as { str: string }).str : ""))
            .join(" ");
          onProgress?.(i + 1, totalPages);
          return text;
        }),
      );
      const fullText = pageTexts.join("\n\n").replace(/\s+/g, " ").trim();
      console.log("[PDF] S1: extracted", fullText.length, "chars from", totalPages, "pages");

      // Heuristic: 30 chars TOTAL is too low to trust as "real text" — but
      // we also want to accept text-heavy mixed PDFs. Treat anything with
      // an average of >=20 chars per page as text-based.
      if (fullText.length > 30 && fullText.length > totalPages * 20) {
        console.log("[PDF] S1 OK:", fullText.slice(0, 200));
        return { text: fullText.slice(0, 50000), pages: totalPages };
      }
      console.log("[PDF] S1 produced too little text — falling through to image-batch OCR");
    } catch (e) {
      console.warn("[PDF] S1 failed (will try OCR):", e instanceof Error ? e.message : e);
    }
  }

  // Strategy 2: parallel image-batch OCR via extract-pdf-images.
  // This is the fast path for image-only / scanned PDFs. Used to take
  // 3-10 min on big files via the legacy single-call edge fn; now ~30-60s
  // for 80 pages thanks to client-side rendering + server-side fan-out.
  if (pdfInstance && totalPagesCached > 0) {
    try {
      console.log("[PDF] S2: image-batch OCR over", totalPagesCached, "pages...");
      const text = await extractViaImageBatchOCR(pdfInstance, totalPagesCached, onProgress);
      if (text.length > 30) {
        console.log("[PDF] S2 OK:", text.slice(0, 200));
        return { text: text.slice(0, 200000), pages: totalPagesCached };
      }
      console.warn("[PDF] S2 produced too little text — falling through to legacy edge fn");
    } catch (e) {
      console.warn("[PDF] S2 failed (will try legacy edge fn):", e instanceof Error ? e.message : e);
    }
  }

  // Strategy 3: legacy single-call edge function (Claude/Gemini on the
  // whole PDF). Slow and chokes on big files, kept as a safety net.
  let edgeError = "";
  try {
    console.log("[PDF] S3: legacy single-call edge fn...");
    const formData = new FormData();
    formData.append("file", file);
    const { data, error } = await supabase.functions.invoke("extract-pdf", { body: formData });

    if (!error && data?.text && data.text.length > 30) {
      console.log("[PDF] S3 OK:", data.text.slice(0, 200));
      onProgress?.(1, 1);
      return { text: data.text, pages: data.pages || 1 };
    }

    // Capture the upstream error so we can surface it if everything fails.
    if (data?.error) edgeError = String(data.error);
    else if (error?.message) edgeError = error.message;
    if (error && typeof (error as { context?: { json?: () => Promise<{ error?: string }> } }).context?.json === "function") {
      try {
        const body = await (error as { context: { json: () => Promise<{ error?: string }> } }).context.json();
        if (body?.error) edgeError = String(body.error);
      } catch { /* ignore */ }
    }
  } catch (e) {
    edgeError = e instanceof Error ? e.message : String(e);
    console.warn("[PDF] S3 failed:", edgeError);
  }

  // Strategy 4: last-resort latin1 regex hack on raw bytes
  try {
    console.log("[PDF] S4: latin1 regex parsing...");
    const buffer = await file.arrayBuffer();
    const raw = new TextDecoder("latin1").decode(new Uint8Array(buffer));
    const texts: string[] = [];

    const parenRegex = /\(([^\\)]{2,200})\)/g;
    let match;
    while ((match = parenRegex.exec(raw)) !== null) {
      const t = match[1].replace(/\\n/g, " ").replace(/\\r/g, " ").replace(/\\\(/g, "(").replace(/\\\)/g, ")").replace(/\\\\/g, "\\").replace(/\\[0-7]{3}/g, " ").trim();
      if (t.length > 2 && /[a-zA-Z]/.test(t)) texts.push(t);
    }

    const tjRegex = /\[((?:\([^)]*\)|[^\]])*)\]\s*TJ/g;
    while ((match = tjRegex.exec(raw)) !== null) {
      const parts: string[] = [];
      const inner = /\(([^)]{1,200})\)/g;
      let m;
      while ((m = inner.exec(match[1])) !== null) if (m[1].trim()) parts.push(m[1].trim());
      if (parts.length) texts.push(parts.join(""));
    }

    const fullText = texts.join(" ").replace(/\s+/g, " ").trim();
    const ratio = (fullText.match(/[a-zA-Z\s]/g) || []).length / Math.max(fullText.length, 1);
    console.log("[PDF] S4:", fullText.length, "chars, ratio:", ratio.toFixed(2));

    if (fullText.length > 100 && ratio > 0.4) {
      console.log("[PDF] S4 OK:", fullText.slice(0, 200));
      onProgress?.(1, 1);
      return { text: fullText.slice(0, 20000), pages: 1 };
    }
  } catch (e) {
    console.warn("[PDF] S4 failed:", e);
  }

  const detail = edgeError ? ` (server: ${edgeError})` : "";
  throw new Error(`Could not extract text${detail}. Please paste the content manually.`);
}

export interface GroupedSource {
  id: string;          // first chunk ID (for key)
  ids: string[];       // all chunk IDs
  type: "url" | "note" | "pdf";
  title: string;       // name without chunk suffix
  chunkCount: number;
  wordCount: number;
  content: string;     // first chunk for preview
  file_path: string | null;
  directive?: string;
}

/**
 * Groups sources by file (same PDF = 1 entry).
 * URLs/Notes with suffix (1/3) are also grouped.
 */
function groupSources(sources: Source[]): GroupedSource[] {
  const groups = new Map<string, Source[]>();

  for (const s of sources) {
    // Extract the base title (without " (1/3)")
    const baseTitle = s.title.replace(/\s*\(\d+\/\d+\)$/, "");
    const key = `${s.type}:${baseTitle}`;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return [...groups.entries()].map(([, chunks]) => {
    const first = chunks[0];
    const baseTitle = first.title.replace(/\s*\(\d+\/\d+\)$/, "");
    const totalWords = chunks.reduce((sum, c) => sum + (c.content ? c.content.split(/\s+/).length : 0), 0);
    return {
      id: first.id,
      ids: chunks.map((c) => c.id),
      type: first.type,
      title: baseTitle,
      chunkCount: chunks.length,
      wordCount: totalWords,
      content: first.content,
      file_path: chunks.find((c) => c.file_path)?.file_path ?? null,
      directive: chunks.find((c) => c.directive)?.directive || "",
    };
  });
}

// Tracks which users we've already run the embedding backfill for this
// session, so it fires once per login rather than on every hook mount.
const embeddingBackfillDone = new Set<string>();

export function useSources() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  // Gate keeper: returns an error string when the current plan would block
  // adding one more source (counted as deduplicated groups, not chunks).
  const checkSourceQuota = useCallback((): string | null => {
    const limits = getPlanLimits(profile?.plan);
    if (limits.maxSources === "unlimited") return null;
    const groupCount = new Set(
      sources.map((s) => s.title.replace(/\s*\(\d+\/\d+\)$/, ""))
    ).size;
    if (groupCount >= limits.maxSources) {
      return upgradeMessage(profile?.plan, `Source limit (${limits.maxSources})`);
    }
    return null;
  }, [profile?.plan, sources]);

  const fetchSources = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const cacheKey = `sources:${user.id}`;
    const cached = getCache<Source[]>(cacheKey);
    if (cached) { setSources(cached); setLoading(false); return; }

    try {
      const { data, error } = await supabase
        .from("sources")
        .select("id, user_id, type, title, content, file_path, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        const typed = data as Source[];
        setSources(typed);
        setCache(cacheKey, typed);
      }
    } catch { /* network */ }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Backfill embeddings for sources created before embedding existed (or whose
  // fire-and-forget embed on insert failed). Best-effort, non-blocking, and
  // bounded: it only processes sources with a NULL embedding (up to 20 per
  // run), then becomes a no-op. Without this, older sources stay invisible to
  // semantic RAG search and weaken source relevance.
  useEffect(() => {
    if (!user?.id || embeddingBackfillDone.has(user.id)) return;
    embeddingBackfillDone.add(user.id);
    embedAllExistingSources(user.id).catch(() => {});
  }, [user?.id]);

  const addUrl = useCallback(
    async (url: string): Promise<{ error: string | null }> => {
      if (!user) return { error: "Not connected" };
      const quotaError = checkSourceQuota();
      if (quotaError) return { error: quotaError };

      // Fetch via Edge Function (no CORS)
      let title = url.slice(0, 120);
      let pageContent = "";

      try {
        const { data, error: fnErr } = await supabase.functions.invoke("fetch-url", {
          body: { url },
        });
        if (!fnErr && data?.text) {
          pageContent = data.text;
          title = data.title?.slice(0, 120) || title;
        } else {
        }
      } catch {
      }

      // Fallback: if Edge Function fails, try client-side
      if (!pageContent) {
        try {
          const response = await fetch(url, {
            headers: { "Accept": "text/html" },
            signal: AbortSignal.timeout(8000),
          });
          if (response.ok) {
            const html = await response.text();
            pageContent = extractTextFromHtml(html);
            const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (m?.[1]) title = m[1].trim().slice(0, 120);
          }
        } catch { /* CORS / timeout */ }
      }

      if (!pageContent || pageContent.length < 50) {
        return { error: "Unable to access this page. Paste the text manually in a Note." };
      }

      const chunks = chunkText(pageContent);

      if (chunks.length === 1) {
        const { data: inserted, error } = await supabase.from("sources").insert({
          user_id: user.id, type: "url", title, content: chunks[0],
        }).select("id, content");
        if (error) return { error: error.message };
        if (inserted) {
          inserted.forEach((s) => embedSource(s.id, s.content).catch(() => {}));
          distillSource(inserted.map((s) => s.id), title, pageContent).catch(() => {});
        }
      } else {
        const inserts = chunks.map((chunk, i) => ({
          user_id: user.id, type: "url" as const,
          title: `${title} (${i + 1}/${chunks.length})`, content: chunk,
        }));
        const { data: inserted, error } = await supabase.from("sources").insert(inserts).select("id, content");
        if (error) return { error: error.message };
        if (inserted) {
          inserted.forEach((s) => embedSource(s.id, s.content).catch(() => {}));
          distillSource(inserted.map((s) => s.id), title, pageContent).catch(() => {});
        }
      }

      invalidateCache(`sources:${user.id}`);
      await fetchSources();
      return { error: null };
    },
    [user, fetchSources, checkSourceQuota]
  );

  const addNote = useCallback(
    async (title: string, content: string): Promise<{ error: string | null }> => {
      if (!user) return { error: "Not connected" };
      const quotaError = checkSourceQuota();
      if (quotaError) return { error: quotaError };

      const chunks = chunkText(content);

      if (chunks.length === 1) {
        const { data: inserted, error } = await supabase.from("sources").insert({
          user_id: user.id,
          type: "note",
          title: title.slice(0, 200),
          content: chunks[0],
        }).select("id, content");
        if (error) return { error: error.message };
        if (inserted) {
          inserted.forEach((s) => embedSource(s.id, s.content).catch(() => {}));
          distillSource(inserted.map((s) => s.id), title.slice(0, 200), content).catch(() => {});
        }
      } else {
        const inserts = chunks.map((chunk, i) => ({
          user_id: user.id,
          type: "note" as const,
          title: `${title.slice(0, 180)} (${i + 1}/${chunks.length})`,
          content: chunk,
        }));
        const { data: inserted, error } = await supabase.from("sources").insert(inserts).select("id, content");
        if (error) return { error: error.message };
        if (inserted) {
          inserted.forEach((s) => embedSource(s.id, s.content).catch(() => {}));
          distillSource(inserted.map((s) => s.id), title.slice(0, 200), content).catch(() => {});
        }
      }

      invalidateCache(`sources:${user.id}`);
      await fetchSources();
      return { error: null };
    },
    [user, fetchSources, checkSourceQuota]
  );

  const addPdf = useCallback(
    async (file: File): Promise<{ error: string | null; insertedIds?: string[] }> => {
      console.log("=== addPdf START ===", file?.name, file?.size);
      if (!user) { console.error("[addPdf] No user"); return { error: "Not authenticated" }; }
      if (file.size > 10 * 1024 * 1024) return { error: "File must not exceed 10 MB." };
      const quotaError = checkSourceQuota();
      if (quotaError) return { error: quotaError };

      // 1. Extract text
      let pdfText: string;
      try {
        console.log("[addPdf] Calling extractTextFromPdf...");
        const result = await extractTextFromPdf(file, (p, t) => console.log(`[addPdf] Progress: ${p}/${t}`));
        pdfText = result.text;
        console.log("[addPdf] Got text:", pdfText.length, "chars");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[addPdf] Extract failed:", msg);
        return { error: msg };
      }

      if (!pdfText || pdfText.length < 10) return { error: "No extractable text in this PDF." };

      // 2. Storage upload (fire-and-forget)
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      supabase.storage.from("sources").upload(filePath, file, { contentType: "application/pdf" }).catch(() => {});

      // 3. Split into chunks and insert
      const title = file.name.replace(/\.pdf$/i, "");
      const chunks = chunkText(pdfText);

      // Optimistic update: inject temp placeholders immediately so the UI
      // reflects the new source without waiting for the Supabase round-trip.
      const nowIso = new Date().toISOString();
      const tempSources: Source[] = chunks.map((chunk, i) => ({
        id: `temp-${Date.now()}-${i}`,
        user_id: user.id,
        type: "pdf",
        title: chunks.length === 1 ? title : `${title} (${i + 1}/${chunks.length})`,
        content: chunk,
        file_path: i === 0 ? filePath : null,
        created_at: nowIso,
      } as Source));
      setSources((prev) => [...tempSources, ...prev]);

      try {
        const inserts = chunks.map((chunk, i) => ({
          user_id: user.id,
          type: "pdf" as const,
          title: chunks.length === 1 ? title : `${title} (${i + 1}/${chunks.length})`,
          content: chunk,
          file_path: i === 0 ? filePath : null,
        }));
        const { data: inserted, error } = await supabase
          .from("sources")
          .insert(inserts)
          .select("id, user_id, type, title, content, file_path, created_at");

        if (error) {
          // Roll back optimistic update
          setSources((prev) => prev.filter((s) => !tempSources.some((t) => t.id === s.id)));
          return { error: error.message };
        }

        if (inserted) {
          // Replace temp sources with real ones
          const realSources = inserted as Source[];
          setSources((prev) => [
            ...realSources,
            ...prev.filter((s) => !tempSources.some((t) => t.id === s.id)),
          ]);
          // Fire-and-forget embeddings
          realSources.forEach((s) => {
            if (s.content) embedSource(s.id, s.content).catch(() => {});
          });
          // Fire-and-forget viral-pattern distillation on the FULL PDF text
          // (Claude reads the whole thing once and stamps the result onto
          // every chunk row).
          distillSource(realSources.map((s) => s.id), title, pdfText).catch(() => {});
        }

        invalidateCache(`sources:${user.id}`);
        const ids = inserted ? (inserted as Source[]).map((s) => s.id) : [];
        return { error: null, insertedIds: ids };
      } catch (err) {
        setSources((prev) => prev.filter((s) => !tempSources.some((t) => t.id === s.id)));
        return { error: err instanceof Error ? err.message : "Insert failed" };
      }
    },
    [user]
  );

  const searchWeb = useCallback(
    async (query: string): Promise<{ error: string | null }> => {
      if (!user) return { error: "Not connected" };
      const quotaError = checkSourceQuota();
      if (quotaError) return { error: quotaError };

      // Try via Edge Function (Tavily key server-side)
      let title = "";
      let content = "";

      try {
        const { data, error: fnErr } = await supabase.functions.invoke("search-web", {
          body: { query },
        });
        if (!fnErr && data?.content) {
          title = data.title || `Search: ${query.slice(0, 100)}`;
          content = data.content;
        }
      } catch {
      }

      // Fallback client-side if Edge Function fails
      if (!content) {
        const TAVILY_KEY = import.meta.env.VITE_TAVILY_API_KEY;
        if (!TAVILY_KEY || TAVILY_KEY === "your-tavily-api-key") {
          return { error: "Web search unavailable. Deploy the search-web Edge Function." };
        }
        try {
          const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: TAVILY_KEY, query, max_results: 3, include_answer: true }),
          });
          if (!response.ok) return { error: `Tavily error: ${response.status}` };
          const data = await response.json();
          if (data.answer) content += `${data.answer}\n\n`;
          if (data.results) {
            for (const r of data.results) content += `— ${r.title}\n${r.url}\n${r.content?.slice(0, 500) ?? ""}\n\n`;
          }
          title = `Search: ${query.slice(0, 100)}`;
        } catch (err) {
          return { error: err instanceof Error ? err.message : "Search error" };
        }
      }

      if (!content.trim()) return { error: "No results found." };

      const chunks = chunkText(content.trim());
      if (chunks.length === 1) {
        const { data: inserted, error } = await supabase.from("sources").insert({
          user_id: user.id, type: "url", title, content: chunks[0],
        }).select("id, content");
        if (error) return { error: error.message };
        if (inserted) {
          inserted.forEach((s) => embedSource(s.id, s.content).catch(() => {}));
          distillSource(inserted.map((s) => s.id), title, content).catch(() => {});
        }
      } else {
        const inserts = chunks.map((chunk, i) => ({
          user_id: user.id, type: "url" as const,
          title: `${title} (${i + 1}/${chunks.length})`, content: chunk,
        }));
        const { data: inserted, error } = await supabase.from("sources").insert(inserts).select("id, content");
        if (error) return { error: error.message };
        if (inserted) {
          inserted.forEach((s) => embedSource(s.id, s.content).catch(() => {}));
          distillSource(inserted.map((s) => s.id), title, content).catch(() => {});
        }
      }

      invalidateCache(`sources:${user.id}`);
      await fetchSources();
      return { error: null };
    },
    [user, fetchSources, checkSourceQuota]
  );

  const removeSource = useCallback(
    async (source: Source): Promise<{ error: string | null }> => {
      if (source.type === "pdf" && source.file_path) {
        await supabase.storage.from("sources").remove([source.file_path]);
      }

      const { error } = await supabase
        .from("sources")
        .delete()
        .eq("id", source.id);

      if (error) return { error: error.message };
      if (user) invalidateCache(`sources:${user.id}`);
      setSources((prev) => prev.filter((s) => s.id !== source.id));
      return { error: null };
    },
    [user]
  );

  const removeGrouped = useCallback(
    async (group: GroupedSource): Promise<{ error: string | null }> => {
      if (group.file_path) {
        await supabase.storage.from("sources").remove([group.file_path]);
      }
      const { error } = await supabase
        .from("sources")
        .delete()
        .in("id", group.ids);

      if (error) return { error: error.message };
      if (user) invalidateCache(`sources:${user.id}`);
      setSources((prev) => prev.filter((s) => !group.ids.includes(s.id)));
      return { error: null };
    },
    [user]
  );

  // Memoize the grouping so re-renders from unrelated state don't
  // recompute the Map/regex/reduce for every source on each render.
  const grouped = useMemo(() => groupSources(sources), [sources]);

  return { sources, grouped, loading, addUrl, addNote, addPdf, searchWeb, removeSource, removeGrouped };
}

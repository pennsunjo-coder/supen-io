import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getCache, setCache, invalidateCache } from "@/lib/cache";
import { embedSource } from "@/lib/embeddings";
import type { Source } from "@/types/database";

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
 * Extracts text from a PDF — client-side via pdf.js with CDN worker.
 * Works in all modern browsers (Chrome, Firefox, Safari, Edge).
 * Falls back to Edge Function "extract-pdf" if client-side extraction fails.
 */
async function extractTextFromPdf(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<{ text: string; pages: number }> {
  // ── Strategy 1: client-side pdf.js ──
  try {
    const pdfjsLib = await import("pdfjs-dist");

    // Worker URL — try local copy first, CDN fallback for Safari/compatibility
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    } catch {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      disableFontFace: true,
      useWorkerFetch: false,
      isEvalSupported: false,
      disableAutoFetch: true,
      disableStream: true,
      verbosity: 0,
    });

    // Timeout for Safari (slower PDF processing)
    const pdf = await Promise.race([
      loadingTask.promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("PDF loading timeout — try a smaller file")), 30000),
      ),
    ]);

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const tc = await page.getTextContent({ includeMarkedContent: false });
        fullText += tc.items
          .map((item) => ("str" in item ? (item.str as string) : ""))
          .filter((s) => s.trim().length > 0)
          .join(" ") + "\n";
        onProgress?.(i, pdf.numPages);
      } catch { /* skip page */ }
    }

    const cleaned = fullText
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (cleaned.length > 20) {
      return { text: cleaned, pages: pdf.numPages };
    }
    // No text extracted — likely a scanned/image PDF
    throw new Error("No extractable text (PDF may be scanned/image-based)");
  } catch (clientErr) {
    const errMsg = clientErr instanceof Error ? clientErr.message : String(clientErr);
    if (IS_DEV) console.warn("[PDF] Client-side extraction failed:", errMsg, clientErr);
    // If the error is a password-protected PDF, surface it immediately
    if (/password/i.test(errMsg)) {
      throw new Error("This PDF is password-protected.");
    }
  }

  // ── Strategy 2: Edge Function fallback ──
  try {
    const formData = new FormData();
    formData.append("file", file);

    const { data, error } = await supabase.functions.invoke("extract-pdf", {
      body: formData,
    });

    if (error) throw new Error(error.message || "Edge Function failed");
    if (!data?.text) throw new Error("No text extracted by the server");

    return { text: data.text, pages: data.pages || 0 };
  } catch (serverErr) {
    const msg = serverErr instanceof Error ? serverErr.message : "Unknown error";
    throw new Error(`PDF extraction failed. ${msg}. If this is a scanned PDF, try OCR first.`);
  }
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
    };
  });
}

export function useSources() {
  const { user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSources = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const cacheKey = `sources:${user.id}`;
    const cached = getCache<Source[]>(cacheKey);
    if (cached) { setSources(cached); setLoading(false); return; }

    try {
      // Only select columns needed for the list view.
      // Exclude `embedding` (huge pgvector blob — loaded server-side only
      // when searching) and any other heavy columns.
      const { data, error } = await supabase
        .from("sources")
        .select("id, user_id, type, title, content, file_path, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

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

  const addUrl = useCallback(
    async (url: string): Promise<{ error: string | null }> => {
      if (!user) return { error: "Not connected" };

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
        if (inserted) inserted.forEach((s) => embedSource(s.id, s.content).catch(() => {}));
      } else {
        const inserts = chunks.map((chunk, i) => ({
          user_id: user.id, type: "url" as const,
          title: `${title} (${i + 1}/${chunks.length})`, content: chunk,
        }));
        const { data: inserted, error } = await supabase.from("sources").insert(inserts).select("id, content");
        if (error) return { error: error.message };
        if (inserted) inserted.forEach((s) => embedSource(s.id, s.content).catch(() => {}));
      }

      invalidateCache(`sources:${user.id}`);
      await fetchSources();
      return { error: null };
    },
    [user, fetchSources]
  );

  const addNote = useCallback(
    async (title: string, content: string): Promise<{ error: string | null }> => {
      if (!user) return { error: "Not connected" };

      const chunks = chunkText(content);

      if (chunks.length === 1) {
        const { data: inserted, error } = await supabase.from("sources").insert({
          user_id: user.id,
          type: "note",
          title: title.slice(0, 200),
          content: chunks[0],
        }).select("id, content");
        if (error) return { error: error.message };
        if (inserted) inserted.forEach((s) => embedSource(s.id, s.content).catch(() => {}));
      } else {
        const inserts = chunks.map((chunk, i) => ({
          user_id: user.id,
          type: "note" as const,
          title: `${title.slice(0, 180)} (${i + 1}/${chunks.length})`,
          content: chunk,
        }));
        const { data: inserted, error } = await supabase.from("sources").insert(inserts).select("id, content");
        if (error) return { error: error.message };
        if (inserted) inserted.forEach((s) => embedSource(s.id, s.content).catch(() => {}));
      }

      invalidateCache(`sources:${user.id}`);
      await fetchSources();
      return { error: null };
    },
    [user, fetchSources]
  );

  const addPdf = useCallback(
    async (file: File): Promise<{ error: string | null }> => {
      if (!user) return { error: "Not connected" };

      if (file.size > 10 * 1024 * 1024) {
        return { error: "File must not exceed 10 MB." };
      }

      // 1. Extract text client-side with pdf.js
      let pdfText: string;
      try {
        if (IS_DEV) console.log("[PDF] Upload started:", file.name, `${(file.size / 1024).toFixed(0)}KB`, file.type);
        if (IS_DEV) console.log("[PDF] Step 1: extracting text...");
        const result = await extractTextFromPdf(file);
        pdfText = result.text;
        if (IS_DEV) console.log("[PDF] Step 1 OK:", result.pages, "pages,", pdfText.length, "chars");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[PDF] Extraction failed:", msg);
        return { error: msg.includes("password") ? "This PDF is password-protected." : msg.includes("timeout") ? "PDF took too long. Try a smaller file." : msg.includes("No text") || msg.includes("No extractable") ? "No text found. This PDF may be scanned (image-only)." : `PDF error: ${msg}` };
      }

      if (!pdfText || pdfText.length < 10) {
        return { error: "No extractable text in this PDF." };
      }

      // 2. Upload to Storage (fire-and-forget — don't block on this)
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      supabase.storage
        .from("sources")
        .upload(filePath, file, { contentType: "application/pdf" })
        .then((res) => {
          if (res.error && IS_DEV) console.warn("Storage upload failed:", res.error.message);
        })
        .catch(() => { /* storage not configured — continue */ });

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
        }

        invalidateCache(`sources:${user.id}`);
        return { error: null };
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
        if (inserted) inserted.forEach((s) => embedSource(s.id, s.content).catch(() => {}));
      } else {
        const inserts = chunks.map((chunk, i) => ({
          user_id: user.id, type: "url" as const,
          title: `${title} (${i + 1}/${chunks.length})`, content: chunk,
        }));
        const { data: inserted, error } = await supabase.from("sources").insert(inserts).select("id, content");
        if (error) return { error: error.message };
        if (inserted) inserted.forEach((s) => embedSource(s.id, s.content).catch(() => {}));
      }

      invalidateCache(`sources:${user.id}`);
      await fetchSources();
      return { error: null };
    },
    [user, fetchSources]
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

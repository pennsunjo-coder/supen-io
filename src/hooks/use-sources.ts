import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getCache, setCache, invalidateCache } from "@/lib/cache";
import type { Source } from "@/types/database";

const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

const CHUNK_SIZE = 400; // mots par chunk (cible 300-500)
const CHUNK_OVERLAP = 50; // mots de chevauchement

/**
 * Découpe un texte en chunks de CHUNK_SIZE mots avec CHUNK_OVERLAP mots de chevauchement.
 * Retourne un tableau de strings. Si le texte est court (<= CHUNK_SIZE), retourne [texte].
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
 * Extrait le texte principal d'une page HTML en supprimant
 * les balises script, style, nav, header, footer et publicités.
 */
function extractTextFromHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Supprimer les éléments non-contenu
  const selectorsToRemove = [
    "script", "style", "nav", "header", "footer",
    "iframe", "noscript", "aside",
    "[role='navigation']", "[role='banner']", "[role='contentinfo']",
    ".ad", ".ads", ".advertisement", ".sidebar", ".menu", ".cookie",
  ];
  for (const sel of selectorsToRemove) {
    doc.querySelectorAll(sel).forEach((el) => el.remove());
  }

  // Chercher le contenu principal
  const main = doc.querySelector("article") || doc.querySelector("main") || doc.querySelector("[role='main']") || doc.body;
  const text = (main?.textContent || "")
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, 30000);
}

/**
 * Extrait le texte d'un PDF.
 * Chrome/Firefox : pdf.js côté client (rapide).
 * Safari : Edge Function directement (pas de tentative pdf.js).
 */
async function extractTextFromPdf(file: File): Promise<{ text: string; pages: number }> {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (!isSafari) {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.mjs",
        import.meta.url
      ).toString();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
        disableFontFace: true,
        verbosity: 0,
      }).promise;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const tc = await page.getTextContent({ includeMarkedContent: false });
          fullText += tc.items
            .map((item) => ("str" in item ? (item.str as string) : ""))
            .filter((s) => s.trim().length > 0)
            .join(" ") + "\n";
        } catch { /* skip page */ }
      }

      if (fullText.trim().length > 20) {
        console.log("🟢 PDF.js:", pdf.numPages, "pages");
        return { text: fullText.trim(), pages: pdf.numPages };
      }
    } catch (err) {
      console.warn("🟡 PDF.js failed:", err);
    }
  }

  // Safari ou fallback : Edge Function
  console.log("🔵 Edge Function (Safari compatible)");
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Accept: "application/json",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Erreur serveur" }));
    throw new Error(err.error || "Edge Function failed");
  }

  const result = await response.json();
  console.log("🟢 Edge Function:", result.pages, "pages");
  return { text: result.text, pages: result.pages };
}

export interface GroupedSource {
  id: string;          // premier chunk ID (pour key)
  ids: string[];       // tous les chunk IDs
  type: "url" | "note" | "pdf";
  title: string;       // nom sans suffixe chunk
  chunkCount: number;
  wordCount: number;
  content: string;     // premier chunk pour preview
  file_path: string | null;
}

/**
 * Groupe les sources par fichier (même PDF = 1 entrée).
 * URLs/Notes avec suffixe (1/3) sont aussi groupées.
 */
function groupSources(sources: Source[]): GroupedSource[] {
  const groups = new Map<string, Source[]>();

  for (const s of sources) {
    // Extraire le titre de base (sans " (1/3)")
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
      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const typed = data as Source[];
        setSources(typed);
        setCache(cacheKey, typed);
      }
    } catch { /* réseau */ }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const addUrl = useCallback(
    async (url: string): Promise<{ error: string | null }> => {
      if (!user) return { error: "Non connecté" };

      let title: string;
      try {
        const parsed = new URL(url);
        const path = parsed.pathname === "/" ? "" : parsed.pathname;
        title = `${parsed.hostname}${path}`.slice(0, 120);
      } catch {
        title = url.slice(0, 120);
      }

      // Fetch le contenu de la page
      let pageContent = "";
      try {
        const response = await fetch(url, {
          headers: { "Accept": "text/html" },
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok) {
          const html = await response.text();
          pageContent = extractTextFromHtml(html);

          // Extraire un meilleur titre depuis la page
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch?.[1]) {
            title = titleMatch[1].trim().slice(0, 120);
          }
        }
      } catch {
        // Si le fetch échoue (CORS, timeout…), on stocke juste l'URL
        pageContent = url;
      }

      const finalContent = pageContent || url;
      const chunks = chunkText(finalContent);

      if (chunks.length === 1) {
        const { error } = await supabase.from("sources").insert({
          user_id: user.id,
          type: "url",
          title,
          content: chunks[0],
        });
        if (error) return { error: error.message };
      } else {
        const inserts = chunks.map((chunk, i) => ({
          user_id: user.id,
          type: "url" as const,
          title: `${title} (${i + 1}/${chunks.length})`,
          content: chunk,
        }));
        const { error } = await supabase.from("sources").insert(inserts);
        if (error) return { error: error.message };
      }

      await fetchSources();
      return { error: null };
    },
    [user, fetchSources]
  );

  const addNote = useCallback(
    async (title: string, content: string): Promise<{ error: string | null }> => {
      if (!user) return { error: "Non connecté" };

      const chunks = chunkText(content);

      if (chunks.length === 1) {
        const { error } = await supabase.from("sources").insert({
          user_id: user.id,
          type: "note",
          title: title.slice(0, 200),
          content: chunks[0],
        });
        if (error) return { error: error.message };
      } else {
        const inserts = chunks.map((chunk, i) => ({
          user_id: user.id,
          type: "note" as const,
          title: `${title.slice(0, 180)} (${i + 1}/${chunks.length})`,
          content: chunk,
        }));
        const { error } = await supabase.from("sources").insert(inserts);
        if (error) return { error: error.message };
      }

      await fetchSources();
      return { error: null };
    },
    [user, fetchSources]
  );

  const addPdf = useCallback(
    async (file: File): Promise<{ error: string | null }> => {
      if (!user) return { error: "Non connecté" };

      if (file.size > 10 * 1024 * 1024) {
        return { error: "Le fichier ne doit pas dépasser 10 Mo." };
      }

      // 1. Extraire le texte côté client avec pdf.js
      let pdfText: string;
      let pageCount: number;
      try {
        console.log("🔵 PDF: extracting text from", file.name, `(${(file.size / 1024).toFixed(0)}KB)`);
        const result = await extractTextFromPdf(file);
        pdfText = result.text;
        pageCount = result.pages;
        console.log("🟢 PDF: extracted", pageCount, "pages,", pdfText.split(/\s+/).length, "words");
      } catch (err) {
        console.error("🔴 PDF extraction failed:", err);
        return { error: "Impossible de lire ce PDF. Le fichier est peut-être protégé ou corrompu." };
      }

      if (!pdfText || pdfText.length < 10) {
        return { error: "Aucun texte extractible dans ce PDF." };
      }

      // 2. Uploader dans Storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      try {
        const { error: uploadError } = await supabase.storage
          .from("sources")
          .upload(filePath, file, { contentType: "application/pdf" });

        if (uploadError) {
          console.warn("Storage upload failed:", uploadError.message);
          // On continue même si le storage échoue — le texte est extrait
        }
      } catch {
        // Storage pas configuré — on continue avec le texte
      }

      // 3. Découper en chunks et insérer
      const title = file.name.replace(/\.pdf$/i, "");
      const chunks = chunkText(pdfText);
      invalidateCache(`sources:${user.id}`);

      if (chunks.length === 1) {
        const { error } = await supabase.from("sources").insert({
          user_id: user.id,
          type: "pdf",
          title,
          content: chunks[0],
          file_path: filePath,
        });
        if (error) return { error: error.message };
      } else {
        const inserts = chunks.map((chunk, i) => ({
          user_id: user.id,
          type: "pdf" as const,
          title: `${title} (${i + 1}/${chunks.length})`,
          content: chunk,
          file_path: i === 0 ? filePath : null,
        }));
        const { error } = await supabase.from("sources").insert(inserts);
        if (error) return { error: error.message };
      }

      console.log(`🟢 PDF "${title}": ${pageCount} pages, ${chunks.length} chunks, ${pdfText.split(/\s+/).length} mots — saved to sources`);
      await fetchSources();
      return { error: null };
    },
    [user, fetchSources]
  );

  const searchWeb = useCallback(
    async (query: string): Promise<{ error: string | null }> => {
      if (!user) return { error: "Non connecté" };

      if (!TAVILY_API_KEY || TAVILY_API_KEY === "your-tavily-api-key") {
        return { error: "Clé API Tavily non configurée dans .env" };
      }

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query,
          max_results: 3,
          include_answer: true,
        }),
      });

      if (!response.ok) {
        return { error: `Erreur Tavily : ${response.status}` };
      }

      const data = await response.json();

      let content = "";
      if (data.answer) {
        content += `${data.answer}\n\n`;
      }
      if (data.results) {
        for (const result of data.results) {
          content += `— ${result.title}\n${result.url}\n${result.content?.slice(0, 500) ?? ""}\n\n`;
        }
      }

      const { error } = await supabase.from("sources").insert({
        user_id: user.id,
        type: "url",
        title: `Recherche : ${query.slice(0, 100)}`,
        content: content.trim(),
      });

      if (error) return { error: error.message };
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

  const grouped = groupSources(sources);

  return { sources, grouped, loading, addUrl, addNote, addPdf, searchWeb, removeSource, removeGrouped };
}

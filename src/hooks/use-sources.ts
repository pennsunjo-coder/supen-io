import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Source } from "@/types/database";

const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

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

export function useSources() {
  const { user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSources = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("sources")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSources(data as Source[]);
    }
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

      const { error } = await supabase.from("sources").insert({
        user_id: user.id,
        type: "url",
        title,
        content: pageContent || url,
      });

      if (error) return { error: error.message };
      await fetchSources();
      return { error: null };
    },
    [user, fetchSources]
  );

  const addNote = useCallback(
    async (title: string, content: string): Promise<{ error: string | null }> => {
      if (!user) return { error: "Non connecté" };

      const { error } = await supabase.from("sources").insert({
        user_id: user.id,
        type: "note",
        title: title.slice(0, 200),
        content,
      });

      if (error) return { error: error.message };
      await fetchSources();
      return { error: null };
    },
    [user, fetchSources]
  );

  const addPdf = useCallback(
    async (file: File): Promise<{ error: string | null }> => {
      if (!user) return { error: "Non connecté" };

      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("sources")
        .upload(filePath, file, { contentType: "application/pdf" });

      if (uploadError) return { error: uploadError.message };

      const { data: insertData, error: insertError } = await supabase
        .from("sources")
        .insert({
          user_id: user.id,
          type: "pdf",
          title: file.name.replace(/\.pdf$/i, ""),
          content: "",
          file_path: filePath,
        })
        .select("id")
        .single();

      if (insertError) return { error: insertError.message };

      // Appeler la Edge Function pour extraire le texte du PDF
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token && insertData?.id) {
          await supabase.functions.invoke("extract-pdf", {
            body: { file_path: filePath, source_id: insertData.id },
          });
        }
      } catch {
        // Si l'extraction échoue, la source reste avec content vide
      }

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
      setSources((prev) => prev.filter((s) => s.id !== source.id));
      return { error: null };
    },
    []
  );

  return { sources, loading, addUrl, addNote, addPdf, searchWeb, removeSource };
}

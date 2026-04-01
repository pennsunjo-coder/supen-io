import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Source } from "@/types/database";

const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

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

      const { error } = await supabase.from("sources").insert({
        user_id: user.id,
        type: "url",
        title,
        content: url,
      });

      if (error) return { error: error.message };
      await fetchSources();
      return { error: null };
    },
    [user, fetchSources]
  );

  const addNote = useCallback(
    async (
      title: string,
      content: string
    ): Promise<{ error: string | null }> => {
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

      const { error: insertError } = await supabase.from("sources").insert({
        user_id: user.id,
        type: "pdf",
        title: file.name.replace(/\.pdf$/i, ""),
        content: "",
        file_path: filePath,
      });

      if (insertError) return { error: insertError.message };
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

      // Construire le contenu à partir des résultats
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

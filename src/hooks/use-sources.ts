import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Source } from "@/types/database";

export function useSources() {
  const { user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSources = useCallback(async () => {
    if (!user) return;
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

      // Extraire un titre lisible depuis l'URL
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

  const removeSource = useCallback(
    async (source: Source): Promise<{ error: string | null }> => {
      // Supprimer le fichier du storage si c'est un PDF
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

  return { sources, loading, addUrl, addNote, addPdf, removeSource };
}

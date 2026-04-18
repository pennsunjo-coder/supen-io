import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface ContentVariation {
  id: string;
  content: string;
  format: string;
  platform: string;
  viral_score: number;
  image_prompt: string | null;
  infographic_html: string | null;
  infographic_base64: string | null;
  infographic_mode: string | null;
  session_id: string | null;
  created_at: string;
}

export interface ContentSessionInfo {
  id: string;
  topic: string;
  platform: string;
  format: string;
  created_at: string;
}

export function useContentDetail(sessionId: string | undefined) {
  const [session, setSession] = useState<ContentSessionInfo | null>(null);
  const [variations, setVariations] = useState<ContentVariation[]>([]);
  const [infographic, setInfographic] = useState<ContentVariation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }

    async function fetchData() {
      setLoading(true);

      // Fetch session metadata (best-effort)
      const { data: sessionData } = await supabase
        .from("content_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionData) {
        setSession(sessionData as ContentSessionInfo);
      }

      // Fetch all content rows for this session
      const { data } = await supabase
        .from("generated_content")
        .select("id, content, format, platform, viral_score, image_prompt, infographic_html, infographic_base64, infographic_mode, session_id, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (data) {
        const typed = data as ContentVariation[];
        const infographicRow = typed.find((d) => d.format === "Infographic");
        const posts = typed.filter((d) => d.format !== "Infographic");

        // Also check if any post variation has an infographic attached
        const postWithInfographic = posts.find((d) => d.infographic_base64 || d.infographic_html);

        setVariations(posts);
        setInfographic(infographicRow || postWithInfographic || null);
      }

      setLoading(false);
    }

    fetchData();
  }, [sessionId]);

  return { session, variations, infographic, loading };
}

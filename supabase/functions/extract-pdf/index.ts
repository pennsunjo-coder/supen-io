import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import pdfParse from "npm:pdf-parse@1.1.1";

const CHUNK_WORD_LIMIT = 500;

function chunkText(text: string, maxWords: number): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
  }
  return chunks;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { file_path, source_id } = await req.json();

    if (!file_path || !source_id) {
      return new Response(
        JSON.stringify({ error: "file_path et source_id requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Créer un client Supabase avec le token de l'utilisateur
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } },
    );

    // Obtenir l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Non authentifié" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // Télécharger le PDF depuis Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("sources")
      .download(file_path);

    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({ error: `Échec du téléchargement : ${downloadError?.message}` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Extraire le texte avec pdf-parse
    const buffer = await fileData.arrayBuffer();
    const pdf = await pdfParse(Buffer.from(buffer));
    const fullText = pdf.text.trim();

    if (!fullText) {
      // Mettre à jour la source avec un message vide
      await supabase
        .from("sources")
        .update({ content: "(PDF sans texte extractible)" })
        .eq("id", source_id);

      return new Response(
        JSON.stringify({ chunks: 0, message: "Aucun texte extrait du PDF" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Découper en chunks de 500 mots
    const chunks = chunkText(fullText, CHUNK_WORD_LIMIT);

    // Mettre à jour la source principale avec le texte complet (tronqué à 50000 chars)
    await supabase
      .from("sources")
      .update({ content: fullText.slice(0, 50000) })
      .eq("id", source_id);

    // Si plus d'un chunk, insérer les chunks supplémentaires comme sources séparées
    if (chunks.length > 1) {
      const { data: sourceData } = await supabase
        .from("sources")
        .select("title")
        .eq("id", source_id)
        .single();

      const baseTitle = sourceData?.title || "PDF";

      const extraChunks = chunks.slice(1).map((chunk, i) => ({
        user_id: user.id,
        type: "pdf" as const,
        title: `${baseTitle} (partie ${i + 2}/${chunks.length})`,
        content: chunk,
        file_path: null,
      }));

      await supabase.from("sources").insert(extraChunks);
    }

    return new Response(
      JSON.stringify({ chunks: chunks.length, message: `${chunks.length} chunk(s) extrait(s)` }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erreur interne" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

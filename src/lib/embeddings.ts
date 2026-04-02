import { supabase } from "@/lib/supabase";

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3";

interface VoyageEmbeddingResponse {
  data: Array<{ embedding: number[] }>;
  usage: { total_tokens: number };
}

/**
 * Génère un embedding via Voyage AI.
 * Utilise la clé VITE_VOYAGEAI_API_KEY.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = import.meta.env.VITE_VOYAGEAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "La variable VITE_VOYAGEAI_API_KEY doit être définie dans le fichier .env"
    );
  }

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: [text],
      model: VOYAGE_MODEL,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Voyage AI erreur ${response.status}: ${body}`);
  }

  const result: VoyageEmbeddingResponse = await response.json();
  return result.data[0].embedding;
}

export interface ViralReference {
  id: string;
  content: string;
  platform: string;
  format: string;
  similarity: number;
}

/**
 * Recherche les modèles viraux les plus similaires au texte donné.
 * Génère l'embedding du texte, puis appelle la fonction Supabase
 * match_viral_references pour trouver les K plus proches voisins.
 */
export async function searchViralReferences(
  text: string,
  platform?: string,
  format?: string,
  matchCount: number = 3
): Promise<ViralReference[]> {
  const embedding = await generateEmbedding(text);

  const { data, error } = await supabase.rpc("match_viral_references", {
    query_embedding: embedding,
    match_count: matchCount,
    filter_platform: platform ?? null,
    filter_format: format ?? null,
  });

  if (error) {
    throw new Error(`Erreur recherche RAG : ${error.message}`);
  }

  return (data as ViralReference[]) ?? [];
}

/**
 * Generate an illustration image for a social media post using Gemini Flash Image.
 * Called from StudioWizard when user clicks the "Image" button on a variation.
 * Uses the same VITE_GEMINI_API_KEY already exposed client-side for infographics.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ─── Public API ───

export async function generateContentImage(
  content: string,
  platform: string,
  niche?: string,
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt = buildImagePrompt(content, platform, niche);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000); // 2 min

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
            responseMimeType: "image/jpeg",
          },
        }),
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn("[image-generator] Gemini HTTP", response.status);
      return null;
    }

    const data = await response.json();
    const base64 = data.candidates?.[0]?.content?.parts
      ?.find((p: { inlineData?: { data: string } }) => p.inlineData)
      ?.inlineData?.data;

    return base64 || null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("[image-generator] Error:", err);
    return null;
  }
}

// ─── Prompt builder ───

function buildImagePrompt(content: string, platform: string, niche?: string): string {
  const keywords = extractKeywords(content);
  const topic = keywords.slice(0, 5).join(", ");

  return `Crée une illustration professionnelle et moderne pour un post ${platform}.
${niche ? `Niche / domaine : ${niche}.` : ""}

STYLE : Flat design professionnel, couleurs pastels harmonieuses,
style "SaaS / Tech Premium", fond blanc cassé (#FDFDF9).

SUJET : ${topic}

CONTEXTE DU POST :
${content.slice(0, 400)}

RÈGLES VISUELLES :
- Format carré 1:1
- Style vectoriel plat, pas de photographie réaliste
- Palette : tons pastels professionnels (bleu, vert, orange, violet)
- Texte minimal ou absent (l'image doit parler d'elle-même)
- Icônes et formes géométriques épurées
- Ambiance : professionnel, moderne, inspirant
- Pas de personnages complexes, pas de clipart
- Fond : blanc cassé ou gradient très subtil

QUALITÉ : Haute résolution, rendu vectoriel propre,
adapté aux réseaux sociaux professionnels.`;
}

// ─── Keyword extraction ───

const STOP_WORDS = new Set([
  "le", "la", "les", "de", "du", "des", "un", "une",
  "et", "ou", "mais", "donc", "car",
  "je", "tu", "il", "elle", "nous", "vous", "ils",
  "que", "qui", "quoi", "dont", "ce", "se",
  "est", "sont", "être", "avoir", "faire", "aller",
  "pas", "plus", "très", "bien", "aussi", "comme",
  "pour", "par", "sur", "dans", "avec", "sans",
  "tout", "tous", "toute", "toutes", "mon", "ton", "son",
]);

function extractKeywords(content: string): string[] {
  return content
    .toLowerCase()
    .replace(/[^a-zA-ZÀ-ÿ\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !STOP_WORDS.has(w))
    .slice(0, 10);
}

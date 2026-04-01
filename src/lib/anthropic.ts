import Anthropic from "@anthropic-ai/sdk";

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error(
    "La variable VITE_ANTHROPIC_API_KEY doit être définie dans le fichier .env"
  );
}

export const anthropic = new Anthropic({
  apiKey,
  dangerouslyAllowBrowser: true,
});

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

export const SYSTEM_PROMPT = `Tu es un assistant IA intégré à Supen.io, une plateforme de création de contenu pour les réseaux sociaux. Tu aides les créateurs à analyser leurs sources de recherche (PDFs, URLs, vidéos YouTube, notes) et à générer des idées et du contenu.

Règles :
- Réponds toujours en français.
- Sois concis, pertinent et actionnable.
- Quand on te demande de générer du contenu, adapte le ton et le format à la plateforme cible (LinkedIn, X, Instagram, etc.).
- Si tu n'as pas assez de contexte, pose des questions pour clarifier.`;

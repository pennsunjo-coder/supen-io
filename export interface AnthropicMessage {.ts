export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export class AnthropicService {
  private apiKey: string;
  private baseUrl = "https://api.anthropic.com/v1";

  constructor() {
    this.apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!this.apiKey) {
      console.warn("VITE_ANTHROPIC_API_KEY n'est pas défini");
    }
  }

  async sendMessage(messages: AnthropicMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Clé API Anthropic manquante. Configurez VITE_ANTHROPIC_API_KEY dans .env");
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 2000,
          messages: messages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erreur Anthropic: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.content[0]?.text || "";
    } catch (error) {
      console.error("Erreur lors de l'appel à Anthropic:", error);
      throw error;
    }
  }

  async generateContent(
    topic: string,
    platform: string,
    format: string,
    sources?: string[]
  ): Promise<string> {
    let context = "";
    if (sources && sources.length > 0) {
      context = `\n\nSources disponibles:\n${sources.join("\n\n")}\n\n`;
    }

    const prompt = `${context}Génère un contenu pour ${platform} au format ${format} sur le sujet : "${topic}".

Instructions:
- Adopte un ton naturel et humain
- Sois concis et percutant
- Adapte le style à la plateforme ${platform}
- Inclus des emojis appropriés si pertinent
- Évite le jargon technique
- Sois engageant et original

Format demandé: ${format}
Plateforme: ${platform}`;

    const messages: AnthropicMessage[] = [
      {
        role: "user",
        content: prompt,
      },
    ];

    return this.sendMessage(messages);
  }
}

export const anthropicService = new AnthropicService();
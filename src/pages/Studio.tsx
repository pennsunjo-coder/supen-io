import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Wand2, ArrowRight, Sparkles, Copy, Check,
  RefreshCw, ChevronLeft, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { sanitizeInput } from "@/lib/security";
import { searchViralReferences, ViralReference } from "@/lib/embeddings";

const PlatformX = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const PlatformInstagram = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const PlatformLinkedIn = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);
const PlatformYouTube = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const PlatformFacebook = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const PlatformTikTok = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
);

interface Platform {
  name: string;
  icon: React.FC;
  formats: string[];
  gradient: string;
}

const platforms: Platform[] = [
  { name: "X (Twitter)", icon: PlatformX, formats: ["Tweet", "Thread (5-10 posts)"], gradient: "from-[hsl(200,10%,20%)] to-[hsl(200,10%,12%)]" },
  { name: "LinkedIn", icon: PlatformLinkedIn, formats: ["Post professionnel", "Article"], gradient: "from-[hsl(210,60%,18%)] to-[hsl(210,50%,10%)]" },
  { name: "Instagram", icon: PlatformInstagram, formats: ["Légende post", "Carousel"], gradient: "from-[hsl(330,40%,18%)] to-[hsl(280,30%,12%)]" },
  { name: "YouTube", icon: PlatformYouTube, formats: ["Script long", "Script Shorts"], gradient: "from-[hsl(0,40%,18%)] to-[hsl(0,30%,10%)]" },
  { name: "Facebook", icon: PlatformFacebook, formats: ["Post", "Story text"], gradient: "from-[hsl(220,50%,18%)] to-[hsl(220,40%,10%)]" },
  { name: "TikTok", icon: PlatformTikTok, formats: ["Légende", "Script voix-off"], gradient: "from-[hsl(340,40%,18%)] to-[hsl(170,30%,10%)]" },
];

const Studio = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedFormat || !selectedPlatform) return;

    const sanitizedTopic = sanitizeInput(topic, 2000);
    if (!sanitizedTopic) return;

    setIsGenerating(true);
    setGeneratedContent("");
    setError(null);

    try {
      // RAG : chercher les modèles viraux similaires
      let viralContext = "";
      try {
        const viralRefs: ViralReference[] = await searchViralReferences(
          sanitizedTopic,
          selectedPlatform.name,
          selectedFormat,
          3
        );
        if (viralRefs.length > 0) {
          viralContext = "\n\nVoici des modèles de contenus viraux similaires pour t'inspirer du ton, de la structure et du style (ne copie pas, inspire-toi) :\n" +
            viralRefs.map((ref, i) => `--- Modèle ${i + 1} (score: ${(ref.similarity * 100).toFixed(0)}%) ---\n${ref.content}`).join("\n\n");
        }
      } catch {
        // Si le RAG échoue (pas de clé Voyage, table vide…), on continue sans
      }

      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: `Tu es un expert en création de contenu pour les réseaux sociaux. Tu génères du contenu prêt à publier, engageant et optimisé pour chaque plateforme. Réponds uniquement avec le contenu généré, sans explication ni commentaire autour.${viralContext}`,
        messages: [
          {
            role: "user",
            content: `Génère un contenu de type "${selectedFormat}" pour la plateforme "${selectedPlatform.name}" sur le sujet suivant :\n\n${sanitizedTopic}`,
          },
        ],
      });

      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");

      setGeneratedContent(text);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur inconnue";
      setError(`Erreur de génération : ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            {!selectedPlatform ? (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Wand2 className="w-4 h-4 text-primary" />
                    </div>
                    <h1 className="text-xl font-bold">Content Studio</h1>
                  </div>
                  <p className="text-sm text-muted-foreground ml-12">
                    Choisis une plateforme pour générer du contenu à partir de tes sources.
                  </p>
                </div>

                {/* Platform grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.name}
                      onClick={() => setSelectedPlatform(platform)}
                      className={cn(
                        "group relative rounded-xl border border-border/30 bg-gradient-to-br p-5 text-left transition-all hover:border-primary/30 hover:scale-[1.02] active:scale-[0.98]",
                        platform.gradient
                      )}
                    >
                      <div className="mb-4 text-foreground/80 group-hover:text-foreground transition-colors">
                        <platform.icon />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-1.5">{platform.name}</h3>
                      <div className="flex flex-wrap gap-1">
                        {platform.formats.map((f) => (
                          <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/5 text-muted-foreground">
                            {f}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Multi-platform CTA */}
                <div className="mt-6 p-4 rounded-xl border border-dashed border-primary/20 bg-primary/5 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold">Multi-plateforme</h3>
                    <p className="text-xs text-muted-foreground">Transforme 1 source en 6 posts prêts à publier</p>
                  </div>
                  <Button size="sm" className="shrink-0 glow-sm text-xs">
                    Lancer <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Back + header */}
                <div className="mb-6">
                  <button
                    onClick={() => {
                      setSelectedPlatform(null);
                      setSelectedFormat(null);
                      setGeneratedContent("");
                      setTopic("");
                    }}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Retour
                  </button>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center", selectedPlatform.gradient)}>
                      <selectedPlatform.icon />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold">{selectedPlatform.name}</h1>
                      <p className="text-xs text-muted-foreground">Génère du contenu optimisé pour cette plateforme</p>
                    </div>
                  </div>
                </div>

                {/* Format select */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Format</label>
                  <div className="flex gap-2">
                    {selectedPlatform.formats.map((f) => (
                      <button
                        key={f}
                        onClick={() => setSelectedFormat(f)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                          selectedFormat === f
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/40"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic input */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Sujet ou instructions</label>
                  <Textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: Les 3 erreurs que font les créateurs de contenu débutants..."
                    maxLength={2000}
                    className="bg-accent/30 border-border/30 min-h-[100px] resize-none focus:ring-primary/30 text-sm"
                  />
                </div>

                {/* Generate button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedFormat || !topic.trim() || isGenerating}
                  className="w-full h-11 glow-sm gap-2 font-semibold"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Générer le contenu
                    </>
                  )}
                </Button>

                {/* Error */}
                {error && (
                  <div className="mt-4 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                    {error}
                  </div>
                )}

                {/* Output */}
                {generatedContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Résultat</span>
                      <div className="flex gap-1.5">
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground" onClick={handleGenerate}>
                          <RefreshCw className="w-3 h-3" /> Regénérer
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground" onClick={handleCopy}>
                          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied ? "Copié" : "Copier"}
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/30 bg-card p-5">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                        {generatedContent}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-accent/50 overflow-hidden">
                        <div className="h-full w-[85%] rounded-full bg-emerald-500/60" />
                      </div>
                      <span className="text-[10px] text-muted-foreground">Score humain : 85%</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Studio;

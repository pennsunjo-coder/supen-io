import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  X, LayoutGrid, ImagePlus, RefreshCw, Download, Sparkles, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const TYPES = [
  { id: "infographic", label: "Infographie pédagogique", desc: "Style sketchnote, parfait pour LinkedIn et Facebook", icon: LayoutGrid, recommended: true },
  { id: "visual", label: "Post visuel", desc: "Design moderne et épuré pour Instagram et TikTok", icon: ImagePlus, recommended: false },
];

const STYLES = [
  { id: "sketchnote", label: "Sketchnote", desc: "Fond blanc, couleurs vives", colors: ["#FFF", "#FF6B6B", "#4ECDC4", "#2C3E50"] },
  { id: "modern", label: "Moderne", desc: "Fond sombre, accents cyan", colors: ["#0F172A", "#249D8B", "#1E293B", "#F1F5F9"] },
  { id: "colorful", label: "Coloré", desc: "Énergique et contrasté", colors: ["#6366F1", "#EC4899", "#F59E0B", "#FFF"] },
];

interface Props {
  open: boolean;
  onClose: () => void;
  content: string;
  platform: string;
}

type ResultMode = "gemini" | "claude" | null;

export default function InfographicModal({ open, onClose, content, platform }: Props) {
  const [step, setStep] = useState<"type" | "style" | "result">("type");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultMode, setResultMode] = useState<ResultMode>(null);
  const [imageBase64, setImageBase64] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function handleSelectType(id: string) {
    setSelectedType(id);
    setStep("style");
  }

  function handleSelectStyle(id: string) {
    setSelectedStyle(id);
    handleGenerate(id);
  }

  function buildGeminiPrompt(styleId: string): string {
    const styleLabel = STYLES.find((x) => x.id === styleId)?.label || "Moderne";
    const extra = customPrompt ? `\n\nAdditional instructions: ${customPrompt}` : "";

    return `Create a professional infographic in the style of a handwritten sketchnote/whiteboard.
Style: ${styleLabel}
Platform: ${platform}
Content to visualize:
${content.slice(0, 2000)}

Requirements:
- White/cream background
- Bold title at top
- Numbered sections with circle numbers
- Hand-drawn style icons
- Red/orange accent colors for key stats
- Black handwriting-style font
- 'Follow @author for more | Repost 🔄' at bottom
- Square format 1080x1080${extra}`;
  }

  async function generateWithGemini(styleId: string): Promise<string | null> {
    if (!GEMINI_API_KEY) return null;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: buildGeminiPrompt(styleId) }],
            }],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
              responseMimeType: "image/png",
            },
          }),
        },
      );

      if (!response.ok) return null;

      const data = await response.json();
      const base64 = data.candidates?.[0]?.content?.parts
        ?.find((p: { inlineData?: { data: string } }) => p.inlineData)
        ?.inlineData?.data;

      return base64 || null;
    } catch {
      return null;
    }
  }

  async function generateWithClaude(styleId: string): Promise<string> {
    const styleLabel = STYLES.find((x) => x.id === styleId)?.label || "Moderne";
    const extra = customPrompt ? `\n\nInstructions supplémentaires : ${customPrompt}` : "";

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: `Tu es un expert en design d'infographies pour les réseaux sociaux. Génère du HTML/CSS COMPLET et autonome pour une infographie 1080x1080px.

RÈGLES :
- Un seul fichier HTML auto-suffisant avec <style> inline
- Google Fonts : Poppins + Inter via <link>
- Palette 3-4 couleurs max
- Style : ${styleLabel}
- Format : div de 1080x1080px avec overflow hidden
- Sections numérotées avec cercles ou badges colorés
- Titres en gros, corps lisible (16px min)
- CTA en bas
- UNIQUEMENT le code HTML complet. Pas de markdown, pas d'explication.

Plateforme cible : ${platform}${extra}`,
      messages: [{ role: "user", content: `Transforme ce contenu en infographie :\n\n${content.slice(0, 2000)}` }],
    });

    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
      || text.match(/<html[\s\S]*<\/html>/i)
      || text.match(/<div[\s\S]*<\/div>/);
    return htmlMatch ? htmlMatch[0] : text;
  }

  async function handleGenerate(style?: string) {
    const s = style || selectedStyle;
    setGenerating(true);
    setStep("result");
    setImageBase64("");
    setHtmlCode("");
    setResultMode(null);

    try {
      // 1) Gemini Flash Image
      const base64 = await generateWithGemini(s);
      if (base64) {
        setImageBase64(base64);
        setResultMode("gemini");
        setGenerating(false);
        return;
      }

      // 2) Fallback Claude HTML/CSS
      const html = await generateWithClaude(s);
      setHtmlCode(html);
      setResultMode("claude");
    } catch {
      setHtmlCode("<div style='padding:40px;color:#999;font-family:sans-serif;text-align:center'>Erreur de génération. Réessaie.</div>");
      setResultMode("claude");
    }
    setGenerating(false);
  }

  async function handleDownload() {
    if (resultMode === "gemini" && imageBase64) {
      const link = document.createElement("a");
      link.download = `supen-infographic-${Date.now()}.png`;
      link.href = `data:image/png;base64,${imageBase64}`;
      link.click();
      return;
    }

    if (!iframeRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const iframeDoc = iframeRef.current.contentDocument;
      if (!iframeDoc?.body) return;
      const canvas = await html2canvas(iframeDoc.body, { width: 1080, height: 1080, scale: 1 });
      const link = document.createElement("a");
      link.download = `supen-infographic-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      navigator.clipboard.writeText(htmlCode);
      alert("Le téléchargement PNG n'est pas disponible. Le code HTML a été copié.");
    }
  }

  function handleReset() {
    setStep("type");
    setSelectedType("");
    setSelectedStyle("");
    setImageBase64("");
    setHtmlCode("");
    setResultMode(null);
    setCustomPrompt("");
    setShowPrompt(false);
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border/30 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/20">
            <div>
              <h3 className="text-lg font-bold">
                {step === "result" ? "Ton visuel" : "Créer un visuel"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step === "type" && "Choisis le type de visuel"}
                {step === "style" && "Choisis un style"}
                {step === "result" && (
                  <>
                    {platform}
                    {resultMode === "gemini" && <span className="ml-2 text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">Gemini Image</span>}
                    {resultMode === "claude" && <span className="ml-2 text-[9px] bg-orange-500/15 text-orange-400 px-1.5 py-0.5 rounded-full">Claude HTML</span>}
                  </>
                )}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {/* Step: Type */}
            {step === "type" && (
              <div className="grid gap-3">
                {TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectType(t.id)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/30 hover:border-primary/40 hover:bg-primary/[0.03] transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <t.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{t.label}</p>
                        {t.recommended && <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">Recommandé</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step: Style */}
            {step === "style" && (
              <div className="grid gap-3">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStyle(s.id)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/30 hover:border-primary/40 transition-all text-left"
                  >
                    <div className="flex gap-1 shrink-0">
                      {s.colors.map((c, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step: Result */}
            {step === "result" && (
              <div>
                {generating ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary mb-3" />
                    <p className="text-sm text-muted-foreground">Génération du visuel...</p>
                  </div>
                ) : (
                  <>
                    {/* Preview */}
                    <div className="rounded-xl overflow-hidden border border-border/30 bg-white mb-4">
                      {resultMode === "gemini" && imageBase64 ? (
                        <img
                          src={`data:image/png;base64,${imageBase64}`}
                          alt="Infographie générée"
                          className="w-full h-auto"
                        />
                      ) : (
                        <iframe
                          ref={iframeRef}
                          srcDoc={htmlCode}
                          className="w-full"
                          style={{ height: 400, border: "none" }}
                          sandbox="allow-same-origin"
                          title="Infographic preview"
                        />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mb-4">
                      <Button size="sm" className="h-9 gap-2 text-xs" onClick={handleDownload}>
                        <Download className="w-3.5 h-3.5" /> Télécharger PNG
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={() => handleGenerate()}>
                        <RefreshCw className="w-3.5 h-3.5" /> Regénérer
                      </Button>
                      {resultMode === "claude" && (
                        <Button variant="ghost" size="sm" className="h-9 gap-2 text-xs" onClick={() => { navigator.clipboard.writeText(htmlCode); }}>
                          <Check className="w-3.5 h-3.5" /> Copier HTML
                        </Button>
                      )}
                    </div>

                    {/* Custom prompt */}
                    <button onClick={() => setShowPrompt(!showPrompt)} className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
                      {showPrompt ? "Masquer les instructions" : "Modifier les instructions"}
                    </button>
                    {showPrompt && (
                      <div className="space-y-2">
                        <Textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="Ex : utilise du rouge, ajoute un QR code, change le titre..."
                          className="text-xs min-h-[60px] resize-none"
                        />
                        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleGenerate()}>
                          <Sparkles className="w-3 h-3" /> Regénérer avec instructions
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

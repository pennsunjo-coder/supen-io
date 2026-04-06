import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  X, LayoutGrid, ImagePlus, RefreshCw, Download, Sparkles, Check,
  ExternalLink, Save, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { buildInfographicPrompt } from "@/lib/infographic-style";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const TYPES = [
  { id: "infographic", label: "Educational infographic", desc: "Sketchnote style, perfect for LinkedIn and Facebook", icon: LayoutGrid, recommended: true },
  { id: "visual", label: "Visual post", desc: "Modern clean design for Instagram and TikTok", icon: ImagePlus, recommended: false },
];

const STYLES = [
  { id: "sketchnote", label: "Sketchnote", desc: "Warm cream, hand-drawn feel", colors: ["#FFF8F0", "#E53E3E", "#38A169", "#3182CE"] },
  { id: "modern", label: "Modern", desc: "Dark background, cyan accents", colors: ["#0F172A", "#249D8B", "#1E293B", "#F1F5F9"] },
  { id: "colorful", label: "Colorful", desc: "Energetic and contrasting", colors: ["#6366F1", "#EC4899", "#F59E0B", "#FFF"] },
];


interface Props {
  open: boolean;
  onClose: () => void;
  content: string;
  platform: string;
}

type ResultMode = "gemini" | "claude" | null;

export default function InfographicModal({ open, onClose, content, platform }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<"type" | "style" | "result">("type");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultMode, setResultMode] = useState<ResultMode>(null);
  const [imageBase64, setImageBase64] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
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
    const styleLabel = STYLES.find((x) => x.id === styleId)?.label || "Modern";
    const extra = customPrompt ? `\n\nAdditional instructions: ${customPrompt}` : "";

    return `Create a professional infographic in the style of a handwritten sketchnote/whiteboard.
Style: ${styleLabel}
Platform: ${platform}
Content to visualize:
${content.slice(0, 2000)}

Requirements:
- White/cream background (#FFF8F0)
- Bold title at top (52px, heavy weight)
- Wood-colored border frame (#5D3A1A)
- Numbered sections with colored circle numbers (red, blue, green, orange)
- Hand-drawn style icons and large emojis
- Red/orange accent colors for key stats
- Handwriting-style font (Patrick Hand / Caveat style)
- Arrow symbols (→) for sub-points
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

  async function generateWithClaude(): Promise<string> {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: buildInfographicPrompt(content, platform, customPrompt || undefined),
      }],
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
    setSaved(false);

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
      const html = await generateWithClaude();
      setHtmlCode(html);
      setResultMode("claude");
    } catch {
      setHtmlCode("<div style='padding:40px;color:#999;font-family:sans-serif;text-align:center'>Generation error. Please try again.</div>");
      setResultMode("claude");
    }
    setGenerating(false);
  }

  // ─── Download ───

  async function handleDownloadPng() {
    if (resultMode === "gemini" && imageBase64) {
      const link = document.createElement("a");
      link.download = `supen-infographic-${Date.now()}.png`;
      link.href = `data:image/png;base64,${imageBase64}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PNG downloaded!");
      return;
    }

    if (!htmlCode) return;
    setDownloading(true);

    try {
      const container = document.createElement("div");
      container.style.cssText = `
        position: fixed; top: -9999px; left: -9999px;
        width: 1080px; height: 1080px; overflow: hidden; z-index: -1;
      `;
      // Strip <html>/<head>/<body> wrappers — inject only the inner content + styles
      const styleMatch = htmlCode.match(/<style[\s\S]*?<\/style>/i);
      const bodyMatch = htmlCode.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const innerHtml = (styleMatch ? styleMatch[0] : "") + (bodyMatch ? bodyMatch[1] : htmlCode);
      container.innerHTML = innerHtml;

      // Copy body-level styles onto the container
      const bodyStyleMatch = htmlCode.match(/<body[^>]*style="([^"]*)"/i);
      if (bodyStyleMatch) container.style.cssText += bodyStyleMatch[1];
      // Apply key styles from CSS
      container.style.width = "1080px";
      container.style.height = "1080px";
      container.style.overflow = "hidden";
      container.style.fontFamily = "'Patrick Hand', cursive";
      container.style.background = "#FFF8F0";
      container.style.border = "8px solid #5D3A1A";
      container.style.padding = "48px";
      container.style.boxSizing = "border-box";

      document.body.appendChild(container);

      // Wait for fonts to load
      await new Promise(resolve => setTimeout(resolve, 1500));

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(container, {
        width: 1080,
        height: 1080,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FFF8F0",
        logging: false,
      });

      document.body.removeChild(container);

      const link = document.createElement("a");
      link.download = `supen-infographic-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("PNG downloaded! (1080x1080px)");
    } catch (err) {
      console.error("PNG download error:", err);
      handleDownloadHtml();
      toast.info("PNG failed — HTML downloaded instead. Open in browser and screenshot.");
    }

    setDownloading(false);
  }

  function handleDownloadHtml() {
    if (!htmlCode) return;
    const blob = new Blob([htmlCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `supen-infographic-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("HTML file downloaded!");
  }

  function handleOpenNewTab() {
    if (!htmlCode) return;
    const blob = new Blob([htmlCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  // ─── Save to Supabase ───

  async function handleSave() {
    if (!user || saved) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("generated_content").insert({
        user_id: user.id,
        platform,
        format: "Infographic",
        content: resultMode === "gemini"
          ? `[Gemini Image] ${content.slice(0, 200)}`
          : htmlCode.slice(0, 5000),
        viral_score: 85,
        image_prompt: resultMode === "gemini" ? "Gemini generated image" : "HTML infographic",
      });

      if (error) {
        toast.error("Error saving infographic");
        console.warn("Save infographic error:", error.message);
      } else {
        setSaved(true);
        toast.success("Infographic saved to history!");
      }
    } catch {
      toast.error("Network error");
    }

    setSaving(false);
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
    setSaved(false);
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
                {step === "result" ? "Your visual" : "Create a visual"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step === "type" && "Choose the visual type"}
                {step === "style" && "Choose a style"}
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
                        {t.recommended && <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">Recommended</span>}
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
                    <p className="text-sm text-muted-foreground">Generating visual...</p>
                  </div>
                ) : (
                  <>
                    {/* Preview */}
                    <div className="rounded-xl overflow-hidden border border-border/30 bg-white mb-4">
                      {resultMode === "gemini" && imageBase64 ? (
                        <img
                          src={`data:image/png;base64,${imageBase64}`}
                          alt="Generated infographic"
                          className="w-full h-auto"
                        />
                      ) : (
                        <div className="relative w-full" style={{ paddingBottom: "100%" }}>
                          <iframe
                            ref={iframeRef}
                            srcDoc={htmlCode}
                            className="absolute inset-0 w-full h-full"
                            style={{
                              border: "none",
                              transform: "scale(0.45)",
                              transformOrigin: "top left",
                              width: "222%",
                              height: "222%",
                            }}
                            sandbox="allow-same-origin"
                            title="Infographic preview"
                          />
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Button
                        size="sm"
                        className="h-10 gap-2 text-sm font-semibold"
                        onClick={handleDownloadPng}
                        disabled={downloading}
                      >
                        {downloading
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PNG...</>
                          : <><Download className="w-4 h-4" /> Download PNG</>
                        }
                      </Button>

                      {resultMode === "claude" && (
                        <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={handleOpenNewTab}>
                          <ExternalLink className="w-3.5 h-3.5" /> Open in new tab
                        </Button>
                      )}

                      <Button variant="outline" size="sm" className="h-9 gap-2 text-xs" onClick={() => handleGenerate()}>
                        <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                      </Button>

                      <Button
                        variant={saved ? "ghost" : "outline"}
                        size="sm"
                        className={cn("h-9 gap-2 text-xs", saved && "text-green-400")}
                        onClick={handleSave}
                        disabled={saved || saving}
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                         saved ? <Check className="w-3.5 h-3.5" /> :
                         <Save className="w-3.5 h-3.5" />}
                        {saved ? "Saved" : "Save to history"}
                      </Button>
                    </div>


                    {/* Custom prompt */}
                    <button onClick={() => setShowPrompt(!showPrompt)} className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
                      {showPrompt ? "Hide instructions" : "Edit instructions"}
                    </button>
                    {showPrompt && (
                      <div className="space-y-2">
                        <Textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="E.g. use red, add a QR code, change the title..."
                          className="text-xs min-h-[60px] resize-none"
                        />
                        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => handleGenerate()}>
                          <Sparkles className="w-3 h-3" /> Regenerate with instructions
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

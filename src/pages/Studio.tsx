import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Copy, Check, RefreshCw, ChevronLeft,
  FileText, Lightbulb, Hash, ImagePlus, Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { sanitizeInput } from "@/lib/security";
import { searchViralReferences, ViralReference } from "@/lib/embeddings";

/* ─── Icônes plateformes ─── */

const IconX = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const IconLinkedIn = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);
const IconYouTube = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const IconFacebook = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const IconTikTok = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
);

/* ─── Données ─── */

interface Platform {
  id: string;
  name: string;
  icon: React.FC;
  formats: string[];
  gradient: string;
}

const platforms: Platform[] = [
  { id: "instagram", name: "Instagram", icon: IconInstagram, formats: ["Post", "Carrousel", "Reel (script)"], gradient: "from-[hsl(330,50%,22%)] to-[hsl(280,40%,14%)]" },
  { id: "tiktok", name: "TikTok", icon: IconTikTok, formats: ["Caption", "Script vidéo"], gradient: "from-[hsl(340,40%,20%)] to-[hsl(170,35%,12%)]" },
  { id: "linkedin", name: "LinkedIn", icon: IconLinkedIn, formats: ["Post", "Thread"], gradient: "from-[hsl(210,60%,20%)] to-[hsl(210,50%,12%)]" },
  { id: "facebook", name: "Facebook", icon: IconFacebook, formats: ["Post", "Thread"], gradient: "from-[hsl(220,50%,20%)] to-[hsl(220,40%,12%)]" },
  { id: "x", name: "X (Twitter)", icon: IconX, formats: ["Tweet", "Thread"], gradient: "from-[hsl(200,10%,22%)] to-[hsl(200,10%,14%)]" },
  { id: "youtube", name: "YouTube", icon: IconYouTube, formats: ["Script long", "Script Shorts"], gradient: "from-[hsl(0,45%,20%)] to-[hsl(0,35%,12%)]" },
];

type SourceMode = "document" | "idea" | "keyword";

const sourceModes: { id: SourceMode; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "document", label: "J'importe un document", desc: "Colle le texte d'un article, PDF ou page web", icon: FileText },
  { id: "idea", label: "J'ai une idée à développer", desc: "Décris ton idée en quelques phrases", icon: Lightbulb },
  { id: "keyword", label: "Juste un sujet / mot-clé", desc: "Un mot ou une phrase suffit", icon: Hash },
];

const STEP_LABELS = ["Réseau", "Format", "Matière source"];

/* ─── Animations ─── */

const stepVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

/* ─── Composant principal ─── */

const Studio = () => {
  // Wizard
  const [step, setStep] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode | null>(null);
  const [sourceText, setSourceText] = useState("");

  // Génération
  const [variations, setVariations] = useState<string[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  /* ── Navigation ── */

  function goBack() {
    if (variations.length > 0) {
      setVariations([]);
      setSelectedVariation(null);
      return;
    }
    if (step > 0) {
      setStep(step - 1);
      if (step === 1) setSelectedFormat(null);
      if (step === 2) { setSourceMode(null); setSourceText(""); }
    }
  }

  function reset() {
    setStep(0);
    setSelectedPlatform(null);
    setSelectedFormat(null);
    setSourceMode(null);
    setSourceText("");
    setVariations([]);
    setSelectedVariation(null);
    setError(null);
  }

  /* ── Génération (5 variations + RAG) ── */

  async function handleGenerate() {
    if (!selectedPlatform || !selectedFormat || !sourceText.trim()) return;

    const sanitized = sanitizeInput(sourceText, 5000);
    if (!sanitized) return;

    setIsGenerating(true);
    setVariations([]);
    setSelectedVariation(null);
    setError(null);

    try {
      let viralContext = "";
      try {
        const refs: ViralReference[] = await searchViralReferences(
          sanitized,
          selectedPlatform.name,
          selectedFormat,
          3,
        );
        if (refs.length > 0) {
          viralContext =
            "\n\nModèles de contenus viraux pour t'inspirer du ton, de la structure et du style (ne copie pas, inspire-toi) :\n" +
            refs
              .map((r, i) => `--- Modèle ${i + 1} (score: ${(r.similarity * 100).toFixed(0)}%) ---\n${r.content}`)
              .join("\n\n");
        }
      } catch {
        // RAG indisponible, on continue sans
      }

      const modeLabel =
        sourceMode === "document"
          ? "Here is a source document to transform"
          : sourceMode === "idea"
            ? "Here is an idea to develop"
            : "Here is a topic / keyword";

      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 4096,
        messages: [
          { role: "system", content: `You are an expert in viral content creation for social media. You generate ready-to-publish, engaging content optimized for each platform.\n\nRules:\n- Always respond in English.\n- Generate exactly 5 numbered variations (1. 2. 3. 4. 5.), each with a different angle or hook.\n- Separate each variation with a blank line and the number.\n- Direct, human writing. Short sentences.\n- No artificially enthusiastic phrases.\n- Adapt the tone to ${selectedPlatform.name}.\n- Requested format: ${selectedFormat}.${viralContext}` },
          { role: "user", content: `${modeLabel}:\n\n${sanitized}\n\nGenerate 5 "${selectedFormat}" variations for ${selectedPlatform.name}.` },
        ],
      });

      const text = response.choices[0]?.message?.content || "";

      // Parser les 5 variations
      const parsed = text
        .split(/\n\s*(?=\d\.\s)/)
        .map((v) => v.replace(/^\d\.\s*/, "").trim())
        .filter((v) => v.length > 20);

      setVariations(parsed.length > 0 ? parsed : [text]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(`Erreur de génération : ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  }

  /* ── Humaniser ── */

  async function handleHumanize(idx: number) {
    const original = variations[idx];
    if (!original || !selectedPlatform) return;

    setIsHumanizing(true);
    setError(null);

    try {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 2048,
        messages: [
          { role: "system", content: `You are an expert in content rewriting. Your mission: make this text undetectable by AI detectors while keeping the same message.\n\nRules:\n- English only.\n- Use natural, imperfect, human phrasing.\n- Vary sentence length. Add hesitations, casual expressions if appropriate.\n- Keep the format adapted to ${selectedPlatform.name}.\n- Respond only with the rewritten text, nothing else.` },
          { role: "user", content: `Humanize this content:\n\n${original}` },
        ],
      });

      const text = response.choices[0]?.message?.content || "";

      setVariations((prev) => prev.map((v, i) => (i === idx ? text : v)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(`Erreur d'humanisation : ${msg}`);
    } finally {
      setIsHumanizing(false);
    }
  }

  /* ── Copier ── */

  function handleCopy(idx: number) {
    navigator.clipboard.writeText(variations[idx]);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  /* ── Barre de progression ── */

  const progressPercent = variations.length > 0 ? 100 : ((step + 1) / 3) * 100;

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 md:p-8">

          {/* ── Header + Progress ── */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              {step > 0 || variations.length > 0 ? (
                <button
                  onClick={goBack}
                  className="w-8 h-8 rounded-lg border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : null}
              <div className="flex-1">
                <h1 className="text-lg font-bold">Content Studio</h1>
                <p className="text-xs text-muted-foreground">
                  {variations.length > 0
                    ? "Choisis ta variation préférée"
                    : STEP_LABELS[step]
                      ? `Étape ${step + 1}/3 — ${STEP_LABELS[step]}`
                      : ""}
                </p>
              </div>
              {(step > 0 || variations.length > 0) && (
                <button
                  onClick={reset}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Recommencer
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-1 rounded-full bg-accent/30 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              {STEP_LABELS.map((label, i) => (
                <span
                  key={label}
                  className={cn(
                    "text-[10px] transition-colors",
                    i <= step || variations.length > 0
                      ? "text-primary font-medium"
                      : "text-muted-foreground/50",
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Contenu des étapes ── */}
          <AnimatePresence mode="wait">

            {/* ÉTAPE 1 — Choix du réseau */}
            {step === 0 && variations.length === 0 && (
              <motion.div key="step-0" {...stepVariants} transition={{ duration: 0.25 }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {platforms.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPlatform(p); setStep(1); }}
                      className={cn(
                        "group relative rounded-xl border border-border/30 bg-gradient-to-br p-6 text-left transition-all hover:border-primary/40 hover:scale-[1.02] active:scale-[0.98]",
                        p.gradient,
                        selectedPlatform?.id === p.id && "ring-2 ring-primary/50",
                      )}
                    >
                      <div className="mb-3 text-foreground/70 group-hover:text-foreground transition-colors">
                        <p.icon />
                      </div>
                      <h3 className="text-sm font-semibold">{p.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {p.formats.join(" · ")}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ÉTAPE 2 — Choix du format */}
            {step === 1 && variations.length === 0 && selectedPlatform && (
              <motion.div key="step-1" {...stepVariants} transition={{ duration: 0.25 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", selectedPlatform.gradient)}>
                    <selectedPlatform.icon />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">{selectedPlatform.name}</h2>
                    <p className="text-xs text-muted-foreground">Choisis le format de contenu</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedPlatform.formats.map((f) => (
                    <button
                      key={f}
                      onClick={() => { setSelectedFormat(f); setStep(2); }}
                      className={cn(
                        "px-5 py-3 rounded-xl text-sm font-medium transition-all border",
                        selectedFormat === f
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/40 hover:border-border/50",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ÉTAPE 3 — Matière source */}
            {step === 2 && variations.length === 0 && selectedPlatform && selectedFormat && (
              <motion.div key="step-2" {...stepVariants} transition={{ duration: 0.25 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", selectedPlatform.gradient)}>
                    <selectedPlatform.icon />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">{selectedPlatform.name} — {selectedFormat}</h2>
                    <p className="text-xs text-muted-foreground">Quelle est ta matière source ?</p>
                  </div>
                </div>

                {/* Mode selector */}
                <div className="grid gap-2 mb-5">
                  {sourceModes.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setSourceMode(m.id); setSourceText(""); }}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                        sourceMode === m.id
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/30 hover:border-border/50 hover:bg-accent/30",
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        sourceMode === m.id ? "bg-primary/15 text-primary" : "bg-accent/50 text-muted-foreground",
                      )}>
                        <m.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.label}</p>
                        <p className="text-[11px] text-muted-foreground">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Input selon le mode */}
                <AnimatePresence mode="wait">
                  {sourceMode && (
                    <motion.div
                      key={sourceMode}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {sourceMode === "keyword" ? (
                        <Input
                          value={sourceText}
                          onChange={(e) => setSourceText(e.target.value)}
                          placeholder="Ex : productivité, marketing digital, IA..."
                          maxLength={200}
                          className="bg-accent/30 border-border/30 h-11 text-sm focus:ring-primary/30"
                        />
                      ) : (
                        <Textarea
                          value={sourceText}
                          onChange={(e) => setSourceText(e.target.value)}
                          placeholder={
                            sourceMode === "document"
                              ? "Colle ici le texte de ton article, PDF, page web..."
                              : "Décris ton idée, ce que tu veux transmettre..."
                          }
                          maxLength={5000}
                          className="bg-accent/30 border-border/30 min-h-[140px] resize-none text-sm focus:ring-primary/30"
                        />
                      )}

                      {/* Bouton générer */}
                      <Button
                        onClick={handleGenerate}
                        disabled={!sourceText.trim() || isGenerating}
                        className="w-full h-12 mt-4 glow-sm gap-2 font-semibold text-sm"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Génération de 5 variations...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Générer mon contenu
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── Résultats : 5 variations ── */}
            {variations.length > 0 && (
              <motion.div key="results" {...stepVariants} transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-3 mb-6">
                  {selectedPlatform && (
                    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", selectedPlatform.gradient)}>
                      <selectedPlatform.icon />
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-semibold">
                      {variations.length} variation{variations.length > 1 ? "s" : ""} générée{variations.length > 1 ? "s" : ""}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Clique sur une variation pour la sélectionner
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {variations.map((v, idx) => {
                    const isSelected = selectedVariation === idx;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        onClick={() => setSelectedVariation(idx)}
                        className={cn(
                          "rounded-xl border p-5 cursor-pointer transition-all",
                          isSelected
                            ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                            : "border-border/30 bg-card hover:border-border/50",
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            isSelected
                              ? "bg-primary/15 text-primary"
                              : "bg-accent/50 text-muted-foreground",
                          )}>
                            Variation {idx + 1}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] text-primary font-medium">Sélectionnée</span>
                          )}
                        </div>

                        {/* Contenu */}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                          {v}
                        </p>

                        {/* Actions */}
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 mt-4 pt-3 border-t border-border/20"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1.5 border-border/40"
                              onClick={(e) => { e.stopPropagation(); handleCopy(idx); }}
                            >
                              {copiedIdx === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copiedIdx === idx ? "Copié" : "Copier"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1.5 border-border/40"
                              disabled={isHumanizing}
                              onClick={(e) => { e.stopPropagation(); handleHumanize(idx); }}
                            >
                              {isHumanizing ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Wand2 className="w-3 h-3" />
                              )}
                              Humaniser
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1.5 border-border/40"
                              onClick={(e) => { e.stopPropagation(); }}
                            >
                              <ImagePlus className="w-3 h-3" />
                              Créer une image
                            </Button>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Regénérer */}
                <Button
                  variant="ghost"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full mt-4 h-10 text-xs text-muted-foreground gap-2"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
                  Regénérer 5 nouvelles variations
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Erreur ── */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive"
            >
              {error}
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Studio;

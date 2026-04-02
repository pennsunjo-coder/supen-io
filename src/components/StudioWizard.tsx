import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Copy, Check, RefreshCw, ChevronLeft,
  FileText, Lightbulb, Hash, ImagePlus, Wand2,
  Shield, Layers, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { sanitizeInput } from "@/lib/security";
import { searchViralReferences, ViralReference, searchUserSources } from "@/lib/embeddings";
import { supabase } from "@/lib/supabase";
import type { Source } from "@/types/database";
import { StickyNote, Globe as GlobeIcon } from "lucide-react";

/* ─── Icônes plateformes ─── */

const IconX = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const IconInstagram = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const IconLinkedIn = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);
const IconYouTube = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const IconFacebook = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const IconTikTok = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
);

/* ─── Données ─── */

interface Platform {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  formats: string[];
}

const platforms: Platform[] = [
  { id: "instagram", name: "Instagram", icon: IconInstagram, formats: ["Post", "Carrousel", "Reel (script)"] },
  { id: "tiktok", name: "TikTok", icon: IconTikTok, formats: ["Caption", "Script vidéo"] },
  { id: "linkedin", name: "LinkedIn", icon: IconLinkedIn, formats: ["Post", "Thread"] },
  { id: "facebook", name: "Facebook", icon: IconFacebook, formats: ["Post", "Thread"] },
  { id: "x", name: "X (Twitter)", icon: IconX, formats: ["Tweet", "Thread"] },
  { id: "youtube", name: "YouTube", icon: IconYouTube, formats: ["Script long", "Script Shorts"] },
];

type SourceMode = "document" | "idea" | "keyword";

const sourceModes: { id: SourceMode; label: string; placeholder: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "document", label: "Document", placeholder: "Colle le texte de ton article, PDF ou page web...", icon: FileText },
  { id: "idea", label: "Idée", placeholder: "Décris ton idée, ce que tu veux transmettre...", icon: Lightbulb },
  { id: "keyword", label: "Mot-clé", placeholder: "Ex : productivité, IA, marketing digital...", icon: Hash },
];

/* ─── Angles & scores ─── */

const ANGLE_LABELS = ["Éducatif", "Storytelling", "Provocation", "Pratique", "Débat"] as const;
const ANGLE_COLORS: Record<string, string> = {
  "Éducatif": "bg-blue-500/15 text-blue-400",
  "Storytelling": "bg-purple-500/15 text-purple-400",
  "Provocation": "bg-red-500/15 text-red-400",
  "Pratique": "bg-emerald-500/15 text-emerald-400",
  "Débat": "bg-amber-500/15 text-amber-400",
};

function viralScore(text: string, idx: number): number {
  // Score déterministe basé sur longueur + index
  const base = 72 + ((text.length * 7 + idx * 13) % 23);
  return Math.min(base, 94);
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

interface ParsedVariation {
  angle: string;
  content: string;
  words: number;
  score: number;
}

function parseVariations(raw: string): ParsedVariation[] {
  // Split par le séparateur demandé
  let parts = raw.split(/---VARIATION---/).map((s) => s.trim()).filter((s) => s.length > 20);

  // Fallback : split par numérotation si le modèle n'utilise pas le séparateur
  if (parts.length < 2) {
    parts = raw.split(/\n\s*(?=\d\.\s)/).map((v) => v.replace(/^\d\.\s*/, "").trim()).filter((v) => v.length > 20);
  }

  // Fallback ultime : tout comme une seule variation
  if (parts.length === 0) parts = [raw.trim()];

  return parts.map((content, idx) => ({
    angle: ANGLE_LABELS[idx % ANGLE_LABELS.length],
    content,
    words: wordCount(content),
    score: viralScore(content, idx),
  }));
}

/* ─── Composant ─── */

const sourceTypeIcons: Record<string, React.FC<{ className?: string }>> = {
  pdf: FileText,
  url: GlobeIcon,
  note: StickyNote,
};

interface StudioWizardProps {
  activeSourceIds?: string[];
  sources?: Source[];
  onContentGenerated?: (content: string) => void;
}

const StudioWizard = ({ activeSourceIds = [], sources = [], onContentGenerated }: StudioWizardProps) => {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode>("keyword");
  const [sourceText, setSourceText] = useState("");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const [variations, setVariations] = useState<ParsedVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function reset() {
    setStarted(false);
    setStep(0);
    setSelectedPlatform(null);
    setSelectedFormat(null);
    setSourceMode("keyword");
    setSourceText("");
    setSelectedDocumentIds([]);
    setVariations([]);
    setSelectedVariation(null);
    setError(null);
  }

  function toggleDocumentId(id: string) {
    setSelectedDocumentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function goBack() {
    if (variations.length > 0) { setVariations([]); setSelectedVariation(null); return; }
    if (step === 0) { reset(); return; }
    setStep(step - 1);
    if (step === 1) setSelectedFormat(null);
    if (step === 2) setSourceText("");
  }

  /* ── Génération ── */

  async function handleGenerate() {
    const isDocMode = sourceMode === "document" && selectedDocumentIds.length > 0;
    if (!selectedPlatform || !selectedFormat) return;
    if (!isDocMode && !sourceText.trim()) return;

    const sanitized = isDocMode
      ? sources.filter((s) => selectedDocumentIds.includes(s.id)).map((s) => s.title).join(", ")
      : sanitizeInput(sourceText, 5000);
    if (!sanitized) return;

    setIsGenerating(true);
    setVariations([]);
    setSelectedVariation(null);
    setError(null);

    try {
      // === SECTION 2 : Contexte utilisateur (RAG sources) ===
      let userSection = "";
      const ragIds = isDocMode
        ? [...new Set([...selectedDocumentIds, ...activeSourceIds])]
        : activeSourceIds;

      try {
        if (ragIds.length > 0) {
          const userRefs = await searchUserSources(sanitized, ragIds, 8);
          if (userRefs.length > 0) {
            userSection = "\n\n## CONTEXTE UTILISATEUR (sources sélectionnées)\n" +
              userRefs.map((r) => `### [${r.type.toUpperCase()}] ${r.title}\n${r.content}`).join("\n\n");
          }
        }
      } catch { /* Sources indisponibles */ }

      // Si mode document et pas de résultats RAG, injecter directement le contenu des sources sélectionnées
      if (isDocMode && !userSection) {
        const selected = sources.filter((s) => selectedDocumentIds.includes(s.id));
        if (selected.length > 0) {
          userSection = "\n\n## CONTEXTE UTILISATEUR (sources sélectionnées)\n" +
            selected.map((s) => `### [${s.type.toUpperCase()}] ${s.title}\n${s.content.slice(0, 3000)}`).join("\n\n");
        }
      }

      // === SECTION 3 : Modèles viraux (RAG viral) ===
      let viralSection = "";
      try {
        const refs: ViralReference[] = await searchViralReferences(sanitized, selectedPlatform.name, selectedFormat, 3);
        if (refs.length > 0) {
          viralSection = "\n\n## MODÈLES VIRAUX DE RÉFÉRENCE\nInspire-toi du ton, de la structure et du style. Ne copie pas.\n" +
            refs.map((r, i) => `### Modèle ${i + 1}\n${r.content}`).join("\n\n");
        }
      } catch { /* RAG indisponible */ }

      const modeLabel = isDocMode
        ? "Voici des documents sources à transformer en contenu"
        : sourceMode === "idea" ? "Voici une idée à développer" : "Voici un sujet / mot-clé";

      const userMessage = isDocMode
        ? `${modeLabel}. Les sources sélectionnées sont : ${sanitized}. Génère du contenu basé UNIQUEMENT sur ces sources.`
        : `${modeLabel} :\n\n${sanitized}`;

      // === Instruction spéciale mode document ===
      const docInstruction = isDocMode
        ? `\n11. Tu dois baser le contenu UNIQUEMENT sur les sources fournies en SECTION 2. Cite des faits, chiffres et idées qui viennent directement de ces sources. Ne génère PAS d'informations qui ne sont pas dans les sources.`
        : "";

      // === PROMPT STRUCTURÉ ===
      const systemPrompt = `## SECTION 1 — IDENTITÉ
Tu es un expert en création de contenu viral pour les réseaux sociaux. Tu crées du contenu qui génère de l'engagement, des partages et de la croissance organique.${userSection}${viralSection}

## SECTION 4 — INSTRUCTIONS DE GÉNÉRATION
Plateforme : ${selectedPlatform.name}
Format : ${selectedFormat}

Règles strictes :
1. Génère exactement 5 variations DISTINCTES, séparées par le marqueur ---VARIATION--- sur une ligne seule.
2. Chaque variation doit avoir un ANGLE DIFFÉRENT dans cet ordre :
   - Variation 1 : Éducatif (enseigne quelque chose de concret)
   - Variation 2 : Storytelling (raconte une histoire, un vécu)
   - Variation 3 : Provocation (challenge une croyance, opinion contraire)
   - Variation 4 : Pratique (liste actionnable, étapes concrètes)
   - Variation 5 : Débat (pose une question ouverte, invite à commenter)
3. Chaque variation DOIT commencer par un hook ultra fort de max 10 mots. La première ligne accroche ou meurt.
4. Si des sources utilisateur sont fournies, ancre le contenu dans ces sources. Cite des faits, chiffres ou idées qui en viennent.
5. Écriture directe, humaine, niveau CM2. Phrases courtes. Pas de jargon.
6. JAMAIS de formules enthousiastes artificielles ("Parfait !", "Absolument !", "Excellent !").
7. Pas de markdown (pas de gras, pas d'italique, pas de titres) sauf si le format le demande.
8. Adapte le ton et la longueur à ${selectedPlatform.name} + ${selectedFormat}.
9. Réponds UNIQUEMENT avec les 5 variations séparées par ---VARIATION---. Rien d'autre.
10. Réponds toujours en français.${docInstruction}`;

      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const parsed = parseVariations(text);
      setVariations(parsed);

      // Notifier le coach IA
      if (parsed.length > 0 && onContentGenerated) {
        onContentGenerated(parsed[0].content);
      }

      // Sauvegarder dans generated_content
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const allSourceIds = [...new Set([...activeSourceIds, ...selectedDocumentIds])];
          const inserts = parsed.map((v) => ({
            user_id: user.id,
            platform: selectedPlatform.name,
            format: selectedFormat,
            content: v.content,
            source_ids: allSourceIds,
          }));
          await supabase.from("generated_content").insert(inserts);
        }
      } catch { /* Sauvegarde silencieuse */ }
    } catch (err: unknown) {
      setError(`Erreur de génération : ${err instanceof Error ? err.message : "Erreur inconnue"}`);
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
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: `Tu es un expert en réécriture de contenu. Rends ce texte indétectable par les détecteurs d'IA tout en gardant le même message.
Règles : Français uniquement. Tournures naturelles, imparfaites, humaines. Varie la longueur des phrases. Garde le format adapté à ${selectedPlatform.name}. Réponds uniquement avec le texte réécrit.`,
        messages: [{ role: "user", content: `Humanise ce contenu :\n\n${original.content}` }],
      });
      const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      setVariations((prev) => prev.map((v, i) => i === idx ? { ...v, content: text, words: wordCount(text) } : v));
    } catch (err: unknown) {
      setError(`Erreur d'humanisation : ${err instanceof Error ? err.message : "Erreur inconnue"}`);
    } finally {
      setIsHumanizing(false);
    }
  }

  function handleCopy(idx: number) {
    navigator.clipboard.writeText(variations[idx].content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  const breadcrumb = [selectedPlatform?.name, selectedFormat].filter(Boolean).join(" / ");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ═══════ ACCUEIL ═══════ */}
        {!started && variations.length === 0 && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col items-center justify-center px-8">
            <div className="max-w-sm w-full text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-5 h-5 text-primary/80" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1.5">Prêt à créer du contenu viral ?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">Choisis un réseau, décris ton sujet, et laisse l'IA générer 5 variations prêtes à publier.</p>
              <Button onClick={() => setStarted(true)} className="h-12 px-8 text-sm font-semibold glow-sm gap-2.5">
                <Sparkles className="w-4 h-4" /> Créer du contenu
              </Button>
              <div className="flex items-center justify-center gap-6 mt-10">
                <div className="flex items-center gap-1.5 text-muted-foreground/50">
                  <Layers className="w-3.5 h-3.5" /><span className="text-[11px]">5 variations</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground/50">
                  <Shield className="w-3.5 h-3.5" /><span className="text-[11px]">Anti-IA activé</span>
                </div>
                <div className={cn("flex items-center gap-1.5", activeSourceIds.length > 0 ? "text-primary/70" : "text-muted-foreground/50")}>
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{activeSourceIds.length > 0 ? `${activeSourceIds.length} source${activeSourceIds.length > 1 ? "s" : ""} active${activeSourceIds.length > 1 ? "s" : ""}` : "6 plateformes"}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════ WIZARD ═══════ */}
        {started && variations.length === 0 && (
          <motion.div key="wizard" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, ease: "easeOut" }} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 pt-4 pb-3 shrink-0 border-b border-border/10">
              <div className="flex items-center gap-2">
                <button onClick={goBack} className="w-7 h-7 rounded-lg border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground">Nouveau contenu</span>
                    {breadcrumb && (<><span className="text-muted-foreground/30 text-[10px]">/</span><span className="text-[11px] text-muted-foreground truncate">{breadcrumb}</span></>)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (<div key={i} className={cn("h-1 rounded-full transition-all duration-300", i <= step ? "bg-primary w-4" : "bg-accent/40 w-2")} />))}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-lg mx-auto px-5 py-6">
                <AnimatePresence mode="wait">
                  {step === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <p className="text-xs text-muted-foreground mb-3">Choisis le réseau</p>
                      <div className="flex flex-wrap gap-2">
                        {platforms.map((p) => (
                          <button key={p.id} onClick={() => { setSelectedPlatform(p); setStep(1); }} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/40 hover:border-border/50 active:scale-[0.97] transition-all">
                            <p.icon className="w-4 h-4" /><span className="text-xs font-medium">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {step === 1 && selectedPlatform && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <p className="text-xs text-muted-foreground mb-3">Type de contenu</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPlatform.formats.map((f) => (
                          <button key={f} onClick={() => { setSelectedFormat(f); setStep(2); }} className="px-4 py-2 rounded-lg text-xs font-medium border border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/40 hover:border-border/50 active:scale-[0.97] transition-all">{f}</button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {step === 2 && selectedPlatform && selectedFormat && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <p className="text-xs text-muted-foreground mb-3">Ta matière source</p>
                      <div className="flex gap-1 mb-4 p-0.5 rounded-lg bg-accent/20 border border-border/20">
                        {sourceModes.map((m) => (
                          <button key={m.id} onClick={() => { setSourceMode(m.id); setSourceText(""); setSelectedDocumentIds([]); }} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-medium transition-all", sourceMode === m.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                            <m.icon className="w-3 h-3" />{m.label}
                          </button>
                        ))}
                      </div>

                      {/* MODE DOCUMENT — sélection de sources */}
                      {sourceMode === "document" && (
                        <div>
                          {sources.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border/30 p-6 text-center">
                              <FileText className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
                              <p className="text-xs font-medium text-muted-foreground mb-1">Aucun document disponible</p>
                              <p className="text-[11px] text-muted-foreground/60">Ajoute des sources (PDF, URL, Notes) dans ton Notebook pour les utiliser ici.</p>
                            </div>
                          ) : (
                            <>
                              <p className="text-[11px] text-muted-foreground/70 mb-2">
                                Sélectionne les documents à utiliser comme base ({selectedDocumentIds.length} sélectionné{selectedDocumentIds.length > 1 ? "s" : ""})
                              </p>
                              <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                                {sources.map((s) => {
                                  const isChecked = selectedDocumentIds.includes(s.id);
                                  const TypeIcon = sourceTypeIcons[s.type] || StickyNote;
                                  const words = s.content ? s.content.split(/\s+/).length : 0;
                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => toggleDocumentId(s.id)}
                                      className={cn(
                                        "w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all",
                                        isChecked
                                          ? "border-primary/40 bg-primary/5"
                                          : "border-border/20 hover:border-border/40 hover:bg-accent/20",
                                      )}
                                    >
                                      {/* Checkbox */}
                                      <div className={cn(
                                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                        isChecked ? "bg-primary border-primary" : "border-border/40",
                                      )}>
                                        {isChecked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                      </div>
                                      {/* Icon */}
                                      <div className={cn(
                                        "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                                        isChecked ? "bg-primary/15 text-primary" : "bg-accent/50 text-muted-foreground",
                                      )}>
                                        <TypeIcon className="w-3 h-3" />
                                      </div>
                                      {/* Info */}
                                      <div className="flex-1 min-w-0">
                                        <p className={cn("text-xs truncate", isChecked ? "text-foreground font-medium" : "text-muted-foreground")}>{s.title}</p>
                                        <p className="text-[10px] text-muted-foreground/50">
                                          {s.type === "url" ? "Lien" : s.type === "pdf" ? "PDF" : "Note"}
                                          {words > 0 && ` · ${words} mots`}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                              {selectedDocumentIds.length > 0 && (
                                <p className="text-[10px] text-primary/70 mt-2">
                                  L'IA va générer du contenu basé sur ces {selectedDocumentIds.length} document{selectedDocumentIds.length > 1 ? "s" : ""}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* MODE IDÉE — textarea */}
                      {sourceMode === "idea" && (
                        <Textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder={sourceModes.find((m) => m.id === sourceMode)?.placeholder} maxLength={5000} className="bg-accent/20 border-border/30 min-h-[120px] resize-none text-sm" />
                      )}

                      {/* MODE MOT-CLÉ — input */}
                      {sourceMode === "keyword" && (
                        <Input value={sourceText} onChange={(e) => setSourceText(e.target.value)} placeholder={sourceModes.find((m) => m.id === sourceMode)?.placeholder} maxLength={200} className="bg-accent/20 border-border/30 h-11 text-sm" onKeyDown={(e) => e.key === "Enter" && sourceText.trim() && handleGenerate()} />
                      )}

                      <Button
                        onClick={handleGenerate}
                        disabled={
                          (sourceMode === "document" ? selectedDocumentIds.length === 0 : !sourceText.trim()) || isGenerating
                        }
                        className="w-full h-11 mt-4 glow-sm gap-2 font-semibold text-sm"
                      >
                        {isGenerating ? (<><RefreshCw className="w-4 h-4 animate-spin" /> Génération en cours...</>) : (<><Sparkles className="w-4 h-4" /> Générer 5 variations</>)}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════ RÉSULTATS ═══════ */}
        {variations.length > 0 && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 pt-4 pb-3 shrink-0 border-b border-border/10">
              <div className="flex items-center gap-2">
                <button onClick={goBack} className="w-7 h-7 rounded-lg border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1">
                  <span className="text-xs font-semibold">{variations.length} variations</span>
                  <span className="text-[11px] text-muted-foreground ml-2">{breadcrumb}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="max-w-lg mx-auto space-y-3">
                {variations.map((v, idx) => {
                  const isSelected = selectedVariation === idx;
                  const angleColor = ANGLE_COLORS[v.angle] || "bg-accent/40 text-muted-foreground";
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedVariation(isSelected ? null : idx)}
                      className={cn("rounded-xl border p-4 cursor-pointer transition-all", isSelected ? "border-primary/40 bg-primary/[0.03] ring-1 ring-primary/15" : "border-border/20 hover:border-border/40")}
                    >
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", angleColor)}>
                          {v.angle}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 ml-auto">
                          {v.words} mots
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="w-10 h-1.5 rounded-full bg-accent/30 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500/60" style={{ width: `${v.score}%` }} />
                          </div>
                          <span className="text-[10px] text-emerald-400/80 font-medium">{v.score}%</span>
                        </div>
                      </div>

                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-foreground/85">{v.content}</p>

                      {isSelected && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/15">
                          <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1.5 px-2.5 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); handleCopy(idx); }}>
                            {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedIdx === idx ? "Copié" : "Copier"}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1.5 px-2.5 text-muted-foreground hover:text-foreground" disabled={isHumanizing} onClick={(e) => { e.stopPropagation(); handleHumanize(idx); }}>
                            {isHumanizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                            Humaniser
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1.5 px-2.5 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                            <ImagePlus className="w-3 h-3" /> Image
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
                <div className="flex items-center justify-between pt-2">
                  <button onClick={reset} className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors">Recommencer</button>
                  <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating} className="h-7 text-[11px] gap-1.5 text-muted-foreground">
                    <RefreshCw className={cn("w-3 h-3", isGenerating && "animate-spin")} /> Regénérer
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mx-5 mb-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-[11px] text-destructive shrink-0">{error}</div>
      )}
    </div>
  );
};

export default StudioWizard;

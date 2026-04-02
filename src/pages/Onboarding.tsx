import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Zap, Sparkles, Plus,
  Briefcase, Cpu, TrendingUp, Palette, Megaphone,
  Heart, GraduationCap, ShoppingBag, Plane, Music,
  PenTool, Camera, UtensilsCrossed, Home,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";

/* ─── Icônes SVG plateformes ─── */

const IconInstagram = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const IconTikTok = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
);
const IconYouTube = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const IconFacebook = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const IconX = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const IconLinkedIn = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);
const IconThreads = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.711-.108 1.752-.67 3.078-1.636 3.867-1.08.883-2.504 1.262-4.16 1.262-.595 0-1.232-.07-1.898-.21-1.86-.392-3.318-1.357-4.105-2.718-.585-1.01-.89-2.19-.89-3.455 0-1.742.56-3.196 1.62-4.206 1.157-1.103 2.813-1.685 4.788-1.685 2.084 0 3.776.627 4.892 1.815.518.55.913 1.2 1.178 1.935.166-.207.346-.4.54-.58 1.036-.954 2.467-1.46 4.135-1.46h.12c1.14.012 2.147.312 2.994.893.248.17.48.36.693.568l-1.42 1.42a3.496 3.496 0 00-2.267-.763h-.086c-1.058.01-1.89.336-2.474.97a2.99 2.99 0 00-.478.726c.106.435.165.891.175 1.37.02.944-.114 1.834-.397 2.649-.476 1.37-1.327 2.471-2.531 3.27-1.295.861-2.895 1.298-4.755 1.298z"/></svg>
);
const IconPinterest = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-4 h-4"} fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
);

/* ─── Données ─── */

const PLATFORM_OPTIONS: { id: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "Instagram", icon: IconInstagram },
  { id: "TikTok", icon: IconTikTok },
  { id: "YouTube", icon: IconYouTube },
  { id: "Facebook", icon: IconFacebook },
  { id: "X (Twitter)", icon: IconX },
  { id: "LinkedIn", icon: IconLinkedIn },
  { id: "Threads", icon: IconThreads },
  { id: "Pinterest", icon: IconPinterest },
];

const SOURCE_OPTIONS = [
  "Instagram", "TikTok", "YouTube", "Facebook",
  "LinkedIn", "X (Twitter)", "Un ami", "Google", "Autre",
];

const NICHE_OPTIONS: { id: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "Business & Entrepreneuriat", icon: Briefcase },
  { id: "Intelligence Artificielle & Tech", icon: Cpu },
  { id: "Finance & Investissement", icon: TrendingUp },
  { id: "Créativité & Design", icon: Palette },
  { id: "Marketing Digital", icon: Megaphone },
  { id: "Santé & Bien-être", icon: Heart },
  { id: "Éducation & Formation", icon: GraduationCap },
  { id: "E-commerce", icon: ShoppingBag },
  { id: "Voyage & Lifestyle", icon: Plane },
  { id: "Musique & Entertainment", icon: Music },
  { id: "Écriture & Copywriting", icon: PenTool },
  { id: "Photo & Vidéo", icon: Camera },
  { id: "Food & Cuisine", icon: UtensilsCrossed },
  { id: "Mode & Beauté", icon: Sparkles },
  { id: "Immobilier", icon: Home },
];

const CONFETTI_COLORS = ["#818cf8", "#34d399", "#f472b6", "#fbbf24", "#60a5fa", "#a78bfa", "#fb923c", "#e879f9"];

const stepAnim = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

function ConfettiPiece({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = 10 + (index * 17) % 80;
  const delay = index * 0.12;
  const duration = 1.8 + (index % 3) * 0.4;
  const size = 4 + (index % 3) * 2;
  const rotation = index * 45;
  return (
    <motion.div
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ y: 400, opacity: 0, rotate: rotation + 360 }}
      transition={{ duration, delay, ease: "easeIn" }}
      className="absolute rounded-sm"
      style={{ left: `${left}%`, top: -10, width: size, height: size, backgroundColor: color }}
    />
  );
}

/* ─── Composant ─── */

const Onboarding = () => {
  const navigate = useNavigate();
  const { updateProfile, onboardingCompleted } = useProfile();

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [sourcePlatform, setSourcePlatform] = useState("");
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);

  // Redirect si onboarding déjà fait (dans un useEffect, pas pendant le render)
  useEffect(() => {
    if (onboardingCompleted && step !== 4) {
      navigate("/dashboard", { replace: true });
    }
  }, [onboardingCompleted, step, navigate]);

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  // UN SEUL upsert à la fin — pas d'appel Supabase pendant les étapes intermédiaires
  async function handleComplete() {
    setSaving(true);
    setSaveError(null);

    const finalNiche = niche === "Autre" ? customNiche || "Autre" : niche;

    const result = await updateProfile({
      first_name: firstName.trim(),
      platforms: selectedPlatforms,
      source_platform: sourcePlatform,
      niche: finalNiche,
      onboarding_completed: true,
    });

    setSaving(false);

    if (!result.success) {
      setSaveError(result.error || "Erreur lors de la sauvegarde. Réessaie.");
      return;
    }

    setStep(4);
    setTimeout(() => setShowButton(true), 2000);
  }

  const progress = Math.min(((step + 1) / 5) * 100, 100);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-1 bg-accent/20">
        <motion.div className="h-full bg-primary rounded-r-full" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
      </div>

      <div className="flex items-center gap-2 px-6 pt-5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-bold">Supen.io</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">

            {/* ÉTAPE 1 — Prénom */}
            {step === 0 && (
              <motion.div key="s0" {...stepAnim} transition={{ duration: 0.25 }}>
                <h1 className="text-2xl font-bold text-foreground mb-2">Comment tu t'appelles ?</h1>
                <p className="text-sm text-muted-foreground mb-8">On va personnaliser ton expérience.</p>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ton prénom"
                  autoFocus
                  className="h-14 text-lg bg-accent/20 border-border/30"
                  onKeyDown={(e) => e.key === "Enter" && firstName.trim() && setStep(1)}
                />
                <Button onClick={() => setStep(1)} disabled={!firstName.trim()} className="w-full h-12 mt-6 gap-2 font-semibold glow-sm">
                  Continuer <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* ÉTAPE 2 — Plateformes */}
            {step === 1 && (
              <motion.div key="s1" {...stepAnim} transition={{ duration: 0.25 }}>
                <h1 className="text-2xl font-bold text-foreground mb-2">Sur quelles plateformes crées-tu du contenu ?</h1>
                <p className="text-sm text-muted-foreground mb-6">Sélectionne toutes celles que tu utilises.</p>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map((p) => {
                    const active = selectedPlatforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={cn(
                          "flex items-center gap-2.5 px-4 py-3 rounded-[10px] border text-sm font-medium transition-all",
                          active
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border/30 bg-accent/20 text-muted-foreground hover:text-foreground hover:bg-accent/30",
                        )}
                      >
                        <p.icon className={cn("w-4 h-4", active ? "text-primary" : "text-muted-foreground")} />
                        {p.id}
                      </button>
                    );
                  })}
                </div>
                <Button onClick={() => setStep(2)} disabled={selectedPlatforms.length === 0} className="w-full h-12 mt-8 gap-2 font-semibold glow-sm">
                  Continuer <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* ÉTAPE 3 — Source */}
            {step === 2 && (
              <motion.div key="s2" {...stepAnim} transition={{ duration: 0.25 }}>
                <h1 className="text-2xl font-bold text-foreground mb-2">Comment as-tu découvert Supen.io ?</h1>
                <p className="text-sm text-muted-foreground mb-6">Ça nous aide à grandir.</p>
                <div className="flex flex-wrap gap-2">
                  {SOURCE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSourcePlatform(s)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                        sourcePlatform === s
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/30",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <Button onClick={() => setStep(3)} disabled={!sourcePlatform} className="w-full h-12 mt-8 gap-2 font-semibold glow-sm">
                  Continuer <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* ÉTAPE 4 — Niche */}
            {step === 3 && (
              <motion.div key="s3" {...stepAnim} transition={{ duration: 0.25 }}>
                <h1 className="text-2xl font-bold text-foreground mb-2">Dans quel domaine évolues-tu ?</h1>
                <p className="text-sm text-muted-foreground mb-6">On adaptera les suggestions à ta niche.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                  {NICHE_OPTIONS.map((n) => {
                    const active = niche === n.id;
                    return (
                      <button
                        key={n.id}
                        onClick={() => { setNiche(n.id); setCustomNiche(""); }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-[10px] border text-left text-sm font-medium transition-all",
                          active
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border/30 bg-accent/20 text-muted-foreground hover:text-foreground hover:bg-accent/30",
                        )}
                      >
                        <n.icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                        <span className="truncate">{n.id}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setNiche("Autre")}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-[10px] border text-left text-sm font-medium transition-all",
                      niche === "Autre"
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/30 bg-accent/20 text-muted-foreground hover:text-foreground hover:bg-accent/30",
                    )}
                  >
                    <Plus className={cn("w-4 h-4 shrink-0", niche === "Autre" ? "text-primary" : "text-muted-foreground")} />
                    <span>Autre</span>
                  </button>
                </div>
                {niche === "Autre" && (
                  <Input
                    value={customNiche}
                    onChange={(e) => setCustomNiche(e.target.value)}
                    placeholder="Précise ton domaine..."
                    className="mt-3 h-11 bg-accent/20 border-border/30"
                    autoFocus
                  />
                )}
                {saveError && (
                  <div className="mt-4 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">{saveError}</div>
                )}
                <Button onClick={handleComplete} disabled={!niche || (niche === "Autre" && !customNiche.trim()) || saving} className="w-full h-12 mt-6 gap-2 font-semibold glow-sm">
                  {saving ? "Enregistrement..." : <>Terminer <Sparkles className="w-4 h-4" /></>}
                </Button>
              </motion.div>
            )}

            {/* ÉTAPE FINALE — Bienvenue */}
            {step === 4 && (
              <motion.div key="welcome" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} className="text-center relative">
                <div className="absolute inset-0 overflow-hidden pointer-events-none -top-20" style={{ height: 500 }}>
                  {[...Array(20)].map((_, i) => (<ConfettiPiece key={i} index={i} />))}
                </div>
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">Bienvenue sur Supen.io, {firstName} !</h1>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-8">Ton espace est prêt. Commençons à créer du contenu viral.</p>
                  <AnimatePresence>
                    {showButton && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <Button onClick={() => navigate("/dashboard", { replace: true })} className="h-12 px-8 text-sm font-semibold glow-sm gap-2.5">
                          <Sparkles className="w-4 h-4" /> Accéder au Studio
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Zap, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";

/* ─── Données ─── */

const PLATFORM_OPTIONS = [
  { id: "Instagram", icon: "📸" },
  { id: "TikTok", icon: "🎵" },
  { id: "YouTube", icon: "▶️" },
  { id: "Facebook", icon: "👥" },
  { id: "X (Twitter)", icon: "𝕏" },
  { id: "LinkedIn", icon: "💼" },
  { id: "Threads", icon: "🧵" },
  { id: "Pinterest", icon: "📌" },
];

const SOURCE_OPTIONS = [
  "Instagram", "TikTok", "YouTube", "Facebook",
  "LinkedIn", "X (Twitter)", "Un ami", "Google", "Autre",
];

const NICHE_OPTIONS = [
  { id: "Business & Entrepreneuriat", emoji: "💼" },
  { id: "Intelligence Artificielle & Tech", emoji: "🤖" },
  { id: "Finance & Investissement", emoji: "💰" },
  { id: "Créativité & Design", emoji: "🎨" },
  { id: "Marketing Digital", emoji: "📱" },
  { id: "Santé & Bien-être", emoji: "🏋️" },
  { id: "Éducation & Formation", emoji: "🎓" },
  { id: "E-commerce", emoji: "🛒" },
  { id: "Voyage & Lifestyle", emoji: "✈️" },
  { id: "Musique & Entertainment", emoji: "🎵" },
  { id: "Écriture & Copywriting", emoji: "✍️" },
  { id: "Photo & Vidéo", emoji: "📸" },
  { id: "Food & Cuisine", emoji: "🍕" },
  { id: "Mode & Beauté", emoji: "👗" },
  { id: "Immobilier", emoji: "🏠" },
];

const stepAnim = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

/* ─── Composant ─── */

const Onboarding = () => {
  const navigate = useNavigate();
  const { updateProfile } = useProfile();

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [sourcePlatform, setSourcePlatform] = useState("");
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [saving, setSaving] = useState(false);

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleComplete() {
    setSaving(true);
    const finalNiche = niche === "Autre" ? customNiche || "Autre" : niche;
    await updateProfile({
      first_name: firstName.trim(),
      platforms: selectedPlatforms,
      source_platform: sourcePlatform,
      niche: finalNiche,
      onboarding_completed: true,
    });
    setSaving(false);
    setStep(4);
  }

  const progress = Math.min(((step + 1) / 5) * 100, 100);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-accent/20">
        <motion.div
          className="h-full bg-primary rounded-r-full"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2 px-6 pt-5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-bold">Supen.io</span>
      </div>

      {/* Content */}
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
                <Button
                  onClick={() => setStep(1)}
                  disabled={!firstName.trim()}
                  className="w-full h-12 mt-6 gap-2 font-semibold glow-sm"
                >
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
                          "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                          active
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/30",
                        )}
                      >
                        <span>{p.icon}</span> {p.id}
                      </button>
                    );
                  })}
                </div>
                <Button
                  onClick={() => setStep(2)}
                  disabled={selectedPlatforms.length === 0}
                  className="w-full h-12 mt-8 gap-2 font-semibold glow-sm"
                >
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
                <Button
                  onClick={() => setStep(3)}
                  disabled={!sourcePlatform}
                  className="w-full h-12 mt-8 gap-2 font-semibold glow-sm"
                >
                  Continuer <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* ÉTAPE 4 — Niche */}
            {step === 3 && (
              <motion.div key="s3" {...stepAnim} transition={{ duration: 0.25 }}>
                <h1 className="text-2xl font-bold text-foreground mb-2">Dans quel domaine évolues-tu ?</h1>
                <p className="text-sm text-muted-foreground mb-6">On adaptera les suggestions à ta niche.</p>
                <div className="flex flex-wrap gap-2 max-h-[320px] overflow-y-auto">
                  {NICHE_OPTIONS.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { setNiche(n.id); setCustomNiche(""); }}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all",
                        niche === n.id
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/30",
                      )}
                    >
                      <span>{n.emoji}</span> {n.id}
                    </button>
                  ))}
                  <button
                    onClick={() => setNiche("Autre")}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all",
                      niche === "Autre"
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/30 text-muted-foreground hover:text-foreground hover:bg-accent/30",
                    )}
                  >
                    <span>➕</span> Autre
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
                <Button
                  onClick={handleComplete}
                  disabled={!niche || (niche === "Autre" && !customNiche.trim()) || saving}
                  className="w-full h-12 mt-8 gap-2 font-semibold glow-sm"
                >
                  {saving ? "Enregistrement..." : <>Terminer <Sparkles className="w-4 h-4" /></>}
                </Button>
              </motion.div>
            )}

            {/* ÉTAPE FINALE — Bienvenue */}
            {step === 4 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center"
              >
                {/* Confetti CSS */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 rounded-full animate-ping"
                        style={{
                          backgroundColor: ["#818cf8", "#34d399", "#f472b6", "#fbbf24", "#60a5fa", "#a78bfa"][i % 6],
                          top: `${20 + Math.sin(i * 0.52) * 30}%`,
                          left: `${20 + Math.cos(i * 0.52) * 30}%`,
                          animationDelay: `${i * 0.15}s`,
                          animationDuration: "1.5s",
                        }}
                      />
                    ))}
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto relative z-10">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Bienvenue sur Supen.io, {firstName} !
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  Ton espace est prêt. Commençons à créer du contenu viral.
                </p>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="h-12 px-8 text-sm font-semibold glow-sm gap-2.5"
                >
                  <Sparkles className="w-4 h-4" /> Accéder au Studio
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

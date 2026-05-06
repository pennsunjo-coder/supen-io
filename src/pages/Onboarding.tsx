import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Sparkles, Plus, Check,
  Briefcase, Cpu, TrendingUp, Palette, Megaphone,
  Heart, GraduationCap, ShoppingBag, PenTool, Camera,
  Loader2,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/contexts/AuthContext";
import { LogoFull } from "@/components/Logo";

/* ─── Icones SVG plateformes ─── */

const IconInstagram = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-5 h-5"} fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const IconTikTok = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-5 h-5"} fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
);
const IconYouTube = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-5 h-5"} fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);
const IconFacebook = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-5 h-5"} fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const IconX = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-5 h-5"} fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);
const IconLinkedIn = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-5 h-5"} fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);

/* ─── Donnees ─── */

const PLATFORMS = [
  { id: "Instagram", icon: IconInstagram },
  { id: "TikTok", icon: IconTikTok },
  { id: "YouTube", icon: IconYouTube },
  { id: "LinkedIn", icon: IconLinkedIn },
  { id: "Facebook", icon: IconFacebook },
  { id: "X (Twitter)", icon: IconX },
];

const NICHES: { id: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "Business & Entrepreneurship", icon: Briefcase },
  { id: "Digital Marketing", icon: Megaphone },
  { id: "Tech & AI", icon: Cpu },
  { id: "Finance & Investment", icon: TrendingUp },
  { id: "Education & Training", icon: GraduationCap },
  { id: "Health & Wellness", icon: Heart },
  { id: "Creativity & Design", icon: Palette },
  { id: "E-commerce", icon: ShoppingBag },
  { id: "Writing & Copywriting", icon: PenTool },
  { id: "Photo & Video", icon: Camera },
];

const SOURCES = [
  "Social media", "A friend / colleague", "Google search",
  "Newsletter", "YouTube", "Other",
];

// Voice profile options. Captured at signup so the style-memory block
// has signal from generation #1, before the user has copied / liked
// anything that getUserStyleMemory could draw from.
const TONES: { id: string; label: string; description: string }[] = [
  { id: "casual", label: "Casual", description: "Friendly, conversational, contractions everywhere." },
  { id: "direct", label: "Direct", description: "Punchy, no fluff, strong opinions stated plainly." },
  { id: "professional", label: "Professional", description: "Clean, credible, balanced. Good for B2B." },
  { id: "authoritative", label: "Authoritative", description: "Expert voice, data-heavy, no hedging." },
];

const LENGTHS: { id: string; label: string; description: string }[] = [
  { id: "short", label: "Short & punchy", description: "Tight hooks, one idea per post." },
  { id: "medium", label: "Medium", description: "Hook + 3-5 beats + CTA. The default." },
  { id: "long", label: "Long-form", description: "Stories, frameworks, deep breakdowns." },
];

const TOTAL_STEPS = 5;

const CONFETTI_COLORS = ["#818cf8", "#34d399", "#f472b6", "#fbbf24", "#60a5fa", "#a78bfa", "#fb923c", "#e879f9"];

function ConfettiPiece({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = 10 + (index * 17) % 80;
  const delay = index * 0.1;
  const duration = 1.6 + (index % 3) * 0.4;
  const size = 5 + (index % 3) * 2;
  const rotation = index * 45;
  return (
    <motion.div
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ y: 500, opacity: 0, rotate: rotation + 360 }}
      transition={{ duration, delay, ease: "easeIn" }}
      className="absolute rounded-sm"
      style={{ left: `${left}%`, top: -10, width: size, height: size, backgroundColor: color }}
    />
  );
}

/* ─── Composant ─── */

const Onboarding = () => {
  const { user } = useAuth();
  const { updateProfile, onboardingCompleted, loading: profileLoading } = useProfile();

  const [step, setStep] = useState(0); // 0=welcome, 1=name, 2=platforms, 3=niche, 4=voice, 5=source, 6=success
  const [firstName, setFirstName] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [preferredTone, setPreferredTone] = useState("");
  const [preferredLength, setPreferredLength] = useState("");
  const [sourcePlatform, setSourcePlatform] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showFinalButton, setShowFinalButton] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [direction, setDirection] = useState(1); // 1=forward, -1=back

  useEffect(() => {
    if (!profileLoading && onboardingCompleted && !completed) {
      window.location.href = "/dashboard";
    }
  }, [profileLoading, onboardingCompleted, completed]);

  function goNext() {
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleComplete() {
    setSaving(true);
    setSaveError(null);

    const finalNiche = niche === "Other" ? customNiche || "Other" : niche;
    const payload: Record<string, unknown> = {
      first_name: firstName.trim(),
      platforms: selectedPlatforms,
      source_platform: sourcePlatform || "Not specified",
      niche: finalNiche,
      onboarding_completed: true,
    };
    // Voice profile — best-effort, only sent if columns exist on the
    // server. updateProfile already gracefully handles unknown keys.
    if (preferredTone) payload.preferred_tone = preferredTone;
    if (preferredLength) payload.preferred_length = preferredLength;

    let result = { success: false, error: "Not connected" as string | null };
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!user && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      result = await updateProfile(payload);
      if (result.success) break;
      if (attempt < 2 && result.error && /load failed|fetch|network/i.test(result.error)) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      break;
    }

    setSaving(false);
    if (!result.success) {
      setSaveError(result.error || "Save error. Please try again.");
      return;
    }

    setCompleted(true);
    setDirection(1);
    setStep(6);
    setTimeout(() => setShowFinalButton(true), 1800);
  }

  // Progress for steps 1-5 (welcome=0 and success=6 don't count)
  const progressStep = Math.max(0, Math.min(step - 1, TOTAL_STEPS));
  const progress = step === 0 ? 0 : step >= 6 ? 100 : (progressStep / TOTAL_STEPS) * 100;

  const slideVariants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Progress bar */}
      {step > 0 && step < 6 && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-r-full"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between px-6 py-3">
            {step > 1 ? (
              <button onClick={goBack} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : (
              <div />
            )}
            <span className="text-[11px] text-white/30 font-medium">
              Step {progressStep} of {TOTAL_STEPS}
            </span>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-lg px-6">
        <AnimatePresence mode="wait" custom={direction}>

          {/* ═══ Step 0 — Welcome ═══ */}
          {step === 0 && (
            <motion.div
              key="welcome"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-8"
              >
                <LogoFull size="lg" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-3xl font-bold text-white mb-3"
              >
                Welcome to Supenli.ai
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="text-white/50 text-sm mb-10 leading-relaxed"
              >
                Let's set up your account in 60 seconds.<br />
                You'll be ready to create viral content.
              </motion.p>

              {/* Step previews */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="flex items-center justify-center gap-6 mb-10"
              >
                {[
                  { num: "1", label: "First name" },
                  { num: "2", label: "Platforms" },
                  { num: "3", label: "Niche" },
                  { num: "4", label: "Discovery" },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/40">
                      {s.num}
                    </div>
                    <span className="text-[10px] text-white/30">{s.label}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.4 }}
              >
                <Button
                  onClick={goNext}
                  className="h-13 px-10 text-base font-semibold gap-2.5 rounded-xl"
                  size="lg"
                >
                  Let's go <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ═══ Step 1 — Prenom ═══ */}
          {step === 1 && (
            <motion.div
              key="name"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm">
                <h1 className="text-2xl font-bold text-white mb-2">What's your name?</h1>
                <p className="text-sm text-white/40 mb-8">We personalize everything for you.</p>

                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                  autoFocus
                  className="h-14 text-lg bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary/50"
                  onKeyDown={(e) => e.key === "Enter" && firstName.trim().length >= 2 && goNext()}
                />

                {firstName.length > 0 && firstName.trim().length < 2 && (
                  <p className="text-xs text-amber-400/60 mt-2">Minimum 2 characters</p>
                )}

                <Button
                  onClick={goNext}
                  disabled={firstName.trim().length < 2}
                  className="w-full h-12 mt-6 gap-2 font-semibold rounded-xl"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ Step 2 — Plateformes ═══ */}
          {step === 2 && (
            <motion.div
              key="platforms"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm">
                <h1 className="text-2xl font-bold text-white mb-2">Where do you create content?</h1>
                <p className="text-sm text-white/40 mb-6">Select all your platforms.</p>

                <div className="grid grid-cols-2 gap-3">
                  {PLATFORMS.map((p) => {
                    const active = selectedPlatforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={cn(
                          "relative flex items-center gap-3 px-4 py-4 rounded-xl border text-sm font-medium transition-all",
                          active
                            ? "border-primary/50 bg-primary/10 text-white"
                            : "border-white/8 bg-white/[0.02] text-white/50 hover:text-white/70 hover:bg-white/[0.04] hover:border-white/15",
                        )}
                      >
                        <p.icon className={cn("w-5 h-5", active ? "text-primary" : "text-white/40")} />
                        {p.id}
                        {active && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={goNext}
                  disabled={selectedPlatforms.length === 0}
                  className="w-full h-12 mt-6 gap-2 font-semibold rounded-xl"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>

                {selectedPlatforms.length === 0 && (
                  <p className="text-xs text-white/25 text-center mt-3">Select at least 1 platform</p>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══ Step 3 — Niche ═══ */}
          {step === 3 && (
            <motion.div
              key="niche"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm">
                <h1 className="text-2xl font-bold text-white mb-2">What's your niche?</h1>
                <p className="text-sm text-white/40 mb-6">We'll adapt suggestions to your domain.</p>

                <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
                  {NICHES.map((n) => {
                    const active = niche === n.id;
                    return (
                      <button
                        key={n.id}
                        onClick={() => { setNiche(n.id); setCustomNiche(""); }}
                        className={cn(
                          "flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-left text-sm font-medium transition-all",
                          active
                            ? "border-primary/50 bg-primary/10 text-white"
                            : "border-white/8 bg-white/[0.02] text-white/50 hover:text-white/70 hover:bg-white/[0.04]",
                        )}
                      >
                        <n.icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-white/30")} />
                        <span className="truncate text-[13px]">{n.id}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setNiche("Other")}
                    className={cn(
                      "flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-left text-sm font-medium transition-all col-span-2",
                      niche === "Other"
                        ? "border-primary/50 bg-primary/10 text-white"
                        : "border-white/8 bg-white/[0.02] text-white/50 hover:text-white/70 hover:bg-white/[0.04]",
                    )}
                  >
                    <Plus className={cn("w-4 h-4 shrink-0", niche === "Other" ? "text-primary" : "text-white/30")} />
                    Other domain
                  </button>
                </div>

                {niche === "Other" && (
                  <Input
                    value={customNiche}
                    onChange={(e) => setCustomNiche(e.target.value)}
                    placeholder="Specify your domain..."
                    className="mt-3 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20"
                    autoFocus
                  />
                )}

                <Button
                  onClick={goNext}
                  disabled={!niche || (niche === "Other" && !customNiche.trim())}
                  className="w-full h-12 mt-6 gap-2 font-semibold rounded-xl"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ Step 4 — Decouverte (optionnel) ═══ */}
          {step === 4 && (
            <motion.div
              key="voice"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm">
                <h1 className="text-2xl font-bold text-white mb-2">What does your voice sound like?</h1>
                <p className="text-sm text-white/40 mb-6">Two quick taps. We use this from your very first generation.</p>

                <div className="space-y-5">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-2.5">Tone</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {TONES.map((t) => {
                        const active = preferredTone === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setPreferredTone(t.id)}
                            className={cn(
                              "text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                              active
                                ? "border-primary/50 bg-primary/10 text-white"
                                : "border-white/8 bg-white/[0.02] text-white/60 hover:text-white/80 hover:bg-white/[0.04]",
                            )}
                          >
                            <div className="text-sm font-semibold">{t.label}</div>
                            <div className="text-[11px] text-white/40 mt-0.5 leading-snug">{t.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-2.5">Length</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {LENGTHS.map((l) => {
                        const active = preferredLength === l.id;
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => setPreferredLength(l.id)}
                            className={cn(
                              "text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                              active
                                ? "border-primary/50 bg-primary/10 text-white"
                                : "border-white/8 bg-white/[0.02] text-white/60 hover:text-white/80 hover:bg-white/[0.04]",
                            )}
                          >
                            <div className="text-sm font-semibold">{l.label}</div>
                            <div className="text-[11px] text-white/40 mt-0.5 leading-snug">{l.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-7">
                  <Button
                    variant="outline"
                    onClick={goNext}
                    className="flex-1 h-12 font-medium rounded-xl border-white/10 text-white/60 hover:text-white bg-white/[0.03]"
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={goNext}
                    disabled={!preferredTone || !preferredLength}
                    className="flex-1 h-12 gap-2 font-semibold rounded-xl"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ Step 5 — Source ═══ */}
          {step === 5 && (
            <motion.div
              key="source"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm">
                <h1 className="text-2xl font-bold text-white mb-2">How did you discover Supenli.ai?</h1>
                <p className="text-sm text-white/40 mb-6">Optional — helps us grow.</p>

                <div className="flex flex-wrap gap-2.5">
                  {SOURCES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSourcePlatform(s)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                        sourcePlatform === s
                          ? "border-primary/50 bg-primary/10 text-white"
                          : "border-white/8 bg-white/[0.02] text-white/50 hover:text-white/70 hover:bg-white/[0.04]",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {saveError && (
                  <div className="mt-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">{saveError}</div>
                )}

                <div className="flex gap-3 mt-8">
                  <Button
                    variant="outline"
                    onClick={handleComplete}
                    disabled={saving}
                    className="flex-1 h-12 font-medium rounded-xl border-white/10 text-white/60 hover:text-white bg-white/[0.03]"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Skip"}
                  </Button>
                  <Button
                    onClick={() => { if (sourcePlatform) handleComplete(); }}
                    disabled={!sourcePlatform || saving}
                    className="flex-1 h-12 gap-2 font-semibold rounded-xl"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Finish <Sparkles className="w-4 h-4" /></>}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ Step 6 — Succes ═══ */}
          {step === 6 && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center relative"
            >
              {/* Confetti */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none -top-20" style={{ height: 600 }}>
                {[...Array(24)].map((_, i) => (<ConfettiPiece key={i} index={i} />))}
              </div>

              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <Check className="w-10 h-10 text-primary" />
                  </motion.div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="text-3xl font-bold text-white mb-3"
                >
                  You're all set, {firstName}!
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="text-white/40 text-sm leading-relaxed mb-10 max-w-sm mx-auto"
                >
                  Your workspace is ready. Supenli.ai will help you create viral content for {selectedPlatforms.slice(0, 3).join(", ")}{selectedPlatforms.length > 3 ? ` and ${selectedPlatforms.length - 3} more` : ""}.
                </motion.p>

                <AnimatePresence>
                  {showFinalButton && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Button
                        onClick={() => { window.location.href = "/dashboard"; }}
                        className="h-14 px-10 text-base font-bold rounded-xl gap-3"
                        size="lg"
                      >
                        <Sparkles className="w-5 h-5" /> Start creating
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
  );
};

export default Onboarding;

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isActive: boolean;
  steps: string[];
  estimatedSeconds?: number;
}

export const CONTENT_STEPS = [
  "Analyse de tes sources...",
  "Comprehension du sujet...",
  "Recherche d'angles viraux...",
  "Ecriture de la variation 1...",
  "Ecriture de la variation 2...",
  "Ecriture de la variation 3...",
  "Optimisation pour la viralite...",
  "Calcul des scores viraux...",
  "Presque fini...",
];

export const INFOGRAPHIC_STEPS = [
  "Analyse du contenu...",
  "Detection du type de contenu...",
  "Construction de la structure...",
  "Application de la palette pastel...",
  "Generation de l'image en cours...",
  "Ajustement typographique...",
  "Finalisation...",
  "Cela peut prendre jusqu'a 2 minutes...",
];

export default function GenerationProgress({ isActive, steps, estimatedSeconds = 20 }: Props) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number>(0);

  // Reset when isActive turns on
  useEffect(() => {
    if (isActive) {
      setProgress(0);
      setStepIndex(0);
      setElapsed(0);
      setDone(false);
      startTimeRef.current = Date.now();
    }
  }, [isActive]);

  // Animate progress bar (0→95% asymptotically)
  useEffect(() => {
    if (!isActive || done) return;

    function tick() {
      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedSec = elapsedMs / 1000;
      setElapsed(Math.floor(elapsedSec));

      // Asymptotic curve: fast at start, slows near 95%
      // Uses 1 - e^(-t/T) scaled to 95%
      const ratio = 1 - Math.exp(-elapsedSec / (estimatedSeconds * 0.6));
      setProgress(Math.min(ratio * 95, 95));

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, done, estimatedSeconds]);

  // Rotate step messages — interval scales with the estimated total time so
  // each step roughly maps to a real progress moment instead of looping
  // dozens of times. Clamp at the last step (don't loop) so long runs
  // settle on the "almost done" message instead of restarting from step 0.
  useEffect(() => {
    if (!isActive || done) return;
    const stepIntervalMs = Math.max(2000, Math.round((estimatedSeconds * 1000) / steps.length));
    const interval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }, stepIntervalMs);
    return () => clearInterval(interval);
  }, [isActive, done, steps.length, estimatedSeconds]);

  // When generation finishes → animate to 100%
  useEffect(() => {
    if (!isActive && progress > 0 && !done) {
      setDone(true);
      setProgress(100);
    }
  }, [isActive, progress, done]);

  if (progress === 0 && !isActive) return null;

  return (
    <div className="w-full space-y-3">
      {/* Progress bar */}
      <div className="relative">
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-primary to-violet-500"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: done ? 0.4 : 0.8, ease: "easeOut" }}
          />
        </div>
        {/* Glow effect */}
        {isActive && (
          <motion.div
            className="absolute top-0 h-1 w-12 rounded-full bg-white/30 blur-sm"
            animate={{ left: [`${Math.max(0, progress - 5)}%`, `${progress}%`] }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
        )}
      </div>

      {/* Message + timer */}
      <div className="flex items-center justify-between">
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-xs text-white/50"
          >
            {steps[stepIndex]}
          </motion.p>
        </AnimatePresence>

        <span className="text-[11px] text-white/30 tabular-nums font-mono ml-4 shrink-0">
          {elapsed}s
        </span>
      </div>
    </div>
  );
}

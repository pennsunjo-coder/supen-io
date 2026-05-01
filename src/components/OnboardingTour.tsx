import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const TOUR_STEPS = [
  { id: "welcome", title: "Welcome to Supenli.ai!", description: "Let's take a quick tour. This will only take 30 seconds.", target: "body" },
  { id: "create", title: "Create Content", description: "Click here to generate viral posts for LinkedIn, Instagram, TikTok and more.", target: "[data-tour='create-btn']" },
  { id: "sources", title: "Add Sources", description: "Upload PDFs, paste URLs, or add notes. The AI uses these to generate relevant content.", target: "[data-tour='sources']" },
  { id: "coach", title: "AI Coach", description: "Chat with your personal AI coach to get advice on growing your audience.", target: "[data-tour='coach']" },
  { id: "done", title: "You're all set!", description: "Start by clicking 'Create Content' to generate your first viral post.", target: "body" },
];

const STORAGE_KEY = "supen_tour_completed";

export default function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setTimeout(() => setVisible(true), 1500);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const current = TOUR_STEPS[step];
    if (current.target === "body") { setTargetRect(null); return; }
    const el = document.querySelector(current.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [step, visible]);

  function next() {
    if (step < TOUR_STEPS.length - 1) setStep((s) => s + 1);
    else complete();
  }

  function complete() {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const isCenter = current.target === "body";

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/50" onClick={complete} />

      {targetRect && (
        <div className="absolute rounded-lg ring-4 ring-primary ring-offset-2 ring-offset-transparent z-10 pointer-events-none" style={{ top: targetRect.top - 4, left: targetRect.left - 4, width: targetRect.width + 8, height: targetRect.height + 8 }} />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            "absolute z-20 bg-card border border-border/30 rounded-2xl shadow-2xl p-5 max-w-sm w-full",
            isCenter && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          )}
          style={!isCenter && targetRect ? { top: targetRect.bottom + 12, left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 336)) } : {}}
        >
          <button className="absolute top-3 right-3 w-7 h-7 rounded-full bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" onClick={complete}>
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex gap-1.5 mb-4">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "bg-primary w-4" : i < step ? "bg-primary/40 w-1.5" : "bg-accent/50 w-1.5")} />
            ))}
          </div>

          <h3 className="font-bold text-base mb-2">{current.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">{current.description}</p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/50">{step + 1} of {TOUR_STEPS.length}</span>
            <div className="flex gap-2">
              {step > 0 && <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setStep((s) => s - 1)}>Back</Button>}
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={next}>
                {step === TOUR_STEPS.length - 1 ? "Get Started!" : "Next"}
                {step < TOUR_STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

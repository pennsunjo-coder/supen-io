import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export default function HelpTooltip({ text, position = "top", className }: HelpTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className={cn("relative inline-flex", className)}>
      <button onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onClick={() => setShow((s) => !s)} className="w-4 h-4 rounded-full text-muted-foreground/40 hover:text-muted-foreground transition-colors">
        <HelpCircle className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={cn(
              "absolute z-50 bg-popover border border-border/30 rounded-xl shadow-xl p-3 w-48 text-xs text-muted-foreground leading-relaxed",
              position === "top" && "bottom-6 left-1/2 -translate-x-1/2",
              position === "bottom" && "top-6 left-1/2 -translate-x-1/2",
              position === "right" && "left-6 top-1/2 -translate-y-1/2",
              position === "left" && "right-6 top-1/2 -translate-y-1/2",
            )}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

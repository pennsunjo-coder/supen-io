import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  active: boolean;
  label: string;
  /** Approximate expected duration; shown as "Xs / ~Ys" if provided. */
  estimatedSec?: number;
  className?: string;
}

/**
 * One-line progress banner for background operations (PDF extraction,
 * web search, etc.) that don't expose granular progress. Shows a spinner,
 * a short label, and elapsed time so the user knows the system is alive.
 */
export default function TimedProgress({ active, label, estimatedSec, className }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  const overrun = estimatedSec ? elapsed > estimatedSec : false;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-primary/10 border border-primary/20",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
      <span className="text-xs font-medium text-foreground/90 truncate flex-1">{label}</span>
      <span
        className={cn(
          "text-[10px] font-mono tabular-nums shrink-0",
          overrun ? "text-amber-400" : "text-muted-foreground",
        )}
      >
        {elapsed}s{estimatedSec ? ` / ~${estimatedSec}s` : ""}
      </span>
    </div>
  );
}

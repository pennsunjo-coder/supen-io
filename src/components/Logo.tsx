import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  forceLight?: boolean;
  forceDark?: boolean;
}

const heights = {
  sm: "h-6",
  md: "h-8",
  lg: "h-10",
};

/**
 * Full Supenli.ai logo (text + icon).
 * - Dark theme → /logo-light.svg (white text for dark backgrounds)
 * - Light theme → /logo-dark.svg (black text for light backgrounds)
 */
export function LogoFull({
  size = "md",
  className,
  forceLight,
  forceDark,
}: LogoProps) {
  const { theme } = useTheme();

  const isDark = forceDark || (!forceLight && theme === "dark");

  return (
    <img
      src={isDark ? "/logo-light.svg" : "/logo-dark.svg"}
      alt="Supenli.ai"
      className={cn(heights[size], "w-auto", className)}
    />
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <img
      src="/logo-dark.svg"
      alt="Supenli.ai"
      className={cn("h-8 w-8 object-contain", className)}
    />
  );
}

export default LogoFull;

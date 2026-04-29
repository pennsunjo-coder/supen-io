import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

type Size = "sm" | "md" | "lg";

interface LogoProps {
  size?: Size;
  className?: string;
}

const sizes: Record<Size, string> = {
  sm: "h-7",
  md: "h-9",
  lg: "h-12",
};

const iconSizes: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

/**
 * Full Supenli.io logo (text + icon).
 * Auto-switches between dark/light variant based on theme.
 * - Dark theme → /logo-white.svg (white text on dark bg)
 * - Light theme → /logo.svg (black text on light bg)
 */
export function LogoFull({ size = "md", className }: LogoProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const src = isDark ? "/logo-white.svg" : "/logo.svg";

  return (
    <img
      src={src}
      alt="Supenli.io"
      className={cn(sizes[size], "w-auto object-contain", className)}
      draggable={false}
    />
  );
}

/**
 * Compact Supenli icon.
 * Use for favicons, app icons, square contexts.
 */
export function LogoIcon({ size = "md", className }: { size?: Size; className?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const src = isDark ? "/logo-white.svg" : "/logo.svg";

  return (
    <img
      src={src}
      alt="Supenli"
      className={cn(iconSizes[size], "object-contain", className)}
      draggable={false}
    />
  );
}

export default LogoFull;

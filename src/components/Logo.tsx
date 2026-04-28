import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import logoHorizontalDark from "@/assets/logo-horizontal-dark.svg";
import logoHorizontalLight from "@/assets/logo-horizontal-light.svg";
import logoVerticalDark from "@/assets/logo-vertical-dark.svg";
import logoVerticalLight from "@/assets/logo-vertical-light.svg";

type Size = "sm" | "md" | "lg";

interface LogoProps {
  size?: Size;
  className?: string;
  vertical?: boolean;
}

const horizontalSizes: Record<Size, string> = {
  sm: "h-7",
  md: "h-9",
  lg: "h-12",
};

const verticalSizes: Record<Size, string> = {
  sm: "h-12",
  md: "h-16",
  lg: "h-24",
};

const iconSizes: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

/**
 * Full Supenli.io logo (text + icon).
 * Auto-switches between dark/light variant based on theme.
 * Note: file naming is inverse — "Black" SVG has WHITE text (for dark bg),
 * "White" SVG has BLACK text (for light bg).
 */
export function LogoFull({ size = "md", className, vertical = false }: LogoProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const src = vertical
    ? (isDark ? logoVerticalDark : logoVerticalLight)
    : (isDark ? logoHorizontalDark : logoHorizontalLight);

  const sizeClass = vertical ? verticalSizes[size] : horizontalSizes[size];

  return (
    <img
      src={src}
      alt="Supenli.io"
      className={cn(sizeClass, "w-auto object-contain", className)}
      draggable={false}
    />
  );
}

/**
 * Compact Supen icon (vertical logo).
 * Use for favicons, app icons, square contexts.
 */
export function LogoIcon({ size = "md", className }: { size?: Size; className?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const src = isDark ? logoVerticalDark : logoVerticalLight;

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

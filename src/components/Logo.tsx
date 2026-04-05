import { cn } from "@/lib/utils";

const sizes = {
  sm: { icon: "w-7 h-7", rx: "8", text: "text-base" },
  md: { icon: "w-8 h-8", rx: "8", text: "text-lg" },
  lg: { icon: "w-10 h-10", rx: "10", text: "text-xl" },
};

function LogoSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="40" height="40" rx="10" fill="url(#supen-grad)" />
      <defs>
        <linearGradient id="supen-grad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#00C9B1" />
          <stop offset="100%" stopColor="#0099A8" />
        </linearGradient>
      </defs>
      <path
        d="M26 13C26 10.8 24.2 9 22 9H18C15.8 9 14 10.8 14 13C14 15.2 15.8 17 18 17H22C24.2 17 26 18.8 26 21C26 23.2 24.2 25 22 25H18C15.8 25 14 23.2 14 21"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LogoIcon({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <div className={cn("rounded-xl overflow-hidden shrink-0", sizes[size].icon, className)}>
      <LogoSvg className="w-full h-full" />
    </div>
  );
}

export function LogoFull({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoIcon size={size} />
      <span className={cn("font-bold tracking-tight", sizes[size].text)}>
        Supen<span className="text-primary">.io</span>
      </span>
    </div>
  );
}

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const SketchOvalBadge = ({
  number,
  size = 44,
  color = '#111111',
}: {
  number: string | number;
  size?: number;
  color?: string;
}) => (
  <svg width={size} height={size * 0.85} viewBox="0 0 44 38" fill="none">
    <ellipse cx="22" cy="19" rx="20" ry="17" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="white"/>
    <text x="22" y="25" textAnchor="middle" fontFamily="'Caveat', cursive" fontWeight="700" fontSize="16" fill={color}>
      {typeof number === 'number' && number < 10 ? `0${number}` : number}
    </text>
  </svg>
);

export const SketchLetterBadge = ({
  letter,
  color = '#16A34A',
  size = 32,
}: {
  letter: string;
  color?: string;
  size?: number;
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <rect x="3" y="3" width="26" height="26" rx="4" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="white"/>
    <text x="16" y="23" textAnchor="middle" fontFamily="'Caveat', cursive" fontWeight="700" fontSize="18" fill={color}>
      {letter}
    </text>
  </svg>
);

export const SketchCheckmark = ({ size = 20, color = '#C0392B' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M3 11 L8 16 L17 5" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SketchCross = ({ size = 20, color = '#C0392B' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M4 4 L16 16 M16 4 L4 16" stroke={color} strokeWidth="2.8" strokeLinecap="round"/>
  </svg>
);

export const SketchTarget = ({ size = 32, color = '#2563EB' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="13" stroke={color} strokeWidth="1.8"/>
    <circle cx="16" cy="16" r="8" stroke={color} strokeWidth="1.8"/>
    <circle cx="16" cy="16" r="3" fill={color}/>
    <line x1="16" y1="3" x2="16" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="16" y1="24" x2="16" y2="29" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="3" y1="16" x2="8" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="24" y1="16" x2="29" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export const SketchBarChart = ({ size = 32, color = '#16A34A' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <line x1="6" y1="26" x2="6" y2="6" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="6" y1="26" x2="28" y2="26" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>
    <polyline points="8,22 13,16 18,19 23,10" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="23" cy="10" r="2.5" fill={color}/>
  </svg>
);

export const SketchBrain = ({ size = 32, color = '#7C3AED' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 6 C10 6 6 10 6 15 C6 18 7 20 9 21 C9 23 10 25 12 25 L16 25 L20 25 C22 25 23 23 23 21 C25 20 26 18 26 15 C26 10 22 6 16 6Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <line x1="16" y1="6" x2="16" y2="25" stroke={color} strokeWidth="1.2" strokeDasharray="1 3"/>
    <path d="M9 15 Q11 13 13 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M19 15 Q21 13 23 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
);

export const SketchLightbulb = ({ size = 24, color = '#F5922A' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 5 C11 5 7 9 7 14 C7 18 10 21 11 22 L11 26 L21 26 L21 22 C22 21 25 18 25 14 C25 9 21 5 16 5Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <line x1="12" y1="26" x2="20" y2="26" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="13" y1="29" x2="19" y2="29" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="16" y1="9" x2="16" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export const SketchRocket = ({ size = 32, color = '#C0392B' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 4 C16 4 22 8 22 16 L22 22 L16 28 L10 22 L10 16 C10 8 16 4 16 4Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <circle cx="16" cy="14" r="3" stroke={color} strokeWidth="1.5"/>
    <path d="M10 20 L6 24 L6 27 L9 27 L13 23" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M22 20 L26 24 L26 27 L23 27 L19 23" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const SketchStar = ({ size = 24, color = '#F5922A' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 4 L19 12 L28 12 L21 17 L24 26 L16 21 L8 26 L11 17 L4 12 L13 12 Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const SketchGear = ({ size = 32, color = '#2563EB' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="5" stroke={color} strokeWidth="1.8"/>
    <path d="M16 5 L16 8 M16 24 L16 27 M5 16 L8 16 M24 16 L27 16 M8 8 L10 10 M22 22 L24 24 M8 24 L10 22 M22 10 L24 8" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="1.5" strokeDasharray="3 2"/>
  </svg>
);

export const SketchArrowDown = ({ size = 24, color = '#C0392B' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 4 L12 18 M6 13 L12 19 L18 13" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SketchWavyUnderline = ({ width = 200, color = '#C0392B' }: { width?: number; color?: string }) => (
  <svg width={width} height={8} viewBox={`0 0 ${width} 8`} fill="none">
    <path d={`M 0 4 Q 12 1 25 4 Q 37 7 50 4 Q 62 1 75 4 Q 87 7 100 4 Q 112 1 125 4 Q 137 7 150 4 Q 162 1 175 4 Q 187 7 200 4`}
      stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
);

export const SketchCornerClip = ({ size = 18, color = '#555555' }: { size?: number; color?: string }) => (
  <svg width={size * 0.7} height={size} viewBox="0 0 12 18" fill="none">
    <rect x="1" y="1" width="10" height="16" rx="2" fill={color} stroke="#333" strokeWidth="0.5"/>
    <line x1="1" y1="7" x2="11" y2="7" stroke="#888" strokeWidth="0.5"/>
    <line x1="1" y1="11" x2="11" y2="11" stroke="#888" strokeWidth="0.5"/>
  </svg>
);

export const SKETCH_ICON_MAP: Record<string, React.FC<IconProps>> = {
  target: SketchTarget,
  chart: SketchBarChart,
  brain: SketchBrain,
  lightbulb: SketchLightbulb,
  rocket: SketchRocket,
  star: SketchStar,
  gear: SketchGear,
  check: SketchCheckmark,
  cross: SketchCross,
};

export function getSketchIcon(title: string, index: number): React.FC<IconProps> {
  const t = title.toLowerCase();
  if (t.includes('goal') || t.includes('target') || t.includes('focus') || t.includes('objectif')) return SketchTarget;
  if (t.includes('grow') || t.includes('result') || t.includes('stat') || t.includes('perform')) return SketchBarChart;
  if (t.includes('brain') || t.includes('think') || t.includes('strateg') || t.includes('ai')) return SketchBrain;
  if (t.includes('idea') || t.includes('tip') || t.includes('conseil') || t.includes('insight')) return SketchLightbulb;
  if (t.includes('launch') || t.includes('start') || t.includes('viral') || t.includes('grow')) return SketchRocket;
  if (t.includes('best') || t.includes('top') || t.includes('excel') || t.includes('qualit')) return SketchStar;
  if (t.includes('process') || t.includes('system') || t.includes('automat') || t.includes('workflow')) return SketchGear;
  if (t.includes('success') || t.includes('done') || t.includes('valid') || t.includes('complet')) return SketchCheckmark;
  const fallbacks = [SketchTarget, SketchRocket, SketchBrain, SketchLightbulb, SketchBarChart, SketchGear, SketchStar];
  return fallbacks[index % fallbacks.length];
}

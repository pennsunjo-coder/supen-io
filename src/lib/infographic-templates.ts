/**
 * 8 complete HTML/CSS infographic templates.
 * Extracted from deep analysis of 12 Awa K. Penn reference images.
 * Each template returns a full HTML string with {{PLACEHOLDERS}}.
 *
 * DESIGN PRINCIPLES (from reference analysis):
 * - DENSE content: 85-95% canvas fill, NO empty space at bottom
 * - TIGHT spacing: 24-30px padding, 8-10px gaps
 * - COMPACT typography: titles 28-34px, headers 14px, body 12px
 * - SMALL numbered circles: 30-34px diameter
 * - 7 sections per template (not 5)
 * - Sub-bullets within body text for density
 * - Inline emphasis (.a class) for colored bold words
 * - Pro-tip / bonus section at bottom
 */

const FONT_IMPORTS = `<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&family=Caveat:wght@500;700&display=swap" rel="stylesheet">`;

// ─── Shared font loading head block (robust: @import + fallbacks + font-ready) ───
const FONT_HEAD = `<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
</style>`;

// ─── SVG paper grid backgrounds ───
function dotGridBg(gridSize: number = 32, opacity: number = 0.06): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${gridSize}' height='${gridSize}'><circle cx='${gridSize/2}' cy='${gridSize/2}' r='0.8' fill='rgba(80,80,100,${opacity})'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
function gridLineBg(gridSize: number = 32, opacity: number = 0.05): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${gridSize}' height='${gridSize}'><path d='M ${gridSize} 0 L 0 0 0 ${gridSize}' fill='none' stroke='rgba(80,80,100,${opacity})' stroke-width='0.5'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// ─── Decorative SVG elements ───
function wavyUnderline(width: number, color: string): string {
  return `<svg width="${width}" height="8" viewBox="0 0 200 8" style="display:block;margin:0 auto;"><path d="M 0 4 Q 25 1 50 4 Q 75 7 100 4 Q 125 1 150 4 Q 175 7 200 4" stroke="${color}" stroke-width="2" fill="none"/></svg>`;
}
function decorStar(size: number = 14): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" style="display:inline;vertical-align:middle;"><text x="1" y="13" font-size="13" fill="#F5922A">★</text></svg>`;
}

// ─── Hand-drawn SVG sketch icons (for inline HTML templates) ───
function sketchIcon(type: string, size: number, color: string): string {
  const s = size;
  const c = color;
  const icons: Record<string, string> = {
    target: `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke="${c}" stroke-width="1.8"/><circle cx="16" cy="16" r="8" stroke="${c}" stroke-width="1.8"/><circle cx="16" cy="16" r="3" fill="${c}"/><line x1="16" y1="3" x2="16" y2="8" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/><line x1="16" y1="24" x2="16" y2="29" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/><line x1="3" y1="16" x2="8" y2="16" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/><line x1="24" y1="16" x2="29" y2="16" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    rocket: `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><path d="M16 4 C16 4 22 8 22 16 L22 22 L16 28 L10 22 L10 16 C10 8 16 4 16 4Z" stroke="${c}" stroke-width="1.8" stroke-linecap="round" fill="none"/><circle cx="16" cy="14" r="3" stroke="${c}" stroke-width="1.5"/><path d="M10 20 L6 24 L6 27 L9 27 L13 23" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M22 20 L26 24 L26 27 L23 27 L19 23" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    brain: `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><path d="M16 6 C10 6 6 10 6 15 C6 18 7 20 9 21 C9 23 10 25 12 25 L16 25 L20 25 C22 25 23 23 23 21 C25 20 26 18 26 15 C26 10 22 6 16 6Z" stroke="${c}" stroke-width="1.8" stroke-linecap="round" fill="none"/><line x1="16" y1="6" x2="16" y2="25" stroke="${c}" stroke-width="1.2" stroke-dasharray="1 3"/><path d="M9 15 Q11 13 13 15" stroke="${c}" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M19 15 Q21 13 23 15" stroke="${c}" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>`,
    lightbulb: `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><path d="M16 5 C11 5 7 9 7 14 C7 18 10 21 11 22 L11 26 L21 26 L21 22 C22 21 25 18 25 14 C25 9 21 5 16 5Z" stroke="${c}" stroke-width="1.8" stroke-linecap="round" fill="none"/><line x1="12" y1="26" x2="20" y2="26" stroke="${c}" stroke-width="2" stroke-linecap="round"/><line x1="13" y1="29" x2="19" y2="29" stroke="${c}" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="9" x2="16" y2="13" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    chart: `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><line x1="6" y1="26" x2="6" y2="6" stroke="#111" stroke-width="1.8" stroke-linecap="round"/><line x1="6" y1="26" x2="28" y2="26" stroke="#111" stroke-width="1.8" stroke-linecap="round"/><polyline points="8,22 13,16 18,19 23,10" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="23" cy="10" r="2.5" fill="${c}"/></svg>`,
    gear: `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="5" stroke="${c}" stroke-width="1.8"/><path d="M16 5 L16 8 M16 24 L16 27 M5 16 L8 16 M24 16 L27 16 M8 8 L10 10 M22 22 L24 24 M8 24 L10 22 M22 10 L24 8" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
    clipboard: `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect x="6" y="8" width="20" height="20" rx="2" stroke="${c}" stroke-width="1.8"/><path d="M12 8 L12 6 Q16 4 20 6 L20 8" stroke="${c}" stroke-width="1.8" stroke-linecap="round" fill="none"/><line x1="10" y1="14" x2="22" y2="14" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/><line x1="10" y1="18" x2="22" y2="18" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/><line x1="10" y1="22" x2="18" y2="22" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    check: `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="13" stroke="${c}" stroke-width="1.8"/><path d="M9 16 L14 21 L23 11" stroke="${c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    star: `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><path d="M16 4 L19 12 L28 12 L21 17 L24 26 L16 21 L8 26 L11 17 L4 12 L13 12 Z" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    book: `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><path d="M6 7 L6 26 Q6 27 8 27 L16 27 L16 7 L8 7 Q6 7 6 7Z" stroke="${c}" stroke-width="1.8" fill="none"/><path d="M16 7 L24 7 Q26 7 26 9 L26 26 Q26 27 24 27 L16 27" stroke="${c}" stroke-width="1.8" fill="none"/><line x1="16" y1="7" x2="16" y2="27" stroke="${c}" stroke-width="1.5"/><line x1="9" y1="12" x2="14" y2="12" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/><line x1="9" y1="16" x2="14" y2="16" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  };
  return icons[type] || icons['target'];
}

function iconForIndex(index: number): string {
  const cycle = ['target','rocket','brain','lightbulb','chart','gear','clipboard','check','star','book'];
  return cycle[index % cycle.length];
}

function getIconTypeForContent(_title: string, index: number): string {
  return iconForIndex(index);
}

// ─── Centralized typography system ───
function typography(w: number) {
  const s = w / 1080;
  return {
    titleXL: Math.round(52 * s), titleL: Math.round(44 * s), titleM: Math.round(36 * s), titleS: Math.round(28 * s),
    bodyL: Math.round(22 * s), bodyM: Math.round(18 * s), bodyS: Math.round(15 * s), bodyXS: Math.round(13 * s),
    badge: Math.round(13 * s), label: Math.round(11 * s), footer: Math.round(14 * s),
    num: Math.round(48 * s), numText: Math.round(20 * s), icon: Math.round(32 * s), iconSm: Math.round(24 * s),
    pad: Math.round(48 * s), padSm: Math.round(24 * s), gap: Math.round(12 * s), gapSm: Math.round(8 * s),
    radius: Math.round(12 * s), radiusLg: Math.round(20 * s),
  };
}

// ─── Inline grid background helpers ───
function inlineDotGrid(gridSize: number, opacity: number): string {
  return `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${gridSize}' height='${gridSize}'><circle cx='${gridSize/2}' cy='${gridSize/2}' r='0.8' fill='rgba(80,80,100,${opacity})'/></svg>`)}')`;
}
function inlineLineGrid(gridSize: number, opacity: number): string {
  return `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${gridSize}' height='${gridSize}'><path d='M ${gridSize} 0 L 0 0 0 ${gridSize}' fill='none' stroke='rgba(80,80,100,${opacity})' stroke-width='0.5'/></svg>`)}')`;
}

// ─── TEMPLATE 1: AWA_CLASSIC (style IMG1/IMG3 — cadre bois) ───
export function awaClassic(w: number, h: number): string {
  const t = typography(w);
  const s = w / 1080;
  const frame = Math.round(28 * s);
  const innerW = w - frame * 2;
  const innerH = h - frame * 2;
  const headerH = Math.round(innerH * 0.17);
  const footerH = Math.round(innerH * 0.09);
  const itemGap = Math.round(9 * s);
  const colors = ['#C0392B','#2563EB','#2E7D32','#D4A017','#8B5CF6','#C0392B','#0D9488'];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="width:${w}px;height:${h}px;overflow:hidden;margin:0;padding:0;box-sizing:border-box;background:#3d2b1a;">

<div style="position:absolute;top:${frame}px;left:${frame}px;width:${innerW}px;height:${innerH}px;background-color:#FFFFF5;background-image:${inlineDotGrid(30, 0.05)};display:flex;flex-direction:column;border:2px solid #f0e8d8;overflow:hidden;box-sizing:border-box;">

  <div style="height:${headerH}px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${Math.round(16*s)}px ${t.pad}px;gap:${Math.round(7*s)}px;border-bottom:3px solid #3d2b1a;overflow:hidden;">
    <div style="display:inline-block;background:#3d2b1a;color:#FFFFF5;font-family:'Nunito',sans-serif;font-weight:800;font-size:${t.badge}px;letter-spacing:2px;text-transform:uppercase;padding:${Math.round(5*s)}px ${Math.round(16*s)}px;border-radius:100px;white-space:nowrap;">{{BADGE}}</div>
    <div style="font-family:'Nunito',sans-serif;font-weight:900;font-size:${t.titleM}px;color:#111111;text-align:center;line-height:1.1;max-width:${Math.round(innerW*0.88)}px;letter-spacing:-0.01em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{TITLE}}</div>
    <div style="width:${Math.round(innerW*0.55)}px;height:2px;background:#3d2b1a;"></div>
  </div>

  <div style="flex:1;padding:${Math.round(10*s)}px ${t.pad}px;display:flex;flex-direction:column;gap:${itemGap}px;min-height:0;overflow:hidden;">
    ${colors.map((c,i) => `
    <div style="flex:1;display:flex;align-items:center;gap:${Math.round(14*s)}px;padding:${Math.round(8*s)}px ${Math.round(14*s)}px;border-radius:${Math.round(8*s)}px;border:1px solid rgba(61,43,26,0.15);background:rgba(255,255,245,0.85);min-height:0;overflow:hidden;box-sizing:border-box;">
      <div style="width:${Math.round(42*s)}px;height:${Math.round(42*s)}px;border-radius:${Math.round(8*s)}px;background:${c};display:flex;align-items:center;justify-content:center;font-family:'Nunito',sans-serif;font-weight:900;font-size:${Math.round(18*s)}px;color:#ffffff;flex-shrink:0;">${i+1}</div>
      <div style="flex-shrink:0;opacity:0.8;">${sketchIcon(getIconTypeForContent('', i), Math.round(26*s), c)}</div>
      <div style="flex:1;min-width:0;overflow:hidden;">
        <div style="font-family:'Nunito',sans-serif;font-weight:800;font-size:${t.bodyL}px;color:#111111;line-height:1.15;margin-bottom:${Math.round(2*s)}px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;">{{P${i+1}_TITLE}}</div>
        <div style="font-family:'Caveat',cursive;font-size:${t.bodyM}px;color:#444444;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{P${i+1}_BODY}}</div>
      </div>
    </div>`).join('')}
  </div>

  <div style="height:${footerH}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-top:2px solid #3d2b1a;background:#FFFFF5;overflow:hidden;">
    <div style="font-family:'Nunito',sans-serif;font-weight:700;font-size:${t.footer}px;color:#3d2b1a;letter-spacing:0.5px;white-space:nowrap;">{{FOOTER}} | Repost ↺</div>
  </div>

</div>
</body></html>`;
}

// ─── TEMPLATE 2: DARK_TECH ───
// Based on: dark background, cyan accents, glassmorphism cards
export function darkTech(w: number, h: number): string {
  const isPortrait = h > 1100;
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:linear-gradient(160deg,#0F172A,#1E293B);font-family:'Inter',sans-serif;padding:${isPortrait ? 28 : 24}px;overflow:hidden;display:flex;flex-direction:column}
.header{display:flex;align-items:flex-start;gap:14px;margin-bottom:${isPortrait ? 16 : 12}px}
.header-text{flex:1;text-align:center}
.header-illust{flex-shrink:0;display:flex;align-items:center}
.badge{display:inline-block;background:#24A89B;color:#000;font-size:10px;font-weight:800;padding:3px 14px;border-radius:14px;margin-bottom:8px;letter-spacing:1.5px;text-transform:uppercase}
.title{font-size:${isPortrait ? 32 : 28}px;font-weight:800;color:#F1F5F9;line-height:1.08}
.title span{color:#24A89B}
.sections{display:flex;flex-direction:column;gap:${isPortrait ? 9 : 7}px;flex:1}
.section{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;backdrop-filter:blur(4px)}
.num{width:30px;height:30px;border-radius:8px;background:var(--c);color:#000;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ico{width:30px;height:30px;border-radius:8px;background:color-mix(in srgb,var(--c) 12%,transparent);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sc{flex:1;min-width:0}
.st{font-size:14px;font-weight:700;color:#F1F5F9;margin-bottom:2px}
.sb{font-size:12px;color:#94A3B8;line-height:1.3}
.sb .a{color:#24A89B;font-weight:700}
.pro-tip{margin-top:auto;padding:10px 14px;background:rgba(0,201,177,0.08);border:1px dashed rgba(0,201,177,0.4);border-radius:8px;display:flex;align-items:flex-start;gap:8px}
.pro-tip-label{font-size:11px;font-weight:900;color:#24A89B;text-transform:uppercase;white-space:nowrap}
.pro-tip-body{font-size:12px;color:#94A3B8;line-height:1.3}
.footer{text-align:center;margin-top:8px;padding-top:10px;border-top:1px solid rgba(36,168,155,0.2);font-size:11px;font-weight:700;color:#24A89B}
.s1{--c:#24A89B}.s2{--c:#3B82F6}.s3{--c:#A78BFA}.s4{--c:#F59E0B}.s5{--c:#EC4899}.s6{--c:#10B981}.s7{--c:#F97316}
</style></head><body>
<div class="header"><div class="header-text"><div class="badge">{{BADGE}}</div><div class="title">{{TITLE}}</div></div><div class="header-illust">{{MAIN_ILLUSTRATION}}</div></div>
<div class="sections">
<div class="section s1"><div class="num">1</div><div class="ico">{{P1_ICON}}</div><div class="sc"><div class="st">{{P1_TITLE}}</div><div class="sb">{{P1_BODY}}</div></div></div>
<div class="section s2"><div class="num">2</div><div class="ico">{{P2_ICON}}</div><div class="sc"><div class="st">{{P2_TITLE}}</div><div class="sb">{{P2_BODY}}</div></div></div>
<div class="section s3"><div class="num">3</div><div class="ico">{{P3_ICON}}</div><div class="sc"><div class="st">{{P3_TITLE}}</div><div class="sb">{{P3_BODY}}</div></div></div>
<div class="section s4"><div class="num">4</div><div class="ico">{{P4_ICON}}</div><div class="sc"><div class="st">{{P4_TITLE}}</div><div class="sb">{{P4_BODY}}</div></div></div>
<div class="section s5"><div class="num">5</div><div class="ico">{{P5_ICON}}</div><div class="sc"><div class="st">{{P5_TITLE}}</div><div class="sb">{{P5_BODY}}</div></div></div>
<div class="section s6"><div class="num">6</div><div class="ico">{{P6_ICON}}</div><div class="sc"><div class="st">{{P6_TITLE}}</div><div class="sb">{{P6_BODY}}</div></div></div>
<div class="section s7"><div class="num">7</div><div class="ico">{{P7_ICON}}</div><div class="sc"><div class="st">{{P7_TITLE}}</div><div class="sb">{{P7_BODY}}</div></div></div>
</div>
<div class="pro-tip"><div class="pro-tip-label">Pro Tip:</div><div class="pro-tip-body">{{PRO_TIP}}</div></div>
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 3: CHEAT_SHEET ───
// Bulletproof: CSS grid forces 3x2 fill. Claude ONLY replaces {{text}}.
export function cheatSheet(w: number, h: number): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{background:#FFFFF5;font-family:'Poppins',sans-serif;border:5px solid #888;padding:20px;display:flex;flex-direction:column}
.header{text-align:center;margin-bottom:10px;padding-bottom:8px;border-bottom:3px double #333}
.title{font-size:24px;font-weight:900;color:#1A1A1A;line-height:1.05;text-transform:uppercase;border:3px solid #333;display:inline-block;padding:3px 16px;border-radius:4px;font-style:normal}
.title span{color:#E53E3E}
.grid{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr 1fr;gap:8px;flex:1}
.card{padding:10px;border-radius:6px;border:2px solid var(--c);display:flex;flex-direction:column}
.card-head{font-size:11px;font-weight:700;color:#fff;background:var(--c);margin:-10px -10px 6px;padding:5px 10px;border-radius:4px 4px 0 0;text-transform:uppercase;letter-spacing:0.5px;font-style:normal}
.card-body{font-size:10px;color:#2D3748;line-height:1.35;flex:1;font-style:normal}
.card-body .a{color:var(--c);font-weight:700}
.c1{--c:#E53E3E}.c2{--c:#3182CE}.c3{--c:#38A169}.c4{--c:#DD6B20}.c5{--c:#9B59B6}.c6{--c:#E91E8C}
.bonus{padding:8px 10px;background:rgba(0,0,0,0.025);border:1.5px dashed #666;border-radius:6px;margin-top:6px}
.bonus-title{font-size:10px;font-weight:900;color:#333;text-transform:uppercase;margin-bottom:2px;text-align:center;font-style:normal}
.bonus-body{font-size:10px;color:#2D3748;line-height:1.35;text-align:center;font-style:normal}
.footer{text-align:center;margin-top:6px;padding-top:6px;border-top:2px solid #333;font-size:10px;font-weight:700;color:#333;font-style:normal}
</style></head><body>
<div class="header"><div class="title">{{TITLE}}</div></div>
<div class="grid">
<div class="card c1"><div class="card-head">{{P1_TITLE}}</div><div class="card-body">{{P1_BODY}}</div></div>
<div class="card c2"><div class="card-head">{{P2_TITLE}}</div><div class="card-body">{{P2_BODY}}</div></div>
<div class="card c3"><div class="card-head">{{P3_TITLE}}</div><div class="card-body">{{P3_BODY}}</div></div>
<div class="card c4"><div class="card-head">{{P4_TITLE}}</div><div class="card-body">{{P4_BODY}}</div></div>
<div class="card c5"><div class="card-head">{{P5_TITLE}}</div><div class="card-body">{{P5_BODY}}</div></div>
<div class="card c6"><div class="card-head">{{P6_TITLE}}</div><div class="card-body">{{P6_BODY}}</div></div>
</div>
<div class="bonus"><div class="bonus-title">{{P7_TITLE}}</div><div class="bonus-body">{{PRO_TIP}}</div></div>
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 4: VIRAL_TIPS ───
// Based on: clean white, numbered circles, minimal
export function viralTips(w: number, h: number): string {
  const isPortrait = h > 1100;
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:#FFFFFF;font-family:'Poppins',sans-serif;padding:${isPortrait ? 28 : 24}px;overflow:hidden;display:flex;flex-direction:column}
.header{display:flex;align-items:flex-start;gap:14px;margin-bottom:${isPortrait ? 14 : 10}px}
.header-text{flex:1;text-align:center}
.header-illust{flex-shrink:0;display:flex;align-items:center}
.badge{display:inline-block;background:linear-gradient(135deg,#6366F1,#EC4899);color:#fff;font-size:10px;font-weight:700;padding:3px 14px;border-radius:14px;margin-bottom:8px;letter-spacing:1px;text-transform:uppercase}
.title{font-size:${isPortrait ? 30 : 26}px;font-weight:900;color:#111;line-height:1.08}
.title span{background:linear-gradient(135deg,#6366F1,#EC4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.sections{display:flex;flex-direction:column;gap:${isPortrait ? 9 : 7}px;flex:1}
.section{display:flex;align-items:flex-start;gap:12px;padding:10px 14px;background:#F8FAFC;border-radius:10px}
.num{width:34px;height:34px;border-radius:50%;background:var(--c);color:#fff;font-size:15px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 3px 10px rgba(0,0,0,0.1)}
.ico{width:32px;height:32px;border-radius:10px;background:color-mix(in srgb,var(--c) 10%,transparent);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sc{flex:1;min-width:0}
.st{font-size:14px;font-weight:700;color:#111;margin-bottom:2px}
.sb{font-size:12px;color:#64748B;line-height:1.3}
.sb .a{color:var(--c);font-weight:700}
.pro-tip{margin-top:auto;padding:10px 14px;background:#F0F0FF;border:2px dashed #6366F1;border-radius:8px;display:flex;align-items:flex-start;gap:8px}
.pro-tip-label{font-size:11px;font-weight:900;color:#6366F1;text-transform:uppercase;white-space:nowrap}
.pro-tip-body{font-size:12px;color:#374151;line-height:1.3}
.footer{text-align:center;margin-top:8px;padding-top:10px;border-top:2px solid #E2E8F0;font-size:11px;font-weight:700;color:#6366F1}
.s1{--c:#6366F1}.s2{--c:#EC4899}.s3{--c:#F59E0B}.s4{--c:#10B981}.s5{--c:#8B5CF6}.s6{--c:#3B82F6}.s7{--c:#EF4444}
</style></head><body>
<div class="header"><div class="header-text"><div class="badge">{{BADGE}}</div><div class="title">{{TITLE}}</div></div><div class="header-illust">{{MAIN_ILLUSTRATION}}</div></div>
<div class="sections">
<div class="section s1"><div class="num">1</div><div class="ico">{{P1_ICON}}</div><div class="sc"><div class="st">{{P1_TITLE}}</div><div class="sb">{{P1_BODY}}</div></div></div>
<div class="section s2"><div class="num">2</div><div class="ico">{{P2_ICON}}</div><div class="sc"><div class="st">{{P2_TITLE}}</div><div class="sb">{{P2_BODY}}</div></div></div>
<div class="section s3"><div class="num">3</div><div class="ico">{{P3_ICON}}</div><div class="sc"><div class="st">{{P3_TITLE}}</div><div class="sb">{{P3_BODY}}</div></div></div>
<div class="section s4"><div class="num">4</div><div class="ico">{{P4_ICON}}</div><div class="sc"><div class="st">{{P4_TITLE}}</div><div class="sb">{{P4_BODY}}</div></div></div>
<div class="section s5"><div class="num">5</div><div class="ico">{{P5_ICON}}</div><div class="sc"><div class="st">{{P5_TITLE}}</div><div class="sb">{{P5_BODY}}</div></div></div>
<div class="section s6"><div class="num">6</div><div class="ico">{{P6_ICON}}</div><div class="sc"><div class="st">{{P6_TITLE}}</div><div class="sb">{{P6_BODY}}</div></div></div>
<div class="section s7"><div class="num">7</div><div class="ico">{{P7_ICON}}</div><div class="sc"><div class="st">{{P7_TITLE}}</div><div class="sb">{{P7_BODY}}</div></div></div>
</div>
<div class="pro-tip"><div class="pro-tip-label">Pro Tip:</div><div class="pro-tip-body">{{PRO_TIP}}</div></div>
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 5: STATS_IMPACT ───
// Based on: hero numbers, data visualization feel
export function statsImpact(w: number, h: number): string {
  const isPortrait = h > 1100;
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:#FFFFF5;font-family:'Poppins',sans-serif;border:6px solid #5D3A1A;padding:${isPortrait ? 26 : 22}px;overflow:hidden;display:flex;flex-direction:column;box-shadow:inset 0 0 40px rgba(0,0,0,0.02)}
.header{text-align:center;margin-bottom:14px}
.badge{display:inline-block;background:#DD6B20;color:#fff;font-size:10px;font-weight:700;padding:3px 12px;border-radius:14px;margin-bottom:8px;letter-spacing:1px;text-transform:uppercase;font-family:'Poppins',sans-serif}
.title{font-size:${isPortrait ? 30 : 26}px;font-weight:900;color:#1A1A1A;line-height:1.08;text-transform:uppercase}
.title span{color:#DD6B20}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.stat{text-align:center;padding:16px 10px;background:rgba(0,0,0,0.02);border-radius:12px;border:2px solid var(--c);display:flex;flex-direction:column;align-items:center;justify-content:center}
.stat-ico{width:36px;height:36px;border-radius:10px;background:color-mix(in srgb,var(--c) 12%,transparent);display:flex;align-items:center;justify-content:center;margin-bottom:6px}
.stat-num{font-size:44px;font-weight:900;color:var(--c);line-height:1;font-family:'Poppins',sans-serif}
.stat-label{font-size:14px;font-weight:700;color:#1A1A1A;margin-top:4px}
.stat-desc{font-size:11px;color:#5D3A1A;margin-top:3px;line-height:1.25}
.c1{--c:#E53E3E}.c2{--c:#3182CE}.c3{--c:#38A169}.c4{--c:#DD6B20}.c5{--c:#9B59B6}.c6{--c:#EC4899}
.details{display:flex;flex-direction:column;gap:7px;flex:1}
.detail{display:flex;align-items:flex-start;gap:8px;padding:8px 10px;background:rgba(0,0,0,0.02);border-radius:6px;border-left:3px solid var(--c)}
.detail .st{font-size:13px;font-weight:700;color:var(--c)}
.detail .sb{font-size:11px;color:#2D3748;line-height:1.3}
.detail .sb .a{color:#DD6B20;font-weight:700}
.footer{text-align:center;margin-top:auto;padding-top:10px;border-top:2px solid #5D3A1A;font-size:12px;font-weight:700;color:#5D3A1A;font-family:'Poppins',sans-serif}
</style></head><body>
<div class="header"><div class="badge">{{BADGE}}</div><div class="title">{{TITLE}}</div></div>
<div class="stats">
<div class="stat c1"><div class="stat-ico">{{P1_ICON}}</div><div class="stat-num">{{P1_TITLE}}</div><div class="stat-label">{{P1_BODY}}</div></div>
<div class="stat c2"><div class="stat-ico">{{P2_ICON}}</div><div class="stat-num">{{P2_TITLE}}</div><div class="stat-label">{{P2_BODY}}</div></div>
<div class="stat c3"><div class="stat-ico">{{P3_ICON}}</div><div class="stat-num">{{P3_TITLE}}</div><div class="stat-label">{{P3_BODY}}</div></div>
<div class="stat c4"><div class="stat-ico">{{P4_ICON}}</div><div class="stat-num">{{P4_TITLE}}</div><div class="stat-label">{{P4_BODY}}</div></div>
</div>
<div class="details">
<div class="detail c5"><div class="sc"><div class="st">{{P5_TITLE}}</div><div class="sb">{{P5_BODY}}</div></div></div>
<div class="detail c6"><div class="sc"><div class="st">{{P6_TITLE}}</div><div class="sb">{{P6_BODY}}</div></div></div>
<div class="detail c1"><div class="sc"><div class="st">{{P7_TITLE}}</div><div class="sb">{{PRO_TIP}}</div></div></div>
</div>
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 6: COMPARISON_VS ───
// Bulletproof: CSS grid forces columns to fill. Claude ONLY replaces {{text}}.
export function comparisonVs(w: number, h: number): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{background:#FFFFF5;font-family:'Poppins',sans-serif;border:5px solid #888;padding:20px;display:flex;flex-direction:column}
.header{text-align:center;margin-bottom:10px}
.title{font-size:24px;font-weight:900;color:#1A1A1A;line-height:1.05;text-transform:uppercase;font-style:normal}
.title .left{color:#3182CE}.title .right{color:#E53E3E}
.vs-container{display:grid;grid-template-columns:1fr 32px 1fr;gap:0;flex:1}
.col{display:flex;flex-direction:column;gap:6px}
.col-head{font-size:13px;font-weight:900;color:#fff;padding:7px;border-radius:6px;text-align:center;text-transform:uppercase;font-style:normal}
.col-left .col-head{background:#3182CE}
.col-right .col-head{background:#E53E3E}
.row{padding:8px 10px;border-radius:5px;font-size:11px;color:#2D3748;line-height:1.3;flex:1;font-style:normal}
.row .a{font-weight:700}
.col-left .row{background:rgba(49,130,206,0.06);border-left:3px solid #3182CE}
.col-right .row{background:rgba(229,62,62,0.06);border-left:3px solid #E53E3E}
.row-title{font-weight:700;font-size:12px;margin-bottom:2px;font-style:normal}
.col-left .row-title{color:#3182CE}
.col-right .row-title{color:#E53E3E}
.col-left .row .a{color:#3182CE}
.col-right .row .a{color:#E53E3E}
.vs{display:flex;align-items:center;justify-content:center}
.vs-badge{width:32px;height:32px;border-radius:50%;background:#1A1A1A;color:#FFF;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
.verdict{padding:8px 12px;background:rgba(56,161,105,0.06);border:1.5px solid #38A169;border-radius:6px;text-align:center;margin-top:6px}
.verdict-label{font-size:10px;font-weight:900;color:#38A169;text-transform:uppercase;margin-bottom:2px;font-style:normal}
.verdict-body{font-size:11px;color:#2D3748;line-height:1.3;font-style:normal}
.footer{text-align:center;margin-top:6px;padding-top:6px;border-top:2px solid #888;font-size:10px;font-weight:700;color:#555;font-style:normal}
</style></head><body>
<div class="header"><div class="title">{{TITLE}}</div></div>
<div class="vs-container">
<div class="col col-left">
<div class="col-head">{{P1_TITLE}}</div>
<div class="row"><div class="row-title">{{P2_TITLE}}</div>{{P2_BODY}}</div>
<div class="row"><div class="row-title">{{P3_TITLE}}</div>{{P3_BODY}}</div>
<div class="row"><div class="row-title">{{P4_TITLE}}</div>{{P4_BODY}}</div>
</div>
<div class="vs"><div class="vs-badge">VS</div></div>
<div class="col col-right">
<div class="col-head">{{P1_BODY}}</div>
<div class="row"><div class="row-title">{{P5_TITLE}}</div>{{P5_BODY}}</div>
<div class="row"><div class="row-title">{{P6_TITLE}}</div>{{P6_BODY}}</div>
<div class="row"><div class="row-title">{{P7_TITLE}}</div>{{P7_BODY}}</div>
</div>
</div>
<div class="verdict"><div class="verdict-label">Verdict</div><div class="verdict-body">{{PRO_TIP}}</div></div>
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 7: AWA_BREAKING ───
// For urgent/breaking news style — maximum impact, dense points
export function awaBreaking(w: number, h: number): string {
  const isPortrait = h > 1100;
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:#FFFFF5;font-family:'Poppins',sans-serif;border:8px solid #5D3A1A;padding:${isPortrait ? 26 : 22}px;overflow:hidden;display:flex;flex-direction:column;box-shadow:inset 0 0 60px rgba(0,0,0,0.02)}
.alert{text-align:center;margin-bottom:10px}
.alert-badge{display:inline-block;background:#E53E3E;color:#fff;font-size:12px;font-weight:900;padding:5px 18px;border-radius:18px;letter-spacing:1.5px;text-transform:uppercase;box-shadow:0 3px 12px rgba(229,62,62,0.3)}
.header{display:flex;align-items:flex-start;gap:14px;margin-bottom:16px;padding-bottom:12px;border-bottom:4px solid #E53E3E}
.header-text{flex:1;text-align:center}
.header-illust{flex-shrink:0;display:flex;align-items:center}
.title{font-size:${isPortrait ? 34 : 30}px;font-weight:900;color:#1A1A1A;line-height:1.08;text-transform:uppercase;letter-spacing:-0.5px}
.title span{color:#E53E3E}
.sections{display:flex;flex-direction:column;gap:${isPortrait ? 9 : 7}px;flex:1}
.section{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:rgba(229,62,62,0.03);border-radius:10px;border-left:4px solid var(--c)}
.num{width:32px;height:32px;border-radius:50%;background:var(--c);color:#fff;font-size:14px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.12)}
.ico{width:32px;height:32px;border-radius:8px;background:color-mix(in srgb,var(--c) 12%,transparent);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sc{flex:1;min-width:0}
.st{font-size:14px;font-weight:700;color:var(--c);margin-bottom:2px}
.sb{font-size:12px;color:#374151;line-height:1.3}
.sb .a{color:#E53E3E;font-weight:700}
.what-now{margin-top:auto;padding:10px 14px;background:rgba(56,161,105,0.06);border:2px solid #38A169;border-radius:8px}
.what-now-label{font-size:12px;font-weight:900;color:#38A169;text-transform:uppercase;margin-bottom:3px}
.what-now-body{font-size:12px;color:#2D3748;line-height:1.3}
.footer{text-align:center;margin-top:8px;padding-top:10px;border-top:3px solid #5D3A1A;font-size:12px;font-weight:700;color:#5D3A1A}
.s1{--c:#E53E3E}.s2{--c:#3182CE}.s3{--c:#38A169}.s4{--c:#DD6B20}.s5{--c:#9B59B6}.s6{--c:#EC4899}.s7{--c:#00897B}
</style></head><body>
<div class="alert"><div class="alert-badge">{{BADGE}}</div></div>
<div class="header"><div class="header-text"><div class="title">{{TITLE}}</div></div><div class="header-illust">{{MAIN_ILLUSTRATION}}</div></div>
<div class="sections">
<div class="section s1"><div class="num">1</div><div class="ico">{{P1_ICON}}</div><div class="sc"><div class="st">{{P1_TITLE}}</div><div class="sb">{{P1_BODY}}</div></div></div>
<div class="section s2"><div class="num">2</div><div class="ico">{{P2_ICON}}</div><div class="sc"><div class="st">{{P2_TITLE}}</div><div class="sb">{{P2_BODY}}</div></div></div>
<div class="section s3"><div class="num">3</div><div class="ico">{{P3_ICON}}</div><div class="sc"><div class="st">{{P3_TITLE}}</div><div class="sb">{{P3_BODY}}</div></div></div>
<div class="section s4"><div class="num">4</div><div class="ico">{{P4_ICON}}</div><div class="sc"><div class="st">{{P4_TITLE}}</div><div class="sb">{{P4_BODY}}</div></div></div>
<div class="section s5"><div class="num">5</div><div class="ico">{{P5_ICON}}</div><div class="sc"><div class="st">{{P5_TITLE}}</div><div class="sb">{{P5_BODY}}</div></div></div>
<div class="section s6"><div class="num">6</div><div class="ico">{{P6_ICON}}</div><div class="sc"><div class="st">{{P6_TITLE}}</div><div class="sb">{{P6_BODY}}</div></div></div>
</div>
<div class="what-now"><div class="what-now-label">{{P7_TITLE}}</div><div class="what-now-body">{{PRO_TIP}}</div></div>
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 8: AWA_MASTERCLASS ───
// For "How to master X in Y minutes" — structured learning layout
export function awaMasterclass(w: number, h: number): string {
  const isPortrait = h > 1100;
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:#FFFFF8;font-family:'Poppins',sans-serif;border:5px solid #666;padding:${isPortrait ? 24 : 20}px;overflow:hidden;display:flex;flex-direction:column;box-shadow:inset 0 0 40px rgba(0,0,0,0.02)}
.header{margin-bottom:14px}
.title-box{display:inline-block;border:3px solid #1A1A1A;border-radius:6px;padding:5px 18px;margin-bottom:10px}
.title{font-size:${isPortrait ? 28 : 24}px;font-weight:900;color:#1A1A1A;line-height:1.08;text-transform:uppercase;letter-spacing:-0.5px}
.title span{color:#E53E3E}
.subtitle{font-size:11px;color:#666;line-height:1.35;margin-top:8px}
.content{display:grid;grid-template-columns:1fr 1fr;gap:10px;flex:1}
.block{padding:12px;border-radius:8px;border:2px solid var(--c)}
.block-head{font-size:13px;font-weight:700;color:#fff;background:var(--c);margin:-12px -12px 8px;padding:7px 12px;border-radius:6px 6px 0 0;text-transform:uppercase;letter-spacing:0.3px}
.block-body{font-size:11px;color:#374151;line-height:1.4}
.block-body b{color:var(--c);font-weight:700}
.block-body .a{color:var(--c);font-weight:700}
.b1{--c:#E53E3E}.b2{--c:#3182CE}.b3{--c:#38A169}.b4{--c:#DD6B20}.b5{--c:#9B59B6}.b6{--c:#E91E8C}
.learn-section{margin-top:8px;padding:12px;background:rgba(0,0,0,0.02);border-radius:8px;border:2px dashed #999}
.learn-title{font-size:14px;font-weight:900;color:#1A1A1A;text-transform:uppercase;margin-bottom:6px;text-align:center}
.learn-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.learn-item{font-size:11px;color:#374151;line-height:1.35}
.learn-item b{color:#E53E3E}
.learn-item .a{color:#E53E3E;font-weight:700}
.footer{text-align:center;margin-top:auto;padding-top:8px;border-top:2px solid #666;font-size:12px;font-weight:700;color:#666}
</style></head><body>
<div class="header"><div class="title-box"><div class="title">{{TITLE}}</div></div></div>
<div class="content">
<div class="block b1"><div class="block-head">{{P1_TITLE}}</div><div class="block-body">{{P1_BODY}}</div></div>
<div class="block b2"><div class="block-head">{{P2_TITLE}}</div><div class="block-body">{{P2_BODY}}</div></div>
<div class="block b3"><div class="block-head">{{P3_TITLE}}</div><div class="block-body">{{P3_BODY}}</div></div>
<div class="block b4"><div class="block-head">{{P4_TITLE}}</div><div class="block-body">{{P4_BODY}}</div></div>
</div>
<div class="learn-section"><div class="learn-title">{{P5_TITLE}}</div><div class="learn-grid"><div class="learn-item">{{P5_BODY}}</div><div class="learn-item">{{P6_BODY}}</div><div class="learn-item">{{P7_BODY}}</div><div class="learn-item">{{PRO_TIP}}</div></div></div>
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 9: UI_CARDS ───
export function uiCards(w: number, h: number): string {
  const t = typography(w);
  const s = w / 1080;
  const headerH = Math.round(h * 0.20);
  const footerH = Math.round(h * 0.09);
  const cardGap = Math.round(14 * s);

  const cards = [
    { bg:'#FFF0F0', border:'#FFCCCC', numBg:'#FFB3B3', numColor:'#CC0000', labelBg:'#FFB3B3', labelColor:'#8B0000', label:'❌ Avoid' },
    { bg:'#FEF9E7', border:'#FFE5A0', numBg:'#FFD4A3', numColor:'#CC6600', labelBg:'#FFD4A3', labelColor:'#7A4000', label:'⚡ Better' },
    { bg:'#F0FFF4', border:'#B3EED0', numBg:'#B3FFD1', numColor:'#006633', labelBg:'#B3FFD1', labelColor:'#005500', label:'🏆 Best' },
  ];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="width:${w}px;height:${h}px;overflow:hidden;margin:0;padding:0;box-sizing:border-box;background-color:#f8f9f7;background-image:${inlineDotGrid(28, 0.07)};font-family:'Caveat',cursive;display:flex;flex-direction:column;">

<div style="height:${headerH}px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${Math.round(20*s)}px ${t.pad}px;gap:${t.gapSm}px;overflow:hidden;">
  <div style="display:inline-block;background:#111111;color:#f8f9f7;font-family:'Nunito',sans-serif;font-weight:800;font-size:${t.badge}px;letter-spacing:2.5px;text-transform:uppercase;padding:${Math.round(6*s)}px ${Math.round(22*s)}px;border-radius:100px;white-space:nowrap;">{{BADGE}}</div>
  <div style="font-family:'Nunito',sans-serif;font-weight:900;font-size:${t.titleL}px;color:#111111;text-align:center;line-height:1.1;max-width:${Math.round(w*0.85)}px;letter-spacing:-0.01em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{TITLE}}</div>
</div>

<div style="flex:1;padding:0 ${t.pad}px ${Math.round(16*s)}px;display:flex;flex-direction:column;gap:${cardGap}px;min-height:0;overflow:hidden;">
${cards.map((c,i) => `
  <div style="flex:1;background:${c.bg};border:1.5px solid ${c.border};border-radius:${t.radiusLg}px;padding:0 ${Math.round(28*s)}px;display:flex;align-items:center;gap:${Math.round(20*s)}px;min-height:0;overflow:hidden;box-sizing:border-box;">
    <div style="width:${Math.round(56*s)}px;height:${Math.round(56*s)}px;border-radius:50%;background:${c.numBg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      ${i === 0 ? sketchIcon('cross', Math.round(28*s), c.numColor) : i === 1 ? sketchIcon('lightbulb', Math.round(28*s), c.numColor) : sketchIcon('check', Math.round(28*s), c.numColor)}
    </div>
    <div style="flex:1;min-width:0;overflow:hidden;">
      <div style="display:inline-flex;align-items:center;background:${c.labelBg};color:${c.labelColor};font-family:'Nunito',sans-serif;font-weight:900;font-size:${t.label}px;text-transform:uppercase;letter-spacing:2px;padding:${Math.round(3*s)}px ${Math.round(10*s)}px;border-radius:100px;margin-bottom:${Math.round(6*s)}px;white-space:nowrap;">${c.label}</div>
      <div style="font-family:'Nunito',sans-serif;font-weight:700;font-size:${t.titleS}px;color:#111111;line-height:1.15;margin-bottom:${Math.round(5*s)}px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{P${i+1}_TITLE}}</div>
      <div style="font-family:'Caveat',cursive;font-size:${t.bodyM}px;color:#444444;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;">{{P${i+1}_BODY}}</div>
    </div>
  </div>`).join('')}
</div>

<div style="height:${footerH}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:${Math.round(8*s)}px;border-top:1px solid #E8E8E2;background:#f8f9f7;overflow:hidden;">
  <div style="width:5px;height:5px;border-radius:50%;background:#24A89B;flex-shrink:0;"></div>
  <div style="font-family:'Nunito',sans-serif;font-weight:700;font-size:${t.footer}px;color:#24A89B;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;">{{FOOTER}} | Repost ↺</div>
  <div style="width:5px;height:5px;border-radius:50%;background:#24A89B;flex-shrink:0;"></div>
</div>

</body></html>`;
}

// ─── TEMPLATE 10: WHITEBOARD ───
export function whiteboard(w: number, h: number): string {
  const t = typography(w);
  const s = w / 1080;
  const headerH = Math.round(h * 0.19);
  const footerH = Math.round(h * 0.09);
  const borderColors = ['#C0392B','#2563EB','#4A8B35','#F5922A','#C0392B','#2563EB','#4A8B35'];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="width:${w}px;height:${h}px;overflow:hidden;margin:0;padding:0;box-sizing:border-box;background-color:#f8f9f7;background-image:${inlineDotGrid(28, 0.08)};font-family:'Caveat',cursive;display:flex;flex-direction:column;border:0.5px solid #e0e0e0;position:relative;">

<div style="position:absolute;top:6px;left:6px;width:${Math.round(10*s)}px;height:${Math.round(16*s)}px;background:#555;border-radius:2px;z-index:10;"></div>
<div style="position:absolute;top:6px;right:6px;width:${Math.round(10*s)}px;height:${Math.round(16*s)}px;background:#555;border-radius:2px;z-index:10;"></div>
<div style="position:absolute;bottom:6px;left:6px;width:${Math.round(10*s)}px;height:${Math.round(16*s)}px;background:#555;border-radius:2px;z-index:10;"></div>
<div style="position:absolute;bottom:6px;right:6px;width:${Math.round(10*s)}px;height:${Math.round(16*s)}px;background:#555;border-radius:2px;z-index:10;"></div>

<div style="height:${headerH}px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${Math.round(20*s)}px ${t.pad}px ${Math.round(16*s)}px;gap:${t.gapSm}px;overflow:hidden;">
  <div style="display:inline-block;background:#C0392B;color:#fff;font-family:'Nunito',sans-serif;font-weight:800;font-size:${t.badge}px;letter-spacing:2px;text-transform:uppercase;padding:${Math.round(5*s)}px ${Math.round(18*s)}px;border-radius:100px;white-space:nowrap;">{{BADGE}}</div>
  <div style="font-family:'Nunito',sans-serif;font-weight:900;font-size:${t.titleL}px;color:#111111;text-align:center;line-height:1.1;max-width:${Math.round(w*0.88)}px;letter-spacing:-0.01em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">[{{TITLE}}]</div>
  <svg width="${Math.round(w*0.65)}" height="6" viewBox="0 0 200 6" fill="none" style="display:block;margin:0 auto;"><path d="M 0 3 Q 12 1 25 3 Q 37 5 50 3 Q 62 1 75 3 Q 87 5 100 3 Q 112 1 125 3 Q 137 5 150 3 Q 162 1 175 3 Q 187 5 200 3" stroke="#C0392B" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
</div>

<div style="flex:1;padding:${t.gapSm}px ${t.pad}px;display:flex;flex-direction:column;gap:${t.gap}px;min-height:0;overflow:hidden;">
${[1,2,3,4,5,6,7].map((n,i) => `
  <div style="flex:1;display:flex;align-items:center;gap:${t.gapSm}px;background:#ffffff;border-radius:${t.radius}px;padding:${Math.round(8*s)}px ${Math.round(16*s)}px;border-left:4px solid ${borderColors[i]};min-height:0;overflow:hidden;box-sizing:border-box;">
    <div style="position:relative;flex-shrink:0;width:${t.num}px;height:${Math.round(t.num*0.85)}px;">
      <svg width="${t.num}" height="${Math.round(t.num*0.85)}" viewBox="0 0 44 38" fill="none" style="display:block;"><ellipse cx="22" cy="19" rx="20" ry="17" stroke="#111111" stroke-width="2.2" stroke-linecap="round" fill="white"/><text x="22" y="25" text-anchor="middle" font-family="'Nunito',sans-serif" font-weight="900" font-size="16" fill="#111111">${n < 10 ? '0'+n : n}</text></svg>
    </div>
    <div style="flex-shrink:0;opacity:0.85;">${sketchIcon(getIconTypeForContent('', i), t.icon, borderColors[i])}</div>
    <div style="flex:1;min-width:0;overflow:hidden;">
      <div style="font-family:'Nunito',sans-serif;font-weight:800;font-size:${t.titleS}px;color:#111111;line-height:1.15;margin-bottom:${Math.round(3*s)}px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;white-space:normal;">{{P${n}_TITLE}}</div>
      <div style="font-family:'Caveat',cursive;font-size:${t.bodyM}px;color:#444444;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;white-space:normal;">{{P${n}_BODY}}</div>
    </div>
  </div>`).join('')}
</div>

<div style="height:${footerH}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-top:0.5px solid #cccccc;background:#fafafa;overflow:hidden;">
  <div style="font-family:'Nunito',sans-serif;font-weight:700;font-size:${t.footer}px;color:#333333;white-space:nowrap;">{{FOOTER}} | Repost ↺</div>
</div>

</body></html>`;
}

// ─── TEMPLATE 11: FUNNEL ───
export function funnel(w: number, h: number): string {
  const t = typography(w);
  const s = w / 1080;
  const cardH = Math.round(84 * s);
  const arrowH = Math.round(36 * s);
  const spacer = Math.round(20 * s);

  const steps = [
    { bg:'#B83228', badgeColor:'#B83228', textColor:'#ffffff', width:'100%' },
    { bg:'#E07B20', badgeColor:'#E07B20', textColor:'#ffffff', width:'88%' },
    { bg:'#D4A017', badgeColor:'#8B6914', textColor:'#ffffff', width:'76%' },
    { bg:'#2E7D32', badgeColor:'#2E7D32', textColor:'#ffffff', width:'64%' },
    { bg:'#1565C0', badgeColor:'#1565C0', textColor:'#ffffff', width:'52%' },
  ];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="width:${w}px;min-height:${h}px;overflow:hidden;margin:0;padding:${t.pad}px;box-sizing:border-box;background-color:#fffef5;background-image:${inlineDotGrid(30, 0.06)};font-family:'Caveat',cursive;">

<div style="text-align:center;margin-bottom:${Math.round(6*s)}px;overflow:hidden;">
  <div style="font-family:'Nunito',sans-serif;font-weight:900;font-size:${t.titleL}px;line-height:1.1;color:#111111;letter-spacing:-0.01em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{TITLE}}</div>
</div>
<div style="text-align:center;font-family:'Caveat',cursive;font-size:${t.bodyM}px;color:#666666;font-style:italic;margin-bottom:${Math.round(16*s)}px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">{{P6_BODY}}</div>
<div style="text-align:center;margin-bottom:${spacer}px;">
  <span style="display:inline-block;background:#111111;color:#ffffff;font-family:'Nunito',sans-serif;font-weight:800;font-size:${t.badge}px;letter-spacing:2px;text-transform:uppercase;padding:${Math.round(5*s)}px ${Math.round(18*s)}px;border-radius:100px;white-space:nowrap;">{{BADGE}}</span>
</div>

${steps.map((step, i) => `
<div style="background:${step.bg};border-radius:${t.radius}px;display:flex;align-items:center;min-height:${cardH}px;width:${step.width};margin:0 auto;overflow:hidden;box-sizing:border-box;">
  <div style="width:${Math.round(44*s)}px;height:${Math.round(44*s)}px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:${Math.round(16*s)}px;font-family:'Nunito',sans-serif;font-weight:900;font-size:${Math.round(18*s)}px;color:${step.badgeColor};">${i+1}</div>
  <div style="flex-shrink:0;margin-left:${Math.round(10*s)}px;opacity:0.9;">${sketchIcon(getIconTypeForContent('', i), Math.round(28*s), 'rgba(255,255,255,0.85)')}</div>
  <div style="padding:${Math.round(10*s)}px ${Math.round(16*s)}px ${Math.round(10*s)}px ${Math.round(10*s)}px;flex:1;min-width:0;overflow:hidden;">
    <div style="font-family:'Nunito',sans-serif;font-weight:700;font-size:${t.titleS}px;color:#ffffff;line-height:1.15;margin-bottom:${Math.round(3*s)}px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;">{{P${i+1}_TITLE}}</div>
    <div style="font-family:'Caveat',cursive;font-size:${t.bodyS}px;color:rgba(255,255,255,0.88);font-style:italic;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{P${i+1}_BODY}}</div>
  </div>
</div>
${i < 4 ? `<div style="text-align:center;height:${arrowH}px;display:flex;align-items:center;justify-content:center;">${sketchIcon('arrowDown', Math.round(22*s), '#C0392B')}</div>` : ''}`).join('')}

<div style="border:1.5px solid #2E7D32;border-radius:${t.radius}px;padding:${Math.round(14*s)}px ${Math.round(18*s)}px;margin-top:${spacer}px;background:#ffffff;overflow:hidden;">
  <div style="font-family:'Nunito',sans-serif;font-weight:800;font-size:${Math.round(12*s)}px;color:#2E7D32;margin-bottom:${Math.round(5*s)}px;text-transform:uppercase;letter-spacing:0.05em;display:flex;align-items:center;gap:${Math.round(6*s)}px;">${sketchIcon('lightbulb', Math.round(18*s), '#2E7D32')} PRO TIP:</div>
  <div style="font-family:'Caveat',cursive;font-size:${t.bodyL}px;color:#333333;font-style:italic;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{PRO_TIP}}</div>
</div>

<div style="text-align:center;padding:${Math.round(18*s)}px 0 0;border-top:0.5px solid #cccccc;margin-top:${spacer}px;font-family:'Nunito',sans-serif;font-weight:600;font-size:${t.footer}px;color:#333333;white-space:nowrap;overflow:hidden;">
  {{FOOTER}} | Repost ↺
</div>

</body></html>`;
}

// ─── TEMPLATE 12: DATA_GRID ───
export function dataGrid(w: number, h: number): string {
  const t = typography(w);
  const s = w / 1080;
  const headerH = Math.round(h * 0.19);
  const footerH = Math.round(h * 0.09);
  const thH = Math.round(52 * s);
  const dots = ['#C0392B','#D4A017','#2E7D32','#8B5CF6'];
  const rowBgs = ['#ffffff','#f9fafb','#ffffff','#f9fafb'];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="width:${w}px;height:${h}px;overflow:hidden;margin:0;padding:0;box-sizing:border-box;background-color:#f8f9f7;background-image:${inlineLineGrid(28, 0.06)};font-family:'Caveat',cursive;display:flex;flex-direction:column;">

<div style="height:${headerH}px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${Math.round(20*s)}px ${t.pad}px;gap:${t.gapSm}px;border-bottom:2px solid #C0392B;overflow:hidden;">
  <div style="display:inline-block;background:#2563EB;color:#ffffff;font-family:'Nunito',sans-serif;font-weight:800;font-size:${t.badge}px;letter-spacing:2px;text-transform:uppercase;padding:${Math.round(5*s)}px ${Math.round(18*s)}px;border-radius:100px;white-space:nowrap;">{{BADGE}}</div>
  <div style="font-family:'Nunito',sans-serif;font-weight:900;font-size:${t.titleL}px;color:#111111;text-align:center;line-height:1.1;max-width:${Math.round(w*0.85)}px;letter-spacing:-0.01em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{TITLE}}</div>
</div>

<div style="flex:1;padding:0 ${t.pad}px ${Math.round(14*s)}px;display:flex;flex-direction:column;min-height:0;overflow:hidden;">
  <div style="flex:1;border-radius:${t.radius}px;overflow:hidden;border:1.5px solid #e0e0e0;display:flex;flex-direction:column;box-shadow:0 2px 12px rgba(0,0,0,0.05);min-height:0;">
    <div style="height:${thH}px;flex-shrink:0;display:grid;grid-template-columns:1.2fr 2fr 1fr;background:#f5f5f5;border-bottom:2px solid #e0e0e0;padding:0 ${Math.round(18*s)}px;gap:${Math.round(10*s)}px;align-items:center;">
      <div style="font-family:'Nunito',sans-serif;font-weight:900;font-size:${t.badge}px;text-transform:uppercase;letter-spacing:1px;color:#C0392B;white-space:nowrap;overflow:hidden;">Concept</div>
      <div style="font-family:'Nunito',sans-serif;font-weight:900;font-size:${t.badge}px;text-transform:uppercase;letter-spacing:1px;color:#2563EB;white-space:nowrap;overflow:hidden;">Description</div>
      <div style="font-family:'Nunito',sans-serif;font-weight:900;font-size:${t.badge}px;text-transform:uppercase;letter-spacing:1px;color:#4A8B35;white-space:nowrap;overflow:hidden;">Best For</div>
    </div>
    ${[0,1,2,3].map(i => `
    <div style="flex:1;display:grid;grid-template-columns:1.2fr 2fr 1fr;align-items:center;padding:0 ${Math.round(18*s)}px;gap:${Math.round(10*s)}px;border-bottom:0.5px solid #e8e8e8;background:${rowBgs[i]};min-height:0;overflow:hidden;box-sizing:border-box;">
      <div style="display:flex;align-items:center;gap:${Math.round(8*s)}px;overflow:hidden;">
        <div style="width:${Math.round(14*s)}px;height:${Math.round(14*s)}px;border-radius:50%;background:${dots[i]};flex-shrink:0;"></div>
        <div style="font-family:'Nunito',sans-serif;font-weight:800;font-size:${t.bodyS}px;color:#111111;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;">{{P${i+1}_TITLE}}</div>
      </div>
      <div style="font-family:'Caveat',cursive;font-size:${t.bodyM}px;color:#444444;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{P${i+1}_BODY}}</div>
      <div style="font-family:'Nunito',sans-serif;font-weight:700;font-size:${Math.round(t.bodyS*0.9)}px;color:#4A8B35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{P${i+5}_TITLE}}</div>
    </div>`).join('')}
  </div>
  <div style="margin-top:${Math.round(14*s)}px;padding:${Math.round(12*s)}px ${Math.round(18*s)}px;background:#fffdf0;border-radius:${t.radius}px;border-left:4px solid #C0392B;display:flex;gap:${Math.round(12*s)}px;align-items:flex-start;flex-shrink:0;overflow:hidden;">
    <div style="flex-shrink:0;">${sketchIcon('lightbulb', Math.round(22*s), '#C0392B')}</div>
    <div style="flex:1;min-width:0;overflow:hidden;">
      <div style="font-family:'Nunito',sans-serif;font-weight:900;font-size:${Math.round(t.badge*0.9)}px;color:#C0392B;text-transform:uppercase;letter-spacing:1px;margin-bottom:${Math.round(3*s)}px;">★ Key Takeaway</div>
      <div style="font-family:'Caveat',cursive;font-size:${t.bodyL}px;color:#111111;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{PRO_TIP}}</div>
    </div>
  </div>
</div>

<div style="height:${footerH}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:${Math.round(8*s)}px;border-top:1px solid #e0e0e0;background:#fafafa;overflow:hidden;">
  <div style="font-family:'Nunito',sans-serif;font-weight:700;font-size:${t.footer}px;color:#2563EB;white-space:nowrap;">{{FOOTER}}</div>
  <div style="font-family:'Nunito',sans-serif;font-weight:700;font-size:${t.footer}px;color:#444444;white-space:nowrap;">| Repost ↺</div>
</div>

</body></html>`;
}

// ─── Template registry ───

export const TEMPLATE_REGISTRY: Record<string, (w: number, h: number) => string> = {
  AWA_CLASSIC: awaClassic,
  DARK_TECH: darkTech,
  CHEAT_SHEET: cheatSheet,
  VIRAL_TIPS: viralTips,
  STATS_IMPACT: statsImpact,
  COMPARISON_VS: comparisonVs,
  AWA_BREAKING: awaBreaking,
  AWA_MASTERCLASS: awaMasterclass,
  UI_CARDS: uiCards,
  WHITEBOARD: whiteboard,
  FUNNEL: funnel,
  DATA_GRID: dataGrid,
};

export const TEMPLATE_IDS = Object.keys(TEMPLATE_REGISTRY) as string[];

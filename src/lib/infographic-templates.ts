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

// ─── TEMPLATE 1: AWA_CLASSIC ───
// Bulletproof: CSS forces vertical fill. Claude ONLY replaces {{text}}.
export function awaClassic(w: number, h: number): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{background:#FFFFF5;font-family:'Poppins',sans-serif;border:6px solid #5D3A1A;padding:22px;display:flex;flex-direction:column}
.header{display:flex;align-items:center;gap:12px;margin-bottom:10px;padding-bottom:10px;border-bottom:3px solid #E53E3E}
.header-text{flex:1}
.header-illust{flex-shrink:0}
.badge{display:inline-block;background:#E53E3E;color:#fff;font-size:9px;font-weight:700;padding:2px 10px;border-radius:10px;margin-bottom:6px;letter-spacing:1px;text-transform:uppercase}
.title{font-size:26px;font-weight:900;color:#1A1A1A;line-height:1.05;text-transform:uppercase;letter-spacing:-0.5px;font-style:normal}
.title span{color:#E53E3E}
.sections{display:flex;flex-direction:column;justify-content:space-between;flex:1;gap:0}
.section{display:flex;align-items:flex-start;gap:8px;padding:8px 10px;background:rgba(0,0,0,0.018);border-radius:6px;border-left:3px solid var(--c);flex:1}
.num{width:26px;height:26px;min-width:26px;border-radius:50%;background:var(--c);color:#fff;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-style:normal}
.ico{width:26px;height:26px;min-width:26px;border-radius:6px;background:color-mix(in srgb,var(--c) 10%,transparent);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sc{flex:1;min-width:0}
.st{font-size:13px;font-weight:700;color:var(--c);margin-bottom:1px;font-style:normal}
.sb{font-size:11px;color:#2D3748;line-height:1.35;font-style:normal}
.sb .a{color:#E53E3E;font-weight:700}
.tip{padding:8px 10px;background:rgba(229,62,62,0.04);border:1.5px dashed #E53E3E;border-radius:6px;display:flex;gap:6px;align-items:flex-start;margin-top:6px}
.tip b{font-size:9px;font-weight:900;color:#E53E3E;text-transform:uppercase;white-space:nowrap;letter-spacing:0.5px}
.tip span{font-size:11px;color:#2D3748;line-height:1.3;font-style:normal}
.footer{text-align:center;margin-top:6px;padding-top:6px;border-top:2px solid #5D3A1A;font-size:10px;font-weight:700;color:#5D3A1A;font-style:normal}
.s1{--c:#E53E3E}.s2{--c:#3182CE}.s3{--c:#38A169}.s4{--c:#DD6B20}.s5{--c:#9B59B6}.s6{--c:#EC4899}.s7{--c:#00897B}
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
<div class="tip"><b>Pro Tip:</b><span>{{PRO_TIP}}</span></div>
<div class="footer">{{FOOTER}}</div>
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
// 3-tier Bad/Good/Great comparison with the official Supen pastel palette.
// The Excellent card is visually elevated with a "★ Cible" badge and a green sidebar
// of supporting reasons. Inspired by the meta-prompt visual grammar rules.
export function uiCards(w: number, h: number): string {
  const isPortrait = h > 1100;
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{background:#F8F9FA;background-image:linear-gradient(rgba(0,0,0,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.018) 1px,transparent 1px);background-size:32px 32px;font-family:'Inter',-apple-system,system-ui,sans-serif;padding:${isPortrait ? 40 : 34}px ${isPortrait ? 38 : 32}px;display:flex;flex-direction:column;color:#1A1A1A}
.header{text-align:center;margin-bottom:${isPortrait ? 20 : 16}px}
.kicker{display:inline-block;background:#AEC6CF;color:#1F2937;font-size:10px;font-weight:800;padding:5px 14px;border-radius:20px;margin-bottom:10px;letter-spacing:1.5px;text-transform:uppercase;font-style:normal}
.title{font-family:'Playfair Display','Georgia',serif;font-size:${isPortrait ? 36 : 30}px;font-weight:900;color:#1A1A1A;line-height:1.12;letter-spacing:-0.5px;font-style:normal}
.title span{background:linear-gradient(180deg,transparent 58%,#FFE066 58%);padding:0 6px}
.cards{display:flex;flex-direction:column;gap:${isPortrait ? 12 : 10}px;flex:1;min-height:0}
.card{position:relative;background:#FFFFFF;border-radius:14px;padding:${isPortrait ? 18 : 14}px ${isPortrait ? 22 : 18}px;box-shadow:0 4px 18px rgba(15,23,42,0.07),0 0 0 1px rgba(15,23,42,0.04);display:flex;flex-direction:column;flex:1;min-height:0}
.card.l1{border-left:5px solid #FFB3B3}
.card.l2{border-left:5px solid #FFD4A3}
.card.l3{border-left:5px solid #B3FFD1;box-shadow:0 6px 22px rgba(56,161,105,0.16),0 0 0 1px #B3FFD1}
.label-pill{align-self:flex-start;display:inline-block;font-size:10px;font-weight:800;padding:4px 12px;border-radius:14px;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;font-style:normal}
.l1 .label-pill{background:#FFB3B3;color:#9B1C1C}
.l2 .label-pill{background:#FFD4A3;color:#92400E}
.l3 .label-pill{background:#B3FFD1;color:#14532D}
.target-badge{position:absolute;top:${isPortrait ? 18 : 14}px;right:${isPortrait ? 22 : 18}px;background:#16803C;color:#fff;font-size:9px;font-weight:800;padding:4px 10px;border-radius:12px;letter-spacing:1px;text-transform:uppercase;font-style:normal;display:flex;align-items:center;gap:4px}
.target-badge::before{content:'★';font-size:11px;line-height:1}
.card-title{font-family:'Playfair Display','Georgia',serif;font-size:${isPortrait ? 19 : 17}px;font-weight:700;color:#1A1A1A;margin-bottom:5px;line-height:1.2;padding-right:60px;font-style:normal}
.card-body{font-size:${isPortrait ? 13 : 12}px;color:#4B5563;line-height:1.5;font-weight:400;font-style:normal}
.card-body .a{font-weight:700;color:#1A1A1A;background:linear-gradient(180deg,transparent 60%,#FFE066 60%);padding:0 2px}
.why{margin-top:${isPortrait ? 14 : 11}px;background:#EAFBEF;border-radius:12px;padding:${isPortrait ? 14 : 11}px ${isPortrait ? 16 : 14}px;border:1px solid #B3FFD1}
.why-title{font-size:10px;font-weight:800;color:#16803C;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;display:flex;align-items:center;gap:6px;font-style:normal}
.why-title::before{content:'★';font-size:13px;line-height:1}
.why-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.why-item{display:flex;align-items:flex-start;gap:6px;font-size:11px;color:#1F2937;line-height:1.4;font-style:normal}
.why-item::before{content:'✓';color:#16803C;font-weight:900;flex-shrink:0;font-size:12px;line-height:1.3}
.why-item .a{font-weight:700;color:#16803C}
.footer{text-align:center;margin-top:${isPortrait ? 14 : 10}px;padding-top:10px;border-top:1px solid rgba(15,23,42,0.08);font-size:10px;font-weight:600;color:#24A89B;letter-spacing:0.5px;font-style:normal}
</style></head><body>
<div class="header"><div class="kicker">{{BADGE}}</div><div class="title">{{TITLE}}</div></div>
<div class="cards">
<div class="card l1"><div class="label-pill">Mauvais</div><div class="card-title">{{P1_TITLE}}</div><div class="card-body">{{P1_BODY}}</div></div>
<div class="card l2"><div class="label-pill">Bon</div><div class="card-title">{{P2_TITLE}}</div><div class="card-body">{{P2_BODY}}</div></div>
<div class="card l3"><div class="target-badge">Cible</div><div class="label-pill">Excellent</div><div class="card-title">{{P3_TITLE}}</div><div class="card-body">{{P3_BODY}}</div></div>
</div>
<div class="why">
<div class="why-title">Pourquoi le niveau Excellent fonctionne</div>
<div class="why-grid">
<div class="why-item">{{P4_BODY}}</div>
<div class="why-item">{{P5_BODY}}</div>
<div class="why-item">{{P6_BODY}}</div>
<div class="why-item">{{P7_BODY}}</div>
</div>
</div>
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 10: WHITEBOARD ───
// Hand-drawn whiteboard / notebook page. Caveat handwritten font + yellow highlighter.
// Includes inline doodle SVGs (brain in header, lightbulb in tip) + CTA manuscript footer.
// Best for: tips, steps, how-tos, educational content. LinkedIn-friendly.
export function whiteboard(w: number, h: number): string {
  const isPortrait = h > 1100;
  const brainDoodle = `<svg viewBox="0 0 48 44" width="46" height="42" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#1F2937" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 22 C 10 18, 12 10, 20 9 C 22 6, 28 6, 30 9 C 38 10, 40 18, 36 22 C 40 26, 36 34, 28 33 C 26 36, 20 36, 18 33 C 10 34, 8 26, 14 22 Z"/><path d="M24 9 L 24 33"/><path d="M16 17 Q 19 15, 22 18"/><path d="M26 20 Q 30 18, 33 21"/><path d="M17 26 Q 20 24, 23 27"/><path d="M27 28 Q 30 26, 33 29"/></svg>`;
  const bulbDoodle = `<svg viewBox="0 0 28 32" width="26" height="30" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#D97706" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4 C 8 4, 5 8, 5 13 C 5 17, 8 19, 9 22 L 19 22 C 20 19, 23 17, 23 13 C 23 8, 20 4, 14 4 Z" fill="#FFF8E1"/><line x1="10" y1="24" x2="18" y2="24"/><line x1="11" y1="27" x2="17" y2="27"/><line x1="13" y1="30" x2="15" y2="30"/><path d="M14 8 Q 10 10, 10 14"/></svg>`;
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{background:#FFFFFF;background-image:radial-gradient(circle,#E8EAED 0.8px,transparent 0.8px);background-size:24px 24px;font-family:'Inter',-apple-system,system-ui,sans-serif;padding:${isPortrait ? 36 : 32}px ${isPortrait ? 40 : 36}px;display:flex;flex-direction:column;color:#1F2937}
.header{margin-bottom:${isPortrait ? 20 : 16}px;padding-bottom:12px;border-bottom:2px dashed #E5E7EB;display:flex;align-items:center;justify-content:space-between;gap:16px}
.header-text{flex:1;text-align:center}
.header-doodle{flex-shrink:0;display:flex;align-items:center;justify-content:center}
.kicker{display:inline-block;font-size:10px;font-weight:700;color:#4DABF7;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;font-style:normal}
.title{font-family:'Caveat',cursive;font-size:${isPortrait ? 48 : 42}px;font-weight:700;color:#1F2937;line-height:1;letter-spacing:0.5px;font-style:normal}
.title span{color:#FF6B6B;position:relative;display:inline-block;padding:0 4px}
.title span::after{content:'';position:absolute;left:0;right:0;bottom:6px;height:10px;background:#FFE066;z-index:-1;border-radius:4px}
.sections{display:flex;flex-direction:column;flex:1;min-height:0}
.section{display:flex;align-items:flex-start;gap:14px;padding:${isPortrait ? 10 : 8}px 4px;flex:1;min-height:0}
.section + .section{border-top:1px dashed #F1F3F5}
.mark{font-family:'Caveat',cursive;font-size:30px;font-weight:700;line-height:1;flex-shrink:0;width:36px;text-align:center;font-style:normal}
.s1 .mark,.s4 .mark,.s7 .mark{color:#4DABF7}
.s2 .mark,.s5 .mark{color:#FF6B6B}
.s3 .mark,.s6 .mark{color:#51CF66}
.sc{flex:1;min-width:0}
.st{font-family:'Caveat',cursive;font-size:24px;font-weight:700;color:#1F2937;line-height:1.05;margin-bottom:3px;font-style:normal}
.sb{font-size:${isPortrait ? 13 : 12}px;color:#4B5563;line-height:1.45;font-style:normal}
.sb .a{background:linear-gradient(180deg,transparent 55%,#FFE066 55%);font-weight:600;color:#1F2937;padding:0 2px}
.tip{margin-top:10px;padding:12px 16px;background:#FFFAF0;border:2px dashed #FFB347;border-radius:10px;display:flex;gap:12px;align-items:flex-start}
.tip-icon{flex-shrink:0;display:flex;align-items:flex-start}
.tip-body{flex:1;font-size:${isPortrait ? 13 : 12}px;color:#4B5563;line-height:1.4;font-style:normal}
.tip-label{font-family:'Caveat',cursive;font-size:22px;color:#D97706;display:block;line-height:1;margin-bottom:3px;font-weight:700;font-style:normal}
.footer{text-align:center;margin-top:10px;padding-top:10px;border-top:1px dashed #E5E7EB;font-family:'Caveat',cursive;font-size:22px;color:#24A89B;font-style:normal;font-weight:700}
.footer::before{content:'→ '}
</style></head><body>
<div class="header"><div class="header-text"><div class="kicker">{{BADGE}}</div><div class="title">{{TITLE}}</div></div><div class="header-doodle">${brainDoodle}</div></div>
<div class="sections">
<div class="section s1"><div class="mark">→</div><div class="sc"><div class="st">{{P1_TITLE}}</div><div class="sb">{{P1_BODY}}</div></div></div>
<div class="section s2"><div class="mark">★</div><div class="sc"><div class="st">{{P2_TITLE}}</div><div class="sb">{{P2_BODY}}</div></div></div>
<div class="section s3"><div class="mark">✓</div><div class="sc"><div class="st">{{P3_TITLE}}</div><div class="sb">{{P3_BODY}}</div></div></div>
<div class="section s4"><div class="mark">→</div><div class="sc"><div class="st">{{P4_TITLE}}</div><div class="sb">{{P4_BODY}}</div></div></div>
<div class="section s5"><div class="mark">!</div><div class="sc"><div class="st">{{P5_TITLE}}</div><div class="sb">{{P5_BODY}}</div></div></div>
<div class="section s6"><div class="mark">✓</div><div class="sc"><div class="st">{{P6_TITLE}}</div><div class="sb">{{P6_BODY}}</div></div></div>
<div class="section s7"><div class="mark">★</div><div class="sc"><div class="st">{{P7_TITLE}}</div><div class="sb">{{P7_BODY}}</div></div></div>
</div>
<div class="tip"><div class="tip-icon">${bulbDoodle}</div><div class="tip-body"><span class="tip-label">Astuce pro</span>{{PRO_TIP}}</div></div>
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 11: FUNNEL ───
// Vertical funnel with 5 progressive stages + cartoon character + CTA box.
// Best for: processes, frameworks, conversion paths, strategies.
export function funnel(w: number, h: number): string {
  const isPortrait = h > 1100;
  const characterSvg = `<svg viewBox="0 0 70 96" width="64" height="88" xmlns="http://www.w3.org/2000/svg"><circle cx="35" cy="20" r="13" fill="#24A89B"/><circle cx="30" cy="18" r="1.8" fill="#fff"/><circle cx="40" cy="18" r="1.8" fill="#fff"/><path d="M28 24 Q 35 28, 42 24" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/><path d="M16 60 Q 35 38, 54 60 L 54 86 L 16 86 Z" fill="#24A89B"/><rect x="22" y="62" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.4)"/><circle cx="47" cy="70" r="6" fill="#fff"/><path d="M44 70 L 46.5 73 L 50 67" stroke="#16803C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{background:linear-gradient(180deg,#FFF8F0 0%,#F0F4FF 100%);font-family:'Inter',-apple-system,system-ui,sans-serif;padding:${isPortrait ? 38 : 30}px ${isPortrait ? 40 : 32}px;display:flex;flex-direction:column;color:#1F2937}
.header{text-align:center;margin-bottom:${isPortrait ? 20 : 14}px}
.kicker{display:inline-block;background:#1F2937;color:#fff;font-size:10px;font-weight:800;padding:5px 14px;border-radius:14px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;font-style:normal}
.title{font-family:'Inter',sans-serif;font-size:${isPortrait ? 32 : 28}px;font-weight:900;color:#1F2937;line-height:1.1;letter-spacing:-0.5px;text-transform:uppercase;font-style:normal}
.title span{background:linear-gradient(180deg,transparent 60%,#FFE066 60%);padding:0 4px}
.body-wrap{display:flex;align-items:stretch;gap:${isPortrait ? 16 : 12}px;flex:1;min-height:0}
.funnel{display:flex;flex-direction:column;align-items:center;gap:${isPortrait ? 7 : 5}px;flex:1;min-height:0;justify-content:space-around}
.character{flex-shrink:0;display:flex;align-items:center;justify-content:center;width:${isPortrait ? 80 : 72}px}
.stage{position:relative;display:flex;align-items:center;justify-content:center;color:#fff;border-radius:10px;padding:${isPortrait ? 13 : 10}px 16px;box-shadow:0 6px 18px rgba(0,0,0,0.1),inset 0 1px 0 rgba(255,255,255,0.25);text-align:center;font-style:normal}
.stage.s1{width:100%;background:linear-gradient(135deg,#FFB3B3,#F87171)}
.stage.s2{width:88%;background:linear-gradient(135deg,#FFD4A3,#FB923C)}
.stage.s3{width:76%;background:linear-gradient(135deg,#FFE9A3,#FBBF24)}
.stage.s4{width:64%;background:linear-gradient(135deg,#B3FFD1,#34D399)}
.stage.s5{width:52%;background:linear-gradient(135deg,#AEC6CF,#60A5FA)}
.stage-content{display:flex;align-items:center;gap:11px;width:100%;justify-content:flex-start}
.stage-num{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.28);font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1.5px solid rgba(255,255,255,0.55);color:#fff;font-style:normal}
.stage-check{position:absolute;right:14px;top:50%;transform:translateY(-50%);width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:900;font-style:normal}
.stage-text{flex:1;text-align:left;min-width:0;padding-right:22px}
.stage-title{font-size:${isPortrait ? 14 : 12}px;font-weight:800;line-height:1.1;margin-bottom:1px;text-transform:uppercase;letter-spacing:0.3px;color:#1F2937;font-style:normal}
.stage-body{font-size:${isPortrait ? 11 : 10}px;font-weight:600;line-height:1.3;color:rgba(31,41,55,0.85);font-style:normal}
.arrow{font-size:13px;color:#9CA3AF;line-height:1;font-style:normal}
.cta{margin-top:${isPortrait ? 14 : 10}px;padding:${isPortrait ? 14 : 11}px 18px;background:#24A89B;border-radius:12px;display:flex;align-items:center;gap:14px;box-shadow:0 6px 18px rgba(36,168,155,0.28)}
.cta-icon{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:900;flex-shrink:0;font-style:normal}
.cta-body{flex:1;color:#fff;font-style:normal}
.cta-label{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;opacity:0.85;display:block;margin-bottom:1px;font-style:normal}
.cta-text{font-size:${isPortrait ? 13 : 12}px;font-weight:700;line-height:1.3;font-style:normal}
.cta-arrow{font-size:20px;color:#fff;flex-shrink:0;line-height:1;font-style:normal}
.footer{text-align:center;margin-top:10px;padding-top:8px;border-top:1px solid rgba(0,0,0,0.08);font-size:11px;font-weight:600;color:#6B7280;letter-spacing:0.3px;font-style:normal}
</style></head><body>
<div class="header"><div class="kicker">{{BADGE}}</div><div class="title">{{TITLE}}</div></div>
<div class="body-wrap">
<div class="funnel">
<div class="stage s1"><div class="stage-content"><div class="stage-num">1</div><div class="stage-text"><div class="stage-title">{{P1_TITLE}}</div><div class="stage-body">{{P1_BODY}}</div></div></div><div class="stage-check">✓</div></div>
<div class="arrow">▼</div>
<div class="stage s2"><div class="stage-content"><div class="stage-num">2</div><div class="stage-text"><div class="stage-title">{{P2_TITLE}}</div><div class="stage-body">{{P2_BODY}}</div></div></div><div class="stage-check">✓</div></div>
<div class="arrow">▼</div>
<div class="stage s3"><div class="stage-content"><div class="stage-num">3</div><div class="stage-text"><div class="stage-title">{{P3_TITLE}}</div><div class="stage-body">{{P3_BODY}}</div></div></div><div class="stage-check">✓</div></div>
<div class="arrow">▼</div>
<div class="stage s4"><div class="stage-content"><div class="stage-num">4</div><div class="stage-text"><div class="stage-title">{{P4_TITLE}}</div><div class="stage-body">{{P4_BODY}}</div></div></div><div class="stage-check">✓</div></div>
<div class="arrow">▼</div>
<div class="stage s5"><div class="stage-content"><div class="stage-num">5</div><div class="stage-text"><div class="stage-title">{{P5_TITLE}}</div><div class="stage-body">{{P5_BODY}}</div></div></div><div class="stage-check">✓</div></div>
</div>
<div class="character">${characterSvg}</div>
</div>
<div class="cta"><div class="cta-icon">★</div><div class="cta-body"><span class="cta-label">{{P6_TITLE}}</span><span class="cta-text">{{PRO_TIP}}</span></div><div class="cta-arrow">→</div></div>
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 12: DATA_GRID ───
// Notebook-style framework table with 4 rows × 3 columns + bonus callout.
// Pastel header row, alternating zebra rows, color-coded concept dots, brand-color tip.
// Each row: concept name + description + use case. Bottom = bonus + main takeaway.
export function dataGrid(w: number, h: number): string {
  const isPortrait = h > 1100;
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{background:#FFFFFF;background-image:linear-gradient(rgba(0,0,0,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.018) 1px,transparent 1px);background-size:32px 32px;font-family:'Inter',-apple-system,system-ui,sans-serif;padding:${isPortrait ? 40 : 32}px ${isPortrait ? 38 : 30}px;display:flex;flex-direction:column;color:#1F2937}
.header{text-align:center;margin-bottom:${isPortrait ? 20 : 14}px}
.kicker{display:inline-block;background:#AEC6CF;color:#1F2937;font-size:10px;font-weight:800;padding:5px 14px;border-radius:14px;margin-bottom:10px;text-transform:uppercase;letter-spacing:1.2px;font-style:normal}
.title{font-family:'Playfair Display',Georgia,serif;font-size:${isPortrait ? 32 : 28}px;font-weight:900;color:#1F2937;line-height:1.12;letter-spacing:-0.5px;font-style:normal}
.title span{background:linear-gradient(180deg,transparent 60%,#FFE066 60%);padding:0 4px}
.table{flex:1;display:flex;flex-direction:column;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;background:#fff;min-height:0;box-shadow:0 4px 18px rgba(15,23,42,0.05)}
.row{display:grid;grid-template-columns:1.05fr 1.95fr 1.1fr;align-items:center;padding:${isPortrait ? 12 : 10}px ${isPortrait ? 16 : 14}px;font-size:${isPortrait ? 12 : 11}px;font-style:normal;gap:14px}
.row.head{background:#EEF4F8;font-weight:800;color:#1F2937;border-bottom:2px solid #AEC6CF;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;padding:${isPortrait ? 11 : 9}px ${isPortrait ? 16 : 14}px}
.row.body{border-bottom:1px solid #F3F4F6;flex:1;min-height:0}
.row.body:nth-child(even){background:#FAFBFC}
.row.body:last-child{border-bottom:none}
.cell-name{display:flex;align-items:center;gap:9px;font-weight:800;color:#1F2937;line-height:1.2;font-style:normal}
.dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;border:1.5px solid rgba(0,0,0,0.06)}
.r1 .dot{background:#FFB3B3}
.r2 .dot{background:#FFD4A3}
.r3 .dot{background:#B3FFD1}
.r4 .dot{background:#D4B3FF}
.cell-desc{color:#4B5563;line-height:1.4;font-style:normal}
.cell-desc .a{font-weight:700;background:linear-gradient(180deg,transparent 60%,#FFE066 60%);padding:0 2px;color:#1F2937}
.cell-use{color:#1F2937;font-weight:700;line-height:1.3;font-size:${isPortrait ? 11 : 10}px;display:flex;align-items:center;gap:6px;font-style:normal}
.cell-use::before{content:'→';color:#24A89B;font-weight:900;flex-shrink:0}
.bonus{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:${isPortrait ? 12 : 10}px}
.bonus-card{background:#fff;border-radius:10px;padding:10px 14px;border:1px solid #E5E7EB;border-left:3px solid #AEC6CF;font-style:normal}
.bonus-card.b2{border-left-color:#D4B3FF}
.bonus-title{font-size:10px;font-weight:800;color:#1F2937;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;font-style:normal}
.bonus-body{font-size:11px;color:#4B5563;line-height:1.35;font-style:normal}
.tip{margin-top:${isPortrait ? 12 : 10}px;padding:${isPortrait ? 13 : 11}px ${isPortrait ? 18 : 16}px;background:#E8F8F6;border-radius:12px;border-left:4px solid #24A89B;display:flex;gap:12px;align-items:flex-start;font-style:normal}
.tip-icon{width:28px;height:28px;border-radius:50%;background:#24A89B;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;flex-shrink:0;font-style:normal}
.tip-body{flex:1;font-size:${isPortrait ? 12 : 11}px;color:#1F2937;line-height:1.4;font-style:normal}
.tip-label{display:block;font-size:9px;font-weight:800;color:#24A89B;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;font-style:normal}
.footer{text-align:center;margin-top:10px;padding-top:8px;border-top:1px solid #E5E7EB;font-size:10px;font-weight:600;color:#9CA3AF;letter-spacing:0.5px;font-style:normal}
</style></head><body>
<div class="header"><div class="kicker">{{BADGE}}</div><div class="title">{{TITLE}}</div></div>
<div class="table">
<div class="row head"><div>Élément</div><div>Description</div><div>Idéal pour</div></div>
<div class="row body r1"><div class="cell-name"><div class="dot"></div>{{P1_TITLE}}</div><div class="cell-desc">{{P1_BODY}}</div><div class="cell-use">{{P5_TITLE}}</div></div>
<div class="row body r2"><div class="cell-name"><div class="dot"></div>{{P2_TITLE}}</div><div class="cell-desc">{{P2_BODY}}</div><div class="cell-use">{{P5_BODY}}</div></div>
<div class="row body r3"><div class="cell-name"><div class="dot"></div>{{P3_TITLE}}</div><div class="cell-desc">{{P3_BODY}}</div><div class="cell-use">{{P6_TITLE}}</div></div>
<div class="row body r4"><div class="cell-name"><div class="dot"></div>{{P4_TITLE}}</div><div class="cell-desc">{{P4_BODY}}</div><div class="cell-use">{{P6_BODY}}</div></div>
</div>
<div class="bonus">
<div class="bonus-card"><div class="bonus-title">Bonus</div><div class="bonus-body">{{P7_TITLE}}</div></div>
<div class="bonus-card b2"><div class="bonus-title">À noter</div><div class="bonus-body">{{P7_BODY}}</div></div>
</div>
<div class="tip"><div class="tip-icon">★</div><div class="tip-body"><span class="tip-label">À retenir</span>{{PRO_TIP}}</div></div>
<div class="footer">{{FOOTER}}</div>
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

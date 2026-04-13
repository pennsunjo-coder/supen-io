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
// Awa K Penn signature style: cream background, wood frame, 7 colored numbered items.
// Nunito Black titles + Caveat handwritten body. Yellow #FFEF5A highlights.
export function awaClassic(w: number, h: number): string {
  const pad = Math.round(w * 0.05);
  const frameW = Math.round(w * 0.028);
  const headerH = Math.round(h * 0.16);
  const footerH = Math.round(h * 0.09);
  const bodyH = h - headerH - footerH;
  const titleSize = Math.round(w * 0.042);
  const badgeSize = Math.round(w * 0.012);
  const itemGap = Math.round(h * 0.01);
  const numSize = Math.round(w * 0.046);
  const itemTitleSize = Math.round(w * 0.021);
  const itemBodySize = Math.round(w * 0.015);

  const colors = ['#E63946','#2563EB','#16A34A','#F59E0B','#8B5CF6','#EC4899','#0D9488'];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Caveat:wght@500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{background:#FFFFF5;font-family:'Nunito',sans-serif;display:flex;flex-direction:column;color:#1a1a1a;border:${frameW}px solid #3d2b1a}

.header{height:${headerH}px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${Math.round(pad*0.7)}px ${pad}px;gap:${Math.round(h*0.008)}px;border-bottom:3px solid #3d2b1a}
.badge{display:inline-flex;align-items:center;background:#3d2b1a;color:#FFFFF5;font-size:${badgeSize}px;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:${Math.round(h*0.006)}px ${Math.round(w*0.022)}px;border-radius:100px}
.title{font-family:'Nunito',sans-serif;font-size:${titleSize}px;font-weight:900;color:#1a1a1a;text-align:center;line-height:1.18;max-width:${Math.round(w*0.88)}px;word-wrap:break-word}
.title em{font-style:normal;background:#FFEF5A;padding:0 4px}

.body{flex:1;padding:${Math.round(h*0.015)}px ${pad}px;display:flex;flex-direction:column;gap:${itemGap}px;min-height:0}

.item{flex:1;display:flex;align-items:center;gap:${Math.round(w*0.022)}px;padding:${Math.round(h*0.01)}px ${Math.round(w*0.02)}px;border-radius:8px;border:1px solid rgba(61,43,26,0.15);background:rgba(255,255,245,0.8);min-height:0;overflow:hidden}
.num{width:${numSize}px;height:${numSize}px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:${Math.round(numSize*0.44)}px;font-weight:900;color:#fff;flex-shrink:0}
.item-text{flex:1;min-width:0;overflow:hidden}
.item-title{font-family:'Nunito',sans-serif;font-size:${itemTitleSize}px;font-weight:800;color:#1a1a1a;line-height:1.2;margin-bottom:${Math.round(h*0.003)}px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.item-body{font-family:'Caveat',cursive;font-size:${Math.round(itemBodySize*1.15)}px;font-weight:500;color:#444;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.item-body .a{font-weight:700;color:#3d2b1a;background:#FFEF5A;padding:0 2px}

.footer{height:${footerH}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:${Math.round(w*0.01)}px;border-top:2px solid #3d2b1a;background:#FFFFF5}
.footer-text{font-family:'Nunito',sans-serif;font-size:${Math.round(w*0.013)}px;font-weight:700;color:#3d2b1a;letter-spacing:0.5px}
</style></head><body>
<div class="header"><div class="badge">{{BADGE}}</div><div class="title">{{TITLE}}</div></div>
<div class="body">
${colors.map((c,i)=>`<div class="item"><div class="num" style="background:${c}">${i+1}</div><div class="item-text"><div class="item-title">{{P${i+1}_TITLE}}</div><div class="item-body">{{P${i+1}_BODY}}</div></div></div>`).join('\n')}
</div>
<div class="footer"><div class="footer-text">{{FOOTER}} | Repost ↻</div></div>
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
// Pixel-perfect 3-tier comparison (Bad → Better → Best).
// Dynamic sizing: all dimensions computed from w/h for any aspect ratio.
// Playfair Display titles + Inter body. Circular icon per card. Cream background.
export function uiCards(w: number, h: number): string {
  const pad = Math.round(w * 0.055);
  const cardGap = Math.round(h * 0.018);
  const cardRadius = 20;
  const headerH = Math.round(h * 0.20);
  const bodyH = Math.round(h * 0.68);
  const footerH = h - headerH - bodyH;
  const cardH = Math.round((bodyH - cardGap * 4) / 3);
  const titleSize = Math.round(w * 0.052);
  const badgeSize = Math.round(w * 0.013);
  const cardTitleSize = Math.round(w * 0.028);
  const cardBodySize = Math.round(w * 0.019);
  const iconSize = Math.round(w * 0.065);
  const labelSize = Math.round(w * 0.011);

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:#FDFDF9}
body{font-family:'Inter',sans-serif;display:flex;flex-direction:column;color:#1A1A1A}
.header{height:${headerH}px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${Math.round(pad*0.8)}px ${pad}px;gap:${Math.round(h*0.012)}px;background:#FDFDF9}
.badge{display:inline-flex;align-items:center;gap:6px;background:#1A1A1A;color:#FDFDF9;font-family:'Inter',sans-serif;font-size:${badgeSize}px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;padding:${Math.round(h*0.008)}px ${Math.round(w*0.028)}px;border-radius:100px}
.title{font-family:'Playfair Display',serif;font-size:${titleSize}px;font-weight:900;color:#1A1A1A;text-align:center;line-height:1.15;max-width:${Math.round(w*0.85)}px;word-wrap:break-word;overflow-wrap:break-word}
.title em{font-style:normal;color:#FF7A59;position:relative}
.body{flex:1;padding:0 ${pad}px;display:flex;flex-direction:column;gap:${cardGap}px;min-height:0}
.card{flex:1;border-radius:${cardRadius}px;padding:${Math.round(cardH*0.14)}px ${Math.round(w*0.04)}px;display:flex;align-items:center;gap:${Math.round(w*0.032)}px;min-height:0;overflow:hidden}
.card.c1{background:#FFF0F0;border:1.5px solid #FFCCCC}
.card.c2{background:#FEF9E7;border:1.5px solid #FFE5A0}
.card.c3{background:#F0FFF4;border:1.5px solid #B3EED0}
.icon-wrap{width:${iconSize}px;height:${iconSize}px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:${Math.round(iconSize*0.48)}px;font-weight:900;line-height:1}
.c1 .icon-wrap{background:#FFB3B3;color:#CC0000}
.c2 .icon-wrap{background:#FFD4A3;color:#CC6600}
.c3 .icon-wrap{background:#B3FFD1;color:#006633}
.card-text{flex:1;min-width:0;overflow:hidden}
.card-label{display:inline-flex;align-items:center;gap:5px;font-size:${labelSize}px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:${Math.round(cardH*0.06)}px;padding:3px 10px;border-radius:100px}
.c1 .card-label{background:#FFB3B3;color:#8B0000}
.c2 .card-label{background:#FFD4A3;color:#7A4000}
.c3 .card-label{background:#B3FFD1;color:#005500}
.card-title{font-family:'Playfair Display',serif;font-size:${cardTitleSize}px;font-weight:700;color:#1A1A1A;line-height:1.2;margin-bottom:${Math.round(cardH*0.05)}px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card-body{font-size:${cardBodySize}px;font-weight:500;color:#4A4A4A;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.card-body strong{font-weight:800;color:#1A1A1A}
.footer{height:${footerH}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:8px;border-top:1px solid #E8E8E2;background:#FDFDF9}
.footer-dot{width:5px;height:5px;border-radius:50%;background:#24A89B}
.footer-text{font-size:${Math.round(w*0.012)}px;font-weight:700;color:#24A89B;letter-spacing:1px;text-transform:uppercase}
</style></head><body>
<div class="header">
<div class="badge">{{BADGE}}</div>
<div class="title">{{TITLE}}</div>
</div>
<div class="body">
<div class="card c1"><div class="icon-wrap">✗</div><div class="card-text"><div class="card-label">Avoid</div><div class="card-title">{{P1_TITLE}}</div><div class="card-body">{{P1_BODY}}</div></div></div>
<div class="card c2"><div class="icon-wrap">~</div><div class="card-text"><div class="card-label">Better</div><div class="card-title">{{P2_TITLE}}</div><div class="card-body">{{P2_BODY}}</div></div></div>
<div class="card c3"><div class="icon-wrap">✓</div><div class="card-text"><div class="card-label">Best</div><div class="card-title">{{P3_TITLE}}</div><div class="card-body">{{P3_BODY}}</div></div></div>
</div>
<div class="footer"><div class="footer-dot"></div><div class="footer-text">{{FOOTER}}</div><div class="footer-dot"></div></div>
</body></html>`;
}

// ─── TEMPLATE 10: WHITEBOARD ───
// Clean whiteboard style: white background, colored left borders, numbered circles.
// Nunito Black titles + Caveat handwritten body. Yellow #FFEF5A highlights.
export function whiteboard(w: number, h: number): string {
  const pad = Math.round(w * 0.05);
  const headerH = Math.round(h * 0.16);
  const footerH = Math.round(h * 0.1);
  const bodyH = h - headerH - footerH;
  const titleSize = Math.round(w * 0.046);
  const badgeSize = Math.round(w * 0.012);
  const sectionTitleSize = Math.round(w * 0.022);
  const bodyTextSize = Math.round(w * 0.017);
  const bulletSize = Math.round(w * 0.018);
  const itemGap = Math.round(h * 0.011);

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Caveat:wght@500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{background:#ffffff;font-family:'Nunito',sans-serif;display:flex;flex-direction:column;color:#1a1a1a;border:1px solid #e0e0e0;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.08)}

.header{height:${headerH}px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${Math.round(pad*0.8)}px ${pad}px;gap:${Math.round(h*0.01)}px;background:#ffffff;border-bottom:2px solid #e0e0e0}
.badge{display:inline-flex;align-items:center;background:#E63946;color:#fff;font-family:'Nunito',sans-serif;font-size:${badgeSize}px;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:${Math.round(h*0.007)}px ${Math.round(w*0.025)}px;border-radius:100px}
.title{font-family:'Nunito',sans-serif;font-size:${titleSize}px;font-weight:900;color:#1a1a1a;text-align:center;line-height:1.2;max-width:${Math.round(w*0.88)}px;word-wrap:break-word}
.title em{font-style:normal;background:#FFEF5A;padding:0 4px}

.body{flex:1;padding:${Math.round(h*0.018)}px ${pad}px;display:flex;flex-direction:column;gap:${itemGap}px;min-height:0}

.item{flex:1;display:flex;align-items:center;gap:${Math.round(w*0.025)}px;background:#ffffff;border-radius:12px;padding:${Math.round(h*0.013)}px ${Math.round(w*0.028)}px;border-left:4px solid #E63946;min-height:0;overflow:hidden}
.item:nth-child(2n){border-left-color:#2563EB}
.item:nth-child(3n){border-left-color:#16A34A}
.item:nth-child(4n){border-left-color:#F59E0B}

.num{width:${Math.round(w*0.052)}px;height:${Math.round(w*0.052)}px;border-radius:50%;border:2px solid #1a1a1a;display:flex;align-items:center;justify-content:center;font-size:${Math.round(w*0.022)}px;font-weight:900;flex-shrink:0;color:#1a1a1a;font-family:'Nunito',sans-serif}

.item-text{flex:1;min-width:0;overflow:hidden}
.item-title{font-family:'Nunito',sans-serif;font-size:${sectionTitleSize}px;font-weight:800;color:#1a1a1a;line-height:1.2;margin-bottom:${Math.round(h*0.004)}px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.item-body{font-family:'Caveat',cursive;font-size:${Math.round(bodyTextSize*1.15)}px;font-weight:500;color:#444444;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.item-body .hl{background:#FFEF5A;font-weight:700;padding:0 2px}

.footer{height:${footerH}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:${Math.round(w*0.01)}px;border-top:1px solid #e0e0e0;background:#fafafa}
.footer-text{font-family:'Nunito',sans-serif;font-size:${Math.round(w*0.013)}px;font-weight:700;color:#2563EB;letter-spacing:0.5px}
.footer-repost{font-family:'Nunito',sans-serif;font-size:${Math.round(w*0.013)}px;font-weight:700;color:#444}
</style></head><body>
<div class="header"><div class="badge">{{BADGE}}</div><div class="title">{{TITLE}}</div></div>
<div class="body">
<div class="item"><div class="num">1</div><div class="item-text"><div class="item-title">{{P1_TITLE}}</div><div class="item-body">{{P1_BODY}}</div></div></div>
<div class="item"><div class="num">2</div><div class="item-text"><div class="item-title">{{P2_TITLE}}</div><div class="item-body">{{P2_BODY}}</div></div></div>
<div class="item"><div class="num">3</div><div class="item-text"><div class="item-title">{{P3_TITLE}}</div><div class="item-body">{{P3_BODY}}</div></div></div>
<div class="item"><div class="num">4</div><div class="item-text"><div class="item-title">{{P4_TITLE}}</div><div class="item-body">{{P4_BODY}}</div></div></div>
<div class="item"><div class="num">5</div><div class="item-text"><div class="item-title">{{P5_TITLE}}</div><div class="item-body">{{P5_BODY}}</div></div></div>
<div class="item"><div class="num">6</div><div class="item-text"><div class="item-title">{{P6_TITLE}}</div><div class="item-body">{{P6_BODY}}</div></div></div>
<div class="item"><div class="num">7</div><div class="item-text"><div class="item-title">{{P7_TITLE}}</div><div class="item-body">{{P7_BODY}}</div></div></div>
</div>
<div class="footer"><div class="footer-text">{{FOOTER}}</div><div class="footer-repost">| Repost ↻</div></div>
</body></html>`;
}

// ─── TEMPLATE 11: FUNNEL ───
// Progressive funnel with 5 decreasing-width stages. Warm cream background.
// Nunito Black titles + Caveat handwritten body. Yellow #FFEF5A highlights.
export function funnel(w: number, h: number): string {
  const pad = Math.round(w * 0.05);
  const headerH = Math.round(h * 0.16);
  const footerH = Math.round(h * 0.1);
  const bodyH = h - headerH - footerH;
  const titleSize = Math.round(w * 0.046);
  const badgeSize = Math.round(w * 0.012);
  const stepTitleSize = Math.round(w * 0.024);
  const stepBodySize = Math.round(w * 0.016);
  const arrowSize = Math.round(w * 0.03);
  const stepGap = Math.round(h * 0.008);
  const numSize = Math.round(w * 0.048);

  const steps = [
    {bg:'#fff5f5',border:'#E63946',num:'#E63946',width:'100%'},
    {bg:'#fff8f0',border:'#F59E0B',num:'#F59E0B',width:'88%'},
    {bg:'#fffdf0',border:'#EAB308',num:'#EAB308',width:'74%'},
    {bg:'#f0fdf4',border:'#16A34A',num:'#16A34A',width:'60%'},
    {bg:'#eff6ff',border:'#2563EB',num:'#2563EB',width:'46%'},
  ];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Caveat:wght@500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{background:#fffef5;font-family:'Nunito',sans-serif;display:flex;flex-direction:column;color:#1a1a1a;border:1px solid #e8e0d0;box-shadow:0 4px 24px rgba(0,0,0,0.08)}

.header{height:${headerH}px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${Math.round(pad*0.8)}px ${pad}px;gap:${Math.round(h*0.01)}px;border-bottom:2px solid #e8e0d0}
.badge{display:inline-flex;align-items:center;background:#E63946;color:#fff;font-size:${badgeSize}px;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:${Math.round(h*0.007)}px ${Math.round(w*0.025)}px;border-radius:100px}
.title{font-family:'Nunito',sans-serif;font-size:${titleSize}px;font-weight:900;color:#1a1a1a;text-align:center;line-height:1.18;max-width:${Math.round(w*0.85)}px;word-wrap:break-word}
.title em{font-style:normal;background:#FFEF5A;padding:0 4px}

.body{flex:1;padding:${Math.round(h*0.018)}px ${pad}px;display:flex;flex-direction:column;align-items:center;gap:${stepGap}px;min-height:0}

.step{display:flex;align-items:center;gap:${Math.round(w*0.022)}px;border-radius:12px;padding:${Math.round(h*0.013)}px ${Math.round(w*0.03)}px;border:2px solid;flex-shrink:0;overflow:hidden}
.num{width:${numSize}px;height:${numSize}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${Math.round(numSize*0.44)}px;font-weight:900;flex-shrink:0;color:#fff;font-family:'Nunito',sans-serif}
.step-text{flex:1;min-width:0;overflow:hidden}
.step-title{font-family:'Nunito',sans-serif;font-size:${stepTitleSize}px;font-weight:800;color:#1a1a1a;line-height:1.2;margin-bottom:${Math.round(h*0.004)}px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.step-body{font-family:'Caveat',cursive;font-size:${Math.round(stepBodySize*1.1)}px;font-weight:500;color:#444;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.arrow{font-size:${arrowSize}px;color:#E63946;text-align:center;line-height:1;flex-shrink:0;font-weight:900}

.footer{height:${footerH}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:${Math.round(w*0.01)}px;border-top:1px solid #e8e0d0;background:#fafaf5}
.footer-text{font-family:'Nunito',sans-serif;font-size:${Math.round(w*0.013)}px;font-weight:700;color:#2563EB}
.footer-repost{font-family:'Nunito',sans-serif;font-size:${Math.round(w*0.013)}px;font-weight:700;color:#444}
</style></head><body>
<div class="header"><div class="badge">{{BADGE}}</div><div class="title">{{TITLE}}</div></div>
<div class="body">
${steps.map((s,i) => `<div class="step" style="width:${s.width};background:${s.bg};border-color:${s.border}"><div class="num" style="background:${s.num}">${i+1}</div><div class="step-text"><div class="step-title">{{P${i+1}_TITLE}}</div><div class="step-body">{{P${i+1}_BODY}}</div></div></div>${i<4?`\n<div class="arrow">▼</div>`:''}`).join('\n')}
</div>
<div class="footer"><div class="footer-text">{{FOOTER}}</div><div class="footer-repost">| Repost ↻</div></div>
</body></html>`;
}

// ─── TEMPLATE 12: DATA_GRID ───
// Framework table: 4 rows × 3 columns + key takeaway tip box.
// Nunito Black titles + Caveat handwritten body. Yellow #FFEF5A highlights.
export function dataGrid(w: number, h: number): string {
  const pad = Math.round(w * 0.05);
  const headerH = Math.round(h * 0.17);
  const footerH = Math.round(h * 0.09);
  const bodyH = h - headerH - footerH;
  const titleSize = Math.round(w * 0.044);
  const badgeSize = Math.round(w * 0.012);
  const thSize = Math.round(w * 0.013);
  const cellSize = Math.round(w * 0.016);
  const dotSize = Math.round(w * 0.017);

  const dots = ['#E63946','#F59E0B','#16A34A','#2563EB'];
  const rowBgs = ['#ffffff','#f8f9fa','#ffffff','#f8f9fa'];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Caveat:wght@500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{background:#ffffff;font-family:'Nunito',sans-serif;display:flex;flex-direction:column;color:#1a1a1a;border:1px solid #e0e0e0;box-shadow:0 4px 24px rgba(0,0,0,0.06)}

.header{height:${headerH}px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${Math.round(pad*0.8)}px ${pad}px;gap:${Math.round(h*0.01)}px;border-bottom:2px solid #E63946}
.badge{display:inline-flex;align-items:center;background:#2563EB;color:#fff;font-size:${badgeSize}px;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:${Math.round(h*0.007)}px ${Math.round(w*0.025)}px;border-radius:100px}
.title{font-family:'Nunito',sans-serif;font-size:${titleSize}px;font-weight:900;color:#1a1a1a;text-align:center;line-height:1.18;max-width:${Math.round(w*0.85)}px;word-wrap:break-word}
.title em{font-style:normal;background:#FFEF5A;padding:0 4px}

.body{flex:1;padding:0 ${pad}px ${Math.round(h*0.018)}px;display:flex;flex-direction:column;min-height:0}

.table{flex:1;border-radius:12px;overflow:hidden;border:1.5px solid #e0e0e0;display:flex;flex-direction:column;box-shadow:0 2px 16px rgba(0,0,0,0.05)}
.th-row{display:grid;grid-template-columns:1.2fr 2fr 1fr;background:#f5f5f5;border-bottom:2px solid #e0e0e0;padding:${Math.round(h*0.013)}px ${Math.round(w*0.022)}px;gap:${Math.round(w*0.012)}px}
.th{font-family:'Nunito',sans-serif;font-size:${thSize}px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#1a1a1a}
.th:nth-child(1){color:#E63946}
.th:nth-child(2){color:#2563EB}
.th:nth-child(3){color:#16A34A}

.row{flex:1;display:grid;grid-template-columns:1.2fr 2fr 1fr;align-items:center;padding:0 ${Math.round(w*0.022)}px;gap:${Math.round(w*0.012)}px;border-bottom:0.5px solid #e8e8e8;min-height:0;overflow:hidden}
.row:last-child{border-bottom:none}

.cell-name{display:flex;align-items:center;gap:${Math.round(w*0.01)}px;font-family:'Nunito',sans-serif;font-weight:800;font-size:${cellSize}px;color:#1a1a1a;overflow:hidden}
.dot{width:${dotSize}px;height:${dotSize}px;border-radius:50%;flex-shrink:0}
.cell-desc{font-family:'Caveat',cursive;font-size:${Math.round(cellSize*1.12)}px;font-weight:500;color:#444;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cell-desc .hl{background:#FFEF5A;font-weight:700;padding:0 2px}
.cell-use{font-family:'Nunito',sans-serif;font-size:${Math.round(cellSize*0.9)}px;font-weight:700;color:#16A34A;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

.tip{margin-top:${Math.round(h*0.016)}px;padding:${Math.round(h*0.014)}px ${Math.round(w*0.028)}px;background:#fffdf0;border-radius:10px;border-left:4px solid #E63946;display:flex;gap:${Math.round(w*0.016)}px;align-items:flex-start;flex-shrink:0}
.tip-label{font-family:'Nunito',sans-serif;font-size:${Math.round(w*0.012)}px;font-weight:900;color:#E63946;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:2px}
.tip-body{font-family:'Caveat',cursive;font-size:${Math.round(cellSize*1.05)}px;font-weight:500;color:#1a1a1a;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

.footer{height:${footerH}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:${Math.round(w*0.01)}px;border-top:1px solid #e0e0e0;background:#fafafa}
.footer-text{font-family:'Nunito',sans-serif;font-size:${Math.round(w*0.013)}px;font-weight:700;color:#2563EB}
.footer-repost{font-family:'Nunito',sans-serif;font-size:${Math.round(w*0.013)}px;font-weight:700;color:#444}
</style></head><body>
<div class="header"><div class="badge">{{BADGE}}</div><div class="title">{{TITLE}}</div></div>
<div class="body">
<div class="table">
<div class="th-row"><div class="th">Concept</div><div class="th">Description</div><div class="th">Best For</div></div>
${[0,1,2,3].map(i=>`<div class="row" style="background:${rowBgs[i]}"><div class="cell-name"><div class="dot" style="background:${dots[i]}"></div>{{P${i+1}_TITLE}}</div><div class="cell-desc">{{P${i+1}_BODY}}</div><div class="cell-use">{{P${i+5}_TITLE}}</div></div>`).join('\n')}
</div>
<div class="tip"><div><div class="tip-label">★ Key Takeaway</div><div class="tip-body">{{PRO_TIP}}</div></div></div>
</div>
<div class="footer"><div class="footer-text">{{FOOTER}}</div><div class="footer-repost">| Repost ↻</div></div>
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

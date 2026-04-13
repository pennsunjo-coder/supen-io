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
// Dense guide sketchboard. ALL INLINE STYLES for html2canvas compatibility.
export function awaClassic(w: number, h: number): string {
  const s = (v: number) => Math.round(v * w / 1080);
  const sh = (v: number) => Math.round(v * h / 1350);
  const frameW = s(30);
  const pad = s(44);
  const headerH = sh(180);
  const footerH = sh(56);
  const itemGap = sh(8);
  const numSz = s(42);
  const titleSz = s(50);
  const badgeSz = s(12);
  const itemTitleSz = s(21);
  const itemBodySz = s(18);

  const COLORS = ['#B83228','#2B4DAF','#2E7D32','#D4A017','#8B5CF6','#C0392B','#0D9488'];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}</style>
</head>
<body style="width:${w}px;height:${h}px;overflow:hidden;background:#ffffff;font-family:'Nunito',sans-serif;display:flex;flex-direction:column;color:#111111;border:${frameW}px solid #3d2b1a;">

<div style="height:${headerH}px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${sh(12)}px ${pad}px;gap:${sh(6)}px;background:#f8f8f8;border-bottom:2px solid #111111;">
  <div style="display:inline-flex;align-items:center;background:#3d2b1a;color:#f8f9f7;font-family:'Nunito',sans-serif;font-size:${badgeSz}px;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:${sh(5)}px ${s(22)}px;border-radius:100px;">{{BADGE}}</div>
  <div style="font-family:'Nunito',sans-serif;font-size:${titleSz}px;font-weight:900;color:#111111;text-align:center;line-height:1.15;max-width:${s(950)}px;word-wrap:break-word;text-transform:uppercase;letter-spacing:-0.01em;">{{TITLE}}</div>
</div>

<div style="flex:1;padding:${sh(12)}px ${pad}px;display:flex;flex-direction:column;gap:${itemGap}px;min-height:0;">
${COLORS.map((c,i)=>`<div style="flex:1;display:flex;align-items:center;gap:${s(20)}px;padding:${sh(8)}px ${s(18)}px;border-radius:8px;border:1px solid rgba(61,43,26,0.12);background:#f8f9f7;min-height:0;overflow:hidden;">
  <div style="width:${numSz}px;height:${numSz}px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:${Math.round(numSz*0.44)}px;font-weight:900;color:#fff;flex-shrink:0;background:${c};">${i+1}</div>
  <div style="flex:1;min-width:0;overflow:hidden;">
    <div style="font-family:'Nunito',sans-serif;font-size:${itemTitleSz}px;font-weight:800;color:#111111;line-height:1.2;margin-bottom:${sh(2)}px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-bottom:2px solid ${c};padding-bottom:2px;">{{P${i+1}_TITLE}}</div>
    <div style="font-family:'Caveat',cursive;font-size:${itemBodySz}px;font-weight:400;color:#111111;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{P${i+1}_BODY}}</div>
  </div>
</div>`).join('\n')}
</div>

<div style="height:${footerH}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#1a1a1a;">
  <div style="font-family:'Nunito',sans-serif;font-size:${s(15)}px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">Follow <span style="color:#93c5fd;">@creator</span> for more | <span style="color:#86efac;">Repost ↻</span></div>
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
// 3-tier comparison (Bad → Better → Best). ALL INLINE STYLES for html2canvas.
export function uiCards(w: number, h: number): string {
  const s = (v: number) => Math.round(v * w / 1080);
  const sh = (v: number) => Math.round(v * h / 1350);
  const pad = s(54);
  const headerH = sh(240);
  const footerH = sh(60);
  const cardGap = sh(18);
  const titleSz = s(52);
  const badgeSz = s(12);
  const cardTitleSz = s(26);
  const cardBodySz = s(20);
  const iconSz = s(65);
  const labelSz = s(11);

  const cards = [
    { bg:'#FFF0F0', border:'#FFCCCC', borderL:'#C0392B', iconBg:'#FFB3B3', iconColor:'#CC0000', icon:'✗', label:'Avoid', labelBg:'rgba(192,57,43,0.15)', labelColor:'#C0392B' },
    { bg:'#FEF9E7', border:'#FFE5A0', borderL:'#D4A017', iconBg:'#FFD4A3', iconColor:'#CC6600', icon:'~', label:'Better', labelBg:'rgba(212,160,23,0.15)', labelColor:'#8B6914' },
    { bg:'#F0FFF4', border:'#B3EED0', borderL:'#2E7D32', iconBg:'#B3FFD1', iconColor:'#006633', icon:'✓', label:'Best', labelBg:'rgba(46,125,50,0.15)', labelColor:'#2E7D32' },
  ];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}</style>
</head>
<body style="width:${w}px;height:${h}px;overflow:hidden;background:#f8f9f7;font-family:'Nunito',sans-serif;display:flex;flex-direction:column;color:#111111;">

<div style="height:${headerH}px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${sh(16)}px ${pad}px;gap:${sh(10)}px;">
  <div style="display:inline-flex;align-items:center;background:#111111;color:#f8f9f7;font-size:${badgeSz}px;font-weight:900;letter-spacing:2.5px;text-transform:uppercase;padding:${sh(6)}px ${s(25)}px;border-radius:100px;">{{BADGE}}</div>
  <div style="font-family:'Nunito',sans-serif;font-size:${titleSz}px;font-weight:900;color:#111111;text-align:center;line-height:1.15;max-width:${s(920)}px;word-wrap:break-word;letter-spacing:-0.01em;">{{TITLE}}</div>
</div>

<div style="flex:1;padding:0 ${pad}px;display:flex;flex-direction:column;gap:${cardGap}px;min-height:0;">
${cards.map((c,i)=>`<div style="flex:1;border-radius:16px;padding:${sh(16)}px ${s(35)}px;display:flex;align-items:center;gap:${s(28)}px;min-height:0;overflow:hidden;background:${c.bg};border:1.5px solid ${c.border};border-left:5px solid ${c.borderL};">
  <div style="width:${iconSz}px;height:${iconSz}px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:${Math.round(iconSz*0.48)}px;font-weight:900;line-height:1;background:${c.iconBg};color:${c.iconColor};">${c.icon}</div>
  <div style="flex:1;min-width:0;overflow:hidden;">
    <div style="display:inline-flex;align-items:center;font-size:${labelSz}px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:${sh(6)}px;padding:3px 10px;border-radius:100px;background:${c.labelBg};color:${c.labelColor};">${c.label}</div>
    <div style="font-family:'Nunito',sans-serif;font-size:${cardTitleSz}px;font-weight:800;color:#111111;line-height:1.2;margin-bottom:${sh(5)}px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{P${i+1}_TITLE}}</div>
    <div style="font-family:'Caveat',cursive;font-size:${cardBodySz}px;font-weight:400;color:#111111;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;">{{P${i+1}_BODY}}</div>
  </div>
</div>`).join('\n')}
</div>

<div style="height:${footerH}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-top:0.5px solid #e0e0e0;background:#fafafa;">
  <div style="font-family:'Nunito',sans-serif;font-size:${s(14)}px;font-weight:700;color:#333333;">{{FOOTER}} | Follow <span style="color:#2B4DAF;text-decoration:underline;">@creator</span> | Repost ↻</div>
</div>

</body></html>`;
}

// ─── TEMPLATE 10: WHITEBOARD ───
// Paper-clip whiteboard. ALL INLINE STYLES for html2canvas compatibility.
export function whiteboard(w: number, h: number): string {
  const s = (v: number) => Math.round(v * w / 1080);
  const sh = (v: number) => Math.round(v * h / 1350);
  const pad = s(44);
  const headerH = sh(180);
  const footerH = sh(70);
  const titleSz = s(52);
  const badgeSz = s(12);
  const itemTitleSz = s(22);
  const itemBodySz = s(19);
  const itemGap = sh(9);
  const numSz = s(48);
  const borderColors = ['#C0392B','#2B4DAF','#2E7D32','#D4A017','#C0392B','#2B4DAF','#2E7D32'];
  const titleColors = ['#C0392B','#2B4DAF','#2E7D32','#D4A017','#C0392B','#2B4DAF','#2E7D32'];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}</style>
</head>
<body style="width:${w}px;height:${h}px;overflow:hidden;background:#f8f9f7;font-family:'Nunito',sans-serif;display:flex;flex-direction:column;color:#111111;border:1px solid #dddddd;border-radius:6px;position:relative;">

<div style="position:absolute;top:6px;left:6px;width:12px;height:20px;background:#aaaaaa;border-radius:2px;"></div>
<div style="position:absolute;top:6px;right:6px;width:12px;height:20px;background:#aaaaaa;border-radius:2px;"></div>
<div style="position:absolute;bottom:6px;left:6px;width:12px;height:20px;background:#aaaaaa;border-radius:2px;"></div>
<div style="position:absolute;bottom:6px;right:6px;width:12px;height:20px;background:#aaaaaa;border-radius:2px;"></div>

<div style="height:${headerH}px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${sh(10)}px ${pad}px;gap:${sh(8)}px;">
  <div style="display:inline-flex;align-items:center;background:#C0392B;color:#fff;font-family:'Nunito',sans-serif;font-size:${badgeSz}px;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:${sh(5)}px ${s(22)}px;border-radius:100px;">{{BADGE}}</div>
  <div style="font-family:'Nunito',sans-serif;font-size:${titleSz}px;font-weight:900;color:#111111;text-align:center;line-height:1.15;max-width:${s(950)}px;word-wrap:break-word;letter-spacing:-0.01em;">{{TITLE}}</div>
  <div style="width:${s(860)}px;height:3px;background:#C0392B;margin-top:${sh(4)}px;"></div>
</div>

<div style="flex:1;padding:${sh(12)}px ${pad}px;display:flex;flex-direction:column;gap:${itemGap}px;min-height:0;">
${borderColors.map((c,i)=>`<div style="flex:1;display:flex;align-items:center;gap:${s(22)}px;background:#ffffff;border-radius:10px;padding:${sh(10)}px ${s(25)}px;min-height:0;overflow:hidden;border-left:4px solid ${c};">
  <div style="width:${numSz}px;height:${numSz}px;border-radius:50%;border:2px solid #111111;display:flex;align-items:center;justify-content:center;font-size:${Math.round(numSz*0.42)}px;font-weight:900;flex-shrink:0;color:#111111;font-family:'Nunito',sans-serif;">${i+1}</div>
  <div style="flex:1;min-width:0;overflow:hidden;">
    <div style="font-family:'Nunito',sans-serif;font-size:${itemTitleSz}px;font-weight:800;color:${titleColors[i]};line-height:1.2;margin-bottom:${sh(3)}px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-bottom:2px solid ${c};padding-bottom:2px;">{{P${i+1}_TITLE}}</div>
    <div style="font-family:'Caveat',cursive;font-size:${itemBodySz}px;font-weight:400;color:#111111;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{P${i+1}_BODY}}</div>
  </div>
</div>`).join('\n')}
</div>

<div style="height:${footerH}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-top:0.5px solid #cccccc;background:#fafafa;">
  <div style="font-family:'Nunito',sans-serif;font-size:${s(15)}px;font-weight:700;color:#333333;">{{FOOTER}} | Follow <span style="color:#2B4DAF;font-weight:800;text-decoration:underline;">@creator</span> | Repost ↻</div>
</div>

</body></html>`;
}

// ─── TEMPLATE 11: FUNNEL ───
// Pixel-perfect forensic funnel. ALL INLINE STYLES for html2canvas.
export function funnel(w: number, h: number): string {
  const scale = w / 1080;
  const pad = Math.round(40 * scale);
  const headingSz = Math.round(52 * scale);
  const subheadSz = Math.round(18 * scale);
  const badgeSz = Math.round(12 * scale);
  const cardH = Math.round(84 * scale);
  const arrowH = Math.round(40 * scale);
  const numSz = Math.round(44 * scale);
  const titleSz = Math.round(18 * scale);
  const subtextSz = Math.round(15 * scale);
  const proTipPad = Math.round(16 * scale);
  const footerPad = Math.round(20 * scale);

  const steps = [
    { bg:'#B83228', badgeColor:'#B83228', width:'100%' },
    { bg:'#E07B20', badgeColor:'#E07B20', width:'88%' },
    { bg:'#D4A017', badgeColor:'#8B6914', width:'76%' },
    { bg:'#2E7D32', badgeColor:'#2E7D32', width:'64%' },
    { bg:'#1565C0', badgeColor:'#1565C0', width:'52%' },
  ];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}</style>
</head>
<body style="width:${w}px;min-height:${h}px;background:#f8f9f7;padding:${pad}px;font-family:'Caveat',cursive;">

<div style="text-align:center;margin-bottom:8px;">
  <div style="font-family:'Nunito',sans-serif;font-weight:900;font-size:${headingSz}px;line-height:1.1;color:#111111;letter-spacing:-0.01em;">{{TITLE}}</div>
</div>
<div style="text-align:center;font-family:'Caveat',cursive;font-size:${subheadSz}px;color:#666666;font-style:italic;margin-bottom:${Math.round(20*scale)}px;">{{P6_BODY}}</div>

<div style="text-align:center;margin-bottom:${Math.round(20*scale)}px;">
  <span style="display:inline-block;background:#111111;color:#ffffff;font-family:'Nunito',sans-serif;font-weight:800;font-size:${badgeSz}px;letter-spacing:2px;text-transform:uppercase;padding:${Math.round(6*scale)}px ${Math.round(20*scale)}px;border-radius:100px;">{{BADGE}}</span>
</div>

${steps.map((s, i) => `
<div style="background:${s.bg};border-radius:${Math.round(12*scale)}px;display:flex;align-items:center;min-height:${cardH}px;width:${s.width};margin:0 auto;">
  <div style="width:${numSz}px;height:${numSz}px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:${Math.round(16*scale)}px;font-family:'Nunito',sans-serif;font-weight:700;font-size:${Math.round(18*scale)}px;color:${s.badgeColor};">${i+1}</div>
  <div style="padding:${Math.round(12*scale)}px ${Math.round(16*scale)}px ${Math.round(12*scale)}px ${Math.round(12*scale)}px;flex:1;">
    <div style="font-family:'Nunito',sans-serif;font-weight:700;font-size:${titleSz}px;color:#ffffff;line-height:1.2;margin-bottom:4px;">{{P${i+1}_TITLE}}</div>
    <div style="font-family:'Caveat',cursive;font-size:${subtextSz}px;color:rgba(255,255,255,0.88);font-style:italic;">{{P${i+1}_BODY}}</div>
  </div>
</div>
${i < 4 ? `<div style="text-align:center;height:${arrowH}px;display:flex;align-items:center;justify-content:center;"><span style="font-size:${Math.round(20*scale)}px;color:#C0392B;">▼</span></div>` : ''}
`).join('')}

<div style="border:1.5px solid #2E7D32;border-radius:${Math.round(8*scale)}px;padding:${proTipPad}px ${Math.round(20*scale)}px;margin-top:${Math.round(24*scale)}px;background:#FFFFFF;">
  <div style="font-family:'Nunito',sans-serif;font-weight:700;font-size:${Math.round(13*scale)}px;color:#2E7D32;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">PRO TIP:</div>
  <div style="font-family:'Caveat',cursive;font-size:${Math.round(18*scale)}px;color:#333333;font-style:italic;">{{PRO_TIP}}</div>
</div>

<div style="text-align:center;padding:${footerPad}px 0 0;border-top:0.5px solid #cccccc;margin-top:${Math.round(24*scale)}px;font-family:'Nunito',sans-serif;font-weight:600;font-size:${Math.round(15*scale)}px;color:#333333;">
  {{FOOTER}} | Repost ↺
</div>

</body></html>`;
}

// ─── TEMPLATE 12: DATA_GRID ───
// Framework table 4×3 + key takeaway. ALL INLINE STYLES for html2canvas.
export function dataGrid(w: number, h: number): string {
  const s = (v: number) => Math.round(v * w / 1080);
  const sh = (v: number) => Math.round(v * h / 1350);
  const pad = s(44);
  const headerH = sh(190);
  const footerH = sh(60);
  const titleSz = s(48);
  const badgeSz = s(12);
  const thSz = s(13);
  const cellSz = s(16);
  const dotSz = s(15);
  const thPad = `${sh(14)}px ${s(20)}px`;
  const rowPad = `0 ${s(20)}px`;

  const dots = ['#C0392B','#D4A017','#2E7D32','#8B5CF6'];
  const rowBgs = ['#ffffff','#f9f9f9','#ffffff','#f9f9f9'];
  const thColors = ['#C0392B','#2B4DAF','#2E7D32'];

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}</style>
</head>
<body style="width:${w}px;height:${h}px;overflow:hidden;background:#f8f9f7;font-family:'Nunito',sans-serif;display:flex;flex-direction:column;color:#111111;">

<div style="height:${headerH}px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${sh(10)}px ${pad}px;gap:${sh(8)}px;">
  <div style="display:inline-flex;align-items:center;background:#2B4DAF;color:#fff;font-size:${badgeSz}px;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:${sh(5)}px ${s(22)}px;border-radius:100px;">{{BADGE}}</div>
  <div style="font-family:'Nunito',sans-serif;font-size:${titleSz}px;font-weight:900;color:#111111;text-align:center;line-height:1.18;max-width:${s(920)}px;word-wrap:break-word;letter-spacing:-0.01em;">{{TITLE}}</div>
</div>

<div style="flex:1;padding:0 ${pad}px ${sh(12)}px;display:flex;flex-direction:column;min-height:0;">

<div style="flex:1;border-radius:12px;overflow:hidden;border:1.5px solid #e0e0e0;display:flex;flex-direction:column;background:#ffffff;">
  <div style="display:grid;grid-template-columns:1.2fr 2fr 1fr;background:#f5f5f5;border-bottom:2px solid #e0e0e0;padding:${thPad};gap:${s(10)}px;">
    <div style="font-family:'Nunito',sans-serif;font-size:${thSz}px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:${thColors[0]};">Concept</div>
    <div style="font-family:'Nunito',sans-serif;font-size:${thSz}px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:${thColors[1]};">Description</div>
    <div style="font-family:'Nunito',sans-serif;font-size:${thSz}px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:${thColors[2]};">Best For</div>
  </div>
${[0,1,2,3].map(i=>`  <div style="flex:1;display:grid;grid-template-columns:1.2fr 2fr 1fr;align-items:center;padding:${rowPad};gap:${s(10)}px;border-bottom:0.5px solid #e8e8e8;min-height:0;overflow:hidden;background:${rowBgs[i]};">
    <div style="display:flex;align-items:center;gap:${s(8)}px;font-family:'Nunito',sans-serif;font-weight:800;font-size:${cellSz}px;color:#111111;overflow:hidden;"><div style="width:${dotSz}px;height:${dotSz}px;border-radius:50%;flex-shrink:0;background:${dots[i]};"></div>{{P${i+1}_TITLE}}</div>
    <div style="font-family:'Caveat',cursive;font-size:${Math.round(cellSz*1.15)}px;font-weight:400;color:#111111;line-height:1.35;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{P${i+1}_BODY}}</div>
    <div style="font-family:'Nunito',sans-serif;font-size:${Math.round(cellSz*0.9)}px;font-weight:700;color:#2E7D32;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">{{P${i+5}_TITLE}}</div>
  </div>`).join('\n')}
</div>

<div style="margin-top:${sh(14)}px;padding:${sh(12)}px ${s(25)}px;background:#fffdf0;border-radius:10px;border-left:4px solid #C0392B;flex-shrink:0;">
  <div style="font-family:'Nunito',sans-serif;font-size:${s(12)}px;font-weight:900;color:#C0392B;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">★ Key Takeaway</div>
  <div style="font-family:'Caveat',cursive;font-size:${Math.round(cellSz*1.1)}px;font-weight:400;color:#111111;line-height:1.35;">{{PRO_TIP}}</div>
</div>

</div>

<div style="height:${footerH}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-top:0.5px solid #e0e0e0;background:#fafafa;">
  <div style="font-family:'Nunito',sans-serif;font-size:${s(14)}px;font-weight:700;color:#333333;">Follow <span style="color:#2B4DAF;text-decoration:underline;">@creator</span> for more | Repost ↻</div>
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

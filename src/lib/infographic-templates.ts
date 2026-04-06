/**
 * 6 complete HTML/CSS infographic templates.
 * Extracted from deep analysis of 12 Awa K. Penn reference images.
 * Each template returns a full HTML string with {{PLACEHOLDERS}}.
 */

const FONT_IMPORTS = `<link href="https://fonts.googleapis.com/css2?family=Patrick+Hand:wght@400&family=Poppins:wght@400;700;900&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">`;

// ─── TEMPLATE 1: AWA_CLASSIC ───
// Based on: numbered sections, cream bg, wood border, handwritten
export function awaClassic(w: number, h: number): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:#FFF8F0;font-family:'Patrick Hand',cursive;border:8px solid #5D3A1A;padding:48px;overflow:hidden;display:flex;flex-direction:column;box-shadow:inset 0 0 80px rgba(0,0,0,0.03)}
.header{text-align:center;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #E53E3E}
.badge{display:inline-block;background:#E53E3E;color:#fff;font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;margin-bottom:14px;letter-spacing:1px;text-transform:uppercase;font-family:'Poppins',sans-serif}
.title{font-size:${h > 1100 ? 46 : 42}px;font-weight:900;color:#1A1A1A;line-height:1.12;text-transform:uppercase}
.title span{color:#E53E3E}
.sections{display:flex;flex-direction:column;gap:${h > 1100 ? 20 : 16}px;flex:1}
.section{display:flex;align-items:flex-start;gap:14px;padding:14px 18px;background:rgba(0,0,0,0.02);border-radius:12px;border-left:4px solid var(--c)}
.num{width:42px;height:42px;border-radius:50%;background:var(--c);color:#fff;font-size:18px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'Poppins',sans-serif;box-shadow:0 3px 10px rgba(0,0,0,0.15)}
.ico{width:44px;height:44px;border-radius:12px;background:color-mix(in srgb,var(--c) 12%,transparent);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sc{flex:1}
.st{font-size:18px;font-weight:700;color:var(--c);margin-bottom:4px;font-family:'Poppins',sans-serif}
.sb{font-size:14px;color:#2D3748;line-height:1.45}
.sb .a{color:#E53E3E;font-weight:bold}
.footer{text-align:center;margin-top:auto;padding-top:18px;border-top:2px solid #5D3A1A;font-size:14px;font-weight:700;color:#5D3A1A;font-family:'Poppins',sans-serif}
.s1{--c:#E53E3E}.s2{--c:#3182CE}.s3{--c:#38A169}.s4{--c:#DD6B20}.s5{--c:#9B59B6}
</style></head><body>
<div class="header"><div class="badge">{{BADGE}}</div><div class="title">{{TITLE}}</div></div>
<div class="sections">
<div class="section s1"><div class="num">1</div><div class="ico">{{P1_ICON}}</div><div class="sc"><div class="st">{{P1_TITLE}}</div><div class="sb">{{P1_BODY}}</div></div></div>
<div class="section s2"><div class="num">2</div><div class="ico">{{P2_ICON}}</div><div class="sc"><div class="st">{{P2_TITLE}}</div><div class="sb">{{P2_BODY}}</div></div></div>
<div class="section s3"><div class="num">3</div><div class="ico">{{P3_ICON}}</div><div class="sc"><div class="st">{{P3_TITLE}}</div><div class="sb">{{P3_BODY}}</div></div></div>
<div class="section s4"><div class="num">4</div><div class="ico">{{P4_ICON}}</div><div class="sc"><div class="st">{{P4_TITLE}}</div><div class="sb">{{P4_BODY}}</div></div></div>
<div class="section s5"><div class="num">5</div><div class="ico">{{P5_ICON}}</div><div class="sc"><div class="st">{{P5_TITLE}}</div><div class="sb">{{P5_BODY}}</div></div></div>
</div>
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 2: DARK_TECH ───
// Based on: dark background, cyan accents, glassmorphism cards
export function darkTech(w: number, h: number): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:linear-gradient(160deg,#0F172A,#1E293B);font-family:'Inter',sans-serif;padding:52px;overflow:hidden;display:flex;flex-direction:column}
.header{text-align:center;margin-bottom:36px}
.badge{display:inline-block;background:#00C9B1;color:#000;font-size:11px;font-weight:800;padding:6px 16px;border-radius:20px;margin-bottom:16px;letter-spacing:1.5px;text-transform:uppercase}
.title{font-size:${h > 1100 ? 44 : 40}px;font-weight:800;color:#F1F5F9;line-height:1.15}
.title span{color:#00C9B1}
.subtitle{font-size:14px;color:#64748B;margin-top:12px}
.sections{display:flex;flex-direction:column;gap:${h > 1100 ? 18 : 14}px;flex:1}
.section{display:flex;align-items:flex-start;gap:16px;padding:18px 22px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;backdrop-filter:blur(4px)}
.num{width:40px;height:40px;border-radius:10px;background:var(--c);color:#000;font-size:16px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ico{width:40px;height:40px;border-radius:10px;background:color-mix(in srgb,var(--c) 12%,transparent);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sc{flex:1}
.st{font-size:17px;font-weight:700;color:#F1F5F9;margin-bottom:5px}
.sb{font-size:13px;color:#94A3B8;line-height:1.5}
.footer{text-align:center;margin-top:auto;padding-top:18px;border-top:1px solid rgba(0,201,177,0.2);font-size:13px;font-weight:700;color:#00C9B1}
.s1{--c:#00C9B1}.s2{--c:#3B82F6}.s3{--c:#A78BFA}.s4{--c:#F59E0B}.s5{--c:#EC4899}
</style></head><body>
<div class="header"><div class="badge">{{BADGE}}</div><div class="title">{{TITLE}}</div></div>
<div class="sections">
<div class="section s1"><div class="num">1</div><div class="ico">{{P1_ICON}}</div><div class="sc"><div class="st">{{P1_TITLE}}</div><div class="sb">{{P1_BODY}}</div></div></div>
<div class="section s2"><div class="num">2</div><div class="ico">{{P2_ICON}}</div><div class="sc"><div class="st">{{P2_TITLE}}</div><div class="sb">{{P2_BODY}}</div></div></div>
<div class="section s3"><div class="num">3</div><div class="ico">{{P3_ICON}}</div><div class="sc"><div class="st">{{P3_TITLE}}</div><div class="sb">{{P3_BODY}}</div></div></div>
<div class="section s4"><div class="num">4</div><div class="ico">{{P4_ICON}}</div><div class="sc"><div class="st">{{P4_TITLE}}</div><div class="sb">{{P4_BODY}}</div></div></div>
<div class="section s5"><div class="num">5</div><div class="ico">{{P5_ICON}}</div><div class="sc"><div class="st">{{P5_TITLE}}</div><div class="sb">{{P5_BODY}}</div></div></div>
</div>
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 3: CHEAT_SHEET ───
// Based on: multi-section grid, colored headers, notebook style
export function cheatSheet(w: number, h: number): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:#FFFFF5;font-family:'Patrick Hand',cursive;border:6px solid #888;padding:44px;overflow:hidden;display:flex;flex-direction:column;box-shadow:inset 0 0 60px rgba(0,0,0,0.02)}
.header{text-align:center;margin-bottom:28px;padding-bottom:16px;border-bottom:3px double #333}
.title{font-size:${h > 1100 ? 42 : 38}px;font-weight:900;color:#1A1A1A;line-height:1.1;text-transform:uppercase;border:3px solid #333;display:inline-block;padding:6px 24px;border-radius:6px}
.title span{color:#E53E3E}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;flex:1}
.card{padding:16px;border-radius:10px;border:2px solid var(--c)}
.card-head{font-size:16px;font-weight:700;color:#fff;background:var(--c);margin:-16px -16px 12px;padding:10px 16px;border-radius:8px 8px 0 0;text-transform:uppercase;letter-spacing:0.5px;font-family:'Poppins',sans-serif}
.card-body{font-size:13px;color:#2D3748;line-height:1.5}
.card-body .item{margin-bottom:6px;display:flex;gap:6px}
.card-body .dot{color:var(--c);font-weight:bold;flex-shrink:0}
.c1{--c:#E53E3E}.c2{--c:#3182CE}.c3{--c:#38A169}.c4{--c:#DD6B20}.c5{--c:#9B59B6}.c6{--c:#E91E8C}
.footer{text-align:center;margin-top:auto;padding-top:14px;border-top:2px solid #333;font-size:14px;font-weight:700;color:#333;font-family:'Poppins',sans-serif}
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
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 4: VIRAL_TIPS ───
// Based on: clean white, giant numbered circles, minimal
export function viralTips(w: number, h: number): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:#FFFFFF;font-family:'Poppins',sans-serif;padding:56px;overflow:hidden;display:flex;flex-direction:column}
.header{text-align:center;margin-bottom:40px}
.badge{display:inline-block;background:linear-gradient(135deg,#6366F1,#EC4899);color:#fff;font-size:11px;font-weight:700;padding:6px 18px;border-radius:20px;margin-bottom:16px;letter-spacing:1px;text-transform:uppercase}
.title{font-size:${h > 1100 ? 44 : 40}px;font-weight:900;color:#111;line-height:1.12}
.title span{background:linear-gradient(135deg,#6366F1,#EC4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.sections{display:flex;flex-direction:column;gap:${h > 1100 ? 22 : 16}px;flex:1}
.section{display:flex;align-items:center;gap:20px;padding:16px 24px;background:#F8FAFC;border-radius:16px}
.num{width:56px;height:56px;border-radius:50%;background:var(--c);color:#fff;font-size:22px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 6px 20px rgba(0,0,0,0.12)}
.ico{width:48px;height:48px;border-radius:14px;background:color-mix(in srgb,var(--c) 10%,transparent);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sc{flex:1}
.st{font-size:18px;font-weight:700;color:#111;margin-bottom:3px}
.sb{font-size:13px;color:#64748B;line-height:1.45}
.footer{text-align:center;margin-top:auto;padding-top:20px;border-top:2px solid #E2E8F0;font-size:13px;font-weight:700;color:#6366F1}
.s1{--c:#6366F1}.s2{--c:#EC4899}.s3{--c:#F59E0B}.s4{--c:#10B981}.s5{--c:#8B5CF6}
</style></head><body>
<div class="header"><div class="badge">{{BADGE}}</div><div class="title">{{TITLE}}</div></div>
<div class="sections">
<div class="section s1"><div class="num">1</div><div class="ico">{{P1_ICON}}</div><div class="sc"><div class="st">{{P1_TITLE}}</div><div class="sb">{{P1_BODY}}</div></div></div>
<div class="section s2"><div class="num">2</div><div class="ico">{{P2_ICON}}</div><div class="sc"><div class="st">{{P2_TITLE}}</div><div class="sb">{{P2_BODY}}</div></div></div>
<div class="section s3"><div class="num">3</div><div class="ico">{{P3_ICON}}</div><div class="sc"><div class="st">{{P3_TITLE}}</div><div class="sb">{{P3_BODY}}</div></div></div>
<div class="section s4"><div class="num">4</div><div class="ico">{{P4_ICON}}</div><div class="sc"><div class="st">{{P4_TITLE}}</div><div class="sb">{{P4_BODY}}</div></div></div>
<div class="section s5"><div class="num">5</div><div class="ico">{{P5_ICON}}</div><div class="sc"><div class="st">{{P5_TITLE}}</div><div class="sb">{{P5_BODY}}</div></div></div>
</div>
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 5: STATS_IMPACT ───
// Based on: hero numbers, data visualization feel
export function statsImpact(w: number, h: number): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:#FFF8F0;font-family:'Patrick Hand',cursive;border:8px solid #5D3A1A;padding:48px;overflow:hidden;display:flex;flex-direction:column;box-shadow:inset 0 0 60px rgba(0,0,0,0.03)}
.header{text-align:center;margin-bottom:32px}
.badge{display:inline-block;background:#DD6B20;color:#fff;font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;margin-bottom:14px;letter-spacing:1px;text-transform:uppercase;font-family:'Poppins',sans-serif}
.title{font-size:${h > 1100 ? 44 : 40}px;font-weight:900;color:#1A1A1A;line-height:1.12;text-transform:uppercase}
.title span{color:#DD6B20}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:20px;flex:1}
.stat{text-align:center;padding:24px 16px;background:rgba(0,0,0,0.02);border-radius:16px;border:2px solid var(--c);display:flex;flex-direction:column;align-items:center;justify-content:center}
.stat-num{font-size:64px;font-weight:900;color:var(--c);line-height:1;font-family:'Poppins',sans-serif}
.stat-label{font-size:18px;font-weight:700;color:#1A1A1A;margin-top:8px}
.stat-desc{font-size:13px;color:#5D3A1A;margin-top:4px;line-height:1.3}
.stat-ico{width:52px;height:52px;border-radius:14px;background:color-mix(in srgb,var(--c) 12%,transparent);display:flex;align-items:center;justify-content:center;margin-bottom:8px}
.c1{--c:#E53E3E}.c2{--c:#3182CE}.c3{--c:#38A169}.c4{--c:#DD6B20}
.footer{text-align:center;margin-top:auto;padding-top:18px;border-top:2px solid #5D3A1A;font-size:14px;font-weight:700;color:#5D3A1A;font-family:'Poppins',sans-serif}
</style></head><body>
<div class="header"><div class="badge">{{BADGE}}</div><div class="title">{{TITLE}}</div></div>
<div class="stats">
<div class="stat c1"><div class="stat-ico">{{P1_ICON}}</div><div class="stat-num">{{P1_TITLE}}</div><div class="stat-label">{{P1_BODY}}</div></div>
<div class="stat c2"><div class="stat-ico">{{P2_ICON}}</div><div class="stat-num">{{P2_TITLE}}</div><div class="stat-label">{{P2_BODY}}</div></div>
<div class="stat c3"><div class="stat-ico">{{P3_ICON}}</div><div class="stat-num">{{P3_TITLE}}</div><div class="stat-label">{{P3_BODY}}</div></div>
<div class="stat c4"><div class="stat-ico">{{P4_ICON}}</div><div class="stat-num">{{P4_TITLE}}</div><div class="stat-label">{{P4_BODY}}</div></div>
</div>
<div class="footer">{{FOOTER}}</div>
</body></html>`;
}

// ─── TEMPLATE 6: COMPARISON_VS ───
// Based on: 2-column comparison, VS badge, structured rows
export function comparisonVs(w: number, h: number): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${FONT_IMPORTS}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:${w}px;height:${h}px;background:#FFFFF5;font-family:'Patrick Hand',cursive;border:6px solid #888;padding:44px;overflow:hidden;display:flex;flex-direction:column;box-shadow:inset 0 0 60px rgba(0,0,0,0.02)}
.header{text-align:center;margin-bottom:28px}
.title{font-size:${h > 1100 ? 42 : 38}px;font-weight:900;color:#1A1A1A;line-height:1.1;text-transform:uppercase}
.title .left{color:#3182CE}.title .right{color:#E53E3E}
.vs-container{display:grid;grid-template-columns:1fr 48px 1fr;gap:0;flex:1}
.col{display:flex;flex-direction:column;gap:12px}
.col-head{font-size:20px;font-weight:900;color:#fff;padding:12px;border-radius:10px;text-align:center;text-transform:uppercase;font-family:'Poppins',sans-serif}
.col-left .col-head{background:#3182CE}
.col-right .col-head{background:#E53E3E}
.row{padding:10px 14px;border-radius:8px;font-size:14px;color:#2D3748;line-height:1.4}
.col-left .row{background:rgba(49,130,206,0.06);border-left:3px solid #3182CE}
.col-right .row{background:rgba(229,62,62,0.06);border-left:3px solid #E53E3E}
.row-title{font-weight:700;font-size:15px;margin-bottom:2px;font-family:'Poppins',sans-serif}
.col-left .row-title{color:#3182CE}
.col-right .row-title{color:#E53E3E}
.vs{display:flex;align-items:center;justify-content:center}
.vs-badge{width:44px;height:44px;border-radius:50%;background:#1A1A1A;color:#FFF;font-size:14px;font-weight:900;display:flex;align-items:center;justify-content:center;font-family:'Poppins',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.2)}
.footer{text-align:center;margin-top:auto;padding-top:14px;border-top:2px solid #888;font-size:14px;font-weight:700;color:#555;font-family:'Poppins',sans-serif}
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
};

export const TEMPLATE_IDS = Object.keys(TEMPLATE_REGISTRY) as string[];

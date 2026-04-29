const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Shared styles ──

const STYLES = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f1a;padding:40px 20px;color:#fff}
.wr{max-width:580px;margin:0 auto}
.cd{background:#1a1a2e;border-radius:20px;overflow:hidden;border:1px solid rgba(36,168,155,.2);box-shadow:0 20px 60px rgba(0,0,0,.5)}
.hd{background:linear-gradient(135deg,#1a1a2e,#0d1117);padding:36px 40px 28px;border-bottom:1px solid rgba(36,168,155,.15);text-align:center}
.sub{color:rgba(255,255,255,.4);font-size:12px;margin-top:8px;letter-spacing:1px;text-transform:uppercase}
.bd{padding:40px}
.gr{font-size:26px;font-weight:700;color:#fff;margin-bottom:16px;line-height:1.3}
.tx{color:rgba(255,255,255,.7);font-size:15px;line-height:1.7;margin-bottom:20px}
.hl{color:#24A89B;font-weight:600}
.cta{display:inline-block;background:linear-gradient(135deg,#24A89B,#1a8a7f);color:#fff;padding:16px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 8px 24px rgba(36,168,155,.3)}
.ft{background:rgba(36,168,155,.06);border:1px solid rgba(36,168,155,.15);border-radius:14px;padding:24px;margin:24px 0}
.fi{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px}
.fi:last-child{margin-bottom:0}
.fi svg{flex-shrink:0;margin-top:2px}
.fi-t{color:rgba(255,255,255,.8);font-size:14px;line-height:1.5}
.fi-t strong{color:#fff;font-weight:600}
.dv{height:1px;background:rgba(255,255,255,.08);margin:28px 0}
.wn{background:rgba(255,193,7,.08);border:1px solid rgba(255,193,7,.2);border-radius:12px;padding:16px 20px;margin:20px 0;color:rgba(255,255,255,.7);font-size:13px;line-height:1.6}
.fo{padding:24px 40px;border-top:1px solid rgba(255,255,255,.06);text-align:center}
.fo p{color:rgba(255,255,255,.3);font-size:12px;line-height:1.6}
.bg{display:inline-flex;align-items:center;gap:6px;background:rgba(36,168,155,.15);color:#24A89B;border:1px solid rgba(36,168,155,.3);border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;margin-bottom:20px;letter-spacing:.5px}
.ct{text-align:center;margin:28px 0}
`;

// ── SVG Icons ──

const I = {
  zap: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#24A89B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  img: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#24A89B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  file: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#24A89B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  bot: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#24A89B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>`,
  chk: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#24A89B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  trn: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#24A89B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  lck: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#24A89B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  str: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#24A89B" stroke="#24A89B" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  msg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#24A89B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  heart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#24A89B" stroke="#24A89B" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
};

// ── Logo SVG ──

const LOGO = `<div style="text-align:center">
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="42" viewBox="0 0 420 110" style="max-width:160px">
<text x="0" y="82" font-family="-apple-system,BlinkMacSystemFont,Helvetica,sans-serif" font-size="72" font-weight="800" fill="#ffffff" letter-spacing="-2">Supenli<tspan fill="#24A89B">.io</tspan></text>
</svg>
</div>`;

const APP = "https://supenli.io/dashboard";

// ── Welcome ──

function buildWelcomeEmail(name: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wr"><div class="cd">
<div class="hd">${LOGO}<p class="sub">AI-Powered Content Creation</p></div>
<div class="bd">
<div class="bg">${I.str} Nouveau membre</div>
<div class="gr">Bienvenue, ${name} !</div>
<p class="tx">Tu viens de rejoindre la plateforme de cr&eacute;ation de contenu viral aliment&eacute;e par l'IA. Tu es au bon endroit pour <span class="hl">cr&eacute;er, structurer et publier</span> du contenu qui performe vraiment.</p>
<div class="ft">
<div class="fi">${I.zap}<div class="fi-t"><strong>G&eacute;n&eacute;ration en secondes</strong><br>5 variations virales par sujet, adapt&eacute;es &agrave; chaque plateforme.</div></div>
<div class="fi">${I.img}<div class="fi-t"><strong>Infographies automatiques</strong><br>Transforme ton contenu en visuels pr&ecirc;ts &agrave; publier.</div></div>
<div class="fi">${I.file}<div class="fi-t"><strong>Sources intelligentes</strong><br>Importe tes PDFs et URLs pour enrichir ta cr&eacute;ation.</div></div>
<div class="fi">${I.bot}<div class="fi-t"><strong>AI Coach personnel</strong><br>Un expert toujours disponible pour booster ta strat&eacute;gie.</div></div>
</div>
<div class="ct"><a href="${APP}" class="cta">Commencer &agrave; cr&eacute;er &rarr;</a></div>
<div class="dv"></div>
<p class="tx" style="font-size:13px;margin-bottom:0;text-align:center">Des questions ? R&eacute;ponds directement &agrave; cet email.</p>
</div>
<div class="fo"><p>&copy; 2026 Supenli.io &middot; Tu re&ccedil;ois cet email car tu viens de cr&eacute;er un compte.</p></div>
</div></div></body></html>`;
}

// ── Reset password ──

function buildResetEmail(resetLink: string, name?: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wr"><div class="cd">
<div class="hd">${LOGO}</div>
<div class="bd">
<div class="bg">${I.lck} S&eacute;curit&eacute; du compte</div>
<div class="gr">R&eacute;initialise ton mot de passe</div>
<p class="tx">${name ? `Bonjour <span class="hl">${name}</span>,<br><br>` : ''}Nous avons re&ccedil;u une demande de r&eacute;initialisation de mot de passe pour ton compte <strong>Supenli.io</strong>. Clique sur le bouton ci-dessous pour cr&eacute;er un nouveau mot de passe.</p>
<div class="ct"><a href="${resetLink}" class="cta">R&eacute;initialiser mon mot de passe &rarr;</a></div>
<div class="wn">${I.lck} Ce lien expire dans <strong>1 heure</strong>. Si tu n'as pas demand&eacute; cette r&eacute;initialisation, tu peux ignorer cet email.</div>
<div class="dv"></div>
<p class="tx" style="font-size:12px;margin-bottom:0;color:rgba(255,255,255,.4)">Si le bouton ne fonctionne pas, copie ce lien :<br><span style="color:#24A89B;word-break:break-all;font-size:11px">${resetLink}</span></p>
</div>
<div class="fo"><p>&copy; 2026 Supenli.io &middot; Email envoy&eacute; pour des raisons de s&eacute;curit&eacute;.</p></div>
</div></div></body></html>`;
}

// ── Content ready ──

function buildContentReadyEmail(name: string, platform: string, topic: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wr"><div class="cd">
<div class="hd">${LOGO}</div>
<div class="bd">
<div class="bg">${I.trn} ${platform}</div>
<div class="gr">Ton contenu est pr&ecirc;t !</div>
<p class="tx">Hey <span class="hl">${name}</span>,<br><br>Ton contenu <strong>${platform}</strong> sur &laquo;<span class="hl">${topic}</span>&raquo; a &eacute;t&eacute; g&eacute;n&eacute;r&eacute; avec <strong>5 variations virales</strong> pr&ecirc;tes &agrave; publier.</p>
<div class="ft">
<div class="fi">${I.chk}<div class="fi-t"><strong>5 variations g&eacute;n&eacute;r&eacute;es</strong><br>Chaque variation a un angle et un hook diff&eacute;rent.</div></div>
<div class="fi">${I.trn}<div class="fi-t"><strong>Score de viralit&eacute;</strong><br>Identifie la meilleure variation pour maximiser ta port&eacute;e.</div></div>
</div>
<div class="ct"><a href="${APP}" class="cta">Voir mon contenu &rarr;</a></div>
</div>
<div class="fo"><p>&copy; 2026 Supenli.io</p></div>
</div></div></body></html>`;
}

// ── Feedback ──

function buildFeedbackEmail(name: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wr"><div class="cd">
<div class="hd">${LOGO}<p class="sub">Ton avis compte pour nous</p></div>
<div class="bd">
<div class="bg">${I.heart} Feedback</div>
<div class="gr">Comment tu trouves Supenli.io ?</div>
<p class="tx">Hey <span class="hl">${name}</span>,<br><br>Tu utilises Supenli.io depuis quelques jours et ton avis nous tient vraiment &agrave; c&oelig;ur. En 2 minutes, tu peux nous aider &agrave; construire l'outil dont tu as vraiment besoin.</p>
<div class="ft">
<div class="fi">${I.msg}<div class="fi-t"><strong>Ce qu'on veut savoir :</strong><br>&rarr; Qu'est-ce qui fonctionne bien pour toi ?<br>&rarr; Qu'est-ce qui pourrait &ecirc;tre am&eacute;lior&eacute; ?<br>&rarr; Quelle fonctionnalit&eacute; te manque le plus ?</div></div>
</div>
<div class="ct"><a href="mailto:feedback@supenli.io?subject=Mon avis sur Supenli.io" class="cta">Donner mon avis &rarr;</a></div>
<div class="dv"></div>
<p class="tx" style="font-size:13px;margin-bottom:0;text-align:center">Tu peux aussi r&eacute;pondre directement &agrave; cet email.<br>Chaque message est lu personnellement.</p>
</div>
<div class="fo"><p>&copy; 2026 Supenli.io &middot; On construit cet outil pour toi.</p></div>
</div></div></body></html>`;
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, type, data } = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    if (!to || !subject) throw new Error("Missing: to, subject");

    let html = "";
    if (type === "welcome") html = buildWelcomeEmail(data?.name || "there");
    else if (type === "reset-password") html = buildResetEmail(data?.resetLink || "#", data?.name);
    else if (type === "content-ready") html = buildContentReadyEmail(data?.name || "there", data?.platform || "Social Media", data?.topic || "ton sujet");
    else if (type === "feedback") html = buildFeedbackEmail(data?.name || "there");
    else html = data?.html || "<p>No content</p>";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: "Supenli.io <onboarding@resend.dev>", to: [to], subject, html }),
    });

    if (!res.ok) { const e = await res.json(); throw new Error(e.message || `Resend ${res.status}`); }
    const result = await res.json();
    return json({ success: true, id: result.id });
  } catch (err) {
    console.error("[send-email]", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

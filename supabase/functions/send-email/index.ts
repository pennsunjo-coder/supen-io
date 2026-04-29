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

// ── Shared email styles (dark premium theme) ──

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f1a; padding: 40px 20px; color: #ffffff; }
  .wrapper { max-width: 580px; margin: 0 auto; }
  .card { background: #1a1a2e; border-radius: 20px; overflow: hidden; border: 1px solid rgba(36,168,155,0.2); box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
  .header { background: linear-gradient(135deg, #1a1a2e 0%, #0d1117 100%); padding: 36px 40px 28px; border-bottom: 1px solid rgba(36,168,155,0.15); text-align: center; }
  .logo-text { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
  .logo-dot { color: #24A89B; }
  .body { padding: 40px; }
  .greeting { font-size: 26px; font-weight: 700; color: #ffffff; margin-bottom: 16px; line-height: 1.3; }
  .text { color: rgba(255,255,255,0.7); font-size: 15px; line-height: 1.7; margin-bottom: 20px; }
  .hl { color: #24A89B; font-weight: 600; }
  .cta { display: inline-block; background: linear-gradient(135deg, #24A89B, #1a8a7f); color: #ffffff; padding: 16px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 8px 0 24px; box-shadow: 0 8px 24px rgba(36,168,155,0.3); }
  .features { background: rgba(36,168,155,0.06); border: 1px solid rgba(36,168,155,0.15); border-radius: 14px; padding: 24px; margin: 24px 0; }
  .fi { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
  .fi:last-child { margin-bottom: 0; }
  .fi-icon { font-size: 18px; line-height: 1.4; flex-shrink: 0; }
  .fi-text { color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.5; }
  .fi-text strong { color: #ffffff; font-weight: 600; }
  .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 28px 0; }
  .warn { background: rgba(255,193,7,0.08); border: 1px solid rgba(255,193,7,0.2); border-radius: 12px; padding: 16px 20px; margin: 20px 0; color: rgba(255,255,255,0.7); font-size: 13px; line-height: 1.6; }
  .footer { padding: 24px 40px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; }
  .footer p { color: rgba(255,255,255,0.3); font-size: 12px; line-height: 1.6; }
  .badge { display: inline-block; background: rgba(36,168,155,0.15); color: #24A89B; border: 1px solid rgba(36,168,155,0.3); border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 600; margin-bottom: 20px; letter-spacing: 0.5px; }
`;

const LOGO = `<span class="logo-text">Supenli<span class="logo-dot">.io</span></span>`;

const APP_URL = "https://supenli.io/dashboard";

// ── Welcome email ──

function buildWelcomeEmail(name: string): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wrapper"><div class="card">
  <div class="header">${LOGO}</div>
  <div class="body">
    <div class="badge">&#10024; Nouveau membre</div>
    <div class="greeting">Bienvenue, ${name} !</div>
    <p class="text">Tu viens de rejoindre la plateforme de cr&eacute;ation de contenu viral aliment&eacute;e par l'IA. Tu es au bon endroit pour <span class="hl">cr&eacute;er, structurer et publier</span> du contenu qui performe vraiment.</p>
    <div class="features">
      <div class="fi"><span class="fi-icon">&#9889;</span><div class="fi-text"><strong>G&eacute;n&eacute;ration en secondes</strong><br>5 variations virales par sujet, adapt&eacute;es &agrave; chaque plateforme.</div></div>
      <div class="fi"><span class="fi-icon">&#128248;</span><div class="fi-text"><strong>Infographies automatiques</strong><br>Transforme ton contenu en visuels pr&ecirc;ts &agrave; publier.</div></div>
      <div class="fi"><span class="fi-icon">&#128196;</span><div class="fi-text"><strong>Sources intelligentes</strong><br>Importe tes PDFs et URLs pour enrichir ta cr&eacute;ation.</div></div>
      <div class="fi"><span class="fi-icon">&#129302;</span><div class="fi-text"><strong>AI Coach personnel</strong><br>Un expert toujours disponible pour booster ta strat&eacute;gie.</div></div>
    </div>
    <a href="${APP_URL}" class="cta">Commencer &agrave; cr&eacute;er &rarr;</a>
    <div class="divider"></div>
    <p class="text" style="font-size:13px;margin-bottom:0;">Des questions ? R&eacute;ponds directement &agrave; cet email. Notre &eacute;quipe est l&agrave; pour t'accompagner.</p>
  </div>
  <div class="footer"><p>&copy; 2026 Supenli.io &middot; Tu re&ccedil;ois cet email car tu viens de cr&eacute;er un compte.</p></div>
</div></div></body></html>`;
}

// ── Reset password email ──

function buildResetEmail(resetLink: string, name?: string): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wrapper"><div class="card">
  <div class="header">${LOGO}</div>
  <div class="body">
    <div class="badge">&#128274; S&eacute;curit&eacute; du compte</div>
    <div class="greeting">R&eacute;initialise ton mot de passe</div>
    <p class="text">${name ? `Bonjour <span class="hl">${name}</span>,<br><br>` : ''}Nous avons re&ccedil;u une demande de r&eacute;initialisation de mot de passe pour ton compte Supenli.io. Clique sur le bouton ci-dessous pour cr&eacute;er un nouveau mot de passe.</p>
    <a href="${resetLink}" class="cta">R&eacute;initialiser mon mot de passe &rarr;</a>
    <div class="warn">&#9888;&#65039; Ce lien expire dans <strong>1 heure</strong>. Si tu n'as pas demand&eacute; cette r&eacute;initialisation, tu peux ignorer cet email &mdash; ton compte est en s&eacute;curit&eacute;.</div>
    <div class="divider"></div>
    <p class="text" style="font-size:13px;margin-bottom:0;">Si le bouton ne fonctionne pas, copie ce lien :<br><span class="hl" style="font-size:12px;word-break:break-all;">${resetLink}</span></p>
  </div>
  <div class="footer"><p>&copy; 2026 Supenli.io &middot; Cet email a &eacute;t&eacute; envoy&eacute; pour des raisons de s&eacute;curit&eacute;.</p></div>
</div></div></body></html>`;
}

// ── Content ready email ──

function buildContentReadyEmail(name: string, platform: string, topic: string): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wrapper"><div class="card">
  <div class="header">${LOGO}</div>
  <div class="body">
    <div class="badge">&#127919; ${platform}</div>
    <div class="greeting">Ton contenu est pr&ecirc;t !</div>
    <p class="text">Hey <span class="hl">${name}</span>,<br><br>Ton contenu <strong>${platform}</strong> sur &laquo;<span class="hl">${topic}</span>&raquo; a &eacute;t&eacute; g&eacute;n&eacute;r&eacute; avec <strong>5 variations virales</strong> pr&ecirc;tes &agrave; publier.</p>
    <div class="features">
      <div class="fi"><span class="fi-icon">&#9989;</span><div class="fi-text"><strong>5 variations g&eacute;n&eacute;r&eacute;es</strong><br>Chaque variation a un angle et un hook diff&eacute;rent.</div></div>
      <div class="fi"><span class="fi-icon">&#128200;</span><div class="fi-text"><strong>Score de viralit&eacute; calcul&eacute;</strong><br>Identifie la meilleure variation pour maximiser ta port&eacute;e.</div></div>
    </div>
    <a href="${APP_URL}" class="cta">Voir mon contenu &rarr;</a>
  </div>
  <div class="footer"><p>&copy; 2026 Supenli.io</p></div>
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
    if (!to || !subject) throw new Error("Missing required fields: to, subject");

    let html = "";
    if (type === "welcome") {
      html = buildWelcomeEmail(data?.name || "there");
    } else if (type === "reset-password") {
      html = buildResetEmail(data?.resetLink || "#", data?.name);
    } else if (type === "content-ready") {
      html = buildContentReadyEmail(data?.name || "there", data?.platform || "Social Media", data?.topic || "ton sujet");
    } else {
      html = data?.html || "<p>No content</p>";
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Supenli.io <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || `Resend API error (${response.status})`);
    }

    const result = await response.json();
    return json({ success: true, id: result.id });
  } catch (err) {
    console.error("[send-email]", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

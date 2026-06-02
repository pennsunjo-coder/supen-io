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
<text x="0" y="82" font-family="-apple-system,BlinkMacSystemFont,Helvetica,sans-serif" font-size="72" font-weight="800" fill="#ffffff" letter-spacing="-2">Supenli<tspan fill="#24A89B">.ai</tspan></text>
</svg>
</div>`;

const APP = "https://supenli.ai/dashboard";

// ── Welcome ──

function buildWelcomeEmail(name: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wr"><div class="cd">
<div class="hd">${LOGO}<p class="sub">AI-Powered Content Creation</p></div>
<div class="bd">
<div class="bg">${I.str} New Member</div>
<div class="gr">Welcome, ${name}!</div>
<p class="tx">You just joined the AI-powered viral content creation platform. You're in the right place to <span class="hl">create, structure and publish</span> content that actually performs.</p>
<div class="ft">
<div class="fi">${I.zap}<div class="fi-t"><strong>Generate in seconds</strong><br>5 viral variations per topic, adapted to each platform.</div></div>
<div class="fi">${I.img}<div class="fi-t"><strong>Auto infographics</strong><br>Turn your content into ready-to-post visuals.</div></div>
<div class="fi">${I.file}<div class="fi-t"><strong>Smart sources</strong><br>Import PDFs and URLs to enrich your content.</div></div>
<div class="fi">${I.bot}<div class="fi-t"><strong>Personal AI Coach</strong><br>An expert always available to boost your strategy.</div></div>
</div>
<div class="ct"><a href="${APP}" class="cta">Start Creating &rarr;</a></div>
<div class="dv"></div>
<p class="tx" style="font-size:13px;margin-bottom:0;text-align:center">Questions? Reply directly to this email.</p>
</div>
<div class="fo"><p>&copy; 2026 Supenli.ai &middot; You're receiving this because you created an account.</p></div>
</div></div></body></html>`;
}

// ── Reset password ──

function buildResetEmail(resetLink: string, name?: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wr"><div class="cd">
<div class="hd">${LOGO}</div>
<div class="bd">
<div class="bg">${I.lck} Account Security</div>
<div class="gr">Reset your password</div>
<p class="tx">${name ? `Hey <span class="hl">${name}</span>,<br><br>` : ''}We received a request to reset your <strong>Supenli.ai</strong> password. Click the button below to create a new one.</p>
<div class="ct"><a href="${resetLink}" class="cta">Reset my password &rarr;</a></div>
<div class="wn">${I.lck} This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</div>
<div class="dv"></div>
<p class="tx" style="font-size:12px;margin-bottom:0;color:rgba(255,255,255,.4)">If the button doesn't work, copy this link:<br><span style="color:#24A89B;word-break:break-all;font-size:11px">${resetLink}</span></p>
</div>
<div class="fo"><p>&copy; 2026 Supenli.ai &middot; This email was sent for security purposes.</p></div>
</div></div></body></html>`;
}

// ── Content ready ──

function buildContentReadyEmail(name: string, platform: string, topic: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wr"><div class="cd">
<div class="hd">${LOGO}</div>
<div class="bd">
<div class="bg">${I.trn} ${platform}</div>
<div class="gr">Your content is ready!</div>
<p class="tx">Hey <span class="hl">${name}</span>,<br><br>Your <strong>${platform}</strong> content about "<span class="hl">${topic}</span>" has been generated with <strong>5 viral variations</strong> ready to publish.</p>
<div class="ft">
<div class="fi">${I.chk}<div class="fi-t"><strong>5 variations generated</strong><br>Each variation has a different angle and hook.</div></div>
<div class="fi">${I.trn}<div class="fi-t"><strong>Virality score</strong><br>Identify the best variation to maximize your reach.</div></div>
</div>
<div class="ct"><a href="${APP}" class="cta">View my content &rarr;</a></div>
</div>
<div class="fo"><p>&copy; 2026 Supenli.ai</p></div>
</div></div></body></html>`;
}

// ── Feedback ──

function buildFeedbackEmail(name: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wr"><div class="cd">
<div class="hd">${LOGO}<p class="sub">Your feedback matters</p></div>
<div class="bd">
<div class="bg">${I.heart} Feedback</div>
<div class="gr">How are you finding Supenli.ai?</div>
<p class="tx">Hey <span class="hl">${name}</span>,<br><br>You've been using Supenli.ai for a few days and your feedback means a lot to us. In 2 minutes, you can help us build the tool you actually need.</p>
<div class="ft">
<div class="fi">${I.msg}<div class="fi-t"><strong>What we want to know:</strong><br>&rarr; What's working well for you?<br>&rarr; What could be improved?<br>&rarr; What feature do you miss most?</div></div>
</div>
<div class="ct"><a href="mailto:feedback@supenli.ai?subject=My feedback on Supenli.ai" class="cta">Share my feedback &rarr;</a></div>
<div class="dv"></div>
<p class="tx" style="font-size:13px;margin-bottom:0;text-align:center">You can also reply directly to this email.<br>Every message is read personally.</p>
</div>
<div class="fo"><p>&copy; 2026 Supenli.ai &middot; We're building this tool for you.</p></div>
</div></div></body></html>`;
}

// ── Launch Announcement ──
// Two plan cards (Plus / Pro) with direct CTAs into Stripe checkout.
// Links route to /login?plan=plus|pro — Login.tsx reads the param,
// signs the user in/up, then redirects straight to Stripe.
function buildLaunchEmail(name: string): string {
  const PLUS_URL = "https://www.supenli.ai/login?plan=plus";
  const PRO_URL = "https://www.supenli.ai/login?plan=pro";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}
.plan{background:rgba(36,168,155,0.04);border:1px solid rgba(36,168,155,0.18);border-radius:16px;padding:24px;margin-bottom:14px}
.plan.pro{background:linear-gradient(135deg,rgba(36,168,155,0.10),rgba(36,168,155,0.04));border-color:rgba(36,168,155,0.35);position:relative}
.plan-pop{position:absolute;top:-10px;right:18px;background:#24A89B;color:#0d1117;font-size:10px;font-weight:800;letter-spacing:1px;padding:3px 10px;border-radius:10px;text-transform:uppercase}
.plan-n{font-size:14px;color:rgba(255,255,255,0.5);font-weight:600;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px}
.plan-p{font-size:32px;font-weight:800;color:#fff;margin-bottom:4px;line-height:1}
.plan-p span{font-size:14px;font-weight:500;color:rgba(255,255,255,0.5)}
.plan-d{color:rgba(255,255,255,0.6);font-size:13px;line-height:1.5;margin:12px 0 18px}
.plan-l{list-style:none;padding:0;margin:0 0 22px}
.plan-l li{color:rgba(255,255,255,0.75);font-size:13px;line-height:1.6;padding-left:22px;position:relative;margin-bottom:7px}
.plan-l li::before{content:"\\2713";color:#24A89B;font-weight:700;position:absolute;left:0;top:0}
.plan-cta{display:block;text-align:center;background:rgba(36,168,155,0.15);color:#24A89B;border:1px solid rgba(36,168,155,0.4);padding:13px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px}
.plan-cta.solid{background:linear-gradient(135deg,#24A89B,#1a8a7f);color:#fff;border:none;box-shadow:0 6px 18px rgba(36,168,155,0.3)}
</style></head>
<body><div class="wr"><div class="cd">
<div class="hd">${LOGO}<p class="sub">The wait is over</p></div>
<div class="bd">
<div class="bg">${I.zap} We are LIVE</div>
<div class="gr">It's time to go viral, ${name}.</div>
<p class="tx">Supenli.ai is officially open. As a waitlist member you're first in line — pick the plan that fits and the engine is yours in seconds.</p>

<div class="plan">
  <div class="plan-n">Plus</div>
  <div class="plan-p">$10<span> / month</span></div>
  <div class="plan-d">For creators serious about consistency.</div>
  <ul class="plan-l">
    <li>Unlimited viral content across 6 platforms</li>
    <li>50 infographics per month</li>
    <li>Smart sources (PDFs, URLs, YouTube)</li>
    <li>AI Coach with personalized strategy</li>
  </ul>
  <a href="${PLUS_URL}" class="plan-cta">Choose Plus &rarr;</a>
</div>

<div class="plan pro">
  <span class="plan-pop">Most popular</span>
  <div class="plan-n">Pro</div>
  <div class="plan-p">$30<span> / month</span></div>
  <div class="plan-d">For creators who go all in.</div>
  <ul class="plan-l">
    <li>Everything in Plus</li>
    <li>300 infographics per month</li>
    <li>Priority generation queue</li>
    <li>Early access to new features</li>
  </ul>
  <a href="${PRO_URL}" class="plan-cta solid">Choose Pro &rarr;</a>
</div>

<div class="wn">${I.lck} Secure checkout via Stripe. Cancel any time from your account settings.</div>
<div class="dv"></div>
<p class="tx" style="font-size:13px;margin-bottom:0;text-align:center">Questions before subscribing? Just reply to this email.</p>
</div>
<div class="fo"><p>&copy; 2026 Supenli.ai &middot; Built for the next era of creators.</p></div>
</div></div></body></html>`;
}

// ── Subscription activated (payment confirmation) ──
// Fired by stripe-webhook on checkout.session.completed. Confirms the
// plan is live, recaps what they get, and points them to the dashboard
// + the billing portal (so cancellation is one click from the email).
function buildSubscriptionActivatedEmail(name: string, plan: "plus" | "pro"): string {
  const planLabel = plan === "pro" ? "Pro" : "Plus";
  const planPrice = plan === "pro" ? "$30/month" : "$10/month";
  const features = plan === "pro"
    ? [
        "Unlimited generations across 6 platforms",
        "300 infographics per month",
        "Priority generation queue",
        "Style memory + advanced analytics",
        "Early access to new features",
      ]
    : [
        "100 generations per month across 6 platforms",
        "50 infographics per month",
        "Anti-AI humanization on every output",
        "Smart sources (PDFs, URLs, YouTube)",
        "AI Coach with personalized strategy",
      ];
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wr"><div class="cd">
<div class="hd">${LOGO}<p class="sub">Payment Confirmed</p></div>
<div class="bd">
<div class="bg">${I.str} ${planLabel} activated</div>
<div class="gr">Welcome to Supenli.ai ${planLabel}, ${name}!</div>
<p class="tx">Your payment of <span class="hl">${planPrice}</span> went through and your account is now upgraded. Everything below is unlocked right now — no waiting, no extra step.</p>
<div class="ft">
${features.map((f) => `<div class="fi">${I.chk}<div class="fi-t">${f}</div></div>`).join("")}
</div>
<div class="ct"><a href="${APP}" class="cta">Open my dashboard &rarr;</a></div>
<div class="dv"></div>
<p class="tx" style="font-size:13px;margin-bottom:0;text-align:center">Need to update your card, download invoices, or cancel? It's all in <a href="https://www.supenli.ai/settings" style="color:#24A89B;text-decoration:none">your Settings page</a>.<br><br>Welcome aboard — let's go build your audience.</p>
</div>
<div class="fo"><p>&copy; 2026 Supenli.ai &middot; You're receiving this because you upgraded.</p></div>
</div></div></body></html>`;
}

// ── Subscription cancelled ──
// Fired by stripe-webhook on customer.subscription.deleted. Confirms the
// cancel went through, reminds them they keep their Free plan, and leaves
// the door wide open if they ever come back.
function buildSubscriptionCancelledEmail(name: string, plan: "plus" | "pro"): string {
  const planLabel = plan === "pro" ? "Pro" : "Plus";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wr"><div class="cd">
<div class="hd">${LOGO}<p class="sub">Subscription canceled</p></div>
<div class="bd">
<div class="bg">${I.chk} Cancellation confirmed</div>
<div class="gr">${name}, your ${planLabel} subscription is canceled.</div>
<p class="tx">You won't be billed again. Your account stays open on the <span class="hl">Free plan</span> — you keep your past content and you can still generate up to 3 lifetime drafts.</p>
<div class="ft">
<div class="fi">${I.chk}<div class="fi-t"><strong>No more charges</strong><br>Your card will not be billed at the next cycle.</div></div>
<div class="fi">${I.chk}<div class="fi-t"><strong>Past content stays</strong><br>Everything you generated is still in your dashboard.</div></div>
<div class="fi">${I.zap}<div class="fi-t"><strong>One click to come back</strong><br>If you want to resubscribe later, the upgrade button is right there in Settings.</div></div>
</div>
<div class="ct"><a href="${APP}" class="cta">Go to my dashboard &rarr;</a></div>
<div class="dv"></div>
<p class="tx" style="font-size:13px;margin-bottom:0;text-align:center">If you canceled by mistake or have a question, just reply to this email — we read every message.</p>
</div>
<div class="fo"><p>&copy; 2026 Supenli.ai &middot; Sorry to see you go.</p></div>
</div></div></body></html>`;
}

// ── Reminder / re-engagement ──
function buildReminderEmail(name: string, message?: string, daysAway?: number): string {
  const intro = daysAway && daysAway > 0
    ? `It's been <strong>${daysAway} days</strong> since your last visit. Your audience is waiting and so are we.`
    : `We noticed you haven't generated any content yet. Your audience is waiting.`;
  const customMessage = message ? `<p class="tx">${escapeHtml(message)}</p>` : "";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wr"><div class="cd">
<div class="hd">${LOGO}<p class="sub">We miss you</p></div>
<div class="bd">
<div class="bg">${I.zap} Quick reminder</div>
<div class="gr">Hey ${name}, ready to go viral?</div>
<p class="tx">${intro}</p>
${customMessage}
<div class="ft">
<div class="fi">${I.zap}<div class="fi-t"><strong>5 viral variations in 30 seconds</strong><br>Pick a topic, hit generate, ship.</div></div>
<div class="fi">${I.img}<div class="fi-t"><strong>Auto infographics</strong><br>Turn any thread into a scroll-stopping visual.</div></div>
<div class="fi">${I.bot}<div class="fi-t"><strong>AI Coach 24/7</strong><br>Stuck? Ask. It's trained on what actually works.</div></div>
</div>
<div class="ct"><a href="${APP}" class="cta">Create something now &rarr;</a></div>
<div class="dv"></div>
<p class="tx" style="font-size:13px;margin-bottom:0;text-align:center">Not feeling it right now? Reply and tell us what's missing. Every message is read.</p>
</div>
<div class="fo"><p>&copy; 2026 Supenli.ai &middot; You're receiving this because you joined Supenli.ai.</p></div>
</div></div></body></html>`;
}

// ── Waitlist confirmation ──
function buildWaitlistEmail(name: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wr"><div class="cd">
<div class="hd">${LOGO}<p class="sub">Early Access · Priority List</p></div>
<div class="bd">
<div class="bg">${I.str} You're on the list</div>
<div class="gr">You're in, ${name}!</div>
<p class="tx">Thanks for joining the <span class="hl">Supenli.ai</span> priority list. You're now first in line for early access when we go live.</p>
<div class="ft">
<div class="fi">${I.zap}<div class="fi-t"><strong>Priority access</strong><br>You get in before the public launch.</div></div>
<div class="fi">${I.str}<div class="fi-t"><strong>Founding-member perks</strong><br>Early supporters get exclusive deals on launch day.</div></div>
<div class="fi">${I.bot}<div class="fi-t"><strong>The full engine</strong><br>Viral content, infographics and a personal AI coach across 6 platforms.</div></div>
</div>
<div class="dv"></div>
<p class="tx" style="font-size:13px;margin-bottom:0;text-align:center">No spam. We'll send one email the moment we launch.</p>
</div>
<div class="fo"><p>&copy; 2026 Supenli.ai &middot; You're receiving this because you joined the waitlist.</p></div>
</div></div></body></html>`;
}

// ── Contact form (internal notification) ──
function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildContactEmail(name: string, fromEmail: string, subject: string, message: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STYLES}</style></head>
<body><div class="wr"><div class="cd">
<div class="hd">${LOGO}<p class="sub">New contact message</p></div>
<div class="bd">
<div class="bg">${I.msg} Contact</div>
<div class="gr">Message from ${escapeHtml(name)}</div>
<div class="ft">
<div class="fi-t"><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(fromEmail)}&gt;</div>
<div class="dv" style="margin:16px 0"></div>
<div class="fi-t"><strong>Subject:</strong> ${escapeHtml(subject) || "(none)"}</div>
<div class="dv" style="margin:16px 0"></div>
<div class="fi-t" style="white-space:pre-wrap">${escapeHtml(message)}</div>
</div>
<p class="tx" style="font-size:13px;margin-bottom:0">Reply directly to this email to respond to ${escapeHtml(name)}.</p>
</div>
<div class="fo"><p>&copy; 2026 Supenli.ai &middot; Sent from the contact form.</p></div>
</div></div></body></html>`;
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, type, data, replyTo } = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    if (!to || !subject) throw new Error("Missing: to, subject");

    let html = "";
    if (type === "welcome") html = buildWelcomeEmail(data?.name || "there");
    else if (type === "reset-password") html = buildResetEmail(data?.resetLink || "#", data?.name);
    else if (type === "content-ready") html = buildContentReadyEmail(data?.name || "there", data?.platform || "Social Media", data?.topic || "your topic");
    else if (type === "feedback") html = buildFeedbackEmail(data?.name || "there");
    else if (type === "waitlist") html = buildWaitlistEmail(data?.name || "there");
    else if (type === "launch") html = buildLaunchEmail(data?.name || "there");
    else if (type === "reminder") html = buildReminderEmail(data?.name || "there", data?.message, data?.daysAway);
    else if (type === "subscription-activated") html = buildSubscriptionActivatedEmail(data?.name || "there", data?.plan === "pro" ? "pro" : "plus");
    else if (type === "subscription-cancelled") html = buildSubscriptionCancelledEmail(data?.name || "there", data?.plan === "pro" ? "pro" : "plus");
    else if (type === "contact") html = buildContactEmail(data?.name || "there", data?.email || "", data?.subject || "", data?.message || "");
    else throw new Error(`Unknown email type: ${type}`);

    // From-line tuning for deliverability. A personal-looking name in
    // the From + a real human reply_to pushes Gmail to score the email
    // as 1-to-1 instead of bulk marketing, which lands more sends in
    // Primary instead of Promotions. Specific call sites can still
    // override reply_to (e.g. the Contact form passes the visitor's
    // address so we can hit Reply directly).
    const payload: Record<string, unknown> = {
      // Brand-name From (not a personal name). The product is Supenli.ai;
      // emails should read as product communication, not 1-to-1 mail from
      // the founder. Personal-name From was tried earlier for Gmail
      // Promotions-tab evasion but readers misread it as a personal email
      // — keep reply_to pointing at a real human inbox for trust signals
      // instead.
      from: "Supenli.ai <noreply@supenli.ai>",
      to: [to],
      subject,
      html,
      reply_to: replyTo || "pennsunjo@gmail.com",
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify(payload),
    });

    if (!res.ok) { const e = await res.json(); throw new Error(e.message || `Resend ${res.status}`); }
    const result = await res.json();
    return json({ success: true, id: result.id });
  } catch (err) {
    console.error("[send-email]", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

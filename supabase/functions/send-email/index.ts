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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, type, data } = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    if (!to || !subject) {
      throw new Error("Missing required fields: to, subject");
    }

    let html = "";

    if (type === "welcome") {
      html = buildWelcomeEmail(data?.name || "there");
    } else if (type === "reset-password") {
      html = buildResetEmail(data?.resetLink || "");
    } else if (type === "content-ready") {
      html = buildContentReadyEmail(data?.name || "there", data?.platform || "", data?.topic || "");
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
        from: "Supenli.io <hello@supenli.io>",
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

// ─── Email Templates ───

function buildWelcomeEmail(name: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #1a1a2e; padding: 40px 40px 32px; text-align: center; }
    .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .tagline { color: rgba(255,255,255,0.6); font-size: 13px; margin-top: 4px; }
    .body { padding: 40px; }
    .greeting { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 16px; }
    .text { color: #6b7280; font-size: 15px; line-height: 1.7; margin-bottom: 24px; }
    .cta { display: inline-block; background: #FF7A59; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; }
    .footer { padding: 24px 40px; border-top: 1px solid #f0f0f0; text-align: center; }
    .footer-text { color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Supenli.io</div>
      <div class="tagline">AI-powered content creation</div>
    </div>
    <div class="body">
      <div class="greeting">Welcome, ${name}!</div>
      <p class="text">
        You're all set to create viral content for LinkedIn, Instagram, TikTok and more — powered by AI.
      </p>
      <p class="text">
        Here's what you can do right now:<br>
        &#10024; Generate 5 viral post variations in seconds<br>
        &#128248; Create stunning infographics automatically<br>
        &#128196; Upload PDFs and URLs as content sources<br>
        &#128200; Track your content performance
      </p>
      <a href="https://supenli.io/dashboard" class="cta">Start Creating &rarr;</a>
    </div>
    <div class="footer">
      <p class="footer-text">&copy; 2026 Supenli.io &middot; You're receiving this because you created an account.</p>
    </div>
  </div>
</body>
</html>`;
}

function buildResetEmail(resetLink: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #1a1a2e; padding: 40px 40px 32px; text-align: center; }
    .logo { font-size: 24px; font-weight: 800; color: #ffffff; }
    .body { padding: 40px; }
    .title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 16px; }
    .text { color: #6b7280; font-size: 15px; line-height: 1.7; margin-bottom: 24px; }
    .cta { display: inline-block; background: #FF7A59; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; }
    .warning { background: #fef3c7; border-radius: 8px; padding: 12px 16px; color: #92400e; font-size: 13px; margin-top: 24px; }
    .footer { padding: 24px 40px; border-top: 1px solid #f0f0f0; text-align: center; }
    .footer-text { color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Supenli.io</div>
    </div>
    <div class="body">
      <div class="title">Reset your password</div>
      <p class="text">
        We received a request to reset your password. Click the button below to create a new one.
      </p>
      <a href="${resetLink}" class="cta">Reset Password &rarr;</a>
      <div class="warning">
        &#9888;&#65039; This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.
      </div>
    </div>
    <div class="footer">
      <p class="footer-text">&copy; 2026 Supenli.io &middot; This email was sent for security purposes.</p>
    </div>
  </div>
</body>
</html>`;
}

function buildContentReadyEmail(name: string, platform: string, topic: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #1a1a2e; padding: 40px; text-align: center; }
    .logo { font-size: 24px; font-weight: 800; color: #ffffff; }
    .body { padding: 40px; }
    .title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 16px; }
    .text { color: #6b7280; font-size: 15px; line-height: 1.7; margin-bottom: 24px; }
    .badge { display: inline-block; background: #FF7A59; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .cta { display: inline-block; background: #1a1a2e; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; }
    .footer { padding: 24px 40px; border-top: 1px solid #f0f0f0; text-align: center; }
    .footer-text { color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Supenli.io</div>
    </div>
    <div class="body">
      <div class="badge">${platform}</div>
      <div class="title">Your content is ready!</div>
      <p class="text">
        Hey ${name}, your ${platform} content about "<strong>${topic}</strong>" has been generated with 5 viral variations.
      </p>
      <a href="https://supenli.io/dashboard" class="cta">View Content &rarr;</a>
    </div>
    <div class="footer">
      <p class="footer-text">&copy; 2026 Supenli.io</p>
    </div>
  </div>
</body>
</html>`;
}

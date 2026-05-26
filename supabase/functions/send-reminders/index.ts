import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["gamalielkelman@gmail.com", "pennsunjo@gmail.com"];

// Defaults — overridable from the request body.
const DEFAULT_MIN_DAYS_SINCE_SIGNUP = 3;
const DEFAULT_MIN_DAYS_SINCE_LAST_VISIT = 7;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function nameFromEmail(email: string): string {
  return email?.split("@")[0]?.split(/[._-]/)[0] || "there";
}

// Pings inactive signups with a re-engagement email. "Inactive" =
// signed up at least N days ago, no content created, and either never
// signed in again or last sign-in was M+ days ago. Skips paid users.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    // Verify caller is an admin.
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Invalid session" }, 401);
    if (!ADMIN_EMAILS.includes(user.email ?? "")) return json({ error: "Forbidden — admin only" }, 403);

    const body = (await req.json().catch(() => ({}))) as {
      minDaysSinceSignup?: number;
      minDaysSinceLastVisit?: number;
      dryRun?: boolean;
      customMessage?: string;
    };
    const minDaysSinceSignup = body.minDaysSinceSignup ?? DEFAULT_MIN_DAYS_SINCE_SIGNUP;
    const minDaysSinceLastVisit = body.minDaysSinceLastVisit ?? DEFAULT_MIN_DAYS_SINCE_LAST_VISIT;
    const dryRun = body.dryRun === true;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: authData, error: listErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) return json({ error: listErr.message }, 500);
    const authUsers = authData.users || [];

    const ids = authUsers.map((u) => u.id);

    // Skip paid (plus / pro) and pull first_name when we have it.
    const { data: profiles } = await adminClient
      .from("user_profiles")
      .select("user_id, first_name, plan, plan_expires_at")
      .in("user_id", ids);
    const profileMap = new Map<string, { first_name?: string; plan?: string; plan_expires_at?: string }>();
    (profiles || []).forEach((p) => profileMap.set(p.user_id, p));

    // Skip users who already have content.
    const { data: contentRows } = await adminClient
      .from("generated_content")
      .select("user_id")
      .in("user_id", ids);
    const userHasContent = new Set<string>();
    (contentRows || []).forEach((r) => userHasContent.add(r.user_id));

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const candidates = authUsers.filter((u) => {
      if (!u.email) return false;
      // Don't email admins their own reminder.
      if (ADMIN_EMAILS.includes(u.email)) return false;

      const profile = profileMap.get(u.id);
      // Skip paid plans (someone is paying, don't nudge them).
      if (profile?.plan === "plus" || profile?.plan === "pro") {
        const expires = profile.plan_expires_at ? new Date(profile.plan_expires_at).getTime() : Infinity;
        if (expires > now) return false;
      }
      // Skip users who already created content.
      if (userHasContent.has(u.id)) return false;

      const signupAgeDays = (now - new Date(u.created_at).getTime()) / dayMs;
      if (signupAgeDays < minDaysSinceSignup) return false;

      // Re-engage only the truly quiet ones.
      const lastSignIn = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : null;
      if (lastSignIn) {
        const daysSinceLastVisit = (now - lastSignIn) / dayMs;
        if (daysSinceLastVisit < minDaysSinceLastVisit) return false;
      }
      return true;
    });

    if (dryRun) {
      return json({
        dryRun: true,
        candidateCount: candidates.length,
        candidates: candidates.slice(0, 50).map((u) => ({
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
        })),
      });
    }

    // Send reminders sequentially to keep things gentle on Resend's rate limit.
    let success = 0;
    let failed = 0;
    const errors: { email: string; error: string }[] = [];

    for (const u of candidates) {
      const profile = profileMap.get(u.id);
      const name = profile?.first_name || nameFromEmail(u.email!);
      const daysAway = u.last_sign_in_at
        ? Math.floor((now - new Date(u.last_sign_in_at).getTime()) / dayMs)
        : Math.floor((now - new Date(u.created_at).getTime()) / dayMs);

      try {
        const sendRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            to: u.email,
            subject: `${name}, your audience is waiting`,
            type: "reminder",
            data: {
              name,
              daysAway,
              message: body.customMessage,
            },
          }),
        });
        if (!sendRes.ok) {
          const err = await sendRes.text();
          throw new Error(err);
        }
        success++;
      } catch (err) {
        failed++;
        errors.push({ email: u.email!, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return json({
      candidateCount: candidates.length,
      sent: success,
      failed,
      errors: errors.slice(0, 20),
    });
  } catch (err) {
    console.error("[send-reminders] unexpected:", err);
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});

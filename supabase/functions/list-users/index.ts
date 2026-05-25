import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = ["gamalielkelman@gmail.com", "pennsunjo@gmail.com"];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Returns the COMPLETE list of accounts (auth.users), enriched with profile
// data and content counts when present. `user_profiles` is only created at
// onboarding, so reading it alone misses every user who signed up but never
// finished onboarding — which is exactly why the Admin Users tab was showing
// only one row.
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

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Pull every auth user (up to 1000 — Supabase's per-page max).
    const { data: authData, error: listErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      console.error("[list-users] admin.listUsers failed:", listErr);
      return json({ error: listErr.message }, 500);
    }
    const authUsers = authData.users || [];
    const ids = authUsers.map((u) => u.id);

    // 2) Enrich with onboarding profile data when present.
    const { data: profiles } = await adminClient
      .from("user_profiles")
      .select("user_id, first_name, niche, platforms, onboarding_completed, plan, plan_expires_at")
      .in("user_id", ids);
    const profileMap = new Map<string, Record<string, unknown>>();
    (profiles || []).forEach((p) => profileMap.set(p.user_id, p));

    // 3) Content counts.
    const { data: contentRows } = await adminClient
      .from("generated_content")
      .select("user_id")
      .in("user_id", ids);
    const contentMap = new Map<string, number>();
    (contentRows || []).forEach((r) => contentMap.set(r.user_id, (contentMap.get(r.user_id) || 0) + 1));

    const users = authUsers.map((u) => {
      const p = profileMap.get(u.id) as
        | { first_name?: string; niche?: string; platforms?: string[]; onboarding_completed?: boolean; plan?: string; plan_expires_at?: string }
        | undefined;
      return {
        user_id: u.id,
        email: u.email ?? "",
        first_name: p?.first_name ?? "",
        niche: p?.niche ?? "",
        platforms: p?.platforms ?? [],
        onboarding_completed: p?.onboarding_completed ?? false,
        plan: p?.plan ?? "free",
        plan_expires_at: p?.plan_expires_at ?? null,
        content_count: contentMap.get(u.id) ?? 0,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
      };
    });

    // Sort newest first.
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return json({ users });
  } catch (err) {
    console.error("[list-users] unexpected:", err);
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});

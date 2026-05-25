import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Single source of truth for admin emails (must match src/hooks/use-admin.ts).
const ADMIN_EMAILS = ["gamalielkelman@gmail.com", "pennsunjo@gmail.com"];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Auth: only an authenticated admin may call this ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Invalid session" }, 401);
    if (!ADMIN_EMAILS.includes(user.email ?? "")) return json({ error: "Forbidden — admin only" }, 403);

    const { userId } = await req.json().catch(() => ({}));
    if (!userId || typeof userId !== "string") return json({ error: "userId is required" }, 400);

    // Belt + braces: never let an admin delete themselves.
    if (userId === user.id) return json({ error: "You cannot delete your own account" }, 400);

    // --- Service-role delete: removes the auth user; FKs (ON DELETE CASCADE)
    // clean up user_profiles / generated_content / sources / etc.
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteErr) {
      console.error("[delete-user] admin.deleteUser failed:", deleteErr);
      return json({ error: deleteErr.message || "Failed to delete user" }, 500);
    }

    // Defensive cleanup: anything not covered by FK cascades, remove explicitly.
    // (no-op if already gone — silently tolerated)
    await adminClient.from("user_profiles").delete().eq("user_id", userId);
    await adminClient.from("generated_content").delete().eq("user_id", userId);
    await adminClient.from("sources").delete().eq("user_id", userId);
    await adminClient.from("coach_conversations").delete().eq("user_id", userId);
    await adminClient.from("content_sessions").delete().eq("user_id", userId);

    return json({ success: true, deletedUserId: userId });
  } catch (err) {
    console.error("[delete-user] unexpected:", err);
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});

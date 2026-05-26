import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Immediate-cancel: user clicks "Cancel subscription" → Stripe sub deleted
// right now, user_profiles flipped back to free in the same request.
// The user loses paid features the moment the call returns.
//
// We don't use cancel_at_period_end because product decision was "Dès que
// l'utilisateur clique sur Arrêter, il n'a plus droit aux avantages."
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Invalid session" }, 401);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile, error: profileErr } = await adminClient
      .from("user_profiles")
      .select("plan, stripe_subscription_id, stripe_customer_id, plan_expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileErr) return json({ error: profileErr.message }, 500);
    if (!profile) return json({ error: "Profile not found" }, 404);
    if (profile.plan === "free" || !profile.stripe_subscription_id) {
      return json({ error: "No active subscription to cancel" }, 400);
    }

    // Cancel on Stripe first. We use stripe.subscriptions.cancel() which
    // ends the subscription immediately. If Stripe call fails we don't
    // touch the DB — keeps both sides in sync.
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "Stripe not configured" }, 500);
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    try {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
    } catch (err) {
      // If Stripe says the sub is already gone (404 / no_such_subscription)
      // we still flip the DB — the customer state is "no longer paying"
      // either way. Other errors should bubble up so the user sees them.
      const message = err instanceof Error ? err.message : String(err);
      const alreadyGone = /no.?such.?subscription|resource_missing|not.?found/i.test(message);
      if (!alreadyGone) {
        console.error("[cancel-subscription] Stripe cancel failed:", message);
        return json({ error: `Stripe cancel failed: ${message}` }, 500);
      }
      console.warn("[cancel-subscription] Stripe sub already gone, flipping DB anyway:", message);
    }

    // Flip the local profile back to free.
    const { error: updateErr } = await adminClient
      .from("user_profiles")
      .update({
        plan: "free",
        stripe_subscription_id: null,
        plan_expires_at: null,
      })
      .eq("user_id", user.id);

    if (updateErr) {
      console.error("[cancel-subscription] DB update failed after Stripe cancel:", updateErr.message);
      return json({ error: `Stripe canceled but DB update failed: ${updateErr.message}` }, 500);
    }

    return json({ success: true });
  } catch (err) {
    console.error("[cancel-subscription] unexpected:", err);
    return json({ error: err instanceof Error ? err.message : "Server error" }, 500);
  }
});

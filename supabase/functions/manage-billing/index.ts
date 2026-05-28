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

// Opens the Stripe Customer Billing Portal for the signed-in user.
//
// Critically, this does NOT depend on our user_profiles having a
// stripe_customer_id — it looks the customer up directly in Stripe by the
// account email. That makes "manage / cancel my subscription" work even if
// the checkout webhook never fired and our DB is out of sync (which is
// exactly the failure mode we hit at launch). The portal itself lets the
// user cancel, swap payment method, and download invoices — all hosted by
// Stripe, so we don't reimplement any of it.
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
    if (userErr || !user?.email) return json({ error: "Invalid session" }, 401);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "Stripe not configured" }, 500);
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // 1) Prefer the customer id we have on file (set by the webhook).
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: profile } = await adminClient
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id as string | undefined;

    // 2) Fallback: look the customer up in Stripe by email. This is what
    // saves us when the webhook never populated stripe_customer_id.
    if (!customerId) {
      const found = await stripe.customers.list({ email: user.email, limit: 1 });
      if (found.data.length > 0) {
        customerId = found.data[0].id;
        // Best-effort: backfill the id we just recovered so next time is fast
        // and so the rest of the app (plan gating) can self-heal later.
        await adminClient
          .from("user_profiles")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", user.id);
      }
    }

    if (!customerId) {
      return json({ error: "No Stripe customer found for your account. If you just paid, wait a minute and retry, or contact support." }, 404);
    }

    const returnUrl = `${Deno.env.get("SITE_URL") ?? "https://www.supenli.ai"}/settings`;
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return json({ url: portal.url });
  } catch (err) {
    console.error("[manage-billing] unexpected:", err);
    const msg = err instanceof Error ? err.message : "Server error";
    // Surface the common "portal not configured" Stripe error verbatim so we
    // know to flip it on in the Stripe Dashboard.
    return json({ error: msg }, 500);
  }
});

// Reconcile Stripe live state with user_profiles.
//
// The Stripe webhook is now ACK-first + idempotent + Settings polls
// after checkout, but those layers all assume the webhook actually
// fires. Network blips, Stripe transient errors, and the 9-day disable
// incident in early June all proved that assumption wrong. This
// function is the safety net: it walks every active Stripe subscription
// and patches the matching user_profiles row when the plan or customer
// id is out of sync.
//
// Admin-only (ADMIN_EMAILS allowlist), dry-run by default so the admin
// can preview the diff before applying.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

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

interface Mismatch {
  email: string;
  user_id: string | null;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  current_plan_in_db: string | null;
  expected_plan: "plus" | "pro";
  current_expiry: string | null;
  expected_expiry: string;
  reason: string;
}

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
    if (!ADMIN_EMAILS.includes(user.email ?? "")) {
      return json({ error: "Forbidden — admin only" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const apply: boolean = body?.apply === true;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "STRIPE_SECRET_KEY not configured" }, 500);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // ── 1. Pull every active Stripe subscription (paginated) ──
    const activeSubs: Stripe.Subscription[] = [];
    for await (const sub of stripe.subscriptions.list({ status: "active", limit: 100 })) {
      activeSubs.push(sub);
    }

    // ── 2. Map subscription → expected plan via price id or metadata ──
    function expectedPlanOf(sub: Stripe.Subscription): "plus" | "pro" | null {
      // Prefer the explicit metadata.plan we set at checkout.
      const metaPlan = (sub.metadata?.plan ?? "").toLowerCase();
      if (metaPlan === "plus" || metaPlan === "pro") return metaPlan;
      // Fall back to amount: $10 → plus, $30 → pro.
      const amount = sub.items.data[0]?.price?.unit_amount ?? 0;
      if (amount === 1000) return "plus";
      if (amount === 3000) return "pro";
      return null;
    }

    // ── 3. Walk subs and compare to user_profiles ──
    const mismatches: Mismatch[] = [];
    const updates: Array<{ user_id: string; payload: Record<string, unknown> }> = [];

    for (const sub of activeSubs) {
      const expected = expectedPlanOf(sub);
      if (!expected) continue; // can't classify — skip

      const customerId = sub.customer as string;
      const subscriptionId = sub.id;
      const expectedExpiry = new Date(sub.current_period_end * 1000).toISOString();

      // Find the user. Prefer metadata.userId (set at checkout), fall
      // back to looking up the customer's email and matching auth.users.
      let userId: string | null = sub.metadata?.userId ?? null;
      let email = "";

      if (!userId) {
        // Resolve via Stripe customer → email → auth.users
        try {
          const cust = await stripe.customers.retrieve(customerId);
          if (cust && !cust.deleted) {
            email = (cust as Stripe.Customer).email ?? "";
          }
        } catch { /* customer fetch failed */ }
        if (email) {
          const { data: byEmail } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
          const match = byEmail?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
          userId = match?.id ?? null;
        }
      }

      if (!userId) {
        mismatches.push({
          email,
          user_id: null,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          current_plan_in_db: null,
          expected_plan: expected,
          current_expiry: null,
          expected_expiry: expectedExpiry,
          reason: "Stripe has active sub but no matching auth.users row",
        });
        continue;
      }

      // Read the current user_profiles row.
      const { data: profile } = await adminClient
        .from("user_profiles")
        .select("plan, plan_expires_at, stripe_customer_id, stripe_subscription_id")
        .eq("user_id", userId)
        .maybeSingle();

      const dbPlan = (profile?.plan ?? "free") as string;
      const dbExpiry = (profile?.plan_expires_at ?? null) as string | null;
      const dbCustomer = profile?.stripe_customer_id ?? null;
      const dbSub = profile?.stripe_subscription_id ?? null;

      const planMatches = dbPlan === expected;
      const customerMatches = dbCustomer === customerId;
      const subMatches = dbSub === subscriptionId;
      // Treat any expiry within 7 days of expected as "matches" so we
      // don't churn rows on every reconcile.
      const expiryMatches = dbExpiry
        ? Math.abs(new Date(dbExpiry).getTime() - new Date(expectedExpiry).getTime()) < 7 * 86400_000
        : false;

      if (planMatches && customerMatches && subMatches && expiryMatches) {
        continue; // perfectly in sync
      }

      let reason: string;
      if (!planMatches) reason = `plan mismatch: db='${dbPlan}' stripe='${expected}'`;
      else if (!customerMatches) reason = `stripe_customer_id missing or stale`;
      else if (!subMatches) reason = `stripe_subscription_id missing or stale`;
      else reason = `plan_expires_at out of sync`;

      mismatches.push({
        email,
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        current_plan_in_db: dbPlan,
        expected_plan: expected,
        current_expiry: dbExpiry,
        expected_expiry: expectedExpiry,
        reason,
      });

      updates.push({
        user_id: userId,
        payload: {
          plan: expected,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan_expires_at: expectedExpiry,
        },
      });
    }

    // ── 4. Apply if requested ──
    let applied = 0;
    if (apply && updates.length > 0) {
      for (const u of updates) {
        const { error } = await adminClient
          .from("user_profiles")
          .update(u.payload)
          .eq("user_id", u.user_id);
        if (error) {
          console.error(`[reconcile-stripe] update failed for ${u.user_id}:`, error);
        } else {
          applied += 1;
        }
      }
    }

    return json({
      mode: apply ? "apply" : "dry-run",
      total_active_stripe_subs: activeSubs.length,
      mismatches_found: mismatches.length,
      updates_applied: applied,
      mismatches,
    });
  } catch (err) {
    console.error("[reconcile-stripe]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return json({ error: msg }, 500);
  }
});

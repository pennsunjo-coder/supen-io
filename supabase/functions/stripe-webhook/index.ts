import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

// Fire the welcome email WITHOUT blocking the webhook response. Stripe gives
// a webhook ~30s to ACK, and any extra latency feeds the "consecutive failure"
// counter that disables the endpoint after enough days. The DB plan-flip is
// the only thing that MUST happen before we ACK — emails are recoverable
// (manually resend if needed) and were the single biggest source of latency
// in v51 (await fetch → Resend, sometimes 3-8 seconds during domain
// verification windows).
function fireEmail(payload: Record<string, unknown>): void {
  fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify(payload),
  }).catch((err) => console.warn("[stripe-webhook] email send failed:", err));
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    // Supabase Edge Functions run on Deno, whose SubtleCryptoProvider
    // only exposes async crypto primitives. constructEventAsync is the
    // documented Stripe API for async runtimes.
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || "",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  // ── Idempotency gate ──
  // Stripe retries failed deliveries automatically AND the Dashboard
  // "Replay" feature lets us re-send any past event. Without this gate,
  // replaying an invoice.payment_succeeded would extend plan_expires_at
  // by another 30 days on every replay. Insert event.id BEFORE any work
  // (PRIMARY KEY conflict = already processed → ACK 200, do nothing).
  try {
    const { error: insertErr } = await supabase
      .from("processed_stripe_events")
      .insert({ event_id: event.id, event_type: event.type });
    if (insertErr) {
      // Unique-violation = already processed (idempotent ACK). Any other
      // error = log and continue (don't block the webhook on the audit log).
      if (insertErr.code === "23505") {
        console.log(`[stripe-webhook] event ${event.id} already processed — ACKing`);
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      console.warn(`[stripe-webhook] processed_stripe_events insert failed (continuing):`, insertErr);
    }
  } catch (err) {
    // Table missing or other DB issue — fail open so we don't break
    // production on a logging concern. The handler below is still safe
    // for state-shape-idempotent events (checkout.session.completed,
    // customer.subscription.deleted), only invoice.payment_succeeded
    // is sensitive to double-processing.
    console.warn(`[stripe-webhook] idempotency check skipped:`, err);
  }

  // ── Critical DB work + non-blocking email triggers ──
  // Wrap every event handler in a try/catch so a bug or transient DB error
  // never poisons the ACK — Stripe disables endpoints that don't return 2xx
  // for too long. If the DB update fails, we log and still ACK; the data
  // can be reconciled from the Stripe Dashboard's "Replay" later.
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;

      if (userId && plan) {
        await supabase.from("user_profiles").update({
          plan,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq("user_id", userId);

        // Resolve recipient (Stripe session > profile > auth.users) and
        // fire the welcome email WITHOUT awaiting. Errors are logged but
        // never propagate up; the user already has paid access.
        const recipientEmail = session.customer_details?.email || session.customer_email;
        const firstName = session.customer_details?.name?.split(" ")[0] || "there";

        if (recipientEmail) {
          fireEmail({
            to: recipientEmail,
            subject: plan === "pro" ? "Welcome to Supenli.ai Pro 🚀" : "Welcome to Supenli.ai Plus 🚀",
            type: "subscription-activated",
            data: { name: firstName, plan },
          });
        } else {
          // Slow path: resolve email from auth.users in the background, then
          // fire. Done as a .then-chain to keep the main response fast.
          supabase.auth.admin.getUserById(userId).then(({ data: userRow }) => {
            const toEmail = userRow.user?.email;
            if (toEmail) {
              fireEmail({
                to: toEmail,
                subject: plan === "pro" ? "Welcome to Supenli.ai Pro 🚀" : "Welcome to Supenli.ai Plus 🚀",
                type: "subscription-activated",
                data: { name: firstName, plan },
              });
            }
          }).catch((err) => console.warn("[stripe-webhook] email resolve failed:", err));
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        const { data: priorProfile } = await supabase
          .from("user_profiles")
          .select("plan, first_name")
          .eq("user_id", userId)
          .maybeSingle();
        const priorPlan = priorProfile?.plan === "pro" ? "pro" : "plus";
        const firstName = priorProfile?.first_name || "there";

        await supabase.from("user_profiles").update({
          plan: "free",
          stripe_subscription_id: null,
          plan_expires_at: null,
        }).eq("user_id", userId);

        // Cancellation email — non-blocking.
        supabase.auth.admin.getUserById(userId).then(({ data: userRow }) => {
          const toEmail = userRow.user?.email;
          if (toEmail) {
            fireEmail({
              to: toEmail,
              subject: `Your Supenli.ai ${priorPlan === "pro" ? "Pro" : "Plus"} subscription has been canceled`,
              type: "subscription-cancelled",
              data: { name: firstName, plan: priorPlan },
            });
          }
        }).catch((err) => console.warn("[stripe-webhook] cancel email resolve failed:", err));
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.userId;
        if (userId) {
          await supabase.from("user_profiles").update({
            plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }).eq("user_id", userId);
        }
      }
    }
  } catch (err) {
    // Log but ACK — Stripe's "Replay" feature is the recovery path,
    // not retry-by-failure. Returning 5xx here just feeds the disable
    // counter without giving us any new chance at success.
    console.error("[stripe-webhook] handler error (acking anyway):", err);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

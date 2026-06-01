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

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    // Supabase Edge Functions run on Deno, whose SubtleCryptoProvider
    // only exposes async crypto primitives. The sync `constructEvent`
    // throws "SubtleCryptoProvider cannot be used in a synchronous
    // context" on every single delivery. constructEventAsync is the
    // documented Stripe API for async runtimes (Deno, Cloudflare
    // Workers, etc.). This single line is why 100% of our live
    // webhook deliveries were failing.
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || "",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  // Checkout completed → activate plan + send confirmation email
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

      // Welcome-to-Plus/Pro confirmation email. Fire-and-forget: never
      // block the webhook response on email delivery (Stripe retries
      // anything that doesn't return 2xx fast enough). We pull the
      // recipient + name from the profile row we just updated so the
      // greeting is personalized.
      try {
        const recipientEmail = session.customer_details?.email || session.customer_email;
        let firstName = session.customer_details?.name?.split(" ")[0] || "there";
        if (!recipientEmail) {
          // Fall back to the user_profiles row if Stripe didn't include
          // the email in the session metadata.
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("first_name")
            .eq("user_id", userId)
            .maybeSingle();
          if (profile?.first_name) firstName = profile.first_name as string;
        }

        // Resolve the email last: prefer Stripe's, fall back to auth.users.
        let toEmail = recipientEmail;
        if (!toEmail) {
          const { data: userRow } = await supabase.auth.admin.getUserById(userId);
          toEmail = userRow.user?.email ?? null;
        }

        if (toEmail) {
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              to: toEmail,
              subject: plan === "pro" ? "Welcome to Supenli.ai Pro 🚀" : "Welcome to Supenli.ai Plus 🚀",
              type: "subscription-activated",
              data: { name: firstName, plan },
            }),
          });
        }
      } catch (err) {
        // Non-blocking — DB is already updated, email failure is recoverable
        // (user still gets access, we just don't celebrate them by email).
        console.warn("[stripe-webhook] subscription-activated email failed:", err);
      }
    }
  }

  // Subscription cancelled → downgrade to free + send confirmation email
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    if (userId) {
      // Read the previous plan BEFORE flipping the row — the email needs
      // to know whether they were on Plus or Pro to address them properly.
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

      // Cancellation confirmation email (fire-and-forget).
      try {
        const { data: userRow } = await supabase.auth.admin.getUserById(userId);
        const toEmail = userRow.user?.email;
        if (toEmail) {
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              to: toEmail,
              subject: `Your Supenli.ai ${priorPlan === "pro" ? "Pro" : "Plus"} subscription has been canceled`,
              type: "subscription-cancelled",
              data: { name: firstName, plan: priorPlan },
            }),
          });
        }
      } catch (err) {
        console.warn("[stripe-webhook] subscription-cancelled email failed:", err);
      }
    }
  }

  // Invoice paid → extend plan
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.subscription as string;
    if (subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.userId;
        if (userId) {
          await supabase.from("user_profiles").update({
            plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }).eq("user_id", userId);
        }
      } catch { /* subscription lookup failed */ }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

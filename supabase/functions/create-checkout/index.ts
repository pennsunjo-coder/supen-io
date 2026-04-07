import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-06-20",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { plan, userId, email, successUrl, cancelUrl } = await req.json();

    const PRICES: Record<string, string> = {
      pro: Deno.env.get("STRIPE_PRO_PRICE_ID") || "",
      business: Deno.env.get("STRIPE_BUSINESS_PRICE_ID") || "",
    };

    const priceId = PRICES[plan];
    if (!priceId) throw new Error("Invalid plan or price not configured");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${successUrl}?upgraded=true&plan=${plan}`,
      cancel_url: cancelUrl,
      metadata: { userId, plan },
      subscription_data: {
        metadata: { userId, plan },
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

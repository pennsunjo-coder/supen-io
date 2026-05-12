import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MAKETOU_API_KEY = Deno.env.get("MAKETOU_API_KEY") || "";
const MAKETOU_BASE_URL = "https://api.maketou.net";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { planId, email, firstName, lastName, phone, redirectURL, meta } = await req.json();

    // Map plan IDs to MakEtoU productDocumentIds
    const PLAN_MAP: Record<string, string> = {
      'annual': 'd433ea5c-b6d7-44b7-b47b-29af558af30c',
      'semestrial': '4021e7c1-4370-4509-8ca5-c512943d9323',
    };

    const productDocumentId = PLAN_MAP[planId];
    if (!productDocumentId) {
      throw new Error(`Plan ID ${planId} non configuré sur MakEtoU`);
    }

    const response = await fetch(`${MAKETOU_BASE_URL}/api/v1/stores/cart/checkout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MAKETOU_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productDocumentId,
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        phone: phone || "",
        redirectURL: redirectURL || "https://le-clubia-j9i5.vercel.app/app/dashboard?payment=success",
        meta: {
          ...meta,
          planId,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur lors de la création du panier MakEtoU");
    }

    // data contient { id, url }
    const cartId = data.id;

    // Mise à jour de la base de données pour suivre cette transaction
    // On utilise Supabase Service Role pour outrepasser les RLS si nécessaire
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.7");
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // On crée ou met à jour la souscription en attente
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_id: planId,
          status: 'incomplete',
          stripe_subscription_id: `maketou_${cartId}`, // On préfixe pour identifier la source
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

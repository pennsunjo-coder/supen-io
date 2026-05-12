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
      'semestrial': Deno.env.get("MAKETOU_PLAN_SEMESTRIAL_ID") || "",
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

    // data devrait contenir { id, url }
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

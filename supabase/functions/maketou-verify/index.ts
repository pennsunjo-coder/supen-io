import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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
    const { userId } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Récupérer la dernière transaction en attente
    const { data: sub, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'incomplete')
      .maybeSingle();

    if (subError) throw subError;
    if (!sub || !sub.stripe_subscription_id?.startsWith('maketou_')) {
      return new Response(JSON.stringify({ status: 'no_pending_payment' }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const cartId = sub.stripe_subscription_id.replace('maketou_', '');

    // 2. Vérifier le statut chez MakEtoU
    const response = await fetch(`${MAKETOU_BASE_URL}/api/v1/stores/cart/${cartId}`, {
      headers: {
        "Authorization": `Bearer ${MAKETOU_API_KEY}`,
      },
    });

    const data = await response.json();
    
    // Selon la doc, on cherche l'état de paiement
    // Note: adapter selon le champ exact (isPaid, status: 'completed', etc.)
    const isPaid = data.isPaid === true || data.status === 'completed';

    if (isPaid) {
      // 3. Activer la souscription
      const now = new Date();
      const durationMonths = sub.plan_id === 'annual' ? 12 : 6;
      const end = new Date();
      end.setMonth(now.getMonth() + durationMonths);

      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: end.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', sub.id);

      // Mettre à jour le rôle du profil
      await supabaseAdmin
        .from('profiles')
        .update({ role: 'member' })
        .eq('id', userId);

      return new Response(JSON.stringify({ status: 'activated', planId: sub.plan_id }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ status: 'still_pending', maketou_status: data.status }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});

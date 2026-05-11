const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // TEST RADICAL : Pas d'IA, pas de clé, juste une réponse immédiate.
  return new Response(JSON.stringify({ 
    message: "HELLO WORLD - THE PIPE IS WORKING",
    timestamp: new Date().toISOString()
  }), { 
    status: 200, 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  });
});

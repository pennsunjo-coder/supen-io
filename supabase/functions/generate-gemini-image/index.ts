import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[generate-gemini-image] Missing Supabase configuration");
      return new Response(JSON.stringify({ error: "Server configuration error: Missing Supabase secrets." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!GEMINI_API_KEY) {
      console.error("[generate-gemini-image] Missing GEMINI_API_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error: GEMINI_API_KEY is not set." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated: Missing Authorization header." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[generate-gemini-image] Auth error:", userError?.message);
      return new Response(JSON.stringify({ error: "Invalid session: " + (userError?.message || "User not found") }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rate limit
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: allowed, error: rpcError } = await adminClient.rpc("check_rate_limit", {
      p_user_id: user.id, p_function: "generate-gemini-image", p_max_requests: 10, p_window_hours: 1,
    });
    
    if (rpcError) {
      console.error("[generate-gemini-image] Rate limit RPC error:", rpcError.message);
      // Don't block the user if the rate limiter itself is broken, but log it
    } else if (allowed === false) {
      console.warn("[generate-gemini-image] Rate limit reached for user:", user.id);
      return new Response(JSON.stringify({ error: "Image generation limit reached (10 per hour). Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const { prompt, size, isRawContent } = body;
    
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
      return new Response(JSON.stringify({ error: "Invalid prompt. Please provide a descriptive prompt for the infographic." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const generationSize = size || "1024x1024";
    let finalPrompt = prompt;

    // --- INFOGRAPHIC ARCHITECT: Content Expansion Step ---
    if (isRawContent) {
      console.log("[generate-gemini-image] Architect: Expanding content into expert script...");
      try {
        const architectResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `
                You are the INFOGRAPHIC ARCHITECT (Awa K. Penn style).
                GOAL: Transform the raw post below into a DENSE, HIGH-VALUE infographic script.
                
                RULES:
                1. DO NOT summarize. EXPAND with concrete examples, tools, and technical details.
                2. Structure into 7-9 distinct vertical sections.
                3. Include a "POWER GRID" section with 6 specific actionable items (e.g., prompt formulas, keyboard shortcuts, or cheat codes).
                4. Add a "PRO TIP" that sounds like expert-level insider knowledge.
                5. Use authoritative, direct language. No fluff. No AI jargon (delve, tapestry, etc.).
                
                FORMAT:
                [TITLE]: <Catchy Heavy Title>
                [SECTION_X]: <Actionable header>: <Detailed expansion with examples>
                [GRID_ITEM_X]: <Label>: <Specific tip/prompt>
                [PRO_TIP]: <Actionable advice>
                
                RAW CONTENT:
                ${prompt}
              ` }] }],
            }),
          }
        );
        
        if (architectResponse.ok) {
          const architectData = await architectResponse.json();
          const expandedText = architectData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (expandedText) {
            finalPrompt = expandedText;
            console.log("[generate-gemini-image] Architect Success. Script size:", finalPrompt.length);
          }
        }
      } catch (archErr) {
        console.warn("[generate-gemini-image] Architect failed, proceeding with raw prompt:", archErr);
      }
    }

    console.log("[generate-gemini-image] Attempting Gemini generation...");

    const requestBody = {
      contents: [{ parts: [{ text: finalPrompt }] }],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      ],
      generationConfig: { 
        responseModalities: ["IMAGE"]
      },
    };

    let geminiError = null;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));
        const base64 = imagePart?.inlineData?.data;

        if (base64) {
          console.log("[generate-gemini-image] Success with Gemini!");
          return new Response(JSON.stringify({ image: base64, provider: "gemini" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      } else {
        const errText = await response.text();
        geminiError = `Gemini Status ${response.status}: ${errText}`;
        console.warn("[generate-gemini-image] Gemini failed, checking fallback...", geminiError);
      }
    } catch (err) {
      geminiError = err instanceof Error ? err.message : "Unknown Gemini error";
      console.warn("[generate-gemini-image] Gemini exception:", geminiError);
    }

    // --- FALLBACK TO OPENAI ---
    console.log("[generate-gemini-image] Switching to OpenAI fallback...");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: `Gemini failed (${geminiError}) and no OPENAI_API_KEY for fallback.` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    try {
      const oaResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: finalPrompt,
          n: 1,
          size: generationSize,
          response_format: "b64_json",
        }),
      });

      if (!oaResponse.ok) {
        const oaErrText = await oaResponse.text();
        console.error("[generate-gemini-image] OpenAI fallback failed:", oaErrText);
        return new Response(JSON.stringify({ error: `Both Gemini and OpenAI failed. Gemini: ${geminiError} | OpenAI: ${oaErrText}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const oaData = await oaResponse.json();
      const base64 = oaData.data?.[0]?.b64_json;

      if (!base64) {
        throw new Error("OpenAI returned no image data.");
      }

      console.log("[generate-gemini-image] Success with OpenAI fallback!");
      return new Response(JSON.stringify({ image: base64, provider: "openai" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (oaErr) {
      console.error("[generate-gemini-image] OpenAI exception:", oaErr);
      return new Response(JSON.stringify({ error: `Critical failure. Gemini: ${geminiError} | OpenAI Exception: ${oaErr instanceof Error ? oaErr.message : oaErr}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

  } catch (err) {
    console.error("[generate-gemini-image] Global error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error during image generation." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

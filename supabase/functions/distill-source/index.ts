// Smart source distillation edge function.
//
// When the client uploads a PDF / URL / note / web-search result, the source
// is chunked + embedded for RAG. In parallel, this function is fired-and-
// forgotten to extract viral patterns (hooks, named entities, structures,
// the core insight) from the raw text via Claude Opus 4.8. The structured
// result is stored on every row of sources sharing the same parent payload,
// so StudioWizard can prepend it to the generation prompt without an extra
// LLM round-trip at generate-time.
//
// Auth: caller must provide a Bearer Supabase user token. We verify it and
// only allow distillation of sources owned by the same user (defense-in-
// depth — the service-role write below also re-checks user_id).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.30.1?target=deno";

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

const CLAUDE_MODEL = "claude-opus-4-8";

// Cap the input we send to Claude — viral distillation works on a synopsis,
// not the full transcript. 30k chars covers most PDFs (~6k tokens in) and
// keeps cost predictable (one distillation ≈ $0.05-0.10 with Opus).
const MAX_INPUT_CHARS = 30_000;

const DISTILL_SYSTEM_PROMPT = `You are a viral content analyst. You read research material that a creator just uploaded and extract the STRUCTURED viral patterns the creator can reuse when writing their own posts.

You ALWAYS return a single JSON object — no prose before, no prose after — matching this exact shape:

{
  "core_insight": "<one sentence: the single most useful thing this source teaches a content creator>",
  "viral_hooks": [
    "<a verbatim or near-verbatim sentence from the source that would work as a content opener — keep specific numbers, named tools, named people>"
  ],
  "named_entities": {
    "tools": ["<each named software/AI/product mentioned, ONE per array entry>"],
    "urls":  ["<each exact URL cited>"],
    "numbers_and_results": ["<each specific outcome: '50k followers in 90 days', '$10k/month', '4x my views'>"],
    "people": ["<each named individual: 'MrBeast', 'Elon Musk', etc>"]
  },
  "reusable_structures": [
    {
      "name": "<short kebab-case label, e.g. historical-analogy>",
      "template": "<the structural pattern with [PLACEHOLDERS] for swap-in variables>"
    }
  ]
}

RULES:
- 1 to 5 viral hooks. Prefer the most specific ones. If the source has none, return [].
- Entities: deduplicate. Empty arrays are OK if nothing fits.
- reusable_structures: 0 to 3. Only include patterns the creator can ACTUALLY reuse by swapping placeholders — not generic "share a story" advice.
- core_insight: NEVER vague ("AI is useful"). ALWAYS specific ("Notebook LM can reverse-engineer a viral YouTube channel from 50 video links in 30 minutes").
- Output ONLY the JSON object. No markdown, no code fences, no commentary.`;

interface DistillationResult {
  core_insight: string;
  viral_hooks: string[];
  named_entities: {
    tools: string[];
    urls: string[];
    numbers_and_results: string[];
    people: string[];
  };
  reusable_structures: Array<{ name: string; template: string }>;
  distilled_at: string;
  model: string;
}

function extractJson(text: string): unknown {
  // Claude usually returns clean JSON, but tolerate a code-fence wrapping
  // or surrounding whitespace just in case.
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fenced ? fenced[1] : trimmed;
  return JSON.parse(candidate);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "Invalid session" }, 401);

    const body = await req.json();
    const { sourceIds, title, content } = body as {
      sourceIds: string[];
      title?: string;
      content: string;
    };

    if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return json({ error: "sourceIds must be a non-empty array" }, 400);
    }
    if (!content || typeof content !== "string" || content.trim().length < 200) {
      // Tiny sources (a 2-line note) aren't worth a $0.05 LLM call.
      return json({ skipped: true, reason: "content too short" });
    }

    // Rate limit — 30 distillations per hour per user. A creator dropping
    // a research dump of 20 PDFs gets handled, anything beyond is abuse.
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: allowed } = await adminClient.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function: "distill-source",
      p_max_requests: 30,
      p_window_hours: 1,
    });
    if (allowed === false) {
      return json({ error: "Rate limit reached. Try again later." }, 429);
    }

    // Run the Claude extraction
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);

    const trimmedContent = content.length > MAX_INPUT_CHARS
      ? content.slice(0, MAX_INPUT_CHARS) + "\n\n[...truncated for analysis...]"
      : content;

    const userMessage = title
      ? `Source title: ${title}\n\n---\n\n${trimmedContent}`
      : trimmedContent;

    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      system: DISTILL_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText = response.content
      .filter((block): block is { type: "text"; text: string } => block.type === "text")
      .map((b) => b.text)
      .join("");

    let parsed: DistillationResult;
    try {
      const raw = extractJson(rawText) as Partial<DistillationResult>;
      // Defensive normalization — Claude is reliable but never trust shape.
      parsed = {
        core_insight: typeof raw.core_insight === "string" ? raw.core_insight : "",
        viral_hooks: Array.isArray(raw.viral_hooks) ? raw.viral_hooks.filter((h) => typeof h === "string").slice(0, 5) : [],
        named_entities: {
          tools: Array.isArray(raw.named_entities?.tools) ? raw.named_entities!.tools.filter((t) => typeof t === "string") : [],
          urls: Array.isArray(raw.named_entities?.urls) ? raw.named_entities!.urls.filter((t) => typeof t === "string") : [],
          numbers_and_results: Array.isArray(raw.named_entities?.numbers_and_results) ? raw.named_entities!.numbers_and_results.filter((t) => typeof t === "string") : [],
          people: Array.isArray(raw.named_entities?.people) ? raw.named_entities!.people.filter((t) => typeof t === "string") : [],
        },
        reusable_structures: Array.isArray(raw.reusable_structures)
          ? raw.reusable_structures
              .filter((s): s is { name: string; template: string } => !!s && typeof s.name === "string" && typeof s.template === "string")
              .slice(0, 3)
          : [],
        distilled_at: new Date().toISOString(),
        model: CLAUDE_MODEL,
      };
    } catch (err) {
      console.error("[distill-source] JSON parse failed:", err, "raw:", rawText.slice(0, 200));
      return json({ error: "Claude returned invalid JSON" }, 502);
    }

    // Write distillation to ALL rows the client gave us (chunks of the same
    // parent source share the distillation). RLS would normally restrict
    // this update — but with the service-role client we still scope by
    // user_id explicitly to avoid touching another user's rows.
    const { error: updateError } = await adminClient
      .from("sources")
      .update({ distillation: parsed })
      .in("id", sourceIds)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[distill-source] update failed:", updateError);
      return json({ error: updateError.message }, 500);
    }

    return json({ distillation: parsed, updated: sourceIds.length });
  } catch (err) {
    console.error("[distill-source]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return json({ error: msg }, 500);
  }
});

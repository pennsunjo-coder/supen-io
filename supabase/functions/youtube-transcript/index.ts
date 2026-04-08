import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL required");

    const videoId = extractVideoId(url);
    if (!videoId) throw new Error("URL YouTube invalide");

    // Fetch the YouTube watch page to get caption tracks
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(watchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });
    const html = await response.text();

    // Extract captionTracks from page data
    const captionMatch = html.match(/"captionTracks":(\[.*?\])/);
    if (!captionMatch) {
      throw new Error("Pas de transcription disponible pour cette video");
    }

    let captions: { baseUrl: string; languageCode: string; name?: { simpleText?: string } }[];
    try {
      captions = JSON.parse(captionMatch[1]);
    } catch {
      throw new Error("Impossible de parser les sous-titres");
    }

    if (!captions || captions.length === 0) {
      throw new Error("Aucune piste de sous-titres trouvee");
    }

    // Prefer French, fallback to first available
    const preferredCaption =
      captions.find((c) => c.languageCode === "fr" || c.languageCode === "fr-FR") ||
      captions.find((c) => c.languageCode === "en" || c.languageCode === "en-US") ||
      captions[0];

    if (!preferredCaption?.baseUrl) {
      throw new Error("URL de sous-titres introuvable");
    }

    // Decode the URL (it's escaped JSON)
    const captionUrl = preferredCaption.baseUrl.replace(/\\u0026/g, "&");
    const captionResponse = await fetch(captionUrl);
    const captionXml = await captionResponse.text();

    // Parse <text> tags from the XML
    const textMatches = captionXml.match(/<text[^>]*>(.*?)<\/text>/gs) || [];
    const transcript = textMatches
      .map((t) => {
        const inner = t.replace(/<text[^>]*>/, "").replace(/<\/text>/, "");
        return decodeHtmlEntities(inner);
      })
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (!transcript || transcript.length < 10) {
      throw new Error("Transcription vide ou trop courte");
    }

    // Extract video title
    const titleMatch = html.match(/<meta name="title" content="([^"]+)"/) ||
                       html.match(/<title>(.*?)<\/title>/);
    let title = titleMatch ? titleMatch[1] : `YouTube ${videoId}`;
    title = title.replace(/ - YouTube$/, "").trim();
    title = decodeHtmlEntities(title);

    return new Response(
      JSON.stringify({ transcript, title, videoId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

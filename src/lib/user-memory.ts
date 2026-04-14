/**
 * User style memory.
 * Tracks which content users copy/save/like to personalize future generations.
 * Injects the user's preferred style into the system prompt.
 */

import { supabase } from "./supabase";

// ─── Save interaction ───

export async function saveInteraction(
  userId: string,
  content: string,
  platform: string,
  angle: string,
  viralScore: number,
  interactionType: "copied" | "saved" | "liked",
): Promise<void> {
  try {
    await supabase.from("user_style_memory").insert({
      user_id: userId,
      content: content.slice(0, 1000),
      platform,
      angle,
      viral_score: viralScore,
      interaction_type: interactionType,
    });
  } catch {
    // Silent — memory is non-critical, should never block the user
  }
}

// ─── Retrieve style memory for prompt injection ───

export async function getUserStyleMemory(
  userId: string,
  platform: string,
): Promise<string> {
  try {
    const { data } = await supabase
      .from("user_style_memory")
      .select("content, angle, viral_score, interaction_type")
      .eq("user_id", userId)
      .eq("platform", platform)
      .order("created_at", { ascending: false })
      .limit(5);

    // Also fetch explicit likes from variation_feedback
    let likedData: { content_preview: string; angle: string; viral_score: number }[] = [];
    try {
      const { data: liked } = await supabase
        .from("variation_feedback")
        .select("content_preview, angle, viral_score")
        .eq("user_id", userId)
        .eq("platform", platform)
        .eq("rating", "liked")
        .order("created_at", { ascending: false })
        .limit(3);
      if (liked) likedData = liked;
    } catch { /* table may not exist yet */ }

    // Fetch user profile for preferences
    let profileData: { niche?: string; platforms?: string[]; preferred_tone?: string; preferred_length?: string; first_name?: string } = {};
    try {
      const { data: prof } = await supabase
        .from("user_profiles")
        .select("niche, platforms, preferred_tone, preferred_length, first_name")
        .eq("user_id", userId)
        .maybeSingle();
      if (prof) profileData = prof;
    } catch { /* silent */ }

    const allData = [...(data || []), ...likedData.map((l) => ({
      content: l.content_preview,
      angle: l.angle,
      viral_score: l.viral_score,
      interaction_type: "liked" as const,
    }))];

    // Detect favorite angle
    const angleCounts: Record<string, number> = {};
    for (const d of allData) {
      if (d.angle) {
        angleCounts[d.angle] = (angleCounts[d.angle] || 0) + (d.interaction_type === "liked" ? 2 : 1);
      }
    }
    const favoriteAngle = Object.entries(angleCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    const avgScore = allData.length > 0
      ? Math.round(allData.reduce((sum, d) => sum + (d.viral_score || 0), 0) / allData.length)
      : 0;

    // Build examples from interactions
    const examples = allData
      .slice(0, 5)
      .map((d) => `[${d.angle} - Score ${d.viral_score}/100 - ${d.interaction_type}]:\n${d.content.slice(0, 200)}`)
      .join("\n\n");

    // Build enriched context
    let memory = `\n\n## SECTION 5 — USER STYLE MEMORY`;

    if (profileData.first_name || profileData.niche || profileData.preferred_tone) {
      memory += `\nProfile:`;
      if (profileData.first_name) memory += `\n- Name: ${profileData.first_name}`;
      if (profileData.niche) memory += `\n- Niche: ${profileData.niche}`;
      if (profileData.platforms?.length) memory += `\n- Preferred platforms: ${profileData.platforms.join(", ")}`;
      if (profileData.preferred_tone) memory += `\n- Preferred tone: ${profileData.preferred_tone}`;
      if (profileData.preferred_length) memory += `\n- Preferred length: ${profileData.preferred_length}`;
    }

    if (favoriteAngle || avgScore > 0) {
      memory += `\n\nContent patterns:`;
      if (favoriteAngle) memory += `\n- Favorite angle: ${favoriteAngle}`;
      if (avgScore > 0) memory += `\n- Average viral score: ${avgScore}/100`;
      memory += `\n- Active platform: ${platform}`;
    }

    if (examples) {
      memory += `\n\nContent they liked recently:\n${examples}`;
    }

    memory += `\n\nUse this to personalize ALL content. Never generate generic content — adapt to their style, niche, and preferences. Give more weight to "${favoriteAngle || "varied"}" angles.`;

    return memory;
  } catch {
    return "";
  }
}

// ─── Check if user has memory for a platform ───

export async function hasStyleMemory(
  userId: string,
  platform: string,
): Promise<boolean> {
  try {
    const { count } = await supabase
      .from("user_style_memory")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("platform", platform);
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

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

    if (!data || data.length === 0) return "";

    // Build style context from user's best interactions
    const examples = data
      .map((d) => `[${d.angle} - Score ${d.viral_score}/100 - ${d.interaction_type}]:\n${d.content.slice(0, 200)}`)
      .join("\n\n");

    // Detect favorite angle
    const angleCounts: Record<string, number> = {};
    for (const d of data) {
      if (d.angle) angleCounts[d.angle] = (angleCounts[d.angle] || 0) + 1;
    }
    const favoriteAngle = Object.entries(angleCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    // Detect average score for calibration
    const avgScore = Math.round(data.reduce((sum, d) => sum + (d.viral_score || 0), 0) / data.length);

    return `\n\n## SECTION 5 — STYLE PREFERE DE CET UTILISATEUR
Angle favori : ${favoriteAngle || "varie"}
Score moyen de son contenu prefere : ${avgScore}/100
Exemples de contenu qu'il a apprecie recemment :

${examples}

Adapte le ton, la structure et le style a ces preferences. Donne plus de poids a l'angle "${favoriteAngle || "varie"}" (en faire 2 variations au lieu de 1 si c'est pertinent). Reste creatif mais ancre dans ce style.`;
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

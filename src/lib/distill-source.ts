/**
 * Smart source distillation client helper.
 *
 * After a source (PDF / URL / note) has been chunked and inserted, we fire
 * a non-blocking call to the `distill-source` edge function. Claude reads
 * the full text and extracts structured viral patterns (hooks, named tools,
 * URLs, numbers, people, reusable structures, one core insight) that get
 * persisted on the sources row(s). StudioWizard then prepends those
 * patterns to the system prompt at generate-time, so the model writes
 * content that mirrors the source's viral DNA — not just its raw text.
 *
 * Failure is silent: the source still works for vanilla RAG even if
 * distillation never lands. Best-effort, non-blocking, exactly like
 * `embedSource` in `@/lib/embeddings`.
 */

import { supabase } from "@/lib/supabase";

export interface SourceDistillation {
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

/**
 * Kick off async distillation for one or more source rows that all share
 * the same parent payload (e.g. all chunks of one PDF). The result is
 * written to every row in `sourceIds`.
 *
 * Returns nothing on success — caller treats this as fire-and-forget.
 * Errors are logged but swallowed (sources still RAG-searchable without
 * a distillation).
 */
export async function distillSource(
  sourceIds: string[],
  title: string | undefined,
  content: string,
): Promise<void> {
  if (sourceIds.length === 0 || !content || content.trim().length < 200) return;
  try {
    const { error } = await supabase.functions.invoke("distill-source", {
      body: { sourceIds, title, content },
    });
    if (error) {
      // Network / 5xx — log but don't surface; the source already works.
      console.warn("[distillSource] non-fatal:", error.message ?? error);
    }
  } catch (err) {
    console.warn("[distillSource] caught:", err instanceof Error ? err.message : err);
  }
}

/**
 * Pull the latest distillation for a set of source row IDs and dedupe —
 * chunks of the same source share the same distillation, we only want
 * one per unique parent.
 *
 * Used by StudioWizard to enrich the source context before injection.
 */
export async function fetchDistillationsForSources(
  sourceIds: string[],
): Promise<Array<{ title: string; distillation: SourceDistillation }>> {
  if (sourceIds.length === 0) return [];
  const { data, error } = await supabase
    .from("sources")
    .select("title, distillation")
    .in("id", sourceIds)
    .not("distillation", "is", null);

  if (error || !data) return [];

  // Dedupe by title — every chunk of the same parent carries the same
  // distillation blob, so keep the first occurrence per title.
  const seen = new Map<string, SourceDistillation>();
  for (const row of data as Array<{ title: string; distillation: SourceDistillation | null }>) {
    if (!row.distillation || seen.has(row.title)) continue;
    seen.set(row.title, row.distillation);
  }
  return Array.from(seen.entries()).map(([title, distillation]) => ({ title, distillation }));
}

/**
 * Render a distillation as a compact text block ready to drop into the
 * generation system prompt. Empty sections are omitted to save tokens.
 */
export function renderDistillationForPrompt(
  title: string,
  d: SourceDistillation,
): string {
  const parts: string[] = [];
  parts.push(`━━━ VIRAL EXTRACT — "${title}" ━━━`);
  if (d.core_insight) parts.push(`CORE INSIGHT: ${d.core_insight}`);

  if (d.viral_hooks.length > 0) {
    parts.push(`HOOKS to mirror (verbatim or near-verbatim from source):`);
    d.viral_hooks.forEach((h) => parts.push(`  • ${h}`));
  }

  const e = d.named_entities;
  const entityLines: string[] = [];
  if (e.tools.length > 0) entityLines.push(`TOOLS: ${e.tools.join(", ")}`);
  if (e.urls.length > 0) entityLines.push(`URLs: ${e.urls.join(", ")}`);
  if (e.numbers_and_results.length > 0) entityLines.push(`RESULTS / NUMBERS: ${e.numbers_and_results.join(" | ")}`);
  if (e.people.length > 0) entityLines.push(`PEOPLE: ${e.people.join(", ")}`);
  if (entityLines.length > 0) parts.push(entityLines.join("\n"));

  if (d.reusable_structures.length > 0) {
    parts.push(`REUSABLE STRUCTURES:`);
    d.reusable_structures.forEach((s) =>
      parts.push(`  • [${s.name}] ${s.template}`),
    );
  }

  return parts.join("\n");
}

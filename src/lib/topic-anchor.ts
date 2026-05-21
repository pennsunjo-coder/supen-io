/**
 * Topic-relevance anchor.
 *
 * Keeps every generated variation locked onto the user's actual subject and
 * niche instead of drifting toward the example topics baked into the
 * playbooks (which lean heavily on AI/tech — Claude, Gemini, NotebookLM…).
 *
 * Division of labour:
 *   - The playbooks supply STRUCTURE, cadence and hook shape.
 *   - This block supplies the non-negotiable SUBJECT.
 *
 * Injected on EVERY generation (with or without sources) so that even in
 * keyword-only mode — where the strong "stay within the sources" rules are
 * skipped — the output stays specific and on-topic rather than generic.
 */
export function buildTopicAnchor(
  topic?: string | null,
  niche?: string | null,
  audience?: string | null,
): string {
  const t = (topic || "").trim();
  if (!t) return "";

  const nicheLine = niche?.trim() ? `Creator niche: ${niche.trim()}\n` : "";
  const audienceLine = audience?.trim() ? `Audience: ${audience.trim()}\n` : "";

  return `╔══════════════════════════════════════╗
║       TOPIC RELEVANCE (read first)       ║
╚══════════════════════════════════════╝

THE TOPIC: "${t}"
${nicheLine}${audienceLine}
NON-NEGOTIABLE:
1. All 5 variations are about THIS exact topic. Same subject, five different angles — never five different subjects.
2. The topic must be unmistakable in the first line of every variation.
3. The playbook and any examples show STRUCTURE, CADENCE and HOOK SHAPE only — reuse their format, never their subject. If an example is about AI tools (Claude, Gemini, NotebookLM) or anything that is not "${t}", do not carry that subject over. Re-skin the structure with this topic and niche.
4. Every specific (name, number, tool, place, result) must belong to "${t}" and this niche — no generic tech/AI placeholders dropped in to sound impressive.
5. If a sentence could sit unchanged under a different topic, it is too generic — cut it or make it specific to "${t}".`;
}

/**
 * Debug / proof tool — prints the EXACT system prompt that Studio Wizard
 * would build for a given topic before calling Claude. Use this to verify
 * that the playbook patterns, hooks, references, and anti-AI rules are
 * actually injected into every generation.
 *
 * Run: npx tsx scripts/show-studio-prompt.ts
 *
 * NOTE: this script doesn't include RAG'd user sources or distilled
 * patterns (those come from the live DB). It shows the static, baseline
 * prompt every generation starts from. The DB-driven additions only
 * make the context richer.
 */

import { buildInstagramPlaybook } from "../src/lib/instagram-playbook";
import { buildReelPlaybook } from "../src/lib/reel-playbook";
import { buildLinkedinPlaybook } from "../src/lib/linkedin-playbook";

// Sample case — the same kind of prompt a user would enter in Studio
const TEST_CASE = {
  topic: "5 AI tools that 4x'd my Instagram reach in 30 days",
  niche: "marketing",
};

function section(title: string, body: string) {
  console.log(
    `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${title}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
  );
  console.log(body);
}

function highlight(label: string, content: string, pattern: RegExp): void {
  const match = content.match(pattern);
  if (match) {
    console.log(`\n✅ ${label}: FOUND (${match[0].slice(0, 80).replace(/\n/g, " ")}...)`);
  } else {
    console.log(`\n❌ ${label}: MISSING`);
  }
}

console.log("════════════════════════════════════════════════════════════");
console.log("STUDIO PROMPT INSPECTOR");
console.log(`Topic: "${TEST_CASE.topic}"`);
console.log(`Niche: "${TEST_CASE.niche}"`);
console.log("════════════════════════════════════════════════════════════");

// ─── Instagram caption playbook ───
const igPrompt = buildInstagramPlaybook(TEST_CASE.niche, TEST_CASE.topic);
section("INSTAGRAM CAPTION PLAYBOOK (full system prompt block)", igPrompt);

console.log("\n\n══════════ PATTERN PRESENCE CHECK — INSTAGRAM ══════════");
highlight("Carousel structure", igPrompt, /CAROUSEL CAPTION/);
highlight("Hot-take structure", igPrompt, /HOT TAKE CAPTION/);
highlight("125-char hook rule", igPrompt, /125 char/i);
highlight("HOOK BANK section", igPrompt, /HOOK BANK/);
highlight("REFERENCE EXAMPLES", igPrompt, /REFERENCE EXAMPLES/);
highlight("Save-CTA signature move", igPrompt, /save-trigger|save-cta/i);
highlight("Anti-AI rules block", igPrompt, /ANTI-AI WRITING RULES/);
highlight("AILEGACY cluster banned", igPrompt, /\bcrucial\b.*reflects.*symbolizes/s);
highlight("Rewrite examples", igPrompt, /REWRITE EXAMPLES/);
highlight("Voice-switching mandate", igPrompt, /Voice switching/i);
highlight("Burstiness rule", igPrompt, /AGGRESSIVELY|burstiness|3-word jabs/i);
highlight("Sandwich em-dash ban", igPrompt, /Sandwich form|word—word/);

// ─── Reel playbook (different platform, different patterns) ───
const reelPrompt = buildReelPlaybook(TEST_CASE.niche, TEST_CASE.topic);
section("REEL SCRIPT PLAYBOOK — pattern check", "(full block omitted, checks below)");

console.log("\n══════════ PATTERN PRESENCE CHECK — REEL ══════════");
highlight("Hook → Build-Up → Value → CTA", reelPrompt, /HOOK \(0-3s\):/);
highlight("HOOK BANK", reelPrompt, /HOOK BANK/);
highlight("BUILD-UP BANK", reelPrompt, /BUILD-UP BANK/);
highlight("'And literally a 5 year old' reference", reelPrompt, /5 year old could do this/);
highlight("'These accounts make \\$X' hook formula", reelPrompt, /accounts make \[?\$?10k/i);
highlight("Comment-to-DM CTA", reelPrompt, /[Cc]omment.*DM/);
highlight("Anti-AI rules (loose mode)", reelPrompt, /ANTI-AI WRITING RULES/);

// ─── LinkedIn playbook (the deepest one) ───
const liPrompt = buildLinkedinPlaybook(TEST_CASE.niche, TEST_CASE.topic);
section("LINKEDIN PLAYBOOK — pattern check", "(full block omitted, checks below)");

console.log("\n══════════ PATTERN PRESENCE CHECK — LINKEDIN ══════════");
highlight("13 viral structures present", liPrompt, /tool_tutorial|founder_story|contrarian_hack/);
highlight("Migration-guide structure (new)", liPrompt, /migration_guide|break.up.*with/i);
highlight("Use-case catalog structure (new)", liPrompt, /use_case_catalog|use cases of/);
highlight("HOOK BANK", liPrompt, /HOOK BANK/);
highlight("'How to break up with' hook (new)", liPrompt, /break up with \[old tool\]/);
highlight("'I want to be the greatest filter' hook (new)", liPrompt, /greatest filter/);
highlight(".md file inventory pattern", liPrompt, /\.md.*inventory|my-context\.md/);
highlight("Anti-AI rules (strict mode)", liPrompt, /ANTI-AI WRITING RULES/);

console.log("\n\n════════════════════════════════════════════════════════════");
console.log("PROMPT SIZE SUMMARY");
console.log("════════════════════════════════════════════════════════════");
console.log(`Instagram prompt block:  ${igPrompt.length.toLocaleString()} chars`);
console.log(`Reel     prompt block:   ${reelPrompt.length.toLocaleString()} chars`);
console.log(`LinkedIn prompt block:   ${liPrompt.length.toLocaleString()} chars`);
console.log(
  `\nApproximate tokens (chars ÷ 4): IG=${Math.round(igPrompt.length / 4)} | Reel=${Math.round(reelPrompt.length / 4)} | LinkedIn=${Math.round(liPrompt.length / 4)}`,
);
console.log("\nClaude Opus 4.8 context window: 200,000 tokens.");
console.log("We use ~3-5% of it per generation. Lots of headroom.\n");

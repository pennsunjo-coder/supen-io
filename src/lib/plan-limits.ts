/**
 * Single source of truth for what each pricing pack actually delivers.
 * The marketing copy in `lib/stripe.ts` PLANS lists the promises; this file
 * turns each promise into an enforceable number that the UI and the
 * server-side rate limiter both read from.
 *
 * When Stripe is wired up, profile.plan flips from "free" to "plus"/"pro"
 * automatically and these gates take effect with no code change needed.
 */

import type { Plan } from "@/lib/stripe";

export interface PlanLimits {
  /** Hard cap on `sources` table rows (counted as groups, not chunks). */
  maxSources: number | "unlimited";
  /** Generations allowed per rolling 24h window. */
  generationsPerDay: number | "unlimited";
  /** Generations allowed per rolling 30-day window. */
  generationsPerMonth: number | "unlimited";
  /** Per-hour cap kept as a safety net against abuse / runaway clients. */
  generationsPerHour: number;
  /** Lifetime generations. Free trial — once spent, never refills.
   *  Paid plans set this to "unlimited" so the daily/monthly caps bind instead. */
  generationsLifetime: number | "unlimited";
  /** Image / infographic generations per rolling 30-day window. Each
   *  regeneration counts as one. Enforced server-side. */
  imagesPerMonth: number | "unlimited";
  /** Premium infographic templates (typography-rich, multi-section). */
  premiumInfographics: boolean;
  /** Style memory + viral scoring loop (learns from edits). */
  styleMemory: boolean;
  /** Pro-only analytics dashboard. */
  advancedAnalytics: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  // There is no Free tier any more — Supenli.ai is paid-only (Plus or Pro).
  // The "free" key is kept here because user_profiles.plan defaults to
  // "free" for any account that hasn't completed a Stripe checkout yet,
  // and removing the entry would break Record<Plan, PlanLimits>. Every
  // quota is set to 0 / false so that if a "free" user somehow bypasses
  // PlanGate and reaches the Studio, the quota check refuses the
  // generation rather than silently letting it through.
  free: {
    maxSources: 0,
    generationsPerDay: 0,
    generationsPerMonth: 0,
    generationsPerHour: 0,
    generationsLifetime: 0,
    imagesPerMonth: 0,
    premiumInfographics: false,
    styleMemory: false,
    advancedAnalytics: false,
  },
  plus: {
    maxSources: "unlimited",
    generationsPerDay: 20,
    generationsPerMonth: 100,
    generationsPerHour: 20,
    generationsLifetime: "unlimited",
    imagesPerMonth: 50,
    premiumInfographics: true,
    styleMemory: true,
    advancedAnalytics: false,
  },
  pro: {
    maxSources: "unlimited",
    generationsPerDay: "unlimited",
    generationsPerMonth: "unlimited",
    generationsPerHour: 60,
    generationsLifetime: "unlimited",
    imagesPerMonth: 300,
    premiumInfographics: true,
    styleMemory: true,
    advancedAnalytics: true,
  },
};

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  if (plan === "plus" || plan === "pro") return PLAN_LIMITS[plan];
  return PLAN_LIMITS.free;
}

/** True when a numeric limit would block a single new action. */
export function isOverLimit(
  current: number,
  limit: number | "unlimited",
): boolean {
  if (limit === "unlimited") return false;
  return current >= limit;
}

/** Friendly upgrade copy for the toast / banner that fires on a block. */
export function upgradeMessage(currentPlan: string | null | undefined, feature: string): string {
  const next = currentPlan === "plus" ? "Pro" : "Plus";
  const current = currentPlan === "plus" ? "Plus" : "Pro";
  return `${feature} limit reached on the ${current} plan. Upgrade to ${next} for more.`;
}

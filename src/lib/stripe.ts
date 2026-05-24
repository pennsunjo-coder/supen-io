/**
 * Stripe integration — plans, checkout, helpers.
 */

import { supabase } from "./supabase";

export type Plan = "free" | "plus" | "pro";

export interface PlanConfig {
  name: string;
  price: number;
  color: string;
  badge: string | null;
  features: string[];
}

// Only paid plans are shown/sold. "free" stays in the Plan type as the
// "not subscribed yet" sentinel (used by plan-limits and the paywall).
export const PLANS: Record<"plus" | "pro", PlanConfig> = {
  plus: {
    name: "Plus",
    price: 10,
    color: "border-primary/40",
    badge: "Most popular",
    features: [
      "100 generations / month",
      "50 images / month",
      "Unlimited sources",
      "Premium infographics",
      "Style memory & learning",
      "Real viral scoring",
      "Priority support",
    ],
  },
  pro: {
    name: "Pro",
    price: 29,
    color: "border-amber-500/40",
    badge: "Best value",
    features: [
      "Everything in Plus",
      "Unlimited generations",
      "300 images / month",
      "Advanced analytics",
      "Team collaboration (coming soon)",
      "API access (coming soon)",
      "Dedicated support",
    ],
  },
};

export async function createCheckoutSession(
  plan: "plus" | "pro",
  userId: string,
  email: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: {
      plan,
      userId,
      email,
      successUrl: `${window.location.origin}/dashboard`,
      cancelUrl: `${window.location.origin}/settings`,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.url) throw new Error("No checkout URL returned");
  return data.url;
}

export function isPlanActive(
  plan: string | null | undefined,
  expiresAt: string | null | undefined,
): boolean {
  if (!plan || plan === "free") return false;
  if (!expiresAt) return false;
  return new Date(expiresAt) > new Date();
}

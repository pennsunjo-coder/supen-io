/**
 * Stripe integration — plans, checkout, helpers.
 */

import { supabase } from "./supabase";

export type Plan = "free" | "pro" | "business";

export interface PlanConfig {
  name: string;
  price: number;
  color: string;
  badge: string | null;
  features: string[];
}

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    name: "Free",
    price: 0,
    color: "border-border/30",
    badge: null,
    features: [
      "5 generations / day",
      "3 sources max",
      "Basic infographics",
      "AI Coach (10 msg/day)",
    ],
  },
  pro: {
    name: "Pro",
    price: 10,
    color: "border-primary/40",
    badge: "Most popular",
    features: [
      "Unlimited generations",
      "Unlimited sources",
      "Premium infographics",
      "Unlimited AI Coach",
      "Style memory & learning",
      "Real viral scoring",
      "Priority support",
    ],
  },
  business: {
    name: "Business",
    price: 29,
    color: "border-amber-500/40",
    badge: "Best value",
    features: [
      "Everything in Pro",
      "Faster AI responses",
      "Advanced analytics",
      "Team collaboration (coming soon)",
      "API access (coming soon)",
      "Dedicated support",
    ],
  },
};

export async function createCheckoutSession(
  plan: "pro" | "business",
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

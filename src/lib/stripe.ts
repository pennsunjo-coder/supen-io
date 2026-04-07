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
      "5 generations / jour",
      "3 sources maximum",
      "Infographies basiques",
      "Coach IA (10 msg/jour)",
    ],
  },
  pro: {
    name: "Pro",
    price: 10,
    color: "border-primary/40",
    badge: "Le plus populaire",
    features: [
      "Generations illimitees",
      "Sources illimitees",
      "Infographies premium",
      "Coach IA illimite",
      "Memoire de style & apprentissage",
      "Scoring viral reel",
      "Support prioritaire",
    ],
  },
  business: {
    name: "Business",
    price: 29,
    color: "border-amber-500/40",
    badge: "Meilleur rapport qualite-prix",
    features: [
      "Tout ce qui est dans Pro",
      "Reponses IA plus rapides",
      "Analytics avancees",
      "Collaboration equipe (bientot)",
      "Acces API (bientot)",
      "Support dedie",
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

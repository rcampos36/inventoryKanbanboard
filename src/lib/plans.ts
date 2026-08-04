/** Subscription plans selectable at registration (Stripe wiring comes later). */

export const PLAN_IDS = ["starter", "professional", "enterprise"] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceLabel: string;
  blurb: string;
  features: string[];
  highlighted?: boolean;
};

export const PLANS: PlanDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    priceLabel: "$99/mo",
    blurb: "One rooftop getting organized on the board.",
    features: [
      "1 dealership board",
      "Up to 5 user logins",
      "Inventory + Daily Sales + Sold by",
      "Working deals & overnight demos",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    priceLabel: "$199/mo",
    blurb: "Full sales-tower visibility for an active store.",
    features: [
      "Everything in Starter",
      "Up to 20 user logins",
      "Reports & sales history",
      "Inventory file import",
      "Priority email support",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Custom",
    blurb: "Dealer groups and multi-store operations.",
    features: [
      "Everything in Professional",
      "Multi-rooftop ready",
      "Higher user limits",
      "SSO (coming later)",
      "Onboarding support",
    ],
  },
];

export const DEFAULT_PLAN_ID: PlanId = "professional";

export function isPlanId(value: string): value is PlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}

export function parsePlanId(value: unknown): PlanId | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return isPlanId(normalized) ? normalized : null;
}

export function planLabel(planId: PlanId): string {
  return PLANS.find((plan) => plan.id === planId)?.name ?? planId;
}

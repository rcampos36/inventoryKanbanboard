/** Subscription plans selectable at registration (billing can attach later). */

export const PLAN_IDS = ["starter", "professional", "enterprise"] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export const PLAN_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "canceled",
] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];

/** Gated product capabilities. */
export const PLAN_FEATURES = [
  "reports",
  "import",
  "managerDemos",
  "intake",
] as const;

export type PlanFeature = (typeof PLAN_FEATURES)[number];

/** Board panes that can be plan-restricted. */
export const PLAN_BOARD_SECTIONS = [
  "inventory",
  "sales",
  "dailySales",
  "workingDeals",
  "managers",
  "overnight",
  "intake",
] as const;

export type PlanBoardSection = (typeof PLAN_BOARD_SECTIONS)[number];

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceLabel: string;
  blurb: string;
  features: string[];
  highlighted?: boolean;
  maxUsers: number;
  entitlements: readonly PlanFeature[];
  boardSections: readonly PlanBoardSection[];
};

const STARTER_SECTIONS = [
  "inventory",
  "sales",
  "dailySales",
  "workingDeals",
  "overnight",
] as const satisfies readonly PlanBoardSection[];

const FULL_BOARD_SECTIONS = PLAN_BOARD_SECTIONS;

export const PLANS: PlanDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    priceLabel: "$299/mo",
    blurb: "One rooftop getting organized on the board.",
    features: [
      "1 dealership board",
      "Up to 5 user logins",
      "Inventory + Daily Sales + Sold by",
      "Working deals & overnight demos",
    ],
    maxUsers: 5,
    entitlements: [],
    boardSections: STARTER_SECTIONS,
  },
  {
    id: "professional",
    name: "Professional",
    priceLabel: "$599/mo",
    blurb: "Full sales-tower visibility for an active store.",
    features: [
      "Everything in Starter",
      "Up to 20 user logins",
      "Reports & sales history",
      "Inventory file import",
      "Manager demos & intake lanes",
      "Priority email support",
    ],
    highlighted: true,
    maxUsers: 20,
    entitlements: ["reports", "import", "managerDemos", "intake"],
    boardSections: FULL_BOARD_SECTIONS,
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
    maxUsers: 100,
    entitlements: ["reports", "import", "managerDemos", "intake"],
    boardSections: FULL_BOARD_SECTIONS,
  },
];

export const DEFAULT_PLAN_ID: PlanId = "professional";

export function isPlanId(value: string): value is PlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}

export function isPlanStatus(value: string): value is PlanStatus {
  return (PLAN_STATUSES as readonly string[]).includes(value);
}

export function planStatusLabel(status: PlanStatus): string {
  switch (status) {
    case "trialing":
      return "Trialing";
    case "active":
      return "Active";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
  }
}

export function parsePlanId(value: unknown): PlanId | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return isPlanId(normalized) ? normalized : null;
}

export function getPlan(planId: PlanId): PlanDefinition {
  return PLANS.find((plan) => plan.id === planId) ?? PLANS[1]!;
}

export function planLabel(planId: PlanId): string {
  return getPlan(planId).name;
}

export function planHasFeature(planId: PlanId, feature: PlanFeature): boolean {
  return getPlan(planId).entitlements.includes(feature);
}

export function planMaxUsers(planId: PlanId): number {
  return getPlan(planId).maxUsers;
}

export function planAllowsBoardSection(
  planId: PlanId,
  section: PlanBoardSection
): boolean {
  return getPlan(planId).boardSections.includes(section);
}

export function planAllowedBoardSections(
  planId: PlanId
): readonly PlanBoardSection[] {
  return getPlan(planId).boardSections;
}

export function featureUpgradeHint(feature: PlanFeature): string {
  switch (feature) {
    case "reports":
      return "Reports are available on Professional and Enterprise plans.";
    case "import":
      return "Inventory file import is available on Professional and Enterprise plans.";
    case "managerDemos":
      return "Manager demos are available on Professional and Enterprise plans.";
    case "intake":
      return "Incoming, DX, and loaner lanes are available on Professional and Enterprise plans.";
  }
}

import type { PlanId } from "@/lib/plans";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationBrand: string;
  /** Organization subscription tier; may be refreshed from DB for older sessions. */
  organizationPlan: PlanId;
};

export const SESSION_COOKIE = "ikb_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

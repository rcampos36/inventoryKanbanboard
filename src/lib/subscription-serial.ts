import { randomBytes } from "crypto";
import { PEARSON_ORG_ID, SUNRISE_ORG_ID } from "@/lib/org-ids";

export const TRIAL_LENGTH_DAYS = 3;

const SERIAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Built-in orgs that never show a trial banner or activation gate. */
export function isSubscriptionExemptOrg(organizationId: string): boolean {
  return (
    organizationId === PEARSON_ORG_ID || organizationId === SUNRISE_ORG_ID
  );
}

function randomSerialChunk(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += SERIAL_ALPHABET[bytes[i]! % SERIAL_ALPHABET.length];
  }
  return out;
}

/** Format: ST-XXXX-XXXX-XXXX */
export function generateSubscriptionSerial(): string {
  return `ST-${randomSerialChunk(4)}-${randomSerialChunk(4)}-${randomSerialChunk(4)}`;
}

/** Normalize user input and formatted serials to a comparable key. */
export function serialCompareKey(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Pretty-print a serial as ST-XXXX-XXXX-XXXX when possible. */
export function normalizeSerial(value: string): string {
  const key = serialCompareKey(value);
  if (key.length === 14 && key.startsWith("ST")) {
    return `ST-${key.slice(2, 6)}-${key.slice(6, 10)}-${key.slice(10, 14)}`;
  }
  return key;
}

export function trialEndsAtFrom(start = new Date()): Date {
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + TRIAL_LENGTH_DAYS);
  return end;
}

export function isTrialExpired(
  trialEndsAt: Date | string | null | undefined,
  now = new Date()
): boolean {
  if (!trialEndsAt) return false;
  const end =
    typeof trialEndsAt === "string" ? new Date(trialEndsAt) : trialEndsAt;
  return end.getTime() <= now.getTime();
}

/** Whole days remaining, rounded up. 0 when expired. */
export function trialDaysRemaining(
  trialEndsAt: Date | string | null | undefined,
  now = new Date()
): number {
  if (!trialEndsAt) return 0;
  const end =
    typeof trialEndsAt === "string" ? new Date(trialEndsAt) : trialEndsAt;
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export type SubscriptionAccessOrg = {
  id: string;
  planStatus: string;
  trialEndsAt: Date | string | null;
  serialActivatedAt?: Date | string | null;
};

export function orgIsSubscriptionActive(org: SubscriptionAccessOrg): boolean {
  if (isSubscriptionExemptOrg(org.id)) return true;
  if (org.planStatus === "active") return true;
  if (org.serialActivatedAt) return true;
  return false;
}

/** True when the app should redirect to /activate. */
export function orgNeedsActivation(
  org: SubscriptionAccessOrg,
  now = new Date()
): boolean {
  if (orgIsSubscriptionActive(org)) return false;
  return isTrialExpired(org.trialEndsAt, now);
}

/**
 * Days left for the trial banner, or null when no banner should show
 * (active / exempt / already activated).
 */
export function trialBannerDaysRemaining(
  org: SubscriptionAccessOrg,
  now = new Date()
): number | null {
  if (orgIsSubscriptionActive(org)) return null;
  if (!org.trialEndsAt) return null;
  return trialDaysRemaining(org.trialEndsAt, now);
}

export function buildSubscriptionSerialEmailText(input: {
  dealershipName: string;
  adminName: string;
  serial: string;
  trialDays?: number;
}): string {
  const days = input.trialDays ?? TRIAL_LENGTH_DAYS;
  return [
    `Hi ${input.adminName},`,
    "",
    `Welcome to SalesTower — ${input.dealershipName} is ready.`,
    "",
    `Your account includes a ${days}-day trial. After the trial ends, you will need this activation serial to keep using SalesTower:`,
    "",
    `  ${input.serial}`,
    "",
    "Save this email. Any user at your dealership can enter the serial on the activation screen when prompted.",
    "",
    "Questions? Reply to this email or contact info@salestower.io.",
    "",
    "— SalesTower",
  ].join("\n");
}

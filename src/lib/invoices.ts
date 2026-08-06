import type { PlanId } from "@/lib/plans";
import {
  formatUsdFromCents,
  planLabel,
  planMonthlyPriceCents,
} from "@/lib/plans";

export function currentBillingPeriodLabel(date = new Date()): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function parseDollarsToCents(
  value: string | null | undefined
): number | null {
  const raw = String(value ?? "")
    .trim()
    .replace(/[$,]/g, "");
  if (!raw) return null;
  const dollars = Number(raw);
  if (!Number.isFinite(dollars) || dollars <= 0) return null;
  return Math.round(dollars * 100);
}

/**
 * Resolve invoice amount:
 * 1) one-off override on the send form
 * 2) saved customMonthlyPriceCents (Enterprise only)
 * 3) fixed plan list price (Starter / Professional)
 */
export function resolveInvoiceAmountCents(input: {
  planId: PlanId;
  customMonthlyPriceCents?: number | null;
  overrideDollars?: string | null;
}): { amountCents: number } | { error: string } {
  const overrideCents = parseDollarsToCents(input.overrideDollars);
  if (input.overrideDollars?.trim()) {
    if (overrideCents == null) {
      return { error: "Enter a valid invoice amount greater than zero." };
    }
    return { amountCents: overrideCents };
  }

  if (
    input.planId === "enterprise" &&
    typeof input.customMonthlyPriceCents === "number" &&
    input.customMonthlyPriceCents > 0
  ) {
    return { amountCents: input.customMonthlyPriceCents };
  }

  const planAmount = planMonthlyPriceCents(input.planId);
  if (planAmount == null) {
    return {
      error:
        "This account uses custom pricing. Save an agreed monthly price on the subscription, or enter an amount for this invoice.",
    };
  }

  return { amountCents: planAmount };
}

/** Default amount shown on the invoice form for this org/plan. */
export function defaultInvoiceAmountCents(input: {
  planId: PlanId;
  customMonthlyPriceCents?: number | null;
}): number | null {
  if (
    input.planId === "enterprise" &&
    typeof input.customMonthlyPriceCents === "number" &&
    input.customMonthlyPriceCents > 0
  ) {
    return input.customMonthlyPriceCents;
  }
  return planMonthlyPriceCents(input.planId);
}

export function buildInvoiceNumber(orgSlug: string, sentAt = new Date()): string {
  const stamp = [
    sentAt.getUTCFullYear(),
    String(sentAt.getUTCMonth() + 1).padStart(2, "0"),
    String(sentAt.getUTCDate()).padStart(2, "0"),
    String(sentAt.getUTCHours()).padStart(2, "0"),
    String(sentAt.getUTCMinutes()).padStart(2, "0"),
  ].join("");
  const slug = orgSlug
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 8);
  return `ST-${slug || "DEALER"}-${stamp}`;
}

export function buildDealershipAddressLines(org: {
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  dealerNumber?: string | null;
}): string[] {
  return [
    org.name,
    org.addressLine1,
    org.addressLine2,
    [org.city, org.state, org.postalCode].filter(Boolean).join(", ") || null,
    org.dealerNumber ? `Dealer # ${org.dealerNumber}` : null,
  ].filter((line): line is string => Boolean(line));
}

export function buildInvoiceEmailText(input: {
  dealershipName: string;
  invoiceNumber: string;
  planId: PlanId;
  amountCents: number;
  periodLabel: string;
  note?: string | null;
  addressLines: string[];
}): string {
  const amount = formatUsdFromCents(input.amountCents);
  const lines = [
    "SalesTower subscription invoice",
    "",
    `Invoice #: ${input.invoiceNumber}`,
    `Dealership: ${input.dealershipName}`,
    `Billing period: ${input.periodLabel}`,
    `Plan: ${planLabel(input.planId)}`,
    `Amount due: ${amount}`,
    "",
  ];

  if (input.addressLines.length) {
    lines.push("Bill to:", ...input.addressLines.map((line) => `  ${line}`), "");
  }

  lines.push(
    "A PDF copy of this invoice is attached for printing or your records.",
    "",
    "Payment instructions",
    "Please remit the amount due by ACH or check for this monthly subscription.",
    "Reply to this email if you need bank / ACH details or have billing questions.",
    ""
  );

  if (input.note?.trim()) {
    lines.push("Note from SalesTower:", input.note.trim(), "");
  }

  lines.push("Thank you,", "SalesTower Billing", "info@salestower.io");

  return lines.join("\n");
}

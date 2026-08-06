import type { PlanId } from "@/lib/plans";
import {
  formatUsdFromCents,
  planLabel,
  planMonthlyPriceCents,
} from "@/lib/plans";

export function currentBillingPeriodLabel(date = new Date()): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function resolveInvoiceAmountCents(
  planId: PlanId,
  overrideDollars?: string | null
): { amountCents: number } | { error: string } {
  const planAmount = planMonthlyPriceCents(planId);
  const override = String(overrideDollars ?? "").trim();

  if (override) {
    const dollars = Number(override.replace(/[$,]/g, ""));
    if (!Number.isFinite(dollars) || dollars <= 0) {
      return { error: "Enter a valid invoice amount greater than zero." };
    }
    return { amountCents: Math.round(dollars * 100) };
  }

  if (planAmount == null) {
    return {
      error:
        "Enterprise pricing is custom — enter an invoice amount before sending.",
    };
  }

  return { amountCents: planAmount };
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
    "Payment instructions",
    "Please remit the amount due by ACH or check for this monthly subscription.",
    "Reply to this email if you need bank / ACH details or have billing questions.",
    ""
  );

  if (input.note?.trim()) {
    lines.push("Note from SalesTower:", input.note.trim(), "");
  }

  lines.push(
    "Thank you,",
    "SalesTower Billing",
    "info@salestower.io"
  );

  return lines.join("\n");
}

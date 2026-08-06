import { Resend } from "resend";

const DEFAULT_TO = "info@salestower.io";
const TEST_FROM = "SalesTower <onboarding@resend.dev>";

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

export function describeResendError(error: unknown): string {
  if (!error) return "Unknown email error";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const record = error as {
      message?: string;
      name?: string;
      statusCode?: number;
    };
    const message = record.message ?? "";
    if (
      message.includes("only send testing emails to your own email address") ||
      message.includes("verify a domain")
    ) {
      return (
        "Resend test mode can only email your Resend account address. " +
        "Set DEMO_TO_EMAIL to that address for now, or verify salestower.io at resend.com/domains and set DEMO_FROM_EMAIL to an address on that domain (e.g. hello@salestower.io)."
      );
    }
    const parts = [
      record.name,
      record.statusCode ? `HTTP ${record.statusCode}` : null,
      record.message,
    ].filter(Boolean);
    if (parts.length) return parts.join(" — ");
  }
  return "Unknown email error";
}

export function resolveFromAddress(): string {
  return process.env.DEMO_FROM_EMAIL?.trim() || TEST_FROM;
}

export function isResendTestSender(from: string): boolean {
  return from.toLowerCase().includes("onboarding@resend.dev");
}

/** Prefer configured inbox, otherwise info@salestower.io when domain sending is ready. */
export function resolveToAddress(from: string): string | null {
  const configured = process.env.DEMO_TO_EMAIL?.trim();
  if (configured) return configured;

  if (isResendTestSender(from)) {
    return null;
  }
  return DEFAULT_TO;
}

/**
 * Resolve recipients for emails meant for a customer (serial, invoice, etc.).
 * Resend's onboarding@resend.dev sender can only deliver to the account email
 * (DEMO_TO_EMAIL). With a verified domain, send to the intended addresses.
 */
export function resolveCustomerEmailRecipients(
  intendedRecipients: string[],
  from: string
):
  | { to: string[]; redirectedFrom?: string[]; note?: string }
  | { error: string } {
  const intended = [
    ...new Set(
      intendedRecipients
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
  if (intended.length === 0) {
    return { error: "No recipient email addresses were provided." };
  }

  if (!isResendTestSender(from)) {
    return { to: intended };
  }

  const testInbox = process.env.DEMO_TO_EMAIL?.trim().toLowerCase();
  if (!testInbox) {
    return {
      error:
        "Using Resend's test sender (onboarding@resend.dev). Set DEMO_TO_EMAIL to your Resend account email so serial emails can be delivered, or verify salestower.io and set DEMO_FROM_EMAIL to an address on that domain.",
    };
  }

  const alreadyTargeted = intended.includes(testInbox);
  return {
    to: [testInbox],
    redirectedFrom: alreadyTargeted ? undefined : intended,
    note: alreadyTargeted
      ? undefined
      : `Resend test mode redirected delivery to ${testInbox} (intended: ${intended.join(", ")}).`,
  };
}

export const CONTACT_INBOX = DEFAULT_TO;

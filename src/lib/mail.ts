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

/** Prefer configured inbox, otherwise info@salestower.io when domain sending is ready. */
export function resolveToAddress(from: string): string | null {
  const configured = process.env.DEMO_TO_EMAIL?.trim();
  if (configured) return configured;

  const usingTestSender = from.toLowerCase().includes("onboarding@resend.dev");
  if (usingTestSender) {
    return null;
  }
  return DEFAULT_TO;
}

export const CONTACT_INBOX = DEFAULT_TO;

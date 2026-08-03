"use server";

import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PEARSON_ORG_ID } from "@/lib/tenant";
import { boardPath } from "@/lib/paths";
import { redirect } from "next/navigation";

export type ScheduleDemoState = {
  ok: boolean;
  error?: string;
};

const DEFAULT_DEMO_TO = "info@salestower.io";
const TEST_FROM = "SalesTower <onboarding@resend.dev>";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function describeResendError(error: unknown): string {
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

function resolveFromAddress(): string {
  return process.env.DEMO_FROM_EMAIL?.trim() || TEST_FROM;
}

function resolveToAddress(from: string): string | null {
  const configured = process.env.DEMO_TO_EMAIL?.trim();
  if (configured) return configured;

  const usingTestSender = from.toLowerCase().includes("onboarding@resend.dev");
  if (usingTestSender) {
    // Without a verified domain, Resend rejects any recipient except the account owner.
    return null;
  }
  return DEFAULT_DEMO_TO;
}

export async function scheduleDemoAction(
  _prev: ScheduleDemoState,
  formData: FormData
): Promise<ScheduleDemoState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const dealership = String(formData.get("dealership") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim(); // honeypot

  if (website) {
    return { ok: true };
  }

  if (!name || name.length < 2) {
    return { ok: false, error: "Please enter your name." };
  }
  if (!email || !email.includes("@") || !email.includes(".")) {
    return { ok: false, error: "Please enter a valid work email." };
  }
  if (!dealership) {
    return { ok: false, error: "Please enter your dealership name." };
  }

  let emailSent = false;
  let emailError: string | null = null;
  let emailedTo: string | null = null;

  const resend = getResend();
  if (!resend) {
    emailError = "RESEND_API_KEY is not configured";
  } else {
    const from = resolveFromAddress();
    const to = resolveToAddress(from);

    if (!to) {
      emailError =
        "Using Resend's test sender. Set DEMO_TO_EMAIL to your Resend account email (rcrogercampos@gmail.com), or verify salestower.io and set DEMO_FROM_EMAIL to hello@salestower.io.";
    } else {
      const lines = [
        "New SalesTower demo request",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Dealership: ${dealership}`,
        `Phone: ${phone || "(not provided)"}`,
        "",
        "Message:",
        message || "(none)",
        "",
        `Submitted via SalesTower landing page → notify ${to}`,
      ];

      try {
        const { error } = await resend.emails.send({
          from,
          to: [to],
          replyTo: email,
          subject: `Demo request — ${dealership} (${name})`,
          text: lines.join("\n"),
        });

        if (error) {
          emailError = describeResendError(error);
          console.error("Resend demo email failed", error);
        } else {
          emailSent = true;
          emailedTo = to;
        }
      } catch (error) {
        emailError = describeResendError(error);
        console.error("Resend demo email threw", error);
      }
    }
  }

  try {
    await prisma.demoRequest.create({
      data: {
        name,
        email,
        dealership,
        phone: phone || null,
        message: message || null,
        emailSent,
        emailError: emailSent
          ? emailedTo
            ? `Delivered to ${emailedTo}`
            : null
          : emailError,
      },
    });
  } catch (error) {
    console.error("Failed to store demo request", error);
    if (emailSent) return { ok: true };
    return {
      ok: false,
      error:
        "Could not submit your request. Please email info@salestower.io directly.",
    };
  }

  return { ok: true };
}

export type DemoRequestRow = {
  id: string;
  name: string;
  email: string;
  dealership: string;
  phone: string | null;
  message: string | null;
  emailSent: boolean;
  emailError: string | null;
  createdAt: string;
};

export async function listDemoRequestsAction(): Promise<DemoRequestRow[]> {
  const user = await requireAdmin();
  if (user.organizationId !== PEARSON_ORG_ID) {
    redirect(boardPath(user.organizationSlug));
  }

  const rows = await prisma.demoRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    dealership: row.dealership,
    phone: row.phone,
    message: row.message,
    emailSent: row.emailSent,
    emailError: row.emailError,
    createdAt: row.createdAt.toISOString(),
  }));
}

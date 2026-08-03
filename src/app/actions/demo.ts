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

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function describeResendError(error: unknown): string {
  if (!error) return "Unknown email error";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const record = error as { message?: string; name?: string; statusCode?: number };
    const parts = [
      record.name,
      record.statusCode ? `HTTP ${record.statusCode}` : null,
      record.message,
    ].filter(Boolean);
    if (parts.length) return parts.join(" — ");
  }
  return "Unknown email error";
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

  const resend = getResend();
  if (!resend) {
    emailError = "RESEND_API_KEY is not configured";
  } else {
    const from =
      process.env.DEMO_FROM_EMAIL?.trim() ||
      "SalesTower <onboarding@resend.dev>";
    const to = process.env.DEMO_TO_EMAIL?.trim() || DEFAULT_DEMO_TO;

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
      }
    } catch (error) {
      emailError = describeResendError(error);
      console.error("Resend demo email threw", error);
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
        emailError,
      },
    });
  } catch (error) {
    console.error("Failed to store demo request", error);
    // If we at least emailed, treat as success.
    if (emailSent) return { ok: true };
    return {
      ok: false,
      error:
        "Could not submit your request. Please email info@salestower.io directly.",
    };
  }

  // Lead is stored even when outbound email fails (common until the domain is verified).
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

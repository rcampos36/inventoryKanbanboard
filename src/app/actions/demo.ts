"use server";

import { Resend } from "resend";

export type ScheduleDemoState = {
  ok: boolean;
  error?: string;
};

const DEMO_TO = "info@salestower.io";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
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
    // Bot filled the hidden field — pretend success.
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

  const resend = getResend();
  if (!resend) {
    return {
      ok: false,
      error:
        "Demo requests are temporarily unavailable. Email info@salestower.io directly.",
    };
  }

  const from =
    process.env.DEMO_FROM_EMAIL?.trim() ||
    "SalesTower <onboarding@resend.dev>";

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
      to: [DEMO_TO],
      replyTo: email,
      subject: `Demo request — ${dealership} (${name})`,
      text: lines.join("\n"),
    });

    if (error) {
      console.error("Resend demo email failed", error);
      return {
        ok: false,
        error: "Could not send your request. Please try again or email info@salestower.io.",
      };
    }
  } catch (error) {
    console.error("Resend demo email threw", error);
    return {
      ok: false,
      error: "Could not send your request. Please try again or email info@salestower.io.",
    };
  }

  return { ok: true };
}

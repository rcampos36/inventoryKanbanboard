"use server";

import {
  CONTACT_INBOX,
  describeResendError,
  getResend,
  resolveFromAddress,
  resolveToAddress,
} from "@/lib/mail";

export type ContactFormState = {
  ok: boolean;
  error?: string;
};

export async function contactUsAction(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim(); // honeypot

  if (website) {
    return { ok: true };
  }

  if (!name || name.length < 2) {
    return { ok: false, error: "Please enter your name." };
  }
  if (!email || !email.includes("@") || !email.includes(".")) {
    return { ok: false, error: "Please enter a valid email." };
  }
  if (!message || message.length < 5) {
    return { ok: false, error: "Please enter a short message." };
  }

  const resend = getResend();
  if (!resend) {
    return {
      ok: false,
      error: `Could not send your message. Please email ${CONTACT_INBOX} directly.`,
    };
  }

  const from = resolveFromAddress();
  const to = resolveToAddress(from);

  if (!to) {
    return {
      ok: false,
      error:
        "Email is not fully configured yet. Please email info@salestower.io directly.",
    };
  }

  const topic = subject || "General inquiry";
  const lines = [
    "New SalesTower contact message",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "(not provided)"}`,
    `Subject: ${topic}`,
    "",
    "Message:",
    message,
    "",
    `Submitted via SalesTower Contact Us → notify ${to}`,
  ];

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `Contact — ${topic} (${name})`,
      text: lines.join("\n"),
    });

    if (error) {
      console.error("Resend contact email failed", error);
      return {
        ok: false,
        error: `${describeResendError(error)} You can also email ${CONTACT_INBOX} directly.`,
      };
    }
  } catch (error) {
    console.error("Resend contact email threw", error);
    return {
      ok: false,
      error: `Could not send your message. Please email ${CONTACT_INBOX} directly.`,
    };
  }

  return { ok: true };
}

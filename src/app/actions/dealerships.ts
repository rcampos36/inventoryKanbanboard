"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth";
import {
  buildDealershipAddressLines,
  buildInvoiceEmailText,
  buildInvoiceNumber,
  currentBillingPeriodLabel,
  parseDollarsToCents,
  resolveInvoiceAmountCents,
} from "@/lib/invoices";
import {
  buildInvoicePdf,
  invoicePdfFilename,
} from "@/lib/invoice-pdf";
import {
  describeResendError,
  getResend,
  resolveCustomerEmailRecipients,
  resolveFromAddress,
} from "@/lib/mail";
import {
  formatUsdFromCents,
  isPlanId,
  isPlanStatus,
  parseDealerCount,
  planLabel,
  planMaxUsers,
  planMonthlyPriceCents,
  type PlanId,
  type PlanStatus,
} from "@/lib/plans";
import {
  buildSubscriptionSerialEmailText,
  TRIAL_LENGTH_DAYS,
} from "@/lib/subscription-serial";

export type DealershipFormState = {
  error?: string;
  success?: string;
};

export type DealershipInvoiceRow = {
  id: string;
  invoiceNumber: string;
  plan: PlanId;
  amountCents: number;
  periodLabel: string;
  recipientEmail: string;
  status: "sent" | "failed" | "paid";
  emailError: string | null;
  sentAt: string;
  paidAt: string | null;
};

export type DealershipListItem = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  plan: PlanId;
  planStatus: PlanStatus;
  dealerCount: number;
  phone: string | null;
  dealerNumber: string | null;
  city: string | null;
  state: string | null;
  userCount: number;
  createdAt: string;
};

export type DealershipDetail = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  plan: PlanId;
  planStatus: PlanStatus;
  dealerCount: number;
  customMonthlyPriceCents: number | null;
  subscriptionSerial: string;
  trialEndsAt: string;
  serialActivatedAt: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  phone: string | null;
  dealerNumber: string | null;
  createdAt: string;
  updatedAt: string;
  users: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "USER";
    createdAt: string;
  }[];
  invoices: DealershipInvoiceRow[];
};

function actionErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_")
  ) {
    throw error;
  }
  return error instanceof Error ? error.message : fallback;
}

function revalidateDealershipPaths(orgId: string) {
  revalidatePath("/admin/dealerships");
  revalidatePath(`/admin/dealerships/${orgId}`);
}

export async function listDealershipsAction(): Promise<DealershipListItem[]> {
  await requirePlatformAdmin();

  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true } },
    },
  });

  return orgs.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    brand: org.brand,
    plan: isPlanId(org.plan) ? org.plan : "professional",
    planStatus: isPlanStatus(org.planStatus) ? org.planStatus : "trialing",
    dealerCount: org.dealerCount,
    phone: org.phone,
    dealerNumber: org.dealerNumber,
    city: org.city,
    state: org.state,
    userCount: org._count.users,
    createdAt: org.createdAt.toISOString(),
  }));
}

export async function getDealershipAction(
  orgId: string
): Promise<DealershipDetail | null> {
  await requirePlatformAdmin();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      users: {
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
      invoices: {
        orderBy: { sentAt: "desc" },
        take: 20,
      },
    },
  });
  if (!org) return null;

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    brand: org.brand,
    plan: isPlanId(org.plan) ? org.plan : "professional",
    planStatus: isPlanStatus(org.planStatus) ? org.planStatus : "trialing",
    dealerCount: org.dealerCount,
    customMonthlyPriceCents: org.customMonthlyPriceCents,
    subscriptionSerial: org.subscriptionSerial,
    trialEndsAt: org.trialEndsAt.toISOString(),
    serialActivatedAt: org.serialActivatedAt?.toISOString() ?? null,
    addressLine1: org.addressLine1,
    addressLine2: org.addressLine2,
    city: org.city,
    state: org.state,
    postalCode: org.postalCode,
    phone: org.phone,
    dealerNumber: org.dealerNumber,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
    users: org.users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })),
    invoices: org.invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      plan: isPlanId(invoice.plan) ? invoice.plan : "professional",
      amountCents: invoice.amountCents,
      periodLabel: invoice.periodLabel,
      recipientEmail: invoice.recipientEmail,
      status: invoice.status,
      emailError: invoice.emailError,
      sentAt: invoice.sentAt.toISOString(),
      paidAt: invoice.paidAt?.toISOString() ?? null,
    })),
  };
}

export async function updateDealershipSubscriptionAction(
  _prev: DealershipFormState,
  formData: FormData
): Promise<DealershipFormState> {
  await requirePlatformAdmin();

  try {
    const orgId = String(formData.get("organizationId") ?? "").trim();
    const planRaw = String(formData.get("plan") ?? "").trim();
    const statusRaw = String(formData.get("planStatus") ?? "").trim();
    const customPriceRaw = String(formData.get("customMonthlyPrice") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const dealerNumber = String(formData.get("dealerNumber") ?? "").trim();
    const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
    const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const state = String(formData.get("state") ?? "").trim();
    const postalCode = String(formData.get("postalCode") ?? "").trim();

    if (!orgId) return { error: "Missing dealership id." };
    if (!isPlanId(planRaw)) return { error: "Choose a valid subscription plan." };
    if (!isPlanStatus(statusRaw)) {
      return { error: "Choose a valid subscription status." };
    }

    const dealerCount = parseDealerCount(formData.get("dealerCount"), planRaw);
    if (dealerCount == null) {
      return {
        error: `Choose a dealer count allowed on ${planLabel(planRaw)}.`,
      };
    }

    // Agreed custom pricing is Enterprise-only; lower tiers always use list price.
    let customMonthlyPriceCents: number | null = null;
    if (planRaw === "enterprise") {
      customMonthlyPriceCents = parseDollarsToCents(customPriceRaw);
      if (customMonthlyPriceCents == null) {
        return {
          error:
            "Enterprise / custom plans need an agreed monthly price before you can save.",
        };
      }
    }

    const existing = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, serialActivatedAt: true },
    });
    if (!existing) return { error: "Dealership not found." };

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        plan: planRaw,
        planStatus: statusRaw,
        dealerCount,
        customMonthlyPriceCents,
        phone: phone || null,
        dealerNumber: dealerNumber || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
        ...(statusRaw === "active" && !existing.serialActivatedAt
          ? { serialActivatedAt: new Date() }
          : {}),
      },
    });

    revalidateDealershipPaths(orgId);
    const billedCents =
      planRaw === "enterprise"
        ? customMonthlyPriceCents
        : planMonthlyPriceCents(planRaw);
    const priceNote =
      billedCents != null ? ` at ${formatUsdFromCents(billedCents)}/mo` : "";
    return {
      success: `Updated to ${planLabel(planRaw)} · ${dealerCount} ${dealerCount === 1 ? "dealer" : "dealers"} (${statusRaw.replace("_", " ")})${priceNote}.`,
    };
  } catch (error) {
    return {
      error: actionErrorMessage(error, "Could not update the dealership."),
    };
  }
}

export async function createDealershipUserAction(
  _prev: DealershipFormState,
  formData: FormData
): Promise<DealershipFormState> {
  await requirePlatformAdmin();

  try {
    const orgId = String(formData.get("organizationId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");
    const roleRaw = String(formData.get("role") ?? "USER");
    const role = roleRaw === "ADMIN" ? "ADMIN" : "USER";

    if (!orgId) return { error: "Missing dealership id." };
    if (!name || !email || !password) {
      return { error: "Name, email, and password are required." };
    }
    if (!email.includes("@")) {
      return { error: "Enter a valid email address." };
    }
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, plan: true },
    });
    if (!org) return { error: "Dealership not found." };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "A user with this email already exists." };
    }

    const plan = isPlanId(org.plan) ? org.plan : "professional";
    const maxUsers = planMaxUsers(plan);
    const userCount = await prisma.user.count({
      where: { organizationId: orgId },
    });
    if (userCount >= maxUsers) {
      return {
        error: `${planLabel(plan)} allows up to ${maxUsers} user logins for this dealership.`,
      };
    }

    await prisma.user.create({
      data: {
        organizationId: orgId,
        name,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role,
      },
    });

    revalidateDealershipPaths(orgId);
    return { success: `Added ${email}.` };
  } catch (error) {
    return {
      error: actionErrorMessage(error, "Could not create the user."),
    };
  }
}

export async function updateDealershipUserAction(
  _prev: DealershipFormState,
  formData: FormData
): Promise<DealershipFormState> {
  await requirePlatformAdmin();

  try {
    const orgId = String(formData.get("organizationId") ?? "").trim();
    const userId = String(formData.get("userId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");
    const roleRaw = String(formData.get("role") ?? "USER");
    const role = roleRaw === "ADMIN" ? "ADMIN" : "USER";

    if (!orgId || !userId) return { error: "Missing user or dealership id." };
    if (!name || !email) {
      return { error: "Name and email are required." };
    }
    if (!email.includes("@")) {
      return { error: "Enter a valid email address." };
    }
    if (password && password.length < 8) {
      return { error: "New password must be at least 8 characters." };
    }

    const target = await prisma.user.findFirst({
      where: { id: userId, organizationId: orgId },
    });
    if (!target) return { error: "User not found." };

    if (target.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { organizationId: orgId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return { error: "You cannot demote the last administrator." };
      }
    }

    const emailOwner = await prisma.user.findUnique({ where: { email } });
    if (emailOwner && emailOwner.id !== target.id) {
      return { error: "Another account already uses that email." };
    }

    await prisma.user.update({
      where: { id: target.id },
      data: {
        name,
        email,
        role,
        ...(password
          ? { passwordHash: await bcrypt.hash(password, 12) }
          : {}),
      },
    });

    revalidateDealershipPaths(orgId);
    return { success: `Updated ${email}.` };
  } catch (error) {
    return {
      error: actionErrorMessage(error, "Could not update the user."),
    };
  }
}

export async function deleteDealershipUserAction(
  _prev: DealershipFormState,
  formData: FormData
): Promise<DealershipFormState> {
  const admin = await requirePlatformAdmin();

  try {
    const orgId = String(formData.get("organizationId") ?? "").trim();
    const userId = String(formData.get("userId") ?? "").trim();

    if (!orgId || !userId) return { error: "Missing user or dealership id." };
    if (admin.id === userId) {
      return { error: "You cannot remove your own admin account." };
    }

    const target = await prisma.user.findFirst({
      where: { id: userId, organizationId: orgId },
    });
    if (!target) return { error: "User not found." };

    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { organizationId: orgId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return { error: "You cannot remove the last administrator." };
      }
    }

    await prisma.user.delete({ where: { id: target.id } });
    revalidateDealershipPaths(orgId);
    return { success: `Removed ${target.email}.` };
  } catch (error) {
    return {
      error: actionErrorMessage(error, "Could not remove the user."),
    };
  }
}

export async function sendDealershipInvoiceAction(
  _prev: DealershipFormState,
  formData: FormData
): Promise<DealershipFormState> {
  await requirePlatformAdmin();

  try {
    const orgId = String(formData.get("organizationId") ?? "").trim();
    const recipientEmail = String(formData.get("recipientEmail") ?? "")
      .trim()
      .toLowerCase();
    const amountOverride = String(formData.get("amountOverride") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();
    const periodLabel =
      String(formData.get("periodLabel") ?? "").trim() ||
      currentBillingPeriodLabel();

    if (!orgId) return { error: "Missing dealership id." };
    if (!recipientEmail || !recipientEmail.includes("@")) {
      return { error: "Enter a valid recipient email." };
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) return { error: "Dealership not found." };

    const plan = isPlanId(org.plan) ? org.plan : "professional";
    const amountResult = resolveInvoiceAmountCents({
      planId: plan,
      customMonthlyPriceCents: org.customMonthlyPriceCents,
      overrideDollars: amountOverride,
    });
    if ("error" in amountResult) {
      return { error: amountResult.error };
    }

    const { amountCents } = amountResult;
    const invoiceNumber = buildInvoiceNumber(org.slug);
    const addressLines = buildDealershipAddressLines(org);

    const emailBody = buildInvoiceEmailText({
      dealershipName: org.name,
      invoiceNumber,
      planId: plan,
      amountCents,
      periodLabel,
      note,
      addressLines,
    });

    const resend = getResend();
    if (!resend) {
      return {
        error:
          "RESEND_API_KEY is not configured. Cannot send the invoice email.",
      };
    }

    const from = resolveFromAddress();
    const usingTestSender = from.toLowerCase().includes("onboarding@resend.dev");
    let emailSent = false;
    let emailError: string | null = null;

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await buildInvoicePdf({
        dealershipName: org.name,
        invoiceNumber,
        planId: plan,
        amountCents,
        periodLabel,
        note,
        addressLines,
        recipientEmail,
      });
    } catch (error) {
      console.error("Invoice PDF generation failed", error);
      return { error: "Could not generate the invoice PDF." };
    }

    try {
      const { error } = await resend.emails.send({
        from,
        to: [recipientEmail],
        replyTo: "info@salestower.io",
        ...(usingTestSender ? {} : { bcc: ["info@salestower.io"] }),
        subject: `SalesTower invoice ${invoiceNumber} — ${formatUsdFromCents(amountCents)} (${periodLabel})`,
        text: emailBody,
        attachments: [
          {
            filename: invoicePdfFilename(invoiceNumber),
            content: pdfBuffer,
          },
        ],
      });

      if (error) {
        emailError = describeResendError(error);
        console.error("Resend invoice email failed", error);
      } else {
        emailSent = true;
      }
    } catch (error) {
      emailError = describeResendError(error);
      console.error("Resend invoice email threw", error);
    }

    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        invoiceNumber,
        plan,
        amountCents,
        periodLabel,
        recipientEmail,
        note: note || null,
        status: emailSent ? "sent" : "failed",
        emailError,
      },
    });

    revalidateDealershipPaths(orgId);

    if (!emailSent) {
      return {
        error:
          emailError ??
          "Invoice was saved but the email could not be delivered.",
      };
    }

    return {
      success: `Invoice ${invoiceNumber} for ${formatUsdFromCents(amountCents)} sent to ${recipientEmail}.`,
    };
  } catch (error) {
    return {
      error: actionErrorMessage(error, "Could not send the invoice."),
    };
  }
}

export async function updateDealershipInvoicePaidAction(
  _prev: DealershipFormState,
  formData: FormData
): Promise<DealershipFormState> {
  await requirePlatformAdmin();

  try {
    const orgId = String(formData.get("organizationId") ?? "").trim();
    const invoiceId = String(formData.get("invoiceId") ?? "").trim();
    const markPaid = String(formData.get("markPaid") ?? "") === "true";

    if (!orgId || !invoiceId) {
      return { error: "Missing invoice or dealership id." };
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId },
    });
    if (!invoice) return { error: "Invoice not found." };

    if (markPaid) {
      if (invoice.status === "paid") {
        return { success: `Invoice ${invoice.invoiceNumber} is already paid.` };
      }
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "paid", paidAt: new Date() },
      });
      revalidateDealershipPaths(orgId);
      return { success: `Invoice ${invoice.invoiceNumber} marked as paid.` };
    }

    if (invoice.status !== "paid") {
      return { success: `Invoice ${invoice.invoiceNumber} is not marked paid.` };
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: invoice.emailError ? "failed" : "sent",
        paidAt: null,
      },
    });
    revalidateDealershipPaths(orgId);
    return { success: `Invoice ${invoice.invoiceNumber} marked unpaid.` };
  } catch (error) {
    return {
      error: actionErrorMessage(error, "Could not update invoice payment status."),
    };
  }
}

export async function resendDealershipSerialAction(
  _prev: DealershipFormState,
  formData: FormData
): Promise<DealershipFormState> {
  await requirePlatformAdmin();

  try {
    const orgId = String(formData.get("organizationId") ?? "").trim();
    if (!orgId) return { error: "Missing dealership id." };

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        subscriptionSerial: true,
        users: {
          where: { role: "ADMIN" },
          orderBy: { createdAt: "asc" },
          select: { email: true, name: true },
        },
      },
    });
    if (!org) return { error: "Dealership not found." };

    const admins = org.users;
    if (admins.length === 0) {
      return { error: "This dealership has no admin users to email." };
    }

    const resend = getResend();
    if (!resend) {
      return {
        error:
          "RESEND_API_KEY is not configured. Cannot send the serial email.",
      };
    }

    const from = resolveFromAddress();
    const intended = admins.map((admin) => admin.email);
    const primaryAdmin = admins[0]!;
    const resolved = resolveCustomerEmailRecipients(intended, from);
    if ("error" in resolved) {
      return { error: resolved.error };
    }

    let body = buildSubscriptionSerialEmailText({
      dealershipName: org.name,
      adminName: primaryAdmin.name,
      serial: org.subscriptionSerial,
      trialDays: TRIAL_LENGTH_DAYS,
    });
    if (resolved.note) {
      body = `${body}\n\n---\n${resolved.note}`;
    }

    const { data, error } = await resend.emails.send({
      from,
      to: resolved.to,
      replyTo: "info@salestower.io",
      subject: `Your SalesTower activation serial — ${org.name}`,
      text: body,
    });

    if (error) {
      console.error("Resend serial email failed", error);
      return { error: describeResendError(error) };
    }

    console.info("Resend serial email sent", {
      id: data?.id,
      to: resolved.to,
      intended,
    });

    return {
      success: resolved.note
        ? `Activation serial sent to ${resolved.to.join(", ")}. ${resolved.note}`
        : `Activation serial resent to ${resolved.to.join(", ")}.`,
    };
  } catch (error) {
    return {
      error: actionErrorMessage(error, "Could not resend the serial email."),
    };
  }
}

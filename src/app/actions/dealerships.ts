"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth";
import {
  isPlanId,
  isPlanStatus,
  planLabel,
  planMaxUsers,
  type PlanId,
  type PlanStatus,
} from "@/lib/plans";

export type DealershipFormState = {
  error?: string;
  success?: string;
};

export type DealershipListItem = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  plan: PlanId;
  planStatus: PlanStatus;
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

    const existing = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true },
    });
    if (!existing) return { error: "Dealership not found." };

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        plan: planRaw,
        planStatus: statusRaw,
        phone: phone || null,
        dealerNumber: dealerNumber || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
      },
    });

    revalidateDealershipPaths(orgId);
    return {
      success: `Updated to ${planLabel(planRaw)} (${statusRaw.replace("_", " ")}).`,
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

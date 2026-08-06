"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  requireAdmin,
  ensureBootstrapAdmin,
  ensureSunriseDemoAdmin,
} from "@/lib/auth";
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
} from "@/lib/session";
import { boardPath } from "@/lib/paths";
import {
  DEFAULT_PLAN_ID,
  isPlanId,
  planLabel,
  planMaxUsers,
} from "@/lib/plans";
import { orgNeedsActivation } from "@/lib/subscription-serial";

export type AuthFormState = {
  error?: string;
  success?: string;
};

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  try {
    await ensureBootstrapAdmin();
    await ensureSunriseDemoAdmin();
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Admin account is not configured.",
    };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "").trim();
  const next =
    nextRaw.startsWith("/admin/") && !nextRaw.startsWith("//")
      ? nextRaw
      : null;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  const organizationPlan =
    user.organization.plan && isPlanId(user.organization.plan)
      ? user.organization.plan
      : DEFAULT_PLAN_ID;

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organization.name,
    organizationSlug: user.organization.slug,
    organizationBrand: user.organization.brand || "Mazda",
    organizationPlan,
  });
  await setSessionCookie(token);

  if (
    !next &&
    orgNeedsActivation({
      id: user.organization.id,
      planStatus: user.organization.planStatus,
      trialEndsAt: user.organization.trialEndsAt,
      serialActivatedAt: user.organization.serialActivatedAt,
    })
  ) {
    redirect("/activate");
  }

  redirect(next ?? boardPath(user.organization.slug));
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

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

export async function createUserAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const admin = await requireAdmin();

  try {
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");
    const roleRaw = String(formData.get("role") ?? "USER");
    const role = roleRaw === "ADMIN" ? "ADMIN" : "USER";

    if (!name || !email || !password) {
      return { error: "Name, email, and password are required." };
    }
    if (!email.includes("@")) {
      return { error: "Enter a valid email address." };
    }
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "A user with this email already exists." };
    }

    const maxUsers = planMaxUsers(admin.organizationPlan);
    const userCount = await prisma.user.count({
      where: { organizationId: admin.organizationId },
    });
    if (userCount >= maxUsers) {
      return {
        error: `Your ${planLabel(admin.organizationPlan)} plan allows up to ${maxUsers} user logins. Upgrade to add more.`,
      };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        organizationId: admin.organizationId,
      },
    });

    revalidatePath("/admin");
    return { success: `Access granted for ${email}.` };
  } catch (error) {
    return {
      error: actionErrorMessage(error, "Could not create the user."),
    };
  }
}

export async function deleteUserAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const admin = await requireAdmin();

  try {
    const userId = String(formData.get("userId") ?? "").trim();

    if (!userId) {
      return { error: "Missing user id." };
    }

    if (admin.id === userId) {
      return { error: "You cannot remove your own admin account." };
    }

    const target = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: admin.organizationId,
      },
    });
    if (!target) {
      return { error: "User not found." };
    }

    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: admin.organizationId,
          role: "ADMIN",
        },
      });
      if (adminCount <= 1) {
        return { error: "You cannot remove the last administrator." };
      }
    }

    await prisma.user.delete({ where: { id: target.id } });
    revalidatePath("/admin");
    return { success: `Removed access for ${target.email}.` };
  } catch (error) {
    return {
      error: actionErrorMessage(error, "Could not remove the user."),
    };
  }
}

export async function listUsersAction() {
  const admin = await requireAdmin();
  return prisma.user.findMany({
    where: { organizationId: admin.organizationId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

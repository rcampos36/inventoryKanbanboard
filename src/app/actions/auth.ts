"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, ensureBootstrapAdmin } from "@/lib/auth";
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
} from "@/lib/session";

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

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

function actionErrorMessage(error: unknown, fallback: string): string {
  // Never swallow Next.js redirect()/notFound() control-flow errors.
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
  await requireAdmin();

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

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { name, email, passwordHash, role },
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

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return { error: "User not found." };
    }

    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return { error: "You cannot remove the last administrator." };
      }
    }

    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/admin");
    return { success: `Removed access for ${target.email}.` };
  } catch (error) {
    return {
      error: actionErrorMessage(error, "Could not remove the user."),
    };
  }
}

export async function listUsersAction() {
  await requireAdmin();
  return prisma.user.findMany({
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

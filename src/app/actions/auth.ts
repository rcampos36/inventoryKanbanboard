"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
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
  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function createUserAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  await requireAdmin();

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

  return { success: `Access granted for ${email}.` };
}

export async function deleteUserAction(userId: string): Promise<AuthFormState> {
  const admin = await requireAdmin();
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
  return { success: `Removed access for ${target.email}.` };
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

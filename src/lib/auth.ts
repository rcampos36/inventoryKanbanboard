import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { readSessionUser } from "@/lib/session";
import type { SessionUser } from "@/lib/session-types";

export type { SessionUser };

/** Creates the first admin from env if the users table is empty. */
export async function ensureBootstrapAdmin() {
  const count = await prisma.user.count();
  if (count > 0) return;

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";

  if (!email || !password) {
    throw new Error(
      "No users exist yet. Set ADMIN_EMAIL and ADMIN_PASSWORD to create the first admin."
    );
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "ADMIN",
    },
  });
}

export async function requireUser(): Promise<SessionUser> {
  await ensureBootstrapAdmin();
  const user = await readSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}

export async function getOptionalUser(): Promise<SessionUser | null> {
  try {
    await ensureBootstrapAdmin();
  } catch {
    // Allow login page to render with a setup message if admin env is missing.
  }
  return readSessionUser();
}

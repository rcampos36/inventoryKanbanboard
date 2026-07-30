import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { readSessionUser } from "@/lib/session";
import type { SessionUser } from "@/lib/session-types";

export type { SessionUser };

/**
 * Ensures an administrator exists from ADMIN_EMAIL / ADMIN_PASSWORD.
 * - Creates the admin only when no admin accounts exist (first setup / recovery)
 * - Updates the password/name/role if that env admin still exists
 * - Does NOT recreate an intentionally deleted env admin while other admins remain
 */
export async function ensureBootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";

  if (!email || !password) {
    const count = await prisma.user.count();
    if (count === 0) {
      throw new Error(
        "No users exist yet. Set ADMIN_EMAIL and ADMIN_PASSWORD to create the first admin."
      );
    }
    return;
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    // Only create the env admin for first setup or when every admin was removed.
    if (adminCount > 0) {
      return;
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
    return;
  }

  const passwordMatches = await bcrypt.compare(password, existing.passwordHash);
  if (!passwordMatches || existing.role !== "ADMIN" || existing.name !== name) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: passwordMatches
          ? existing.passwordHash
          : await bcrypt.hash(password, 12),
        role: "ADMIN",
        name,
      },
    });
  }
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
    redirect("/dashboard");
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

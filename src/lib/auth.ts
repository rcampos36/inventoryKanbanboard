import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { readSessionUser } from "@/lib/session";
import type { SessionUser } from "@/lib/session-types";
import { ensureOrganizations, PEARSON_ORG } from "@/lib/tenant";
import { boardPath } from "@/lib/paths";

export type { SessionUser };

/**
 * Ensures an administrator exists from ADMIN_EMAIL / ADMIN_PASSWORD
 * on the default Pearson Mazda organization.
 */
export async function ensureBootstrapAdmin() {
  await ensureOrganizations();

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
    const adminCount = await prisma.user.count({
      where: { organizationId: PEARSON_ORG.id, role: "ADMIN" },
    });
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
        organizationId: PEARSON_ORG.id,
      },
    });
    return;
  }

  const passwordMatches = await bcrypt.compare(password, existing.passwordHash);
  if (
    !passwordMatches ||
    existing.role !== "ADMIN" ||
    existing.name !== name ||
    existing.organizationId !== PEARSON_ORG.id
  ) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: passwordMatches
          ? existing.passwordHash
          : await bcrypt.hash(password, 12),
        role: "ADMIN",
        name,
        organizationId: PEARSON_ORG.id,
      },
    });
  }
}

/** Creates the Sunrise Honda demo admin if missing. */
export async function ensureSunriseDemoAdmin() {
  await ensureOrganizations();

  const email = "admin@sunrise.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await bcrypt.hash("sunrise123", 12);
  await prisma.user.create({
    data: {
      email,
      name: "Sunrise Admin",
      passwordHash,
      role: "ADMIN",
      organizationId: "org_sunrise_honda",
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
    redirect(boardPath(user.organizationSlug));
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

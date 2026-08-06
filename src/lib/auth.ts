import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { readSessionUser } from "@/lib/session";
import type { SessionUser } from "@/lib/session-types";
import { ensureOrganizations, PEARSON_ORG, PEARSON_ORG_ID } from "@/lib/tenant";
import { boardPath } from "@/lib/paths";
import { hasPlatformAccess } from "@/lib/platform-access";
import {
  DEFAULT_PLAN_ID,
  featureUpgradeHint,
  isPlanId,
  planHasFeature,
  type PlanFeature,
  type PlanId,
} from "@/lib/plans";

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

async function withFreshPlan(user: SessionUser): Promise<SessionUser> {
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { plan: true },
  });
  const plan: PlanId =
    org?.plan && isPlanId(org.plan) ? org.plan : DEFAULT_PLAN_ID;
  if (user.organizationPlan === plan) return user;
  return { ...user, organizationPlan: plan };
}

export async function requireUser(): Promise<SessionUser> {
  await ensureBootstrapAdmin();
  const user = await readSessionUser();
  if (!user) {
    redirect("/login");
  }
  return withFreshPlan(user);
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect(boardPath(user.organizationSlug));
  }
  return user;
}

/**
 * Platform (SalesTower) admin — password unlock + Pearson Mazda admin login.
 * Unauthenticated visitors are sent to login with a return URL to dealerships.
 */
export async function requirePlatformAdmin(): Promise<SessionUser> {
  if (!(await hasPlatformAccess())) {
    redirect("/platform");
  }

  await ensureBootstrapAdmin();
  const session = await readSessionUser();
  if (!session) {
    redirect("/login?next=/admin/dealerships");
  }

  const user = await withFreshPlan(session);
  if (user.role !== "ADMIN" || user.organizationId !== PEARSON_ORG_ID) {
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
  const user = await readSessionUser();
  if (!user) return null;
  return withFreshPlan(user);
}

/** Redirect away from gated pages when the org plan lacks a feature. */
export async function requirePlanFeature(
  feature: PlanFeature
): Promise<SessionUser> {
  const user = await requireUser();
  if (!planHasFeature(user.organizationPlan, feature)) {
    redirect(boardPath(user.organizationSlug));
  }
  return user;
}

/** For server actions: return an error message when the plan blocks a feature. */
export function planFeatureDenied(
  user: SessionUser,
  feature: PlanFeature
): string | null {
  if (planHasFeature(user.organizationPlan, feature)) return null;
  return featureUpgradeHint(feature);
}

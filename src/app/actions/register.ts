"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  getFranchiseBrandOptions,
  resolveFranchiseBrandKey,
} from "@/lib/data";
import {
  createSessionToken,
  setSessionCookie,
} from "@/lib/session";
import { uniqueSlug } from "@/lib/slug";
import { boardPath, isReservedPathSlug } from "@/lib/paths";
import { parsePlanId } from "@/lib/plans";
import { todayIsoDate } from "@/lib/types";
import type { AuthFormState } from "@/app/actions/auth";

function parseNameList(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function boardTitleFor(dealershipName: string): string {
  return `${dealershipName} Inventory and Sales Board`;
}

export async function registerDealerAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const dealershipName = String(formData.get("dealershipName") ?? "").trim();
  const brandRaw = String(formData.get("brand") ?? "").trim();
  const dealerNumber = String(formData.get("dealerNumber") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const adminName = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const salespersonNames = parseNameList(formData.get("salespeople"));
  const managerNames = parseNameList(formData.get("managers"));
  const plan = parsePlanId(formData.get("plan"));

  if (!dealershipName) {
    return { error: "Dealership name is required." };
  }
  if (!plan) {
    return { error: "Please select a subscription plan." };
  }
  if (!dealerNumber) {
    return { error: "Dealer number is required." };
  }
  if (!phone) {
    return { error: "Dealership phone is required." };
  }
  if (!addressLine1) {
    return { error: "Street address is required." };
  }
  if (!city) {
    return { error: "City is required." };
  }
  if (!state) {
    return { error: "State is required." };
  }
  if (!postalCode) {
    return { error: "ZIP code is required." };
  }
  if (!brandRaw) {
    return { error: "Franchise brand is required." };
  }
  const brandOptions = getFranchiseBrandOptions();
  const brandMatch = brandOptions.find(
    (option) => option.toLowerCase() === brandRaw.toLowerCase()
  );
  if (!brandMatch) {
    return { error: "Choose a supported franchise brand." };
  }
  const brand = resolveFranchiseBrandKey(brandMatch);

  if (!adminName) {
    return { error: "Your name is required." };
  }
  if (!email || !email.includes("@")) {
    return { error: "A valid work email is required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "An account with that email already exists. Sign in instead." };
  }

  const existingSlugs = await prisma.organization.findMany({
    select: { slug: true },
  });
  const usedSlugs = new Set(existingSlugs.map((row) => row.slug));
  for (const reserved of [
    "login",
    "register",
    "admin",
    "dashboard",
    "demo",
    "terms",
    "api",
  ]) {
    usedSlugs.add(reserved);
  }
  let slug = uniqueSlug(dealershipName, usedSlugs, "dealership");
  if (isReservedPathSlug(slug)) {
    usedSlugs.add(slug);
    slug = uniqueSlug(`${dealershipName}-motors`, usedSlugs, "dealership");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let organization: {
    org: {
      id: string;
      name: string;
      slug: string;
      brand: string;
      plan: typeof plan;
    };
    admin: {
      id: string;
      email: string;
      name: string;
      role: "ADMIN" | "USER";
    };
  };

  try {
    organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dealershipName,
          slug,
          brand,
          plan,
          planStatus: "trialing",
          dealerNumber,
          phone,
          addressLine1,
          addressLine2: addressLine2 || null,
          city,
          state,
          postalCode,
        },
      });

      await tx.appSettings.create({
        data: {
          organizationId: org.id,
          openSalesDay: todayIsoDate(),
          boardTitle: boardTitleFor(dealershipName),
        },
      });

      const admin = await tx.user.create({
        data: {
          organizationId: org.id,
          email,
          name: adminName,
          passwordHash,
          role: "ADMIN",
        },
      });

      const usedSpIds = new Set<string>();
      for (const [index, name] of salespersonNames.entries()) {
        const id = uniqueSlug(name, usedSpIds, "salesperson");
        usedSpIds.add(id);
        await tx.salesperson.create({
          data: {
            organizationId: org.id,
            id,
            name,
            position: index,
          },
        });
      }

      const usedMgrIds = new Set<string>();
      for (const [index, name] of managerNames.entries()) {
        const id = uniqueSlug(name, usedMgrIds, "manager");
        usedMgrIds.add(id);
        await tx.manager.create({
          data: {
            organizationId: org.id,
            id,
            name,
            position: index,
          },
        });
      }

      return { org, admin };
    });
  } catch (error) {
    console.error("Failed to register dealership", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not create the dealership. Please try again.",
    };
  }

  const token = await createSessionToken({
    id: organization.admin.id,
    email: organization.admin.email,
    name: organization.admin.name,
    role: organization.admin.role,
    organizationId: organization.org.id,
    organizationName: organization.org.name,
    organizationSlug: organization.org.slug,
    organizationBrand: organization.org.brand,
    organizationPlan: organization.org.plan,
  });
  await setSessionCookie(token);
  redirect(boardPath(organization.org.slug));
}

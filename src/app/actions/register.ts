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
  const adminName = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const salespersonNames = parseNameList(formData.get("salespeople"));
  const managerNames = parseNameList(formData.get("managers"));

  if (!dealershipName) {
    return { error: "Dealership name is required." };
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
  const slug = uniqueSlug(dealershipName, usedSlugs, "dealership");

  const passwordHash = await bcrypt.hash(password, 12);

  let organization: {
    org: { id: string; name: string; brand: string };
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
    organizationBrand: organization.org.brand,
  });
  await setSessionCookie(token);
  redirect("/dashboard");
}

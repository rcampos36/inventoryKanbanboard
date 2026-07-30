import { prisma } from "@/lib/db";
import { DEFAULT_BOARD_TITLE } from "@/lib/board";
import { todayIsoDate } from "@/lib/types";

export const PEARSON_ORG_ID = "org_pearson_mazda";
export const SUNRISE_ORG_ID = "org_sunrise_honda";

export const PEARSON_ORG = {
  id: PEARSON_ORG_ID,
  name: "Pearson Mazda",
  slug: "pearson-mazda",
  brand: "Mazda",
} as const;

export const SUNRISE_ORG = {
  id: SUNRISE_ORG_ID,
  name: "Sunrise Honda",
  slug: "sunrise-honda",
  brand: "Honda",
} as const;

async function ensureOrgSettings(
  organizationId: string,
  boardTitle: string
) {
  const existing = await prisma.appSettings.findUnique({
    where: { organizationId },
  });
  if (existing) return existing;

  return prisma.appSettings.create({
    data: {
      organizationId,
      openSalesDay: todayIsoDate(),
      boardTitle,
    },
  });
}

/** Ensures the built-in demo dealerships exist (idempotent). */
export async function ensureOrganizations() {
  await prisma.organization.upsert({
    where: { id: PEARSON_ORG.id },
    create: {
      id: PEARSON_ORG.id,
      name: PEARSON_ORG.name,
      slug: PEARSON_ORG.slug,
      brand: PEARSON_ORG.brand,
    },
    update: {
      name: PEARSON_ORG.name,
      slug: PEARSON_ORG.slug,
      brand: PEARSON_ORG.brand,
    },
  });

  await prisma.organization.upsert({
    where: { id: SUNRISE_ORG.id },
    create: {
      id: SUNRISE_ORG.id,
      name: SUNRISE_ORG.name,
      slug: SUNRISE_ORG.slug,
      brand: SUNRISE_ORG.brand,
    },
    update: {
      name: SUNRISE_ORG.name,
      slug: SUNRISE_ORG.slug,
      brand: SUNRISE_ORG.brand,
    },
  });

  await ensureOrgSettings(PEARSON_ORG.id, DEFAULT_BOARD_TITLE);
  await ensureOrgSettings(
    SUNRISE_ORG.id,
    "Sunrise Honda Inventory and Sales Board"
  );
}

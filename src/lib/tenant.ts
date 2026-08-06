import { prisma } from "@/lib/db";
import { DEFAULT_BOARD_TITLE } from "@/lib/board";
import { PEARSON_ORG_ID, SUNRISE_ORG_ID } from "@/lib/org-ids";
import {
  generateSubscriptionSerial,
  trialEndsAtFrom,
} from "@/lib/subscription-serial";
import { todayIsoDate } from "@/lib/types";

export { PEARSON_ORG_ID, SUNRISE_ORG_ID };

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

function builtInOrgCreateData(org: {
  id: string;
  name: string;
  slug: string;
  brand: string;
}) {
  const now = new Date();
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    brand: org.brand,
    planStatus: "active" as const,
    subscriptionSerial: generateSubscriptionSerial(),
    trialEndsAt: trialEndsAtFrom(now),
    serialActivatedAt: now,
  };
}

/** Ensures the built-in demo dealerships exist (idempotent). */
export async function ensureOrganizations() {
  await prisma.organization.upsert({
    where: { id: PEARSON_ORG.id },
    create: builtInOrgCreateData(PEARSON_ORG),
    update: {
      name: PEARSON_ORG.name,
      slug: PEARSON_ORG.slug,
      brand: PEARSON_ORG.brand,
      planStatus: "active",
    },
  });

  await prisma.organization.upsert({
    where: { id: SUNRISE_ORG.id },
    create: builtInOrgCreateData(SUNRISE_ORG),
    update: {
      name: SUNRISE_ORG.name,
      slug: SUNRISE_ORG.slug,
      brand: SUNRISE_ORG.brand,
      planStatus: "active",
    },
  });

  await ensureOrgSettings(PEARSON_ORG.id, DEFAULT_BOARD_TITLE);
  await ensureOrgSettings(
    SUNRISE_ORG.id,
    "Sunrise Honda Inventory and Sales Board"
  );
}

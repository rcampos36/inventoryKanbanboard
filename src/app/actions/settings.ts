"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { todayIsoDate } from "@/lib/types";

const SETTINGS_ID = "default";

export async function getOpenSalesDay(): Promise<string> {
  const existing = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_ID },
  });
  if (existing) return existing.openSalesDay;

  const today = todayIsoDate();
  const created = await prisma.appSettings.create({
    data: { id: SETTINGS_ID, openSalesDay: today },
  });
  return created.openSalesDay;
}

export async function setOpenSalesDayAction(
  openSalesDay: string
): Promise<string> {
  const row = await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, openSalesDay },
    update: { openSalesDay },
  });
  revalidatePath("/");
  return row.openSalesDay;
}

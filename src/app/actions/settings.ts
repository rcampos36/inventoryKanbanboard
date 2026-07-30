"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { DEFAULT_BOARD_TITLE } from "@/lib/board";
import { todayIsoDate } from "@/lib/types";

const SETTINGS_ID = "default";

export type BoardSettings = {
  openSalesDay: string;
  boardTitle: string;
};

async function ensureSettings() {
  const existing = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_ID },
  });
  if (existing) return existing;

  return prisma.appSettings.create({
    data: {
      id: SETTINGS_ID,
      openSalesDay: todayIsoDate(),
      boardTitle: DEFAULT_BOARD_TITLE,
    },
  });
}

export async function getBoardSettings(): Promise<BoardSettings> {
  await requireUser();
  const row = await ensureSettings();
  return {
    openSalesDay: row.openSalesDay,
    boardTitle: row.boardTitle?.trim() || DEFAULT_BOARD_TITLE,
  };
}

export async function getOpenSalesDay(): Promise<string> {
  const settings = await getBoardSettings();
  return settings.openSalesDay;
}

export async function setOpenSalesDayAction(
  openSalesDay: string
): Promise<string> {
  await requireUser();
  const row = await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      openSalesDay,
      boardTitle: DEFAULT_BOARD_TITLE,
    },
    update: { openSalesDay },
  });
  revalidatePath("/dashboard");
  return row.openSalesDay;
}

export async function setBoardTitleAction(boardTitle: string): Promise<string> {
  await requireUser();
  const title = boardTitle.trim() || DEFAULT_BOARD_TITLE;
  const existing = await ensureSettings();
  const row = await prisma.appSettings.update({
    where: { id: existing.id },
    data: { boardTitle: title },
  });
  revalidatePath("/dashboard");
  return row.boardTitle;
}

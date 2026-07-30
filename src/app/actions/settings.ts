"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { boardPath } from "@/lib/paths";
import { DEFAULT_BOARD_TITLE } from "@/lib/board";
import { todayIsoDate } from "@/lib/types";

export type BoardSettings = {
  openSalesDay: string;
  boardTitle: string;
};

async function ensureSettings(organizationId: string) {
  const existing = await prisma.appSettings.findUnique({
    where: { organizationId },
  });
  if (existing) return existing;

  return prisma.appSettings.create({
    data: {
      organizationId,
      openSalesDay: todayIsoDate(),
      boardTitle: DEFAULT_BOARD_TITLE,
    },
  });
}

export async function getBoardSettings(): Promise<BoardSettings> {
  const user = await requireUser();
  const row = await ensureSettings(user.organizationId);
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
  const user = await requireUser();
  const row = await prisma.appSettings.upsert({
    where: { organizationId: user.organizationId },
    create: {
      organizationId: user.organizationId,
      openSalesDay,
      boardTitle: DEFAULT_BOARD_TITLE,
    },
    update: { openSalesDay },
  });
  revalidatePath(boardPath(user.organizationSlug));
  return row.openSalesDay;
}

export async function setBoardTitleAction(boardTitle: string): Promise<string> {
  const user = await requireUser();
  const title = boardTitle.trim() || DEFAULT_BOARD_TITLE;
  await ensureSettings(user.organizationId);
  const row = await prisma.appSettings.update({
    where: { organizationId: user.organizationId },
    data: { boardTitle: title },
  });
  revalidatePath(boardPath(user.organizationSlug));
  return row.boardTitle;
}

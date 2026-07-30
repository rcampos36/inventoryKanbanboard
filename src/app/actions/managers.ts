"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { boardPath } from "@/lib/paths";
import { uniqueSlug } from "@/lib/slug";
import type { Manager } from "@/lib/types";

export async function listManagersAction(): Promise<Manager[]> {
  const user = await requireUser();
  const rows = await prisma.manager.findMany({
    where: { organizationId: user.organizationId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((row) => ({ id: row.id, name: row.name }));
}

export async function createManagerAction(
  name: string
): Promise<{ ok: true; manager: Manager } | { ok: false; error: string }> {
  const user = await requireUser();

  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Name is required." };
  }

  const existing = await prisma.manager.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true },
  });
  const used = new Set(existing.map((row) => row.id));
  const id = uniqueSlug(trimmed, used, "manager");

  const maxPosition = await prisma.manager.aggregate({
    where: { organizationId: user.organizationId },
    _max: { position: true },
  });
  const manager = await prisma.manager.create({
    data: {
      organizationId: user.organizationId,
      id,
      name: trimmed,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });

  revalidatePath(boardPath(user.organizationSlug));
  return { ok: true, manager: { id: manager.id, name: manager.name } };
}

export async function deleteManagerAction(
  managerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();

  const manager = await prisma.manager.findUnique({
    where: {
      organizationId_id: {
        organizationId: user.organizationId,
        id: managerId,
      },
    },
  });
  if (!manager) {
    return { ok: false, error: "Manager not found." };
  }

  const assignedCount = await prisma.car.count({
    where: {
      organizationId: user.organizationId,
      managerId,
    },
  });

  if (assignedCount > 0) {
    return {
      ok: false,
      error: `Move or clear ${assignedCount} vehicle${assignedCount === 1 ? "" : "s"} assigned to ${manager.name} first.`,
    };
  }

  await prisma.manager.delete({
    where: {
      organizationId_id: {
        organizationId: user.organizationId,
        id: managerId,
      },
    },
  });
  revalidatePath(boardPath(user.organizationSlug));
  return { ok: true };
}

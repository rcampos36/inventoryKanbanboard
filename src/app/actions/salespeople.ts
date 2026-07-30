"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { boardPath } from "@/lib/paths";
import { uniqueSlug } from "@/lib/slug";
import type { Salesperson } from "@/lib/types";

export async function listSalespeopleAction(): Promise<Salesperson[]> {
  const user = await requireUser();
  const rows = await prisma.salesperson.findMany({
    where: { organizationId: user.organizationId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((row) => ({ id: row.id, name: row.name }));
}

export async function createSalespersonAction(
  name: string
): Promise<{ ok: true; person: Salesperson } | { ok: false; error: string }> {
  const user = await requireUser();

  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Name is required." };
  }

  const existing = await prisma.salesperson.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true },
  });
  const used = new Set(existing.map((row) => row.id));
  const id = uniqueSlug(trimmed, used, "salesperson");

  const maxPosition = await prisma.salesperson.aggregate({
    where: { organizationId: user.organizationId },
    _max: { position: true },
  });
  const person = await prisma.salesperson.create({
    data: {
      organizationId: user.organizationId,
      id,
      name: trimmed,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });

  revalidatePath(boardPath(user.organizationSlug));
  return { ok: true, person: { id: person.id, name: person.name } };
}

export async function deleteSalespersonAction(
  salespersonId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();

  const person = await prisma.salesperson.findUnique({
    where: {
      organizationId_id: {
        organizationId: user.organizationId,
        id: salespersonId,
      },
    },
  });
  if (!person) {
    return { ok: false, error: "Salesperson not found." };
  }

  const assignedCount = await prisma.car.count({
    where: {
      organizationId: user.organizationId,
      OR: [
        { salespersonId },
        { coSalespersonId: salespersonId },
        { workingDealId: salespersonId },
        { overnightId: salespersonId },
      ],
    },
  });

  if (assignedCount > 0) {
    return {
      ok: false,
      error: `Move or clear ${assignedCount} vehicle${assignedCount === 1 ? "" : "s"} assigned to ${person.name} first.`,
    };
  }

  await prisma.salesperson.delete({
    where: {
      organizationId_id: {
        organizationId: user.organizationId,
        id: salespersonId,
      },
    },
  });
  revalidatePath(boardPath(user.organizationSlug));
  return { ok: true };
}

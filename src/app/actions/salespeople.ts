"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { DEFAULT_SALESPEOPLE } from "@/lib/data";
import type { Salesperson } from "@/lib/types";

function slugifyName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "salesperson";
}

async function ensureDefaultSalespeople() {
  const count = await prisma.salesperson.count();
  if (count > 0) return;

  await prisma.salesperson.createMany({
    data: DEFAULT_SALESPEOPLE.map((person, index) => ({
      id: person.id,
      name: person.name,
      position: index,
    })),
  });
}

export async function listSalespeopleAction(): Promise<Salesperson[]> {
  await requireUser();
  await ensureDefaultSalespeople();
  const rows = await prisma.salesperson.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((row) => ({ id: row.id, name: row.name }));
}

export async function createSalespersonAction(
  name: string
): Promise<{ ok: true; person: Salesperson } | { ok: false; error: string }> {
  await requireUser();
  await ensureDefaultSalespeople();

  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Name is required." };
  }

  const existing = await prisma.salesperson.findMany({ select: { id: true } });
  const used = new Set(existing.map((row) => row.id));
  let id = slugifyName(trimmed);
  if (used.has(id)) {
    let n = 2;
    while (used.has(`${id}-${n}`)) n += 1;
    id = `${id}-${n}`;
  }

  const maxPosition = await prisma.salesperson.aggregate({
    _max: { position: true },
  });
  const person = await prisma.salesperson.create({
    data: {
      id,
      name: trimmed,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });

  revalidatePath("/");
  return { ok: true, person: { id: person.id, name: person.name } };
}

export async function deleteSalespersonAction(
  salespersonId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireUser();

  const person = await prisma.salesperson.findUnique({
    where: { id: salespersonId },
  });
  if (!person) {
    return { ok: false, error: "Salesperson not found." };
  }

  const assignedCount = await prisma.car.count({
    where: {
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

  await prisma.salesperson.delete({ where: { id: salespersonId } });
  revalidatePath("/");
  return { ok: true };
}

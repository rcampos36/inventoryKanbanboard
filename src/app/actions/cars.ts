"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { toAppCar, toDbCarData } from "@/lib/car-mapper";
import { requireAdmin, requireUser } from "@/lib/auth";
import { boardPath } from "@/lib/paths";
import {
  eventsFromCarChange,
  recordBoardEvents,
  recordInventoryAdded,
} from "@/lib/board-events";
import { parseInventoryFile } from "@/lib/inventory-import";
import { todayIsoDate, type Car } from "@/lib/types";

/** Pull any future-dated sales back to today (End day used to stamp tomorrow). */
async function clampFutureSaleDates(organizationId: string): Promise<void> {
  const today = todayIsoDate();
  await prisma.car.updateMany({
    where: {
      organizationId,
      soldAt: { gt: today },
    },
    data: { soldAt: today },
  });
  await prisma.boardEvent.updateMany({
    where: {
      organizationId,
      type: "sale",
      occurredAt: { gt: today },
    },
    data: {
      occurredAt: today,
      monthKey: today.slice(0, 7),
    },
  });
}

export async function getCars(): Promise<Car[]> {
  const user = await requireUser();
  await clampFutureSaleDates(user.organizationId);
  const rows = await prisma.car.findMany({
    where: { organizationId: user.organizationId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toAppCar);
}

export async function createCarAction(
  input: Omit<Car, "id">
): Promise<Car> {
  const user = await requireUser();
  const maxPosition = await prisma.car.aggregate({
    where: {
      organizationId: user.organizationId,
      columnId: input.columnId,
    },
    _max: { position: true },
  });
  const position = (maxPosition._max.position ?? -1) + 1;

  const row = await prisma.car.create({
    data: {
      ...toDbCarData({ ...input, id: "temp" }),
      organizationId: user.organizationId,
      position,
    },
  });

  await recordInventoryAdded(user.organizationId, row);
  revalidatePath(boardPath(user.organizationSlug));
  return toAppCar(row);
}

export async function updateCarAction(car: Car): Promise<Car> {
  const user = await requireUser();
  const owned = await prisma.car.findFirst({
    where: { id: car.id, organizationId: user.organizationId },
  });
  if (!owned) {
    throw new Error("Vehicle not found.");
  }

  const events = eventsFromCarChange(user.organizationId, owned, car);
  const row = await prisma.car.update({
    where: { id: car.id },
    data: toDbCarData(car),
  });
  await recordBoardEvents(events);
  revalidatePath(boardPath(user.organizationSlug));
  return toAppCar(row);
}

export async function updateCarsAction(cars: Car[]): Promise<void> {
  const user = await requireUser();
  const ids = cars.map((car) => car.id);
  const owned = await prisma.car.findMany({
    where: {
      organizationId: user.organizationId,
      id: { in: ids },
    },
  });
  const ownedById = new Map(owned.map((row) => [row.id, row]));
  if (ownedById.size !== ids.length) {
    throw new Error("One or more vehicles were not found.");
  }

  const events = cars.flatMap((car) => {
    const previous = ownedById.get(car.id);
    if (!previous) return [];
    return eventsFromCarChange(user.organizationId, previous, car);
  });

  await prisma.$transaction(
    cars.map((car, index) =>
      prisma.car.update({
        where: { id: car.id },
        data: {
          ...toDbCarData(car),
          position: index,
        },
      })
    )
  );
  await recordBoardEvents(events);
  revalidatePath(boardPath(user.organizationSlug));
}

export async function clearAllCarsAction(): Promise<number> {
  const user = await requireAdmin();
  const result = await prisma.car.deleteMany({
    where: { organizationId: user.organizationId },
  });
  revalidatePath(boardPath(user.organizationSlug));
  return result.count;
}

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export type ImportInventoryResult =
  | {
      ok: true;
      added: number;
      skippedDuplicates: number;
      skippedInvalid: number;
      cars: Car[];
      warnings: string[];
    }
  | { ok: false; error: string };

/** Import vehicles from an uploaded .xls / .xlsx / .csv into the current org. */
export async function importInventoryAction(
  formData: FormData
): Promise<ImportInventoryResult> {
  const user = await requireUser();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { ok: false, error: "Choose a .csv, .xls, or .xlsx file." };
  }
  if (file.size <= 0) {
    return { ok: false, error: "The selected file is empty." };
  }
  if (file.size > MAX_IMPORT_BYTES) {
    return { ok: false, error: "File is too large (max 5 MB)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseInventoryFile(
    buffer,
    file.name,
    user.organizationBrand
  );

  if (parsed.rows.length === 0) {
    return {
      ok: false,
      error:
        parsed.warnings[0] ??
        "No vehicles could be read from that file. Include Stock # and Vehicle, or Year/Make/Model columns.",
    };
  }

  const existing = await prisma.car.findMany({
    where: {
      organizationId: user.organizationId,
      stockNumber: { in: parsed.rows.map((row) => row.stockNumber) },
    },
    select: { stockNumber: true },
  });
  const existingStocks = new Set(
    existing.map((row) => row.stockNumber.toLowerCase())
  );

  const toCreate = parsed.rows.filter(
    (row) => !existingStocks.has(row.stockNumber.toLowerCase())
  );
  const skippedDuplicates = parsed.rows.length - toCreate.length;

  if (toCreate.length === 0) {
    return {
      ok: true,
      added: 0,
      skippedDuplicates,
      skippedInvalid: parsed.skippedInvalid,
      cars: [],
      warnings: [
        ...parsed.warnings,
        "Every stock number in the file already exists on this board.",
      ].slice(0, 25),
    };
  }

  const positionBase = await prisma.car.aggregate({
    where: { organizationId: user.organizationId },
    _max: { position: true },
  });
  let position = (positionBase._max.position ?? -1) + 1;

  const createdCars: Car[] = [];
  for (const row of toCreate) {
    const created = await prisma.car.create({
      data: {
        organizationId: user.organizationId,
        stockNumber: row.stockNumber,
        year: row.year,
        make: row.make,
        model: row.model,
        trim: row.trim,
        condition: row.condition,
        columnId: row.columnId,
        exteriorColor: row.exteriorColor ?? null,
        price: row.price ?? null,
        position,
      },
    });
    position += 1;
    await recordInventoryAdded(user.organizationId, created);
    createdCars.push(toAppCar(created));
  }

  revalidatePath(boardPath(user.organizationSlug));
  return {
    ok: true,
    added: createdCars.length,
    skippedDuplicates,
    skippedInvalid: parsed.skippedInvalid,
    cars: createdCars,
    warnings: parsed.warnings,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { toAppCar, toDbCarData } from "@/lib/car-mapper";
import { requireUser } from "@/lib/auth";
import { boardPath } from "@/lib/paths";
import {
  eventsFromCarChange,
  recordBoardEvents,
  recordInventoryAdded,
} from "@/lib/board-events";
import type { Car } from "@/lib/types";

export async function getCars(): Promise<Car[]> {
  const user = await requireUser();
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
  const user = await requireUser();
  const result = await prisma.car.deleteMany({
    where: { organizationId: user.organizationId },
  });
  revalidatePath(boardPath(user.organizationSlug));
  return result.count;
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { toAppCar, toDbCarData } from "@/lib/car-mapper";
import { requireUser } from "@/lib/auth";
import type { Car } from "@/lib/types";

export async function getCars(): Promise<Car[]> {
  await requireUser();
  const rows = await prisma.car.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toAppCar);
}

export async function createCarAction(
  input: Omit<Car, "id">
): Promise<Car> {
  await requireUser();
  const maxPosition = await prisma.car.aggregate({
    where: { columnId: input.columnId },
    _max: { position: true },
  });
  const position = (maxPosition._max.position ?? -1) + 1;

  const row = await prisma.car.create({
    data: {
      ...toDbCarData({ ...input, id: "temp" }),
      position,
    },
  });

  revalidatePath("/dashboard");
  return toAppCar(row);
}

export async function updateCarAction(car: Car): Promise<Car> {
  await requireUser();
  const row = await prisma.car.update({
    where: { id: car.id },
    data: toDbCarData(car),
  });
  revalidatePath("/dashboard");
  return toAppCar(row);
}

export async function updateCarsAction(cars: Car[]): Promise<void> {
  await requireUser();
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
  revalidatePath("/dashboard");
}

export async function clearAllCarsAction(): Promise<number> {
  await requireUser();
  const result = await prisma.car.deleteMany({});
  revalidatePath("/dashboard");
  return result.count;
}

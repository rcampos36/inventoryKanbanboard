"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { toAppCar, toDbCarData } from "@/lib/car-mapper";
import type { Car } from "@/lib/types";

export async function getCars(): Promise<Car[]> {
  const rows = await prisma.car.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toAppCar);
}

export async function createCarAction(
  input: Omit<Car, "id">
): Promise<Car> {
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

  revalidatePath("/");
  return toAppCar(row);
}

export async function updateCarAction(car: Car): Promise<Car> {
  const row = await prisma.car.update({
    where: { id: car.id },
    data: toDbCarData(car),
  });
  revalidatePath("/");
  return toAppCar(row);
}

export async function updateCarsAction(cars: Car[]): Promise<void> {
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
  revalidatePath("/");
}

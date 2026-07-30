import { prisma } from "@/lib/db";
import { monthKeyFromDate, todayIsoDate, type Car } from "@/lib/types";
import type { Car as DbCar } from "@/generated/prisma/client";

export type BoardEventType =
  | "sale"
  | "sale_reversed"
  | "inventory_added"
  | "inventory_moved";

type EventInput = {
  organizationId: string;
  type: BoardEventType;
  occurredAt?: string;
  carId?: string | null;
  stockNumber?: string | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  condition?: string | null;
  fromColumnId?: string | null;
  toColumnId?: string | null;
  salespersonId?: string | null;
  coSalespersonId?: string | null;
  price?: number | null;
};

function snapshotFromAppCar(car: Car) {
  return {
    carId: car.id,
    stockNumber: car.stockNumber,
    make: car.make,
    model: car.model,
    trim: car.trim,
    condition: car.condition,
    price: car.price ?? null,
    salespersonId: car.salespersonId ?? null,
    coSalespersonId: car.coSalespersonId ?? null,
  };
}

function snapshotFromDbCar(car: DbCar) {
  return {
    carId: car.id,
    stockNumber: car.stockNumber,
    make: car.make,
    model: car.model,
    trim: car.trim,
    condition: car.condition,
    price: car.price ?? null,
    salespersonId: car.salespersonId ?? null,
    coSalespersonId: car.coSalespersonId ?? null,
  };
}

export async function recordBoardEvent(input: EventInput) {
  const occurredAt = input.occurredAt ?? todayIsoDate();
  await prisma.boardEvent.create({
    data: {
      organizationId: input.organizationId,
      type: input.type,
      occurredAt,
      monthKey: monthKeyFromDate(occurredAt),
      carId: input.carId ?? null,
      stockNumber: input.stockNumber ?? null,
      make: input.make ?? null,
      model: input.model ?? null,
      trim: input.trim ?? null,
      condition: input.condition ?? null,
      fromColumnId: input.fromColumnId ?? null,
      toColumnId: input.toColumnId ?? null,
      salespersonId: input.salespersonId ?? null,
      coSalespersonId: input.coSalespersonId ?? null,
      price: input.price ?? null,
    },
  });
}

export async function recordBoardEvents(inputs: EventInput[]) {
  if (inputs.length === 0) return;
  await prisma.boardEvent.createMany({
    data: inputs.map((input) => {
      const occurredAt = input.occurredAt ?? todayIsoDate();
      return {
        organizationId: input.organizationId,
        type: input.type,
        occurredAt,
        monthKey: monthKeyFromDate(occurredAt),
        carId: input.carId ?? null,
        stockNumber: input.stockNumber ?? null,
        make: input.make ?? null,
        model: input.model ?? null,
        trim: input.trim ?? null,
        condition: input.condition ?? null,
        fromColumnId: input.fromColumnId ?? null,
        toColumnId: input.toColumnId ?? null,
        salespersonId: input.salespersonId ?? null,
        coSalespersonId: input.coSalespersonId ?? null,
        price: input.price ?? null,
      };
    }),
  });
}

function locationKey(car: {
  columnId: string;
  salespersonId?: string | null;
  coSalespersonId?: string | null;
  workingDealId?: string | null;
  managerId?: string | null;
  overnightId?: string | null;
}): string {
  if (car.salespersonId) {
    return `sold:${car.salespersonId}:${car.coSalespersonId ?? ""}`;
  }
  if (car.workingDealId) return `wd:${car.workingDealId}`;
  if (car.managerId) return `mgr:${car.managerId}`;
  if (car.overnightId) return `ond:${car.overnightId}`;
  return `col:${car.columnId}`;
}

/** Diff previous DB car vs next app car and emit report events. */
export function eventsFromCarChange(
  organizationId: string,
  previous: DbCar,
  next: Car
): EventInput[] {
  const events: EventInput[] = [];
  const wasSold = Boolean(previous.salespersonId);
  const isSold = Boolean(next.salespersonId);
  const snap = snapshotFromAppCar(next);

  if (!wasSold && isSold) {
    events.push({
      organizationId,
      type: "sale",
      occurredAt: next.soldAt ?? todayIsoDate(),
      ...snap,
      fromColumnId: previous.columnId,
      toColumnId: "sold",
      salespersonId: next.salespersonId,
      coSalespersonId: next.coSalespersonId ?? null,
    });
  } else if (wasSold && !isSold) {
    events.push({
      organizationId,
      type: "sale_reversed",
      occurredAt: todayIsoDate(),
      ...snapshotFromDbCar(previous),
      fromColumnId: "sold",
      toColumnId: next.columnId,
    });
  } else if (
    wasSold &&
    isSold &&
    (previous.salespersonId !== next.salespersonId ||
      previous.coSalespersonId !== (next.coSalespersonId ?? null))
  ) {
    events.push({
      organizationId,
      type: "sale_reversed",
      occurredAt: previous.soldAt ?? todayIsoDate(),
      ...snapshotFromDbCar(previous),
      fromColumnId: "sold",
      toColumnId: "sold",
    });
    events.push({
      organizationId,
      type: "sale",
      occurredAt: next.soldAt ?? previous.soldAt ?? todayIsoDate(),
      ...snap,
      fromColumnId: "sold",
      toColumnId: "sold",
      salespersonId: next.salespersonId,
      coSalespersonId: next.coSalespersonId ?? null,
    });
  }

  if (locationKey(previous) !== locationKey(next)) {
    events.push({
      organizationId,
      type: "inventory_moved",
      occurredAt:
        !wasSold && isSold
          ? (next.soldAt ?? todayIsoDate())
          : todayIsoDate(),
      ...snap,
      fromColumnId: previous.columnId,
      toColumnId: isSold ? "sold" : next.columnId,
      salespersonId: next.salespersonId ?? null,
      coSalespersonId: next.coSalespersonId ?? null,
    });
  }

  return events;
}

export async function recordInventoryAdded(
  organizationId: string,
  car: DbCar
) {
  await recordBoardEvent({
    organizationId,
    type: "inventory_added",
    ...snapshotFromDbCar(car),
    toColumnId: car.columnId,
  });
}

import type { Car as DbCar } from "@/generated/prisma/client";
import { clampSaleDate, type Car, type CarCondition } from "@/lib/types";

export function toAppCar(row: DbCar): Car {
  return {
    id: row.id,
    stockNumber: row.stockNumber,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim,
    condition: row.condition as CarCondition,
    columnId: row.columnId,
    salespersonId: row.salespersonId ?? undefined,
    coSalespersonId: row.coSalespersonId ?? undefined,
    soldAt: row.soldAt ? clampSaleDate(row.soldAt) : undefined,
    managerId: row.managerId ?? undefined,
    workingDealId: row.workingDealId ?? undefined,
    overnightId: row.overnightId ?? undefined,
    outDate: row.outDate ?? undefined,
    returnDate: row.returnDate ?? undefined,
    tagNumber: row.tagNumber ?? undefined,
    homeColumnId: row.homeColumnId ?? undefined,
    exteriorColor: row.exteriorColor ?? undefined,
    note: row.note ?? undefined,
    price: row.price ?? undefined,
  };
}

export function toDbCarData(car: Car) {
  return {
    stockNumber: car.stockNumber,
    year: car.year,
    make: car.make,
    model: car.model,
    trim: car.trim,
    condition: car.condition,
    columnId: car.columnId,
    salespersonId: car.salespersonId ?? null,
    coSalespersonId: car.coSalespersonId ?? null,
    soldAt: car.soldAt ? clampSaleDate(car.soldAt) : null,
    managerId: car.managerId ?? null,
    workingDealId: car.workingDealId ?? null,
    overnightId: car.overnightId ?? null,
    outDate: car.outDate ?? null,
    returnDate: car.returnDate ?? null,
    tagNumber: car.tagNumber ?? null,
    homeColumnId: car.homeColumnId ?? null,
    exteriorColor: car.exteriorColor ?? null,
    note: car.note ?? null,
    price: car.price ?? null,
  };
}

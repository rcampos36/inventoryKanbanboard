import { MODEL_COLUMNS, COLUMNS } from "@/lib/data";
import {
  todayIsoDate,
  type Car,
  type CarCondition,
} from "@/lib/types";

/** Pick inventory column from make + model + condition (new by model, used by brand). */
export function suggestInventoryColumnId(
  make: string,
  model: string,
  condition: CarCondition
): string {
  const normalizedMake = make.trim().toLowerCase();
  const normalizedModel = model.trim().toLowerCase();

  if (normalizedMake === "mazda" && condition === "new") {
    // Soft-top and RF share the MX-5 Miata board column.
    if (normalizedModel.startsWith("mx-5 miata")) return "mx-5-miata";

    const match = MODEL_COLUMNS.find(
      (col) =>
        !col.id.startsWith("used-") &&
        col.title.toLowerCase() === normalizedModel
    );
    if (match) return match.id;
    return "cx-5";
  }

  if (normalizedMake === "mazda") return "used-mazda";
  return "used-other";
}

/** Home inventory lane for returning an overnight demo. */
export function resolveOvernightHomeColumnId(car: Car): string {
  if (
    car.homeColumnId &&
    COLUMNS.some((column) => column.id === car.homeColumnId)
  ) {
    return car.homeColumnId;
  }
  return suggestInventoryColumnId(car.make, car.model, car.condition);
}

export type OvernightDueStatus = "ok" | "due" | "overdue";

export function overnightDueStatus(
  returnDate: string | undefined,
  today: string = todayIsoDate()
): OvernightDueStatus {
  if (!returnDate) return "ok";
  if (returnDate < today) return "overdue";
  if (returnDate === today) return "due";
  return "ok";
}

export function columnTitle(columnId: string): string {
  return COLUMNS.find((column) => column.id === columnId)?.title ?? columnId;
}

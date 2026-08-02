import {
  getColumns,
  getModelColumns,
  getNewModelColumns,
  getUsedColumns,
  normalizeFranchiseBrand,
  USED_COLUMN_IDS,
} from "@/lib/data";
import {
  todayIsoDate,
  type Car,
  type CarCondition,
} from "@/lib/types";

/** Pick inventory column from make + model + condition for a franchise brand. */
export function suggestInventoryColumnId(
  make: string,
  model: string,
  condition: CarCondition,
  franchiseBrand: string = "Mazda"
): string {
  const brand = normalizeFranchiseBrand(franchiseBrand);
  const normalizedMake = make.trim().toLowerCase();
  const normalizedModel = model.trim().toLowerCase();
  const newColumns = getNewModelColumns(brand);
  const usedColumns = getUsedColumns(brand);
  const franchiseUsedId =
    usedColumns.find((col) => col.id !== USED_COLUMN_IDS.other)?.id ??
    USED_COLUMN_IDS.other;

  if (condition === "new" && normalizedMake === brand.toLowerCase()) {
    if (brand === "Mazda" && normalizedModel.startsWith("mx-5 miata")) {
      return "mx-5-miata";
    }
    if (brand === "Honda") {
      if (normalizedModel === "civic" || normalizedModel.startsWith("civic sedan")) {
        return "civic-sedan";
      }
      if (normalizedModel.startsWith("civic hatch")) return "civic-hatchback";
      if (normalizedModel === "cr-v hybrid" || normalizedModel.startsWith("cr-v hybrid")) {
        return "cr-v-hybrid";
      }
    }

    // Prefer longest title so "CX-70 PHEV" wins over "CX-70".
    const match = [...newColumns]
      .sort((a, b) => b.title.length - a.title.length)
      .find((col) => {
        const title = col.title.toLowerCase();
        return (
          normalizedModel === title ||
          normalizedModel.startsWith(`${title} `) ||
          normalizedModel.startsWith(title)
        );
      });
    if (match) return match.id;
    return newColumns[0]?.id ?? franchiseUsedId;
  }

  if (normalizedMake === brand.toLowerCase()) return franchiseUsedId;
  return USED_COLUMN_IDS.other;
}

/** Home inventory lane for returning an overnight demo. */
export function resolveOvernightHomeColumnId(
  car: Car,
  franchiseBrand: string = "Mazda"
): string {
  const columns = getColumns(franchiseBrand);
  if (
    car.homeColumnId &&
    columns.some((column) => column.id === car.homeColumnId)
  ) {
    return car.homeColumnId;
  }
  return suggestInventoryColumnId(
    car.make,
    car.model,
    car.condition,
    franchiseBrand
  );
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

export function columnTitle(
  columnId: string,
  franchiseBrand: string = "Mazda"
): string {
  return (
    getColumns(franchiseBrand).find((column) => column.id === columnId)?.title ??
    getModelColumns(franchiseBrand).find((column) => column.id === columnId)
      ?.title ??
    columnId
  );
}

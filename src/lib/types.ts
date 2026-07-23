export type CarCondition = "new" | "used";

export interface Car {
  id: string;
  stockNumber: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  condition: CarCondition;
  columnId: string;
  /** Set when the car has been sold and assigned to a salesperson. */
  salespersonId?: string;
  /** Second salesperson when the deal is split 50/50. */
  coSalespersonId?: string;
  /** ISO date (YYYY-MM-DD) when the car was sold / assigned to sales. */
  soldAt?: string;
  /** Set when the car is assigned as a manager demo. */
  managerId?: string;
  /** Set when the car is assigned as a team overnight demo. */
  overnightId?: string;
  /** ISO date (YYYY-MM-DD) when the car went out on overnight demo. */
  outDate?: string;
  /** ISO date (YYYY-MM-DD) when the car is due / comes back from overnight. */
  returnDate?: string;
  /** Dealer tag number used while the car is on overnight demo. */
  tagNumber?: string;
  price?: number;
}

export interface Column {
  id: string;
  title: string;
}

export interface Salesperson {
  id: string;
  name: string;
}

export interface Manager {
  id: string;
  name: string;
}

/** Prefix used to distinguish salesperson drop containers from stage columns. */
export const SALESPERSON_PREFIX = "sp-";
/** Prefix used to distinguish manager-demo drop containers. */
export const MANAGER_PREFIX = "mgr-";
/** Prefix used to distinguish overnight-demo drop containers. */
export const OVERNIGHT_PREFIX = "ond-";

export function salespersonContainerId(salespersonId: string): string {
  return `${SALESPERSON_PREFIX}${salespersonId}`;
}

export function managerContainerId(managerId: string): string {
  return `${MANAGER_PREFIX}${managerId}`;
}

export function overnightContainerId(overnightId: string): string {
  return `${OVERNIGHT_PREFIX}${overnightId}`;
}

export function isSalespersonContainer(containerId: string): boolean {
  return containerId.startsWith(SALESPERSON_PREFIX);
}

export function isManagerContainer(containerId: string): boolean {
  return containerId.startsWith(MANAGER_PREFIX);
}

export function isOvernightContainer(containerId: string): boolean {
  return containerId.startsWith(OVERNIGHT_PREFIX);
}

/**
 * Resolves the car field updates for a given drop container.
 * - Salesperson lane → sold + assigned
 * - Manager lane → manager demo assignment
 * - Overnight lane → team overnight demo assignment
 * - Inventory column → clears all assignments
 */
export function containerToLocation(containerId: string): {
  columnId: string;
  salespersonId?: string;
  managerId?: string;
  overnightId?: string;
} {
  if (isSalespersonContainer(containerId)) {
    return {
      columnId: "sold",
      salespersonId: containerId.slice(SALESPERSON_PREFIX.length),
      managerId: undefined,
      overnightId: undefined,
    };
  }
  if (isManagerContainer(containerId)) {
    return {
      columnId: "manager-demo",
      managerId: containerId.slice(MANAGER_PREFIX.length),
      salespersonId: undefined,
      overnightId: undefined,
    };
  }
  if (isOvernightContainer(containerId)) {
    return {
      columnId: "overnight-demo",
      overnightId: containerId.slice(OVERNIGHT_PREFIX.length),
      salespersonId: undefined,
      managerId: undefined,
    };
  }
  return {
    columnId: containerId,
    salespersonId: undefined,
    managerId: undefined,
    overnightId: undefined,
  };
}

export function carContainerId(car: Car): string {
  if (car.salespersonId) return salespersonContainerId(car.salespersonId);
  if (car.managerId) return managerContainerId(car.managerId);
  if (car.overnightId) return overnightContainerId(car.overnightId);
  return car.columnId;
}

/** Today's date as YYYY-MM-DD. */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Tomorrow's date as YYYY-MM-DD. */
export function tomorrowIsoDate(): string {
  return addDaysIsoDate(todayIsoDate(), 1);
}

/** Add (or subtract) days from an ISO date string. */
export function addDaysIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** Overnight demo lanes need going-out / coming-back dates. */
export function needsCheckoutDates(containerId: string): boolean {
  return isOvernightContainer(containerId);
}

export function isCheckoutAssignment(car: Car): boolean {
  return Boolean(car.overnightId);
}

export type CheckoutDates = {
  outDate: string;
  returnDate: string;
  tagNumber: string;
};

/** Apply a drop-container location onto a car, managing sold/checkout dates. */
export function applyContainerLocation(
  car: Car,
  containerId: string,
  checkoutDates?: CheckoutDates,
  saleDate?: string
): Car {
  const location = containerToLocation(containerId);
  const next: Car = { ...car, ...location };
  const wasSold = Boolean(car.salespersonId);
  const isSold = Boolean(location.salespersonId);
  const wasCheckout = isCheckoutAssignment(car);
  const isCheckout = needsCheckoutDates(containerId);

  if (isSold) {
    // Newly sold: use the active sales day (or today). Keep date on reassignment.
    next.soldAt = wasSold
      ? (car.soldAt ?? saleDate ?? todayIsoDate())
      : (saleDate ?? todayIsoDate());
    // Full-deal assign clears any prior half-deal partner.
    next.coSalespersonId = undefined;
  } else {
    next.soldAt = undefined;
    next.coSalespersonId = undefined;
  }

  if (isCheckout) {
    next.outDate =
      checkoutDates?.outDate ??
      (wasCheckout ? car.outDate : undefined) ??
      todayIsoDate();
    next.returnDate =
      checkoutDates?.returnDate ??
      (wasCheckout ? car.returnDate : undefined) ??
      tomorrowIsoDate();
    next.tagNumber =
      checkoutDates?.tagNumber ??
      (wasCheckout ? car.tagNumber : undefined) ??
      "";
  } else {
    next.outDate = undefined;
    next.returnDate = undefined;
    next.tagNumber = undefined;
  }

  return next;
}

export function isCarSold(car: Car): boolean {
  return Boolean(car.salespersonId) || car.columnId === "sold";
}

export function isHalfDeal(car: Car): boolean {
  return Boolean(car.salespersonId && car.coSalespersonId);
}

export function carInvolvesSalesperson(
  car: Car,
  salespersonId: string
): boolean {
  return (
    car.salespersonId === salespersonId || car.coSalespersonId === salespersonId
  );
}

/** Credit toward a salesperson's tally (1 full, 0.5 half). */
export function saleCreditFor(car: Car, salespersonId: string): number {
  if (!carInvolvesSalesperson(car, salespersonId)) return 0;
  return isHalfDeal(car) ? 0.5 : 1;
}

export function formatSaleCount(count: number): string {
  return Number.isInteger(count) ? String(count) : count.toFixed(1);
}

/** Apply a 50/50 half deal between two salespeople. */
export function applyHalfDeal(
  car: Car,
  primaryId: string,
  partnerId: string,
  saleDate?: string
): Car {
  if (primaryId === partnerId) {
    return applyContainerLocation(
      car,
      salespersonContainerId(primaryId),
      undefined,
      saleDate
    );
  }
  const wasSold = Boolean(car.salespersonId);
  return {
    ...car,
    columnId: "sold",
    salespersonId: primaryId,
    coSalespersonId: partnerId,
    managerId: undefined,
    overnightId: undefined,
    outDate: undefined,
    returnDate: undefined,
    tagNumber: undefined,
    soldAt: wasSold
      ? (car.soldAt ?? saleDate ?? todayIsoDate())
      : (saleDate ?? todayIsoDate()),
  };
}

export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** YYYY-MM key from an ISO date string. */
export function monthKeyFromDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function currentMonthKey(): string {
  return monthKeyFromDate(todayIsoDate());
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

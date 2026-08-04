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
  /** Set when the car is in a salesperson's working (not-yet-closed) deal lane. */
  workingDealId?: string;
  /** Set when the car is assigned as a team overnight demo. */
  overnightId?: string;
  /** ISO date (YYYY-MM-DD) when the car went out on overnight demo. */
  outDate?: string;
  /** ISO date (YYYY-MM-DD) when the car is due / comes back from overnight. */
  returnDate?: string;
  /** Dealer tag number used while the car is on overnight demo. */
  tagNumber?: string;
  /** Inventory column to restore when the overnight demo is returned. */
  homeColumnId?: string;
  /** Exterior paint / body color name of the vehicle. */
  exteriorColor?: string;
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
/** Prefix used to distinguish working-deal drop containers. */
export const WORKING_DEAL_PREFIX = "wd-";
/** Prefix used to distinguish manager-demo drop containers. */
export const MANAGER_PREFIX = "mgr-";
/** Prefix used to distinguish overnight-demo drop containers. */
export const OVERNIGHT_PREFIX = "ond-";

export function salespersonContainerId(salespersonId: string): string {
  return `${SALESPERSON_PREFIX}${salespersonId}`;
}

export function workingDealContainerId(salespersonId: string): string {
  return `${WORKING_DEAL_PREFIX}${salespersonId}`;
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

export function isWorkingDealContainer(containerId: string): boolean {
  return containerId.startsWith(WORKING_DEAL_PREFIX);
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
 * - Working-deal lane → in-progress deal (not sold yet)
 * - Manager lane → manager demo assignment
 * - Overnight lane → team overnight demo assignment
 * - Inventory column → clears all assignments
 */
export function containerToLocation(containerId: string): {
  columnId: string;
  salespersonId?: string;
  workingDealId?: string;
  managerId?: string;
  overnightId?: string;
} {
  if (isSalespersonContainer(containerId)) {
    return {
      columnId: "sold",
      salespersonId: containerId.slice(SALESPERSON_PREFIX.length),
      workingDealId: undefined,
      managerId: undefined,
      overnightId: undefined,
    };
  }
  if (isWorkingDealContainer(containerId)) {
    return {
      columnId: "working-deal",
      workingDealId: containerId.slice(WORKING_DEAL_PREFIX.length),
      salespersonId: undefined,
      managerId: undefined,
      overnightId: undefined,
    };
  }
  if (isManagerContainer(containerId)) {
    return {
      columnId: "manager-demo",
      managerId: containerId.slice(MANAGER_PREFIX.length),
      salespersonId: undefined,
      workingDealId: undefined,
      overnightId: undefined,
    };
  }
  if (isOvernightContainer(containerId)) {
    return {
      columnId: "overnight-demo",
      overnightId: containerId.slice(OVERNIGHT_PREFIX.length),
      salespersonId: undefined,
      workingDealId: undefined,
      managerId: undefined,
    };
  }
  return {
    columnId: containerId,
    salespersonId: undefined,
    workingDealId: undefined,
    managerId: undefined,
    overnightId: undefined,
  };
}

export function carContainerId(car: Car): string {
  if (car.salespersonId) return salespersonContainerId(car.salespersonId);
  if (car.workingDealId) return workingDealContainerId(car.workingDealId);
  if (car.managerId) return managerContainerId(car.managerId);
  if (car.overnightId) return overnightContainerId(car.overnightId);
  return car.columnId;
}

/** Today's date as YYYY-MM-DD in the local timezone. */
export function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Clamp a sale date so it is never after `asOf` (defaults to today). */
export function clampSaleDate(
  isoDate?: string | null,
  asOf: string = todayIsoDate()
): string {
  if (!isoDate) return asOf;
  return isoDate > asOf ? asOf : isoDate;
}

/** Milliseconds until the next local midnight (with a small buffer). */
export function msUntilNextLocalMidnight(now = new Date()): number {
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );
  return Math.max(0, next.getTime() - now.getTime());
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

export function isWorkingDeal(car: Car): boolean {
  return Boolean(car.workingDealId) || car.columnId === "working-deal";
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
  saleDate?: string,
  asOf?: string
): Car {
  const location = containerToLocation(containerId);
  const next: Car = { ...car, ...location };
  const wasSold = Boolean(car.salespersonId);
  const isSold = Boolean(location.salespersonId);
  const wasCheckout = isCheckoutAssignment(car);
  const isCheckout = needsCheckoutDates(containerId);

  if (isSold) {
    // Newly sold: use the active sales day (or today). Never stamp past `asOf`.
    const stamp = clampSaleDate(saleDate, asOf);
    next.soldAt = wasSold
      ? car.soldAt
        ? clampSaleDate(car.soldAt, asOf)
        : stamp
      : stamp;
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
    if (!wasCheckout) {
      const isInventoryHome =
        !car.salespersonId &&
        !car.workingDealId &&
        !car.managerId &&
        !car.overnightId &&
        car.columnId !== "sold" &&
        car.columnId !== "working-deal" &&
        car.columnId !== "manager-demo" &&
        car.columnId !== "overnight-demo";
      next.homeColumnId = isInventoryHome ? car.columnId : car.homeColumnId;
    } else {
      next.homeColumnId = car.homeColumnId;
    }
  } else {
    next.outDate = undefined;
    next.returnDate = undefined;
    next.tagNumber = undefined;
    next.homeColumnId = undefined;
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
  saleDate?: string,
  asOf?: string
): Car {
  if (primaryId === partnerId) {
    return applyContainerLocation(
      car,
      salespersonContainerId(primaryId),
      undefined,
      saleDate,
      asOf
    );
  }
  const wasSold = Boolean(car.salespersonId);
  const stamp = clampSaleDate(saleDate, asOf);
  return {
    ...car,
    columnId: "sold",
    salespersonId: primaryId,
    coSalespersonId: partnerId,
    workingDealId: undefined,
    managerId: undefined,
    overnightId: undefined,
    outDate: undefined,
    returnDate: undefined,
    tagNumber: undefined,
    homeColumnId: undefined,
    soldAt: wasSold
      ? car.soldAt
        ? clampSaleDate(car.soldAt, asOf)
        : stamp
      : stamp,
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

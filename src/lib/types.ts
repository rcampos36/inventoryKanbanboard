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
  /** ISO date (YYYY-MM-DD) when the car was sold / assigned to sales. */
  soldAt?: string;
  /** Set when the car is assigned as a manager demo. */
  managerId?: string;
  /** Set when the car is assigned as a team overnight demo. */
  overnightId?: string;
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

/** Apply a drop-container location onto a car, managing soldAt for sales assignments. */
export function applyContainerLocation(car: Car, containerId: string): Car {
  const location = containerToLocation(containerId);
  const next: Car = { ...car, ...location };
  const wasSold = Boolean(car.salespersonId);
  const isSold = Boolean(location.salespersonId);

  if (isSold) {
    // Mark as sold; stamp a sale date when newly sold (keep date on reassignment).
    next.soldAt = wasSold ? (car.soldAt ?? todayIsoDate()) : todayIsoDate();
  } else {
    next.soldAt = undefined;
  }

  return next;
}

export function isCarSold(car: Car): boolean {
  return Boolean(car.salespersonId) || car.columnId === "sold";
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

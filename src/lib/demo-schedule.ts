/** Preferred demo start times offered on the Schedule a Demo form. */
export const DEMO_TIME_SLOTS = [
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
] as const;

export type DemoTimeSlotValue = (typeof DEMO_TIME_SLOTS)[number]["value"];

const SLOT_VALUES = new Set(
  DEMO_TIME_SLOTS.map((slot) => slot.value as string)
);

export function isDemoTimeSlot(value: string): value is DemoTimeSlotValue {
  return SLOT_VALUES.has(value);
}

export function demoTimeLabel(value: string): string {
  return (
    DEMO_TIME_SLOTS.find((slot) => slot.value === value)?.label ?? value
  );
}

/** Local calendar YYYY-MM-DD for today. */
export function todayLocalIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidPreferredDemoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year!, month! - 1, day!);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month! - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }
  return value >= todayLocalIsoDate();
}

export function formatPreferredDemoDate(value: string): string {
  if (!ISO_DATE.test(value)) return value;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year!, month! - 1, day!);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

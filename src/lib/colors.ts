export interface ModelColor {
  /** Left accent bar + solid dot */
  accent: string;
  /** Subtle background tint for the chip */
  bg: string;
  /** Border color for the chip */
  border: string;
  /** Text color used for the model label */
  text: string;
  /** Badge background for the model pill */
  badgeBg: string;
  /** Badge text for the model pill */
  badgeText: string;
}

/**
 * A curated palette. Each entry uses fully static class strings so the
 * Tailwind JIT compiler can see them at build time.
 */
const PALETTE: ModelColor[] = [
  {
    accent: "bg-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-700",
  },
  {
    accent: "bg-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
  },
  {
    accent: "bg-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
  },
  {
    accent: "bg-yellow-500",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-800",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-800",
  },
  {
    accent: "bg-lime-500",
    bg: "bg-lime-50",
    border: "border-lime-200",
    text: "text-lime-700",
    badgeBg: "bg-lime-100",
    badgeText: "text-lime-700",
  },
  {
    accent: "bg-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
  },
  {
    accent: "bg-teal-500",
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-700",
    badgeBg: "bg-teal-100",
    badgeText: "text-teal-700",
  },
  {
    accent: "bg-cyan-500",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-700",
    badgeBg: "bg-cyan-100",
    badgeText: "text-cyan-700",
  },
  {
    accent: "bg-sky-500",
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-700",
  },
  {
    accent: "bg-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
  },
  {
    accent: "bg-indigo-500",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-700",
  },
  {
    accent: "bg-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    badgeBg: "bg-violet-100",
    badgeText: "text-violet-700",
  },
  {
    accent: "bg-fuchsia-500",
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    text: "text-fuchsia-700",
    badgeBg: "bg-fuchsia-100",
    badgeText: "text-fuchsia-700",
  },
  {
    accent: "bg-pink-500",
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
    badgeBg: "bg-pink-100",
    badgeText: "text-pink-700",
  },
];

/** Stable string hash so the same model always maps to the same color. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Collapse powertrain variants onto one color family.
 * CX-50 / CX-50 Hybrid, CX-70 / CX-70 PHEV, CX-90 / CX-90 PHEV, etc.
 */
export function normalizeModelColorKey(model: string): string {
  const value = model.trim().toLowerCase().replace(/\s+/g, " ");

  if (value.startsWith("cx-50")) return "cx-50";
  if (value.startsWith("cx-70")) return "cx-70";
  if (value.startsWith("cx-90")) return "cx-90";
  if (value.startsWith("cx-30")) return "cx-30";
  if (value.startsWith("cx-5")) return "cx-5";
  if (value.startsWith("mx-5")) return "mx-5-miata";
  if (value.startsWith("mazda3 sedan") || value === "mazda3-sedan") {
    return "mazda3-sedan";
  }
  if (value.startsWith("mazda3 hatchback") || value === "mazda3-hatchback") {
    return "mazda3-hatchback";
  }
  if (value.startsWith("mazda3")) return "mazda3";

  return value;
}

/** Explicit chip accent colors for each new-car model family. */
const MODEL_FAMILY_COLORS: Record<string, ModelColor> = {
  "mazda3-sedan": PALETTE[9], // blue
  "mazda3-hatchback": PALETTE[10], // indigo
  mazda3: PALETTE[9],
  "cx-30": PALETTE[7], // cyan
  "cx-5": PALETTE[5], // emerald
  "cx-50": PALETTE[1], // orange
  "cx-70": PALETTE[11], // violet
  "cx-90": PALETTE[0], // rose
  "mx-5-miata": PALETTE[13], // pink
};

/** All used inventory chips share this yellow treatment. */
export const USED_CAR_COLOR: ModelColor = PALETTE[3];

/** Common Mazda exterior paint names for Add Vehicle suggestions. */
export const EXTERIOR_COLOR_SUGGESTIONS = [
  "Soul Red Crystal Metallic",
  "Machine Gray Metallic",
  "Polymetal Gray Metallic",
  "Jet Black Mica",
  "Snowflake White Pearl Mica",
  "Platinum Quartz Metallic",
  "Deep Crystal Blue Mica",
  "Ceramic Metallic",
  "Zircon Sand Metallic",
  "Rhodium White Premium Metallic",
  "Artisan Red Premium Metallic",
  "Sonic Silver Metallic",
];

export function getModelColor(model: string): ModelColor {
  const key = normalizeModelColorKey(model);
  if (MODEL_FAMILY_COLORS[key]) return MODEL_FAMILY_COLORS[key];
  const index = hashString(key) % PALETTE.length;
  return PALETTE[index];
}

export function getCarColor(
  model: string,
  condition: "new" | "used"
): ModelColor {
  if (condition === "used") return USED_CAR_COLOR;
  return getModelColor(model);
}

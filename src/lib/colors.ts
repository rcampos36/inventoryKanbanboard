export interface ModelColor {
  /** Solid fill used for chips, dots, and avatars */
  accent: string;
  /** Full chip background (same solid family as accent) */
  bg: string;
  /** Border color for the chip */
  border: string;
  /** Primary text on the chip — black for contrast */
  text: string;
  /** Badge background for the model pill */
  badgeBg: string;
  /** Badge text for the model pill */
  badgeText: string;
}

/**
 * A curated palette. Each entry uses fully static class strings so the
 * Tailwind JIT compiler can see them at build time.
 * Chip backgrounds use solid colors with black text for readability.
 */
const PALETTE: ModelColor[] = [
  {
    accent: "bg-rose-400",
    bg: "bg-rose-400",
    border: "border-rose-500",
    text: "text-black",
    badgeBg: "bg-white/70",
    badgeText: "text-black",
  },
  {
    accent: "bg-orange-400",
    bg: "bg-orange-400",
    border: "border-orange-500",
    text: "text-black",
    badgeBg: "bg-white/70",
    badgeText: "text-black",
  },
  {
    accent: "bg-amber-400",
    bg: "bg-amber-400",
    border: "border-amber-500",
    text: "text-black",
    badgeBg: "bg-white/70",
    badgeText: "text-black",
  },
  {
    accent: "bg-yellow-400",
    bg: "bg-yellow-400",
    border: "border-yellow-500",
    text: "text-black",
    badgeBg: "bg-white/70",
    badgeText: "text-black",
  },
  {
    accent: "bg-lime-400",
    bg: "bg-lime-400",
    border: "border-lime-500",
    text: "text-black",
    badgeBg: "bg-white/70",
    badgeText: "text-black",
  },
  {
    accent: "bg-emerald-400",
    bg: "bg-emerald-400",
    border: "border-emerald-500",
    text: "text-black",
    badgeBg: "bg-white/70",
    badgeText: "text-black",
  },
  {
    accent: "bg-teal-400",
    bg: "bg-teal-400",
    border: "border-teal-500",
    text: "text-black",
    badgeBg: "bg-white/70",
    badgeText: "text-black",
  },
  {
    accent: "bg-cyan-400",
    bg: "bg-cyan-400",
    border: "border-cyan-500",
    text: "text-black",
    badgeBg: "bg-white/70",
    badgeText: "text-black",
  },
  {
    accent: "bg-sky-400",
    bg: "bg-sky-400",
    border: "border-sky-500",
    text: "text-black",
    badgeBg: "bg-white/70",
    badgeText: "text-black",
  },
  {
    accent: "bg-blue-400",
    bg: "bg-blue-400",
    border: "border-blue-500",
    text: "text-black",
    badgeBg: "bg-white/70",
    badgeText: "text-black",
  },
  {
    accent: "bg-indigo-400",
    bg: "bg-indigo-400",
    border: "border-indigo-500",
    text: "text-black",
    badgeBg: "bg-white/70",
    badgeText: "text-black",
  },
  {
    accent: "bg-violet-400",
    bg: "bg-violet-400",
    border: "border-violet-500",
    text: "text-black",
    badgeBg: "bg-white/70",
    badgeText: "text-black",
  },
  {
    accent: "bg-fuchsia-400",
    bg: "bg-fuchsia-400",
    border: "border-fuchsia-500",
    text: "text-black",
    badgeBg: "bg-white/70",
    badgeText: "text-black",
  },
  {
    accent: "bg-pink-400",
    bg: "bg-pink-400",
    border: "border-pink-500",
    text: "text-black",
    badgeBg: "bg-white/70",
    badgeText: "text-black",
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

  if (value.startsWith("civic sedan") || value === "civic-sedan") return "civic-sedan";
  if (value.startsWith("civic hatch") || value === "civic-hatchback") {
    return "civic-hatchback";
  }
  if (value === "civic") return "civic-sedan";
  if (value.startsWith("cr-v hybrid") || value === "cr-v-hybrid") return "cr-v-hybrid";
  if (value.startsWith("cr-v") || value === "cr-v") return "cr-v";
  if (value.startsWith("hr-v") || value === "hr-v") return "hr-v";
  if (value.startsWith("accord")) return "accord";
  if (value.startsWith("pilot")) return "pilot";
  if (value.startsWith("passport")) return "passport";
  if (value.startsWith("ridgeline")) return "ridgeline";
  if (value.startsWith("odyssey")) return "odyssey";

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
  "civic-sedan": PALETTE[9],
  "civic-hatchback": PALETTE[10],
  accord: PALETTE[5],
  "hr-v": PALETTE[7],
  "cr-v": PALETTE[1],
  "cr-v-hybrid": PALETTE[1],
  pilot: PALETTE[11],
  passport: PALETTE[0],
  ridgeline: PALETTE[2],
  odyssey: PALETTE[8],
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

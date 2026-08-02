export interface ModelColor {
  /** Solid fill used for chips, dots, and avatars */
  accent: string;
  /** Full chip background (same solid family as accent) */
  bg: string;
  /** Border color for the chip */
  border: string;
  /** Primary text on the chip */
  text: string;
  /** Badge background for the model pill */
  badgeBg: string;
  /** Badge text for the model pill */
  badgeText: string;
}

/**
 * Pastel palette tuned to SalesTower brand (teal #023441, peach #EFBB92, sand #FFE0C0).
 * Static class strings so Tailwind JIT can see them at build time.
 */
const PALETTE: ModelColor[] = [
  {
    // Soft peach / blush — brand peach family
    accent: "bg-orange-200",
    bg: "bg-orange-200",
    border: "border-orange-300",
    text: "text-brand",
    badgeBg: "bg-white/75",
    badgeText: "text-brand",
  },
  {
    // Warm sand
    accent: "bg-amber-100",
    bg: "bg-amber-100",
    border: "border-amber-300",
    text: "text-brand",
    badgeBg: "bg-white/75",
    badgeText: "text-brand",
  },
  {
    // Soft apricot
    accent: "bg-orange-100",
    bg: "bg-orange-100",
    border: "border-orange-200",
    text: "text-brand",
    badgeBg: "bg-white/75",
    badgeText: "text-brand",
  },
  {
    // Pale butter
    accent: "bg-yellow-100",
    bg: "bg-yellow-100",
    border: "border-yellow-300",
    text: "text-brand",
    badgeBg: "bg-white/75",
    badgeText: "text-brand",
  },
  {
    // Soft sage
    accent: "bg-lime-100",
    bg: "bg-lime-100",
    border: "border-lime-300",
    text: "text-brand",
    badgeBg: "bg-white/75",
    badgeText: "text-brand",
  },
  {
    // Mint — near brand teal
    accent: "bg-emerald-100",
    bg: "bg-emerald-100",
    border: "border-emerald-300",
    text: "text-brand",
    badgeBg: "bg-white/75",
    badgeText: "text-brand",
  },
  {
    // Soft teal — brand echo
    accent: "bg-teal-100",
    bg: "bg-teal-100",
    border: "border-teal-300",
    text: "text-brand",
    badgeBg: "bg-white/75",
    badgeText: "text-brand",
  },
  {
    // Seafoam
    accent: "bg-cyan-100",
    bg: "bg-cyan-100",
    border: "border-cyan-300",
    text: "text-brand",
    badgeBg: "bg-white/75",
    badgeText: "text-brand",
  },
  {
    // Soft sky
    accent: "bg-sky-100",
    bg: "bg-sky-100",
    border: "border-sky-300",
    text: "text-brand",
    badgeBg: "bg-white/75",
    badgeText: "text-brand",
  },
  {
    // Powder blue
    accent: "bg-blue-100",
    bg: "bg-blue-100",
    border: "border-blue-300",
    text: "text-brand",
    badgeBg: "bg-white/75",
    badgeText: "text-brand",
  },
  {
    // Dusty periwinkle
    accent: "bg-indigo-100",
    bg: "bg-indigo-100",
    border: "border-indigo-300",
    text: "text-brand",
    badgeBg: "bg-white/75",
    badgeText: "text-brand",
  },
  {
    // Soft lilac
    accent: "bg-violet-100",
    bg: "bg-violet-100",
    border: "border-violet-300",
    text: "text-brand",
    badgeBg: "bg-white/75",
    badgeText: "text-brand",
  },
  {
    // Blush rose
    accent: "bg-rose-100",
    bg: "bg-rose-100",
    border: "border-rose-300",
    text: "text-brand",
    badgeBg: "bg-white/75",
    badgeText: "text-brand",
  },
  {
    // Soft pink
    accent: "bg-pink-100",
    bg: "bg-pink-100",
    border: "border-pink-300",
    text: "text-brand",
    badgeBg: "bg-white/75",
    badgeText: "text-brand",
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

/** Explicit pastel chip colors for each new-car model family. */
const MODEL_FAMILY_COLORS: Record<string, ModelColor> = {
  "mazda3-sedan": PALETTE[9], // powder blue
  "mazda3-hatchback": PALETTE[10], // periwinkle
  mazda3: PALETTE[9],
  "cx-30": PALETTE[7], // seafoam
  "cx-5": PALETTE[6], // soft teal
  "cx-50": PALETTE[0], // peach
  "cx-70": PALETTE[5], // mint
  "cx-90": PALETTE[12], // blush
  "mx-5-miata": PALETTE[13], // soft pink
  "civic-sedan": PALETTE[9],
  "civic-hatchback": PALETTE[10],
  accord: PALETTE[6],
  "hr-v": PALETTE[7],
  "cr-v": PALETTE[0],
  "cr-v-hybrid": PALETTE[2],
  pilot: PALETTE[5],
  passport: PALETTE[12],
  ridgeline: PALETTE[1],
  odyssey: PALETTE[8],
};

/** Used inventory chips share a soft sand/butter treatment. */
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

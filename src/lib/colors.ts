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

export type ChipColorId =
  | "rose"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "fuchsia"
  | "pink";

export interface ChipColorOption extends ModelColor {
  id: ChipColorId;
  label: string;
}

/**
 * A curated palette. Each entry uses fully static class strings so the
 * Tailwind JIT compiler can see them at build time.
 */
export const CHIP_COLOR_OPTIONS: ChipColorOption[] = [
  {
    id: "rose",
    label: "Rose",
    accent: "bg-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-700",
  },
  {
    id: "orange",
    label: "Orange",
    accent: "bg-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
  },
  {
    id: "amber",
    label: "Amber",
    accent: "bg-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
  },
  {
    id: "yellow",
    label: "Yellow",
    accent: "bg-yellow-500",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-800",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-800",
  },
  {
    id: "lime",
    label: "Lime",
    accent: "bg-lime-500",
    bg: "bg-lime-50",
    border: "border-lime-200",
    text: "text-lime-700",
    badgeBg: "bg-lime-100",
    badgeText: "text-lime-700",
  },
  {
    id: "emerald",
    label: "Emerald",
    accent: "bg-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
  },
  {
    id: "teal",
    label: "Teal",
    accent: "bg-teal-500",
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-700",
    badgeBg: "bg-teal-100",
    badgeText: "text-teal-700",
  },
  {
    id: "cyan",
    label: "Cyan",
    accent: "bg-cyan-500",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-700",
    badgeBg: "bg-cyan-100",
    badgeText: "text-cyan-700",
  },
  {
    id: "sky",
    label: "Sky",
    accent: "bg-sky-500",
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-700",
  },
  {
    id: "blue",
    label: "Blue",
    accent: "bg-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
  },
  {
    id: "indigo",
    label: "Indigo",
    accent: "bg-indigo-500",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-700",
  },
  {
    id: "violet",
    label: "Violet",
    accent: "bg-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    badgeBg: "bg-violet-100",
    badgeText: "text-violet-700",
  },
  {
    id: "fuchsia",
    label: "Fuchsia",
    accent: "bg-fuchsia-500",
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    text: "text-fuchsia-700",
    badgeBg: "bg-fuchsia-100",
    badgeText: "text-fuchsia-700",
  },
  {
    id: "pink",
    label: "Pink",
    accent: "bg-pink-500",
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
    badgeBg: "bg-pink-100",
    badgeText: "text-pink-700",
  },
];

const CHIP_COLOR_BY_ID: Record<ChipColorId, ChipColorOption> =
  Object.fromEntries(
    CHIP_COLOR_OPTIONS.map((option) => [option.id, option])
  ) as Record<ChipColorId, ChipColorOption>;

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

/** Explicit colors for each new-car model family (variants share these). */
const MODEL_FAMILY_COLOR_IDS: Record<string, ChipColorId> = {
  "mazda3-sedan": "blue",
  "mazda3-hatchback": "indigo",
  mazda3: "blue",
  "cx-30": "cyan",
  "cx-5": "emerald",
  "cx-50": "orange",
  "cx-70": "violet",
  "cx-90": "rose",
  "mx-5-miata": "pink",
};

/** All used inventory chips share this yellow treatment by default. */
export const USED_CAR_COLOR: ModelColor = CHIP_COLOR_BY_ID.yellow;

export function isChipColorId(value: string | undefined | null): value is ChipColorId {
  return Boolean(value && value in CHIP_COLOR_BY_ID);
}

export function getChipColorOption(id: string | undefined | null): ChipColorOption | null {
  if (!isChipColorId(id)) return null;
  return CHIP_COLOR_BY_ID[id];
}

export function getModelColor(model: string): ModelColor {
  const key = normalizeModelColorKey(model);
  const familyId = MODEL_FAMILY_COLOR_IDS[key];
  if (familyId) return CHIP_COLOR_BY_ID[familyId];
  const index = hashString(key) % CHIP_COLOR_OPTIONS.length;
  return CHIP_COLOR_OPTIONS[index];
}

/** Default chip color id for a new/used car before an explicit pick. */
export function defaultChipColorId(
  model: string,
  condition: "new" | "used"
): ChipColorId {
  if (condition === "used") return "yellow";
  const key = normalizeModelColorKey(model);
  return MODEL_FAMILY_COLOR_IDS[key] ?? CHIP_COLOR_OPTIONS[hashString(key) % CHIP_COLOR_OPTIONS.length].id;
}

export function getCarColor(
  model: string,
  condition: "new" | "used",
  chipColor?: string | null
): ModelColor {
  const override = getChipColorOption(chipColor);
  if (override) return override;
  if (condition === "used") return USED_CAR_COLOR;
  return getModelColor(model);
}

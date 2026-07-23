import type { Car, Column, Manager, Salesperson } from "./types";
import { todayIsoDate } from "./types";

/** New/used inventory grouped by model (and used buckets). */
export const MODEL_COLUMNS: Column[] = [
  { id: "mazda3-sedan", title: "Mazda3 Sedan" },
  { id: "mazda3-hatchback", title: "Mazda3 Hatchback" },
  { id: "cx-30", title: "CX-30" },
  { id: "cx-5", title: "CX-5" },
  { id: "cx-50", title: "CX-50" },
  { id: "cx-50-hybrid", title: "CX-50 Hybrid" },
  { id: "cx-70", title: "CX-70" },
  { id: "cx-70-phev", title: "CX-70 PHEV" },
  { id: "cx-90", title: "CX-90" },
  { id: "cx-90-phev", title: "CX-90 PHEV" },
  { id: "mx-5-miata", title: "MX-5 Miata" },
  { id: "used-mazda", title: "Used Mazda" },
  { id: "used-other", title: "Used – Other Brands" },
];

/** Intake / logistics workflow columns. */
export const INTAKE_COLUMNS: Column[] = [
  { id: "incoming-used", title: "Incoming Used" },
  { id: "dx-in", title: "DX In" },
  { id: "dx-out", title: "DX Out" },
  { id: "incoming-loaners", title: "Incoming Loaners" },
];

/** All moveable inventory columns (model lanes + intake lanes). */
export const COLUMNS: Column[] = [...MODEL_COLUMNS, ...INTAKE_COLUMNS];

export const SALESPEOPLE: Salesperson[] = [
  { id: "avery", name: "Avery Johnson" },
  { id: "marcus", name: "Marcus Lee" },
  { id: "sofia", name: "Sofia Ramirez" },
  { id: "dan", name: "Dan O'Neill" },
];

export const MANAGERS: Manager[] = [
  { id: "elena", name: "Elena Vargas" },
  { id: "chris", name: "Chris Patel" },
  { id: "jordan", name: "Jordan Blake" },
  { id: "mia", name: "Mia Chen" },
  { id: "noah", name: "Noah Brooks" },
];

/** Autocomplete suggestions for the Add Vehicle form (free text still allowed). */
/**
 * Official 2026 Mazda USA models and trims (mazdausa.com).
 * Source: https://www.mazdausa.com/vehicles
 */
export const MAZDA_TRIMS_BY_MODEL: Record<string, string[]> = {
  "Mazda3 Sedan": [
    "2.5 S",
    "2.5 S Select Sport",
    "2.5 S Preferred",
    "2.5 S Carbon Edition",
    "2.5 Turbo Premium Plus",
  ],
  "Mazda3 Hatchback": [
    "2.5 S",
    "2.5 S Select Sport",
    "2.5 S Preferred",
    "2.5 S Carbon Edition",
    "2.5 S Premium",
    "2.5 Turbo Premium Plus",
  ],
  "CX-30": [
    "2.5 S",
    "2.5 S Select Sport",
    "2.5 S Preferred",
    "2.5 S Aire Edition",
    "2.5 S Carbon Edition",
    "2.5 S Premium",
    "2.5 Turbo Aire Edition",
    "2.5 Turbo Premium Plus",
  ],
  "CX-5": [
    "2.5 S",
    "2.5 S Select",
    "2.5 S Preferred",
    "2.5 S Premium",
    "2.5 S Premium Plus",
  ],
  "CX-50": [
    "2.5 S Select",
    "2.5 S Preferred",
    "2.5 S Meridian Edition",
    "2.5 S Premium",
    "2.5 Turbo",
    "2.5 Turbo Meridian Edition",
    "2.5 Turbo Premium Plus",
  ],
  "CX-50 Hybrid": [
    "Hybrid Preferred",
    "Hybrid Premium",
    "Hybrid Premium Plus",
  ],
  "CX-70": [
    "3.3 Turbo Preferred",
    "3.3 Turbo Premium",
    "3.3 Turbo Premium Plus",
    "3.3 Turbo S Premium",
    "3.3 Turbo S Premium Plus",
  ],
  "CX-70 PHEV": ["PHEV SC", "PHEV SC Plus"],
  "CX-90": [
    "3.3 Turbo Select",
    "3.3 Turbo Preferred",
    "3.3 Turbo Premium Sport",
    "3.3 Turbo Premium Plus",
    "3.3 Turbo S Premium Sport",
    "3.3 Turbo S Premium Plus",
  ],
  "CX-90 PHEV": [
    "PHEV Preferred",
    "PHEV Premium Sport",
    "PHEV Premium Plus",
  ],
  "MX-5 Miata": ["Sport", "Club", "Grand Touring"],
  "MX-5 Miata RF": ["Club", "Grand Touring"],
};

/** Free-text friendly catalog: suggestions by make, but any typed value is allowed. */
export const VEHICLE_CATALOG: Record<
  string,
  { models: string[]; trims: string[] }
> = {
  Mazda: {
    models: Object.keys(MAZDA_TRIMS_BY_MODEL),
    trims: Array.from(
      new Set(Object.values(MAZDA_TRIMS_BY_MODEL).flat())
    ),
  },
  Toyota: {
    models: ["Corolla", "Camry", "RAV4", "Highlander", "Tacoma", "Tundra", "4Runner", "Prius"],
    trims: ["LE", "SE", "XLE", "XSE", "Limited", "Platinum", "TRD Sport", "TRD Off-Road"],
  },
  Honda: {
    models: ["Civic", "Accord", "CR-V", "HR-V", "Pilot", "Passport", "Ridgeline"],
    trims: ["LX", "Sport", "EX", "EX-L", "Touring", "Sport Touring", "TrailSport"],
  },
  Ford: {
    models: ["F-150", "Escape", "Explorer", "Bronco", "Mustang", "Edge", "Maverick"],
    trims: ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "ST", "GT", "Badlands"],
  },
  Chevrolet: {
    models: ["Silverado", "Equinox", "Tahoe", "Suburban", "Traverse", "Colorado", "Malibu"],
    trims: ["LS", "LT", "LTZ", "RST", "Premier", "High Country", "Z71", "Trail Boss"],
  },
  GMC: {
    models: ["Sierra", "Terrain", "Acadia", "Yukon", "Canyon"],
    trims: ["Pro", "SLE", "SLT", "AT4", "Denali"],
  },
  Ram: {
    models: ["1500", "2500", "3500"],
    trims: ["Tradesman", "Big Horn", "Laramie", "Rebel", "Limited", "Longhorn"],
  },
  Jeep: {
    models: ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Gladiator", "Wagoneer"],
    trims: ["Sport", "Latitude", "Limited", "Trailhawk", "Overland", "Rubicon", "Summit"],
  },
  Nissan: {
    models: ["Altima", "Sentra", "Rogue", "Pathfinder", "Frontier", "Murano"],
    trims: ["S", "SV", "SR", "SL", "Platinum"],
  },
  Hyundai: {
    models: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Palisade", "Kona"],
    trims: ["SE", "SEL", "SEL Convenience", "Limited", "N Line", "Calligraphy"],
  },
  Kia: {
    models: ["Forte", "K5", "Sportage", "Sorento", "Telluride", "Carnival"],
    trims: ["LX", "S", "EX", "SX", "SX Prestige", "X-Line", "X-Pro"],
  },
  Subaru: {
    models: ["Impreza", "Crosstrek", "Forester", "Outback", "Ascent", "WRX"],
    trims: ["Base", "Premium", "Sport", "Limited", "Touring", "Wilderness", "Onyx Edition"],
  },
  Volkswagen: {
    models: ["Jetta", "Golf", "Tiguan", "Atlas", "ID.4"],
    trims: ["S", "SE", "SEL", "SEL Premium", "R-Line"],
  },
  BMW: {
    models: ["3 Series", "5 Series", "X3", "X5", "X7", "i4"],
    trims: ["330i", "340i", "M340i", "xDrive40i", "M Sport"],
  },
  "Mercedes-Benz": {
    models: ["C-Class", "E-Class", "GLC", "GLE", "GLS", "EQB"],
    trims: ["C 300", "E 350", "GLC 300", "GLE 350", "AMG"],
  },
  Audi: {
    models: ["A4", "A6", "Q3", "Q5", "Q7", "e-tron"],
    trims: ["Premium", "Premium Plus", "Prestige", "S line"],
  },
  Lexus: {
    models: ["ES", "RX", "NX", "GX", "LX", "IS"],
    trims: ["Premium", "Luxury", "F Sport", "Ultra Luxury"],
  },
  Acura: {
    models: ["Integra", "TLX", "RDX", "MDX"],
    trims: ["Base", "Technology", "A-Spec", "Advance", "Type S"],
  },
  Tesla: {
    models: ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
    trims: ["Rear-Wheel Drive", "Long Range", "Performance", "Plaid"],
  },
  Volvo: {
    models: ["S60", "XC40", "XC60", "XC90"],
    trims: ["Core", "Plus", "Ultimate", "Cross Country"],
  },
};

export const MAKE_SUGGESTIONS: string[] = Object.keys(VEHICLE_CATALOG);

export const MODEL_SUGGESTIONS: string[] = Array.from(
  new Set(Object.values(VEHICLE_CATALOG).flatMap((entry) => entry.models))
);

export const TRIM_SUGGESTIONS: string[] = Array.from(
  new Set(Object.values(VEHICLE_CATALOG).flatMap((entry) => entry.trims))
);

export function getModelsForMake(make: string): string[] {
  const entry = VEHICLE_CATALOG[make.trim()];
  return entry?.models ?? MODEL_SUGGESTIONS;
}

export function getTrimsForMake(make: string, model?: string): string[] {
  const normalizedMake = make.trim();
  const normalizedModel = model?.trim() ?? "";

  if (normalizedMake.toLowerCase() === "mazda" && normalizedModel) {
    const mazdaTrims = MAZDA_TRIMS_BY_MODEL[normalizedModel];
    if (mazdaTrims) return mazdaTrims;
  }

  const entry = VEHICLE_CATALOG[normalizedMake];
  return entry?.trims ?? TRIM_SUGGESTIONS;
}

export const INITIAL_CARS: Car[] = [
  {
    id: "car-1",
    stockNumber: "MZ26101",
    year: 2026,
    make: "Mazda",
    model: "Mazda3 Sedan",
    trim: "2.5 S Select Sport",
    condition: "new",
    columnId: "mazda3-sedan",
    price: 25650,
  },
  {
    id: "car-2",
    stockNumber: "MZ26102",
    year: 2026,
    make: "Mazda",
    model: "CX-30",
    trim: "2.5 S Premium",
    condition: "new",
    columnId: "manager-demo",
    managerId: "elena",
    price: 29900,
  },
  {
    id: "car-3",
    stockNumber: "MZ26103",
    year: 2026,
    make: "Mazda",
    model: "CX-5",
    trim: "2.5 S Premium Plus",
    condition: "new",
    columnId: "overnight-demo",
    overnightId: "marcus",
    outDate: "2026-07-22",
    returnDate: "2026-07-23",
    tagNumber: "42",
    price: 34200,
  },
  {
    id: "car-4",
    stockNumber: "MZ26104",
    year: 2026,
    make: "Mazda",
    model: "CX-50",
    trim: "2.5 Turbo Premium Plus",
    condition: "new",
    columnId: "cx-50",
    price: 43350,
  },
  {
    id: "car-5",
    stockNumber: "MZ26105",
    year: 2026,
    make: "Mazda",
    model: "CX-70",
    trim: "3.3 Turbo Premium",
    condition: "new",
    columnId: "cx-70",
    price: 42400,
  },
  {
    id: "car-6",
    stockNumber: "MZ26106",
    year: 2026,
    make: "Mazda",
    model: "CX-90",
    trim: "3.3 Turbo S Premium Plus",
    condition: "new",
    columnId: "cx-90",
    price: 60900,
  },
  {
    id: "car-7",
    stockNumber: "MZ26107",
    year: 2026,
    make: "Mazda",
    model: "MX-5 Miata",
    trim: "Grand Touring",
    condition: "new",
    columnId: "mx-5-miata",
    price: 35300,
  },
  {
    id: "car-8",
    stockNumber: "MZ26108",
    year: 2026,
    make: "Mazda",
    model: "Mazda3 Hatchback",
    trim: "2.5 Turbo Premium Plus",
    condition: "new",
    columnId: "mazda3-hatchback",
    price: 37450,
  },
  {
    id: "car-9",
    stockNumber: "MZ26109",
    year: 2026,
    make: "Mazda",
    model: "CX-50 Hybrid",
    trim: "Hybrid Premium Plus",
    condition: "new",
    columnId: "cx-50-hybrid",
    price: 40900,
  },
  {
    id: "car-12",
    stockNumber: "MZ26112",
    year: 2026,
    make: "Mazda",
    model: "CX-70 PHEV",
    trim: "PHEV SC Plus",
    condition: "new",
    columnId: "cx-70-phev",
    price: 57900,
  },
  {
    id: "car-13",
    stockNumber: "MZ26113",
    year: 2026,
    make: "Mazda",
    model: "CX-90 PHEV",
    trim: "PHEV Premium Plus",
    condition: "new",
    columnId: "cx-90-phev",
    price: 60400,
  },
  {
    id: "car-14",
    stockNumber: "MZ26114",
    year: 2026,
    make: "Mazda",
    model: "MX-5 Miata RF",
    trim: "Grand Touring",
    condition: "new",
    columnId: "mx-5-miata",
    price: 38700,
  },
  {
    id: "car-15",
    stockNumber: "U22015",
    year: 2022,
    make: "Mazda",
    model: "CX-5",
    trim: "Grand Touring",
    condition: "used",
    columnId: "used-mazda",
    price: 28900,
  },
  {
    id: "car-16",
    stockNumber: "U21016",
    year: 2021,
    make: "Mazda",
    model: "Mazda3 Sedan",
    trim: "Preferred",
    condition: "used",
    columnId: "used-mazda",
    price: 21400,
  },
  {
    id: "car-17",
    stockNumber: "U22017",
    year: 2022,
    make: "Honda",
    model: "Civic",
    trim: "Sport",
    condition: "used",
    columnId: "used-other",
    price: 23600,
  },
  {
    id: "car-18",
    stockNumber: "U23018",
    year: 2023,
    make: "Toyota",
    model: "RAV4",
    trim: "XLE",
    condition: "used",
    columnId: "used-other",
    price: 29800,
  },
  {
    id: "car-19",
    stockNumber: "IU24019",
    year: 2021,
    make: "Mazda",
    model: "CX-5",
    trim: "Preferred",
    condition: "used",
    columnId: "incoming-used",
    price: 24500,
  },
  {
    id: "car-20",
    stockNumber: "DX24020",
    year: 2024,
    make: "Mazda",
    model: "CX-30",
    trim: "2.5 S Preferred",
    condition: "used",
    columnId: "dx-in",
    price: 26800,
  },
  {
    id: "car-21",
    stockNumber: "DX24021",
    year: 2025,
    make: "Mazda",
    model: "CX-50",
    trim: "2.5 S Premium",
    condition: "used",
    columnId: "dx-out",
    price: 32900,
  },
  {
    id: "car-22",
    stockNumber: "LN24022",
    year: 2025,
    make: "Mazda",
    model: "Mazda3 Sedan",
    trim: "2.5 S Select Sport",
    condition: "used",
    columnId: "incoming-loaners",
    price: 23900,
  },
  {
    id: "car-10",
    stockNumber: "S23221",
    year: 2023,
    make: "Subaru",
    model: "Outback",
    trim: "Wilderness",
    condition: "used",
    columnId: "sold",
    salespersonId: "avery",
    soldAt: "2026-07-08",
    price: 33750,
  },
  {
    id: "car-11",
    stockNumber: "F22509",
    year: 2022,
    make: "Ford",
    model: "F-150",
    trim: "XLT",
    condition: "used",
    columnId: "sold",
    salespersonId: "marcus",
    soldAt: "2026-07-12",
    price: 41000,
  },
  {
    id: "car-23",
    stockNumber: "MZ26123",
    year: 2026,
    make: "Mazda",
    model: "CX-5",
    trim: "2.5 S Preferred",
    condition: "new",
    columnId: "sold",
    salespersonId: "avery",
    soldAt: todayIsoDate(),
    price: 34250,
  },
  {
    id: "car-24",
    stockNumber: "MZ26124",
    year: 2026,
    make: "Mazda",
    model: "CX-30",
    trim: "2.5 S Select Sport",
    condition: "new",
    columnId: "sold",
    salespersonId: "sofia",
    coSalespersonId: "dan",
    soldAt: todayIsoDate(),
    price: 28060,
  },
  {
    id: "car-25",
    stockNumber: "MZ26125",
    year: 2025,
    make: "Mazda",
    model: "Mazda3 Hatchback",
    trim: "2.5 S Preferred",
    condition: "used",
    columnId: "sold",
    salespersonId: "marcus",
    soldAt: todayIsoDate(),
    price: 25500,
  },
  {
    id: "car-26",
    stockNumber: "MZ26126",
    year: 2026,
    make: "Mazda",
    model: "CX-90",
    trim: "3.3 Turbo Preferred",
    condition: "new",
    columnId: "sold",
    salespersonId: "dan",
    soldAt: "2026-06-10",
    price: 43450,
  },
  {
    id: "car-27",
    stockNumber: "MZ26127",
    year: 2026,
    make: "Mazda",
    model: "CX-50",
    trim: "2.5 S Premium",
    condition: "new",
    columnId: "sold",
    salespersonId: "dan",
    soldAt: "2026-06-22",
    price: 34900,
  },
];

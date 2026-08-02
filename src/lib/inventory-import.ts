import * as XLSX from "xlsx";
import { getNewModelColumns } from "@/lib/data";
import { suggestInventoryColumnId } from "@/lib/suggest-column";
import type { CarCondition } from "@/lib/types";

export type ParsedInventoryRow = {
  stockNumber: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  condition: CarCondition;
  columnId: string;
  exteriorColor?: string;
  price?: number;
};

export type InventoryParseResult = {
  rows: ParsedInventoryRow[];
  skippedInvalid: number;
  warnings: string[];
};

const MAX_ROWS = 2000;

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[%#]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pickField(
  row: Record<string, unknown>,
  aliases: string[]
): unknown {
  const map = new Map<string, unknown>();
  for (const [key, value] of Object.entries(row)) {
    map.set(normalizeHeader(key), value);
  }
  for (const alias of aliases) {
    if (map.has(alias)) return map.get(alias);
  }
  return undefined;
}

function asString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function asOptionalNumber(value: unknown): number | null {
  if (value === "" || value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = String(value).replace(/[$,\s]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseConditionLabel(value: unknown): CarCondition | null {
  const raw = asString(value).toLowerCase();
  if (!raw) return null;
  if (raw === "new" || raw.startsWith("new ")) return "new";
  if (raw === "used" || raw.startsWith("used ") || raw === "cpo" || raw.includes("certified")) {
    return "used";
  }
  return null;
}

function resolveCondition(input: {
  make: string;
  franchiseBrand: string;
  stockNumber: string;
  odometer: unknown;
  certified: unknown;
  explicit: CarCondition | null;
}): CarCondition {
  if (input.explicit) return input.explicit;
  if (/A$/i.test(input.stockNumber)) return "used";
  if (asString(input.certified).toLowerCase() === "yes") return "used";

  const odo = asOptionalNumber(input.odometer);
  if (odo != null && odo > 100) return "used";

  if (input.make.toLowerCase() === input.franchiseBrand.toLowerCase()) {
    return "new";
  }
  return "used";
}

function modelTokensFor(make: string, franchiseBrand: string): string[] {
  const tokens = new Set<string>();
  if (make.toLowerCase() === franchiseBrand.toLowerCase()) {
    for (const col of getNewModelColumns(franchiseBrand)) {
      tokens.add(col.title);
    }
  }
  if (make.toLowerCase() === "mazda") {
    for (const name of [
      "CX-90 PHEV",
      "CX-70 PHEV",
      "CX-50 Hybrid",
      "MX-5 Miata RF",
      "MX-5 Miata",
      "Mazda3",
      "Mazda6",
      "CX-30",
      "CX-50",
      "CX-70",
      "CX-90",
      "CX-5",
      "CX-3",
      "CX-9",
    ]) {
      tokens.add(name);
    }
  }
  if (make.toLowerCase() === "honda") {
    for (const name of [
      "CR-V Hybrid",
      "Civic Hatchback",
      "Civic Sedan",
      "HR-V",
      "CR-V",
      "Accord",
      "Pilot",
      "Passport",
      "Ridgeline",
      "Odyssey",
      "Civic",
    ]) {
      tokens.add(name);
    }
  }
  return [...tokens].sort((a, b) => b.length - a.length);
}

function parseVehicleDescription(
  vehicle: string,
  body: string,
  franchiseBrand: string
): { year: number; make: string; model: string; trim: string } | null {
  const match = vehicle.trim().match(/^(\d{4})\s+(\S+)\s+(.+)$/);
  if (!match) return null;

  const year = Number(match[1]);
  const make = match[2];
  const rest = match[3].trim();
  const tokens = modelTokensFor(make, franchiseBrand);
  const token = tokens.find((name) => {
    const re = new RegExp(
      `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`,
      "i"
    );
    return re.test(rest);
  });

  if (token) {
    const trim = rest.slice(token.length).trim();
    const bodyLower = body.toLowerCase();
    if (token.toLowerCase() === "mazda3") {
      return {
        year,
        make,
        model: bodyLower.includes("hatch")
          ? "Mazda3 Hatchback"
          : "Mazda3 Sedan",
        trim,
      };
    }
    if (token.toLowerCase() === "civic") {
      return {
        year,
        make,
        model: bodyLower.includes("hatch")
          ? "Civic Hatchback"
          : "Civic Sedan",
        trim,
      };
    }
    return { year, make, model: token, trim };
  }

  const parts = rest.split(/\s+/);
  return {
    year,
    make,
    model: parts[0] ?? rest,
    trim: parts.slice(1).join(" "),
  };
}

function rowToInventory(
  row: Record<string, unknown>,
  franchiseBrand: string,
  warnings: string[]
): ParsedInventoryRow | null {
  const stockNumber = asString(
    pickField(row, ["stock", "stock number", "stock no", "stocknum"])
  );
  if (!stockNumber) {
    warnings.push("Skipped a row with no stock number.");
    return null;
  }

  const vehicle = asString(pickField(row, ["vehicle", "vehicle description", "description"]));
  const body = asString(pickField(row, ["body", "body style", "bodystyle"]));
  const explicitCondition = parseConditionLabel(
    pickField(row, ["condition", "new used", "type", "vehicle type"])
  );

  let year: number;
  let make: string;
  let model: string;
  let trim: string;

  if (vehicle) {
    const parsed = parseVehicleDescription(vehicle, body, franchiseBrand);
    if (!parsed) {
      warnings.push(`Could not parse vehicle for stock ${stockNumber}: ${vehicle}`);
      return null;
    }
    year = parsed.year;
    make = parsed.make;
    model = parsed.model;
    trim = parsed.trim;
  } else {
    year = asOptionalNumber(pickField(row, ["year", "model year"])) ?? NaN;
    make = asString(pickField(row, ["make", "brand"]));
    model = asString(pickField(row, ["model"]));
    trim = asString(pickField(row, ["trim", "series", "package"]));
    if (!Number.isFinite(year) || !make || !model) {
      warnings.push(
        `Stock ${stockNumber} needs Vehicle or Year/Make/Model columns.`
      );
      return null;
    }
  }

  const condition = resolveCondition({
    make,
    franchiseBrand,
    stockNumber,
    odometer: pickField(row, ["odometer", "odo", "mileage", "miles"]),
    certified: pickField(row, ["certified", "cpo"]),
    explicit: explicitCondition,
  });

  const columnId = suggestInventoryColumnId(
    make,
    model,
    condition,
    franchiseBrand
  );

  const color = asString(
    pickField(row, ["color", "exterior color", "ext color", "exterior"])
  );
  const priceRaw = asOptionalNumber(
    pickField(row, ["price mkt", "price", "asking price", "internet price", "list price"])
  );

  return {
    stockNumber,
    year,
    make,
    model,
    trim,
    condition,
    columnId,
    exteriorColor: color || undefined,
    price:
      priceRaw != null && priceRaw > 0 ? Math.round(priceRaw) : undefined,
  };
}

/** Parse .xls / .xlsx / .csv buffer into inventory rows for a franchise. */
export function parseInventoryFile(
  buffer: ArrayBuffer | Buffer,
  fileName: string,
  franchiseBrand: string
): InventoryParseResult {
  const warnings: string[] = [];
  const lower = fileName.toLowerCase();
  if (
    !lower.endsWith(".csv") &&
    !lower.endsWith(".xls") &&
    !lower.endsWith(".xlsx")
  ) {
    return {
      rows: [],
      skippedInvalid: 0,
      warnings: ["Use a .csv, .xls, or .xlsx file."],
    };
  }

  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], skippedInvalid: 0, warnings: ["The file has no sheets."] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true,
  });

  if (rawRows.length === 0) {
    return { rows: [], skippedInvalid: 0, warnings: ["No data rows found."] };
  }
  if (rawRows.length > MAX_ROWS) {
    warnings.push(`Only the first ${MAX_ROWS} rows will be imported.`);
  }

  const rows: ParsedInventoryRow[] = [];
  let skippedInvalid = 0;
  const seen = new Set<string>();

  for (const raw of rawRows.slice(0, MAX_ROWS)) {
    const parsed = rowToInventory(raw, franchiseBrand, warnings);
    if (!parsed) {
      skippedInvalid += 1;
      continue;
    }
    const key = parsed.stockNumber.toLowerCase();
    if (seen.has(key)) {
      warnings.push(`Duplicate stock in file skipped: ${parsed.stockNumber}`);
      skippedInvalid += 1;
      continue;
    }
    seen.add(key);
    rows.push(parsed);
  }

  return { rows, skippedInvalid, warnings: warnings.slice(0, 25) };
}

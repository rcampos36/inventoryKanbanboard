/**
 * One-off import: Pearson Mazda inventory from the Aug 2 2026 XLS export.
 * Replaces active Pearson stock only — does not touch Sunrise Honda.
 *
 * Usage: npx tsx scripts/import-pearson-inventory.ts
 */
import "dotenv/config";
import { createRequire } from "node:module";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { suggestInventoryColumnId } from "../src/lib/suggest-column";
import { monthKeyFromDate, todayIsoDate, type CarCondition } from "../src/lib/types";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx") as typeof import("xlsx");

const PEARSON_ID = "org_pearson_mazda";
const FRANCHISE = "Mazda";
const FILE =
  "/Users/rogercampos/Projects/Project Assets/InventoryKanban/Pearson-Inventory-8-2-2026.xls";

/** Longest-first so PHEV / Hybrid variants win over base names. */
const MAZDA_MODEL_TOKENS = [
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
  "MX-30",
] as const;

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

type ParsedVehicle = {
  year: number;
  make: string;
  model: string;
  trim: string;
};

function parseVehicle(vehicle: string, body: string): ParsedVehicle | null {
  const match = String(vehicle)
    .trim()
    .match(/^(\d{4})\s+(\S+)\s+(.+)$/);
  if (!match) return null;

  const year = Number(match[1]);
  const make = match[2];
  let rest = match[3].trim();

  if (make.toLowerCase() === "mazda") {
    const upperRest = rest;
    const token = MAZDA_MODEL_TOKENS.find((name) => {
      const re = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`, "i");
      return re.test(upperRest);
    });

    if (token) {
      const trim = rest.slice(token.length).trim();
      if (token === "Mazda3") {
        const bodyLower = body.toLowerCase();
        const model = bodyLower.includes("hatch")
          ? "Mazda3 Hatchback"
          : "Mazda3 Sedan";
        return { year, make: "Mazda", model, trim };
      }
      return { year, make: "Mazda", model: token, trim };
    }

    // Fallback: first token as model
    const [modelPart, ...trimParts] = rest.split(/\s+/);
    return {
      year,
      make: "Mazda",
      model: modelPart,
      trim: trimParts.join(" "),
    };
  }

  // Other brands: "Make Model Trim..." — make already parsed; rest is model + trim
  const parts = rest.split(/\s+/);
  const model = parts[0] ?? rest;
  const trim = parts.slice(1).join(" ");
  return { year, make, model, trim };
}

/**
 * ProfitTime-style export: CPO / high-mile / trade-in (stock ends in A) = used.
 * Brand-new units typically have blank odometer and are not Certified.
 */
function resolveCondition(
  make: string,
  stock: string,
  odometer: unknown,
  certified: unknown
): CarCondition {
  if (/A$/i.test(stock)) return "used";
  if (String(certified).trim().toLowerCase() === "yes") return "used";

  const odo =
    odometer === "" || odometer == null ? null : Number(odometer);
  if (odo != null && !Number.isNaN(odo) && odo > 100) return "used";

  if (make.toLowerCase() === "mazda") return "new";
  return "used";
}

function priceFromRow(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

async function main() {
  const workbook = XLSX.readFile(FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const parsed: Array<{
    stockNumber: string;
    year: number;
    make: string;
    model: string;
    trim: string;
    condition: CarCondition;
    columnId: string;
    exteriorColor: string | null;
    price: number | null;
  }> = [];

  const columnCounts: Record<string, number> = {};

  for (const row of rows) {
    const stockNumber = String(row["Stock #"] ?? "").trim();
    const vehicle = String(row["Vehicle"] ?? "").trim();
    if (!stockNumber || !vehicle) continue;

    const body = String(row["Body"] ?? "");
    const vehicleParts = parseVehicle(vehicle, body);
    if (!vehicleParts) {
      console.warn(`Skip unparseable vehicle: ${vehicle}`);
      continue;
    }

    const condition = resolveCondition(
      vehicleParts.make,
      stockNumber,
      row["Odometer"],
      row["Certified"]
    );
    const columnId = suggestInventoryColumnId(
      vehicleParts.make,
      vehicleParts.model,
      condition,
      FRANCHISE
    );
    const color = String(row["Color"] ?? "").trim();

    parsed.push({
      stockNumber,
      year: vehicleParts.year,
      make: vehicleParts.make,
      model: vehicleParts.model,
      trim: vehicleParts.trim,
      condition,
      columnId,
      exteriorColor: color || null,
      price: priceFromRow(row["Price / %\nMkt"]),
    });
    columnCounts[columnId] = (columnCounts[columnId] ?? 0) + 1;
  }

  const stocks = parsed.map((p) => p.stockNumber);
  const dupes = stocks.filter((s, i) => stocks.indexOf(s) !== i);
  if (dupes.length) {
    throw new Error(`Duplicate stock numbers in file: ${[...new Set(dupes)].join(", ")}`);
  }

  const before = await prisma.car.count({
    where: { organizationId: PEARSON_ID },
  });
  const sunriseBefore = await prisma.car.count({
    where: { organizationId: "org_sunrise_honda" },
  });

  // Replace Pearson inventory only (sold/demo history on board is cleared for a clean cutover).
  const deleted = await prisma.car.deleteMany({
    where: { organizationId: PEARSON_ID },
  });

  const occurredAt = todayIsoDate();
  const monthKey = monthKeyFromDate(occurredAt);
  let created = 0;
  for (const [index, car] of parsed.entries()) {
    const row = await prisma.car.create({
      data: {
        organizationId: PEARSON_ID,
        stockNumber: car.stockNumber,
        year: car.year,
        make: car.make,
        model: car.model,
        trim: car.trim,
        condition: car.condition,
        columnId: car.columnId,
        exteriorColor: car.exteriorColor,
        price: car.price,
        position: index,
      },
    });
    await prisma.boardEvent.create({
      data: {
        organizationId: PEARSON_ID,
        type: "inventory_added",
        occurredAt,
        monthKey,
        carId: row.id,
        stockNumber: row.stockNumber,
        make: row.make,
        model: row.model,
        trim: row.trim,
        condition: row.condition,
        toColumnId: row.columnId,
        price: row.price,
      },
    });
    created += 1;
  }

  const sunriseAfter = await prisma.car.count({
    where: { organizationId: "org_sunrise_honda" },
  });

  const newCount = parsed.filter((p) => p.condition === "new").length;
  const usedCount = parsed.filter((p) => p.condition === "used").length;

  console.log(JSON.stringify(
    {
      file: FILE,
      pearsonBefore: before,
      pearsonDeleted: deleted.count,
      pearsonCreated: created,
      newCars: newCount,
      usedCars: usedCount,
      byColumn: columnCounts,
      sunriseUnchanged: sunriseBefore === sunriseAfter,
      sunriseCount: sunriseAfter,
      sampleNew: parsed.filter((p) => p.condition === "new"),
    },
    null,
    2
  ));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

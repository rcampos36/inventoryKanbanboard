"use server";

import { prisma } from "@/lib/db";
import { requirePlanFeature } from "@/lib/auth";
import {
  currentMonthKey,
  formatMonthLabel,
} from "@/lib/types";

export type ReportMonthOption = {
  key: string;
  label: string;
};

export type SalesSummary = {
  units: number;
  revenue: number;
  newUnits: number;
  usedUnits: number;
};

export type ModelSalesRow = {
  model: string;
  make: string;
  units: number;
  revenue: number;
};

export type TeamSalesRow = {
  salespersonId: string;
  name: string;
  units: number;
  revenue: number;
};

export type InventoryMovementSummary = {
  added: number;
  moved: number;
  sold: number;
  reversed: number;
};

export type SaleDetailRow = {
  id: string;
  occurredAt: string;
  stockNumber: string;
  vehicle: string;
  condition: string;
  salesperson: string;
  units: number;
  price: number | null;
};

export type MonthlyReport = {
  monthKey: string;
  monthLabel: string;
  months: ReportMonthOption[];
  sales: SalesSummary;
  topModels: ModelSalesRow[];
  teamSales: TeamSalesRow[];
  saleDetails: SaleDetailRow[];
  inventory: InventoryMovementSummary;
};

function lastTwelveMonthKeys(fromKey: string = currentMonthKey()): string[] {
  const [yearStr, monthStr] = fromKey.split("-");
  let year = Number(yearStr);
  let month = Number(monthStr);
  const keys: string[] = [];
  for (let i = 0; i < 12; i++) {
    keys.push(`${year}-${String(month).padStart(2, "0")}`);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return keys;
}

type CreditEvent = {
  type: string;
  carId: string | null;
  make: string | null;
  model: string | null;
  condition: string | null;
  price: number | null;
  salespersonId: string | null;
  coSalespersonId: string | null;
};

function participants(event: CreditEvent): string[] {
  return [event.salespersonId, event.coSalespersonId].filter(
    (id): id is string => Boolean(id)
  );
}

function isHalf(event: CreditEvent): boolean {
  return Boolean(event.salespersonId && event.coSalespersonId);
}

export async function getMonthlyReportAction(
  monthKey?: string
): Promise<MonthlyReport> {
  const user = await requirePlanFeature("reports");
  const months = lastTwelveMonthKeys().map((key) => ({
    key,
    label: formatMonthLabel(key),
  }));
  const selected =
    monthKey && months.some((m) => m.key === monthKey)
      ? monthKey
      : months[0]?.key ?? currentMonthKey();

  const events = await prisma.boardEvent.findMany({
    where: {
      organizationId: user.organizationId,
      monthKey: selected,
    },
    orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
  });

  const salespeople = await prisma.salesperson.findMany({
    where: { organizationId: user.organizationId },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  const nameById = new Map(salespeople.map((p) => [p.id, p.name]));

  const saleEvents = events.filter((e) => e.type === "sale");
  const reversedEvents = events.filter((e) => e.type === "sale_reversed");

  // Net sold units by car (reassignment in-month nets to still sold once).
  const carNet = new Map<string, number>();
  for (const event of saleEvents) {
    const key = event.carId ?? `anon-sale-${event.id}`;
    carNet.set(key, (carNet.get(key) ?? 0) + 1);
  }
  for (const event of reversedEvents) {
    const key = event.carId ?? `anon-rev-${event.id}`;
    carNet.set(key, (carNet.get(key) ?? 0) - 1);
  }

  const netSaleCars = new Set(
    Array.from(carNet.entries())
      .filter(([, net]) => net > 0)
      .map(([carId]) => carId)
  );

  // Use the latest sale event per net-sold car for model/condition/price.
  const latestSaleByCar = new Map<string, (typeof saleEvents)[number]>();
  for (const event of saleEvents) {
    const key = event.carId ?? `anon-sale-${event.id}`;
    if (!netSaleCars.has(key)) continue;
    latestSaleByCar.set(key, event);
  }
  const netSales = Array.from(latestSaleByCar.values());

  const sales: SalesSummary = {
    units: netSales.length,
    revenue: netSales.reduce((sum, e) => sum + (e.price ?? 0), 0),
    newUnits: netSales.filter((e) => e.condition === "new").length,
    usedUnits: netSales.filter((e) => e.condition === "used").length,
  };

  const modelMap = new Map<string, ModelSalesRow>();
  for (const event of netSales) {
    const model = event.model?.trim() || "Unknown";
    const make = event.make?.trim() || "";
    const key = `${make}::${model}`;
    const existing = modelMap.get(key) ?? {
      model,
      make,
      units: 0,
      revenue: 0,
    };
    existing.units += 1;
    existing.revenue += event.price ?? 0;
    modelMap.set(key, existing);
  }
  const topModels = Array.from(modelMap.values()).sort(
    (a, b) => b.units - a.units || b.revenue - a.revenue
  );

  const teamMap = new Map<string, TeamSalesRow>();
  for (const person of salespeople) {
    teamMap.set(person.id, {
      salespersonId: person.id,
      name: person.name,
      units: 0,
      revenue: 0,
    });
  }

  function applyTeamCredit(event: CreditEvent, sign: 1 | -1) {
    const people = participants(event);
    if (people.length === 0) return;
    const credit = isHalf(event) ? 0.5 : 1;
    const splitPrice = isHalf(event)
      ? (event.price ?? 0) / 2
      : (event.price ?? 0);
    for (const personId of people) {
      const row = teamMap.get(personId) ?? {
        salespersonId: personId,
        name: nameById.get(personId) ?? personId,
        units: 0,
        revenue: 0,
      };
      row.units += credit * sign;
      row.revenue += splitPrice * sign;
      teamMap.set(personId, row);
    }
  }

  for (const event of saleEvents) applyTeamCredit(event, 1);
  for (const event of reversedEvents) applyTeamCredit(event, -1);

  const teamSales = Array.from(teamMap.values())
    .map((row) => ({
      ...row,
      units: Math.max(0, Number(row.units.toFixed(1))),
      revenue: Math.max(0, Math.round(row.revenue)),
    }))
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue);

  const saleDetails: SaleDetailRow[] = netSales
    .map((event) => {
      const people = participants(event)
        .map((id) => nameById.get(id) ?? id)
        .filter(Boolean);
      const parts = [event.make, event.model, event.trim]
        .map((p) => p?.trim())
        .filter(Boolean);
      return {
        id: event.id,
        occurredAt: event.occurredAt,
        stockNumber: event.stockNumber?.trim() || "—",
        vehicle: parts.join(" ") || "Unknown vehicle",
        condition:
          event.condition === "new"
            ? "New"
            : event.condition === "used"
              ? "Used"
              : "—",
        salesperson: people.length > 0 ? people.join(" · ") : "Unassigned",
        units: 1,
        price: event.price,
      };
    })
    .sort((a, b) => {
      if (a.occurredAt !== b.occurredAt) {
        return b.occurredAt.localeCompare(a.occurredAt);
      }
      return a.stockNumber.localeCompare(b.stockNumber);
    });

  const inventory: InventoryMovementSummary = {
    added: events.filter((e) => e.type === "inventory_added").length,
    moved: events.filter((e) => e.type === "inventory_moved").length,
    sold: netSales.length,
    reversed: reversedEvents.length,
  };

  return {
    monthKey: selected,
    monthLabel: formatMonthLabel(selected),
    months,
    sales,
    topModels,
    teamSales,
    saleDetails,
    inventory,
  };
}

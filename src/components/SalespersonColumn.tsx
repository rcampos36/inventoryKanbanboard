"use client";

import { CarCard } from "./CarCard";
import { getModelColor } from "@/lib/colors";
import { formatSaleCount, type Car, type Salesperson } from "@/lib/types";

interface SalespersonColumnProps {
  salesperson: Salesperson;
  cars: Car[];
  rank: number;
  monthSoldCount: number;
  onMove?: (carId: string, targetContainerId: string) => void;
  onEditCheckoutDates?: (carId: string) => void;
  onEditExteriorColor?: (carId: string) => void;
  onRequestHalfDeal?: (carId: string) => void;
  onHalfDealWith?: (carId: string, partnerId: string) => void;
  onClearHalfDeal?: (carId: string) => void;
  onDelete?: () => void;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-amber-400 text-amber-950";
  if (rank === 2) return "bg-slate-300 text-slate-800";
  if (rank === 3) return "bg-orange-300 text-orange-950";
  return "bg-slate-100 text-slate-600";
}

/** Month ranking column — display only; drop sales into Daily Sales. */
export function SalespersonColumn({
  salesperson,
  cars,
  rank,
  monthSoldCount,
  onMove,
  onEditCheckoutDates,
  onEditExteriorColor,
  onRequestHalfDeal,
  onHalfDealWith,
  onClearHalfDeal,
  onDelete,
}: SalespersonColumnProps) {
  const color = getModelColor(salesperson.name);

  return (
    <div className="flex min-w-0 w-full flex-col rounded-2xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center gap-1.5 px-2 pt-2.5 pb-1.5">
        <div className="relative shrink-0">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold text-white ${color.accent}`}
          >
            {initials(salesperson.name)}
          </span>
          <span
            className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold ${rankBadgeClass(rank)}`}
            title={`Rank #${rank}`}
          >
            #{rank}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[11px] font-semibold leading-tight text-slate-800">
            {salesperson.name}
          </h3>
          <p className="truncate text-[10px] leading-tight text-slate-500">
            {formatSaleCount(monthSoldCount)}{" "}
            {monthSoldCount === 1 ? "sale" : "sales"}
          </p>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold text-rose-600 hover:bg-rose-50"
            title={`Remove ${salesperson.name}`}
          >
            ×
          </button>
        )}
      </div>

      <div className="flex min-h-32 flex-1 flex-col gap-2 rounded-b-2xl px-1.5 pb-2 pt-1">
        {cars.map((car) => (
          <CarCard
            key={
              car.salespersonId === salesperson.id
                ? `${car.id}__month`
                : `${car.id}__month-co`
            }
            car={car}
            draggable={false}
            onMove={onMove}
            onEditCheckoutDates={onEditCheckoutDates}
            onEditExteriorColor={onEditExteriorColor}
            onRequestHalfDeal={onRequestHalfDeal}
            onHalfDealWith={onHalfDealWith}
            onClearHalfDeal={onClearHalfDeal}
          />
        ))}

        {cars.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 px-1 py-6 text-center text-[10px] leading-snug text-slate-400">
            Closed-day sales appear here
          </div>
        )}
      </div>
    </div>
  );
}

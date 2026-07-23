"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CarCard } from "./CarCard";
import { getModelColor } from "@/lib/colors";
import {
  formatSaleCount,
  salespersonContainerId,
  type Car,
  type Salesperson,
} from "@/lib/types";

interface TodaySalesColumnProps {
  salesperson: Salesperson;
  cars: Car[];
  saleCount: number;
  onMove?: (carId: string, targetContainerId: string) => void;
  onEditCheckoutDates?: (carId: string) => void;
  onRequestHalfDeal?: (carId: string) => void;
  onHalfDealWith?: (carId: string, partnerId: string) => void;
  onClearHalfDeal?: (carId: string) => void;
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

export function TodaySalesColumn({
  salesperson,
  cars,
  saleCount,
  onMove,
  onEditCheckoutDates,
  onRequestHalfDeal,
  onHalfDealWith,
  onClearHalfDeal,
}: TodaySalesColumnProps) {
  const containerId = salespersonContainerId(salesperson.id);
  const { setNodeRef, isOver } = useDroppable({
    id: containerId,
    data: { type: "salesperson", salespersonId: salesperson.id },
  });
  const color = getModelColor(salesperson.name);

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${color.accent}`}
        >
          {initials(salesperson.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-800">
            {salesperson.name}
          </h3>
          <p className="text-xs text-slate-500">
            {formatSaleCount(saleCount)}{" "}
            {saleCount === 1 ? "sale" : "sales"} this day
          </p>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "flex flex-1 flex-col gap-2.5 rounded-b-2xl px-3 pb-3 pt-1",
          "min-h-32 transition-colors",
          isOver ? "bg-emerald-50" : "",
        ].join(" ")}
      >
        <SortableContext
          items={cars
            .filter((c) => c.salespersonId === salesperson.id)
            .map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cars.map((car) => {
            const isPrimary = car.salespersonId === salesperson.id;
            return (
              <CarCard
                key={isPrimary ? car.id : `${car.id}__co`}
                car={car}
                draggable={isPrimary}
                onMove={onMove}
                onEditCheckoutDates={onEditCheckoutDates}
                onRequestHalfDeal={onRequestHalfDeal}
                onHalfDealWith={onHalfDealWith}
                onClearHalfDeal={onClearHalfDeal}
              />
            );
          })}
        </SortableContext>

        {cars.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
            Drop a sold car here
          </div>
        )}
      </div>
    </div>
  );
}

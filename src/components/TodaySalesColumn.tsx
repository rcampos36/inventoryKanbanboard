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
  onEditExteriorColor?: (carId: string) => void;
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
  onEditExteriorColor,
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
    <div className="flex min-w-0 w-full flex-col rounded-2xl bg-[var(--autosync-surface)] ring-1 ring-peach/55">
      <div className="flex items-center gap-1.5 px-2 pt-2.5 pb-1.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${color.accent}`}
        >
          {initials(salesperson.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold leading-tight text-brand">
            {salesperson.name}
          </h3>
          <p className="truncate text-[10px] leading-tight text-brand/60">
            {formatSaleCount(saleCount)}{" "}
            {saleCount === 1 ? "sale" : "sales"}
          </p>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "flex min-h-32 flex-1 flex-col gap-2 rounded-b-2xl px-1.5 pb-2 pt-1",
          "transition-colors",
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
                onEditExteriorColor={onEditExteriorColor}
                onRequestHalfDeal={onRequestHalfDeal}
                onHalfDealWith={onHalfDealWith}
                onClearHalfDeal={onClearHalfDeal}
              />
            );
          })}
        </SortableContext>

        {cars.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-peach/50 px-1 py-6 text-center text-[10px] leading-snug text-brand/45">
            Drop a sold car here
          </div>
        )}
      </div>
    </div>
  );
}

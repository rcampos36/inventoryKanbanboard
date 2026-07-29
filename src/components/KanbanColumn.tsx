"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CarCard } from "./CarCard";
import type { Car, Column } from "@/lib/types";

interface KanbanColumnProps {
  column: Column;
  cars: Car[];
  className?: string;
  onMove?: (carId: string, targetContainerId: string) => void;
  onEditCheckoutDates?: (carId: string) => void;
  onRequestHalfDeal?: (carId: string) => void;
  onHalfDealWith?: (carId: string, partnerId: string) => void;
  onClearHalfDeal?: (carId: string) => void;
}

export function KanbanColumn({
  column,
  cars,
  className,
  onMove,
  onEditCheckoutDates,
  onRequestHalfDeal,
  onHalfDealWith,
  onClearHalfDeal,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  return (
    <div
      className={
        className ??
        "flex w-72 shrink-0 flex-col rounded-2xl bg-slate-100/80"
      }
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-sm font-semibold text-slate-700">{column.title}</h2>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {cars.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "flex flex-1 flex-col gap-2.5 rounded-b-2xl px-3 pb-3 pt-1",
          "min-h-32 transition-colors",
          isOver ? "bg-slate-200/70" : "",
        ].join(" ")}
      >
        <SortableContext
          items={cars.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              onMove={onMove}
              onEditCheckoutDates={onEditCheckoutDates}
              onRequestHalfDeal={onRequestHalfDeal}
              onHalfDealWith={onHalfDealWith}
              onClearHalfDeal={onClearHalfDeal}
            />
          ))}
        </SortableContext>

        {cars.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 py-6 text-xs text-slate-400">
            Drop cars here
          </div>
        )}
      </div>
    </div>
  );
}

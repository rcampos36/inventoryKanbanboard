"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CarCard } from "./CarCard";
import { getModelColor, type ChipColorId } from "@/lib/colors";
import {
  workingDealContainerId,
  type Car,
  type Salesperson,
} from "@/lib/types";

interface WorkingDealColumnProps {
  salesperson: Salesperson;
  cars: Car[];
  onMove?: (carId: string, targetContainerId: string) => void;
  onEditCheckoutDates?: (carId: string) => void;
  onChangeChipColor?: (carId: string, chipColor: ChipColorId) => void;
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

export function WorkingDealColumn({
  salesperson,
  cars,
  onMove,
  onEditCheckoutDates,
  onChangeChipColor,
}: WorkingDealColumnProps) {
  const containerId = workingDealContainerId(salesperson.id);
  const { setNodeRef, isOver } = useDroppable({
    id: containerId,
    data: { type: "working-deal", salespersonId: salesperson.id },
  });
  const color = getModelColor(salesperson.name);

  return (
    <div className="flex min-w-0 w-full flex-col rounded-2xl bg-white ring-1 ring-sky-200">
      <div className="flex items-center gap-2 px-2.5 pt-3 pb-2">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${color.accent}`}
        >
          {initials(salesperson.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xs font-semibold text-slate-800">
            {salesperson.name}
          </h3>
          <p className="truncate text-[11px] text-slate-500">
            {cars.length} working {cars.length === 1 ? "deal" : "deals"}
          </p>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "flex min-h-32 flex-1 flex-col gap-2 rounded-b-2xl px-2 pb-2.5 pt-1",
          "transition-colors",
          isOver ? "bg-sky-50" : "",
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
              onChangeChipColor={onChangeChipColor}
            />
          ))}
        </SortableContext>

        {cars.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-sky-200 py-6 text-center text-xs text-slate-400">
            Drop a working deal here
          </div>
        )}
      </div>
    </div>
  );
}

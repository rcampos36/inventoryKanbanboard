"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CarCard } from "./CarCard";
import { getModelColor } from "@/lib/colors";
import {
  overnightContainerId,
  type Car,
  type Salesperson,
} from "@/lib/types";

interface OvernightColumnProps {
  person: Salesperson;
  cars: Car[];
  onMove?: (carId: string, targetContainerId: string) => void;
  onEditCheckoutDates?: (carId: string) => void;
  onEditExteriorColor?: (carId: string) => void;
  onReviewOvernightDue?: (carId: string) => void;
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

export function OvernightColumn({
  person,
  cars,
  onMove,
  onEditCheckoutDates,
  onEditExteriorColor,
  onReviewOvernightDue,
}: OvernightColumnProps) {
  const containerId = overnightContainerId(person.id);
  const { setNodeRef, isOver } = useDroppable({
    id: containerId,
    data: { type: "overnight", overnightId: person.id },
  });
  const color = getModelColor(person.name);

  return (
    <div className="flex min-w-0 w-full flex-col rounded-2xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center gap-1.5 px-2 pt-2.5 pb-1.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${color.accent}`}
        >
          {initials(person.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[11px] font-semibold leading-tight text-slate-800">
            {person.name}
          </h3>
          <p className="truncate text-[10px] leading-tight text-slate-500">
            {cars.length} {cars.length === 1 ? "demo" : "demos"}
          </p>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "flex min-h-32 flex-1 flex-col gap-2 rounded-b-2xl px-1.5 pb-2 pt-1",
          "transition-colors",
          isOver ? "bg-amber-50" : "",
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
              onEditExteriorColor={onEditExteriorColor}
              onReviewOvernightDue={onReviewOvernightDue}
            />
          ))}
        </SortableContext>

        {cars.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 px-1 py-6 text-center text-[10px] leading-snug text-slate-400">
            Drop an overnight demo here
          </div>
        )}
      </div>
    </div>
  );
}

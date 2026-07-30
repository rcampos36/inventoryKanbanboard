"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CarCard } from "./CarCard";
import { getModelColor } from "@/lib/colors";
import { managerContainerId, type Car, type Manager } from "@/lib/types";

interface ManagerColumnProps {
  manager: Manager;
  cars: Car[];
  onMove?: (carId: string, targetContainerId: string) => void;
  onEditCheckoutDates?: (carId: string) => void;
  onEditExteriorColor?: (carId: string) => void;
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

export function ManagerColumn({
  manager,
  cars,
  onMove,
  onEditCheckoutDates,
  onEditExteriorColor,
}: ManagerColumnProps) {
  const containerId = managerContainerId(manager.id);
  const { setNodeRef, isOver } = useDroppable({
    id: containerId,
    data: { type: "manager", managerId: manager.id },
  });
  const color = getModelColor(manager.name);

  return (
    <div className="flex min-w-0 w-full flex-col rounded-2xl bg-[var(--autosync-surface)] ring-1 ring-peach/55">
      <div className="flex items-center gap-1.5 px-2 pt-2.5 pb-1.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${color.accent}`}
        >
          {initials(manager.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold leading-tight text-brand">
            {manager.name}
          </h3>
          <p className="truncate text-[10px] leading-tight text-brand/60">
            {cars.length} {cars.length === 1 ? "demo" : "demos"}
          </p>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "flex min-h-32 flex-1 flex-col gap-2 rounded-b-2xl px-1.5 pb-2 pt-1",
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
              onEditExteriorColor={onEditExteriorColor}
            />
          ))}
        </SortableContext>

        {cars.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-peach/50 py-6 text-center text-xs text-brand/45">
            Drop a demo car here
          </div>
        )}
      </div>
    </div>
  );
}

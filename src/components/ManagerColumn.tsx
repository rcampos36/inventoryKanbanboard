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

export function ManagerColumn({ manager, cars, onMove }: ManagerColumnProps) {
  const containerId = managerContainerId(manager.id);
  const { setNodeRef, isOver } = useDroppable({
    id: containerId,
    data: { type: "manager", managerId: manager.id },
  });
  const color = getModelColor(manager.name);

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${color.accent}`}
        >
          {initials(manager.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-800">
            {manager.name}
          </h3>
          <p className="text-xs text-slate-500">
            {cars.length} {cars.length === 1 ? "demo" : "demos"}
          </p>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={[
          "flex flex-1 flex-col gap-2.5 rounded-b-2xl px-3 pb-3 pt-1",
          "min-h-32 transition-colors",
          isOver ? "bg-sky-50" : "",
        ].join(" ")}
      >
        <SortableContext
          items={cars.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cars.map((car) => (
            <CarCard key={car.id} car={car} onMove={onMove} />
          ))}
        </SortableContext>

        {cars.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
            Drop a demo car here
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CarCard } from "./CarCard";
import { getModelColor } from "@/lib/colors";
import { salespersonContainerId, type Car, type Salesperson } from "@/lib/types";

interface SalespersonColumnProps {
  salesperson: Salesperson;
  cars: Car[];
  rank: number;
  monthSoldCount: number;
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

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-amber-400 text-amber-950";
  if (rank === 2) return "bg-slate-300 text-slate-800";
  if (rank === 3) return "bg-orange-300 text-orange-950";
  return "bg-slate-100 text-slate-600";
}

export function SalespersonColumn({
  salesperson,
  cars,
  rank,
  monthSoldCount,
  onMove,
}: SalespersonColumnProps) {
  const containerId = salespersonContainerId(salesperson.id);
  const { setNodeRef, isOver } = useDroppable({
    id: containerId,
    data: { type: "salesperson", salespersonId: salesperson.id },
  });
  const color = getModelColor(salesperson.name);

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div className="relative shrink-0">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${color.accent}`}
          >
            {initials(salesperson.name)}
          </span>
          <span
            className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${rankBadgeClass(rank)}`}
            title={`Rank #${rank}`}
          >
            #{rank}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-800">
            {salesperson.name}
          </h3>
          <p className="text-xs text-slate-500">
            {monthSoldCount} {monthSoldCount === 1 ? "sale" : "sales"} this month
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
          items={cars.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cars.map((car) => (
            <CarCard key={car.id} car={car} onMove={onMove} />
          ))}
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

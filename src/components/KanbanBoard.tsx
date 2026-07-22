"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  COLUMNS,
  INITIAL_CARS,
  INTAKE_COLUMNS,
  MANAGERS,
  MODEL_COLUMNS,
  SALESPEOPLE,
} from "@/lib/data";
import {
  applyContainerLocation,
  carContainerId,
  currentMonthKey,
  formatMonthLabel,
  managerContainerId,
  monthKeyFromDate,
  overnightContainerId,
  salespersonContainerId,
  type Car,
} from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";
import { SalespersonColumn } from "./SalespersonColumn";
import { ManagerColumn } from "./ManagerColumn";
import { OvernightColumn } from "./OvernightColumn";
import { CarCard } from "./CarCard";
import { AddCarModal } from "./AddCarModal";

type Board = Record<string, Car[]>;
type ConditionFilter = "all" | "new" | "used";

const CONTAINER_IDS: string[] = [
  ...COLUMNS.map((c) => c.id),
  ...SALESPEOPLE.map((s) => salespersonContainerId(s.id)),
  ...MANAGERS.map((m) => managerContainerId(m.id)),
  ...SALESPEOPLE.map((s) => overnightContainerId(s.id)),
];

function groupCars(cars: Car[]): Board {
  const board: Board = {};
  for (const id of CONTAINER_IDS) board[id] = [];
  for (const car of cars) {
    (board[carContainerId(car)] ??= []).push(car);
  }
  return board;
}

let carCounter = INITIAL_CARS.length;

export function KanbanBoard() {
  const [board, setBoard] = useState<Board>(() => groupCars(INITIAL_CARS));
  const [activeCar, setActiveCar] = useState<Car | null>(null);
  const [query, setQuery] = useState("");
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [salesMonth, setSalesMonth] = useState(currentMonthKey);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredBoard = useMemo<Board>(() => {
    const q = query.trim().toLowerCase();
    const result: Board = {};
    for (const id of CONTAINER_IDS) {
      result[id] = (board[id] ?? []).filter((car) => {
        const matchesCondition =
          conditionFilter === "all" || car.condition === conditionFilter;
        if (!matchesCondition) return false;
        if (!q) return true;
        const haystack =
          `${car.stockNumber} ${car.year} ${car.make} ${car.model} ${car.trim}`.toLowerCase();
        return haystack.includes(q);
      });
    }
    return result;
  }, [board, query, conditionFilter]);

  const totalCount = useMemo(
    () => Object.values(board).reduce((sum, list) => sum + list.length, 0),
    [board]
  );

  const isFiltering = conditionFilter !== "all" || query.trim() !== "";

  const visibleModelColumns = MODEL_COLUMNS.filter(
    (column) => !isFiltering || (filteredBoard[column.id]?.length ?? 0) > 0
  );
  const visibleIntakeColumns = INTAKE_COLUMNS.filter(
    (column) => !isFiltering || (filteredBoard[column.id]?.length ?? 0) > 0
  );

  const salesMonthOptions = useMemo(() => {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      options.push(key);
    }
    return options;
  }, []);

  const rankedSalespeople = useMemo(() => {
    const scored = SALESPEOPLE.map((person) => {
      const allCars = board[salespersonContainerId(person.id)] ?? [];
      const monthCars = allCars.filter(
        (car) => car.soldAt && monthKeyFromDate(car.soldAt) === salesMonth
      );
      return { person, monthCars, count: monthCars.length };
    });

    scored.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.person.name.localeCompare(b.person.name);
    });

    return scored.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [board, salesMonth]);

  function findContainer(id: string): string | undefined {
    if (id in board) return id;
    return CONTAINER_IDS.find((containerId) =>
      board[containerId]?.some((car) => car.id === id)
    );
  }

  function handleDragStart(event: DragStartEvent) {
    const car = event.active.data.current?.car as Car | undefined;
    if (car) setActiveCar(car);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }

    setBoard((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((c) => c.id === activeId);
      if (activeIndex === -1) return prev;

      const moved = applyContainerLocation(
        activeItems[activeIndex],
        overContainer
      );
      const overIndex = overItems.findIndex((c) => c.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;

      return {
        ...prev,
        [activeContainer]: activeItems.filter((c) => c.id !== activeId),
        [overContainer]: [
          ...overItems.slice(0, insertAt),
          moved,
          ...overItems.slice(insertAt),
        ],
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCar(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      const items = board[activeContainer];
      const oldIndex = items.findIndex((c) => c.id === activeId);
      const newIndex = items.findIndex((c) => c.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setBoard((prev) => ({
          ...prev,
          [activeContainer]: arrayMove(prev[activeContainer], oldIndex, newIndex),
        }));
      }
    }
  }

  function moveCar(carId: string, targetContainerId: string) {
    setBoard((prev) => {
      const source = CONTAINER_IDS.find((id) =>
        prev[id]?.some((c) => c.id === carId)
      );
      if (!source || source === targetContainerId) return prev;
      const car = prev[source].find((c) => c.id === carId);
      if (!car) return prev;
      const moved = applyContainerLocation(car, targetContainerId);
      return {
        ...prev,
        [source]: prev[source].filter((c) => c.id !== carId),
        [targetContainerId]: [...(prev[targetContainerId] ?? []), moved],
      };
    });
  }

  function handleAddCar(car: Omit<Car, "id">) {
    carCounter += 1;
    const newCar: Car = { ...car, id: `car-${carCounter}` };
    setBoard((prev) => ({
      ...prev,
      [newCar.columnId]: [...(prev[newCar.columnId] ?? []), newCar],
    }));
  }

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Loading board…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Inventory Kanban Board
            </h1>
            <p className="text-sm text-slate-500">
              {totalCount} vehicles · {COLUMNS.length} columns ·{" "}
              {SALESPEOPLE.length} salespeople · {MANAGERS.length} managers
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stock #, make, model…"
                className="w-64 rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div className="flex overflow-hidden rounded-lg border border-slate-300">
              {(["all", "new", "used"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setConditionFilter(option)}
                  className={[
                    "px-3 py-2 text-xs font-semibold capitalize transition-colors",
                    conditionFilter === option
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {option}
                </button>
              ))}
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Vehicle
            </button>
          </div>
        </div>
      </header>

      <DndContext
        id="inventory-kanban"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          {visibleModelColumns.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Inventory by Model
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-1">
                {visibleModelColumns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    cars={filteredBoard[column.id] ?? []}
                    onMove={moveCar}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sales Team · Sold by
              </h2>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                Month
                <select
                  value={salesMonth}
                  onChange={(e) => setSalesMonth(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                >
                  {salesMonthOptions.map((key) => (
                    <option key={key} value={key}>
                      {formatMonthLabel(key)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {rankedSalespeople.map(({ person, monthCars, count, rank }) => (
                <SalespersonColumn
                  key={person.id}
                  salesperson={person}
                  cars={monthCars}
                  rank={rank}
                  monthSoldCount={count}
                  onMove={moveCar}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Manager Demos
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {MANAGERS.map((manager) => (
                <ManagerColumn
                  key={manager.id}
                  manager={manager}
                  cars={board[managerContainerId(manager.id)] ?? []}
                  onMove={moveCar}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Team Overnight Demos
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-1">
              {SALESPEOPLE.map((person) => (
                <OvernightColumn
                  key={person.id}
                  person={person}
                  cars={board[overnightContainerId(person.id)] ?? []}
                  onMove={moveCar}
                />
              ))}
            </div>
          </section>

          {visibleIntakeColumns.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Incoming · DX · Loaners
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-1">
                {visibleIntakeColumns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    cars={filteredBoard[column.id] ?? []}
                    onMove={moveCar}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <DragOverlay>
          {activeCar ? <CarCard car={activeCar} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <AddCarModal
        open={modalOpen}
        columns={COLUMNS}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddCar}
      />
    </div>
  );
}

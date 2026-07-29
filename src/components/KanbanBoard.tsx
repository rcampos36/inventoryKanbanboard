"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  INTAKE_COLUMNS,
  MANAGERS,
  MODEL_COLUMNS,
  SALESPEOPLE,
} from "@/lib/data";
import {
  applyContainerLocation,
  applyHalfDeal,
  carContainerId,
  carInvolvesSalesperson,
  currentMonthKey,
  formatMonthLabel,
  formatShortDate,
  isCheckoutAssignment,
  managerContainerId,
  monthKeyFromDate,
  needsCheckoutDates,
  overnightContainerId,
  saleCreditFor,
  salespersonContainerId,
  addDaysIsoDate,
  todayIsoDate,
  tomorrowIsoDate,
  type Car,
  type CheckoutDates,
} from "@/lib/types";
import {
  overnightDueStatus,
  resolveOvernightHomeColumnId,
} from "@/lib/suggest-column";
import {
  clearAllCarsAction,
  createCarAction,
  updateCarAction,
  updateCarsAction,
} from "@/app/actions/cars";
import { setOpenSalesDayAction } from "@/app/actions/settings";
import { KanbanColumn } from "./KanbanColumn";
import { SalespersonColumn } from "./SalespersonColumn";
import { TodaySalesColumn } from "./TodaySalesColumn";
import { ManagerColumn } from "./ManagerColumn";
import { OvernightColumn } from "./OvernightColumn";
import { CarCard } from "./CarCard";
import { AddCarModal } from "./AddCarModal";
import { CheckoutDatesModal } from "./CheckoutDatesModal";
import { OvernightDueModal } from "./OvernightDueModal";
import { HalfDealModal } from "./HalfDealModal";
import { ConfirmClearBoardModal } from "./ConfirmClearBoardModal";
import {
  DEFAULT_SECTION_VISIBILITY,
  loadSectionVisibility,
  saveSectionVisibility,
  SectionVisibilityMenu,
  type SectionVisibility,
} from "./SectionVisibilityMenu";

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

function persistCar(car: Car) {
  void updateCarAction(car).catch((error) => {
    console.error("Failed to save vehicle", error);
  });
}

function persistCars(cars: Car[]) {
  void updateCarsAction(cars).catch((error) => {
    console.error("Failed to save vehicle order", error);
  });
}

interface KanbanBoardProps {
  initialCars: Car[];
  initialSalesDay: string;
  headerActions?: React.ReactNode;
}

export function KanbanBoard({
  initialCars,
  initialSalesDay,
  headerActions,
}: KanbanBoardProps) {
  const [board, setBoard] = useState<Board>(() => groupCars(initialCars));
  const [activeCar, setActiveCar] = useState<Car | null>(null);
  const [query, setQuery] = useState("");
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearingBoard, setClearingBoard] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [salesMonth, setSalesMonth] = useState(currentMonthKey);
  const [salesDay, setSalesDay] = useState(initialSalesDay);
  const [savingSalesDay, setSavingSalesDay] = useState(false);
  const [halfDealCarId, setHalfDealCarId] = useState<string | null>(null);
  const [checkoutPrompt, setCheckoutPrompt] = useState<{
    carId: string;
    targetContainerId: string;
    outDate: string;
    returnDate: string;
    tagNumber: string;
    mode: "assign" | "edit";
  } | null>(null);
  const [overnightDueCarId, setOvernightDueCarId] = useState<string | null>(
    null
  );
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>(
    DEFAULT_SECTION_VISIBILITY
  );
  const dragSourceRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setSectionVisibility(loadSectionVisibility());
  }, []);

  function updateSectionVisibility(next: SectionVisibility) {
    setSectionVisibility(next);
    saveSectionVisibility(next);
  }

  // Overnight (or anytime the calendar date changes): roll the sales day forward.
  useEffect(() => {
    let lastCalendarDay = todayIsoDate();

    function syncCalendarDay() {
      const now = todayIsoDate();
      if (now !== lastCalendarDay) {
        lastCalendarDay = now;
        void persistSalesDay(now);
      }
    }

    const intervalId = window.setInterval(syncCalendarDay, 30_000);
    window.addEventListener("focus", syncCalendarDay);
    document.addEventListener("visibilitychange", syncCalendarDay);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncCalendarDay);
      document.removeEventListener("visibilitychange", syncCalendarDay);
    };
  }, []);

  async function persistSalesDay(nextDay: string) {
    setSalesDay(nextDay);
    setSavingSalesDay(true);
    try {
      const saved = await setOpenSalesDayAction(nextDay);
      setSalesDay(saved);
    } catch (error) {
      console.error("Failed to save sales day", error);
    } finally {
      setSavingSalesDay(false);
    }
  }

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

  const allSoldCars = useMemo(() => {
    return SALESPEOPLE.flatMap(
      (person) => board[salespersonContainerId(person.id)] ?? []
    );
  }, [board]);

  const rankedSalespeople = useMemo(() => {
    const scored = SALESPEOPLE.map((person) => {
      const monthCarsAll = allSoldCars.filter(
        (car) =>
          car.soldAt &&
          monthKeyFromDate(car.soldAt) === salesMonth &&
          carInvolvesSalesperson(car, person.id)
      );
      // Open sales day stays in Daily Sales until End day / overnight rollover.
      const monthCars = monthCarsAll.filter((car) => car.soldAt !== salesDay);
      const count = monthCarsAll.reduce(
        (sum, car) => sum + saleCreditFor(car, person.id),
        0
      );
      return { person, monthCars, count };
    });

    scored.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.person.name.localeCompare(b.person.name);
    });

    return scored.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [allSoldCars, salesMonth, salesDay]);

  const todaySalesByPerson = useMemo(() => {
    return SALESPEOPLE.map((person) => {
      const todayCars = allSoldCars.filter(
        (car) =>
          car.soldAt === salesDay && carInvolvesSalesperson(car, person.id)
      );
      const saleCount = todayCars.reduce(
        (sum, car) => sum + saleCreditFor(car, person.id),
        0
      );
      return { person, todayCars, saleCount };
    });
  }, [allSoldCars, salesDay]);

  const dueOvernightDemos = useMemo(() => {
    const today = todayIsoDate();
    const items: { car: Car; status: "due" | "overdue" }[] = [];
    for (const person of SALESPEOPLE) {
      for (const car of board[overnightContainerId(person.id)] ?? []) {
        const status = overnightDueStatus(car.returnDate, today);
        if (status === "due" || status === "overdue") {
          items.push({ car, status });
        }
      }
    }
    return items.sort((a, b) => {
      if (a.status !== b.status) return a.status === "overdue" ? -1 : 1;
      return (a.car.returnDate ?? "").localeCompare(b.car.returnDate ?? "");
    });
  }, [board]);

  const halfDealFound = halfDealCarId ? findCar(halfDealCarId) : null;

  function endSalesDay() {
    void persistSalesDay(addDaysIsoDate(salesDay, 1));
  }

  function findContainer(id: string): string | undefined {
    if (id in board) return id;
    return CONTAINER_IDS.find((containerId) =>
      board[containerId]?.some((car) => car.id === id)
    );
  }

  function handleDragStart(event: DragStartEvent) {
    const car = event.active.data.current?.car as Car | undefined;
    if (car) setActiveCar(car);
    dragSourceRef.current = findContainer(String(event.active.id)) ?? null;
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
        overContainer,
        undefined,
        salesDay
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

  function findCar(carId: string): { car: Car; containerId: string } | null {
    const containerId = CONTAINER_IDS.find((id) =>
      board[id]?.some((c) => c.id === carId)
    );
    if (!containerId) return null;
    const car = board[containerId].find((c) => c.id === carId);
    if (!car) return null;
    return { car, containerId };
  }

  function moveCar(
    carId: string,
    targetContainerId: string,
    checkoutDates?: CheckoutDates
  ) {
    const found = findCar(carId);
    if (!found) return;
    const { car, containerId: source } = found;

    // Editing dates in place (same overnight container).
    if (source === targetContainerId) {
      if (!checkoutDates) return;
      const updated: Car = {
        ...car,
        outDate: checkoutDates.outDate,
        returnDate: checkoutDates.returnDate,
        tagNumber: checkoutDates.tagNumber,
      };
      setBoard((prev) => ({
        ...prev,
        [source]: prev[source].map((c) => (c.id === carId ? updated : c)),
      }));
      persistCar(updated);
      return;
    }

    const moved = applyContainerLocation(
      car,
      targetContainerId,
      checkoutDates,
      salesDay
    );
    setBoard((prev) => ({
      ...prev,
      [source]: prev[source].filter((c) => c.id !== carId),
      [targetContainerId]: [...(prev[targetContainerId] ?? []), moved],
    }));
    persistCar(moved);
  }

  function requestMove(carId: string, targetContainerId: string) {
    const found = findCar(carId);
    if (!found) return;

    if (needsCheckoutDates(targetContainerId)) {
      setCheckoutPrompt({
        carId,
        targetContainerId,
        outDate: found.car.outDate ?? todayIsoDate(),
        returnDate: found.car.returnDate ?? tomorrowIsoDate(),
        tagNumber: found.car.tagNumber ?? "",
        mode: "assign",
      });
      return;
    }

    moveCar(carId, targetContainerId);
  }

  function assignHalfDeal(
    carId: string,
    primaryId: string,
    partnerId: string
  ) {
    const found = findCar(carId);
    if (!found) return;

    const moved = applyHalfDeal(found.car, primaryId, partnerId, salesDay);
    const target = salespersonContainerId(primaryId);
    const source = found.containerId;

    if (source === target) {
      setBoard((prev) => ({
        ...prev,
        [source]: prev[source].map((c) => (c.id === carId ? moved : c)),
      }));
    } else {
      setBoard((prev) => ({
        ...prev,
        [source]: prev[source].filter((c) => c.id !== carId),
        [target]: [...(prev[target] ?? []), moved],
      }));
    }
    persistCar(moved);
    setHalfDealCarId(null);
  }

  function halfDealWith(carId: string, partnerId: string) {
    const found = findCar(carId);
    if (!found?.car.salespersonId) {
      setHalfDealCarId(carId);
      return;
    }
    assignHalfDeal(carId, found.car.salespersonId, partnerId);
  }

  function clearHalfDeal(carId: string) {
    const found = findCar(carId);
    if (!found) return;
    const updated: Car = { ...found.car, coSalespersonId: undefined };
    setBoard((prev) => ({
      ...prev,
      [found.containerId]: prev[found.containerId].map((c) =>
        c.id === carId ? updated : c
      ),
    }));
    persistCar(updated);
  }

  function requestEditCheckoutDates(carId: string) {
    const found = findCar(carId);
    if (!found || !isCheckoutAssignment(found.car)) return;
    setCheckoutPrompt({
      carId,
      targetContainerId: found.containerId,
      outDate: found.car.outDate ?? todayIsoDate(),
      returnDate: found.car.returnDate ?? tomorrowIsoDate(),
      tagNumber: found.car.tagNumber ?? "",
      mode: "edit",
    });
  }

  function extendOvernightDemo(carId: string, returnDate: string) {
    const found = findCar(carId);
    if (!found || !isCheckoutAssignment(found.car)) return;
    const updated: Car = {
      ...found.car,
      returnDate,
      outDate: found.car.outDate ?? todayIsoDate(),
      tagNumber: found.car.tagNumber ?? "",
    };
    setBoard((prev) => ({
      ...prev,
      [found.containerId]: prev[found.containerId].map((c) =>
        c.id === carId ? updated : c
      ),
    }));
    persistCar(updated);
    setOvernightDueCarId(null);
  }

  function markOvernightReturned(carId: string) {
    const found = findCar(carId);
    if (!found || !isCheckoutAssignment(found.car)) return;
    const homeColumnId = resolveOvernightHomeColumnId(found.car);
    moveCar(carId, homeColumnId);
    setOvernightDueCarId(null);
  }

  const overnightDueCar = overnightDueCarId
    ? findCar(overnightDueCarId)?.car ?? null
    : null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCar(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // After dragOver, the car already lives in its destination container.
    const currentContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
    if (!currentContainer || !overContainer) return;

    if (currentContainer === overContainer) {
      const items = board[currentContainer];
      const oldIndex = items.findIndex((c) => c.id === activeId);
      const newIndex = items.findIndex((c) => c.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        setBoard((prev) => ({
          ...prev,
          [currentContainer]: reordered,
        }));
        persistCars(reordered);
      } else {
        const car = items.find((c) => c.id === activeId);
        if (car) persistCar(car);
      }
    }

    const car = board[currentContainer]?.find((c) => c.id === activeId);
    const cameFromElsewhere = dragSourceRef.current !== currentContainer;
    // After a drop onto overnight from another lane, confirm dates.
    if (needsCheckoutDates(currentContainer) && cameFromElsewhere && car) {
      setCheckoutPrompt({
        carId: activeId,
        targetContainerId: currentContainer,
        outDate: car.outDate ?? todayIsoDate(),
        returnDate: car.returnDate ?? tomorrowIsoDate(),
        tagNumber: car.tagNumber ?? "",
        mode: "assign",
      });
    }
    dragSourceRef.current = null;
  }

  async function handleAddCar(car: Omit<Car, "id">) {
    try {
      const created = await createCarAction(car);
      setBoard((prev) => ({
        ...prev,
        [created.columnId]: [...(prev[created.columnId] ?? []), created],
      }));
    } catch (error) {
      console.error("Failed to add vehicle", error);
    }
  }

  async function handleClearAllCars() {
    setClearingBoard(true);
    try {
      await clearAllCarsAction();
      setBoard(groupCars([]));
      setClearConfirmOpen(false);
    } catch (error) {
      console.error("Failed to clear board", error);
    } finally {
      setClearingBoard(false);
    }
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

            <SectionVisibilityMenu
              visibility={sectionVisibility}
              onChange={updateSectionVisibility}
            />

            <button
              type="button"
              onClick={() => setClearConfirmOpen(true)}
              disabled={totalCount === 0}
              className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
              title="Remove every vehicle from the board"
            >
              Start from zero
            </button>

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

            {headerActions}
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
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {sectionVisibility.inventory && visibleModelColumns.length > 0 && (
            <aside
              className={[
                "min-h-0 w-full shrink-0 overflow-y-auto border-b border-slate-200 bg-slate-50/60 p-4 lg:border-b-0 lg:border-r",
                sectionVisibility.sales ||
                sectionVisibility.dailySales ||
                sectionVisibility.managers ||
                sectionVisibility.overnight ||
                sectionVisibility.intake
                  ? "lg:w-[min(42rem,45%)]"
                  : "lg:flex-1",
              ].join(" ")}
            >
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Inventory by Model
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {visibleModelColumns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    className="flex min-w-0 w-full flex-col rounded-2xl bg-slate-100/80"
                    cars={filteredBoard[column.id] ?? []}
                    onMove={requestMove}
                    onEditCheckoutDates={requestEditCheckoutDates}
                    onRequestHalfDeal={setHalfDealCarId}
                    onHalfDealWith={halfDealWith}
                    onClearHalfDeal={clearHalfDeal}
                  />
                ))}
              </div>
            </aside>
          )}

          {(sectionVisibility.sales ||
            sectionVisibility.dailySales ||
            sectionVisibility.managers ||
            sectionVisibility.overnight ||
            sectionVisibility.intake) && (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
            {(sectionVisibility.sales || sectionVisibility.dailySales) && (
            <section>
              {sectionVisibility.sales && (
                <>
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {rankedSalespeople.map(({ person, monthCars, count, rank }) => (
                  <SalespersonColumn
                    key={person.id}
                    salesperson={person}
                    cars={monthCars}
                    rank={rank}
                    monthSoldCount={count}
                    onMove={requestMove}
                    onRequestHalfDeal={setHalfDealCarId}
                    onHalfDealWith={halfDealWith}
                    onClearHalfDeal={clearHalfDeal}
                  />
                ))}
              </div>
                </>
              )}

              {sectionVisibility.dailySales && (
              <div className={sectionVisibility.sales ? "mt-5" : undefined}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Daily Sales · {formatShortDate(salesDay)}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      Date
                      <input
                        type="date"
                        value={salesDay}
                        disabled={savingSalesDay}
                        onChange={(e) => {
                          if (e.target.value)
                            void persistSalesDay(e.target.value);
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={savingSalesDay}
                      onClick={() => void persistSalesDay(todayIsoDate())}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      disabled={savingSalesDay}
                      onClick={endSalesDay}
                      className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                      title="Close this sales day and move these sales into each team member's monthly column"
                    >
                      {savingSalesDay ? "Saving…" : "End day"}
                    </button>
                  </div>
                </div>
                <p className="mb-3 text-xs text-slate-500">
                  Drop sales here for this date. End day (or overnight) moves
                  them into the monthly columns above.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {todaySalesByPerson.map(
                    ({ person, todayCars, saleCount }) => (
                      <TodaySalesColumn
                        key={person.id}
                        salesperson={person}
                        cars={todayCars}
                        saleCount={saleCount}
                        onMove={requestMove}
                        onRequestHalfDeal={setHalfDealCarId}
                        onHalfDealWith={halfDealWith}
                        onClearHalfDeal={clearHalfDeal}
                      />
                    ),
                  )}
                </div>
              </div>
              )}
            </section>
            )}

            {sectionVisibility.managers && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Manager Demos
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                {MANAGERS.map((manager) => (
                  <ManagerColumn
                    key={manager.id}
                    manager={manager}
                    cars={board[managerContainerId(manager.id)] ?? []}
                    onMove={requestMove}
                  />
                ))}
              </div>
            </section>
            )}

            {sectionVisibility.overnight && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Team Overnight Demos
              </h2>
              {dueOvernightDemos.length > 0 && (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    {dueOvernightDemos.length} demo
                    {dueOvernightDemos.length === 1 ? "" : "s"} due back
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {dueOvernightDemos.map(({ car, status }) => (
                      <li key={car.id}>
                        <button
                          type="button"
                          onClick={() => setOvernightDueCarId(car.id)}
                          className="flex w-full items-center justify-between gap-2 rounded-lg bg-white/80 px-2.5 py-1.5 text-left text-xs font-semibold text-slate-800 ring-1 ring-amber-200/80 hover:bg-white"
                        >
                          <span className="min-w-0 truncate">
                            #{car.stockNumber}
                            {car.tagNumber ? ` · Tag ${car.tagNumber}` : ""}
                            {" · "}
                            {car.model}
                          </span>
                          <span
                            className={[
                              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              status === "overdue"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-900",
                            ].join(" ")}
                          >
                            {status === "overdue" ? "Past due" : "Due today"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SALESPEOPLE.map((person) => (
                  <OvernightColumn
                    key={person.id}
                    person={person}
                    cars={board[overnightContainerId(person.id)] ?? []}
                    onMove={requestMove}
                    onEditCheckoutDates={requestEditCheckoutDates}
                    onReviewOvernightDue={setOvernightDueCarId}
                  />
                ))}
              </div>
            </section>
            )}

            {sectionVisibility.intake && visibleIntakeColumns.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Incoming · DX · Loaners
                </h2>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {visibleIntakeColumns.map((column) => (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      className="flex min-w-0 w-full flex-col rounded-2xl bg-slate-100/80"
                      cars={filteredBoard[column.id] ?? []}
                      onMove={requestMove}
                      onEditCheckoutDates={requestEditCheckoutDates}
                      onRequestHalfDeal={setHalfDealCarId}
                      onHalfDealWith={halfDealWith}
                      onClearHalfDeal={clearHalfDeal}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
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

      <CheckoutDatesModal
        open={Boolean(checkoutPrompt)}
        title={
          checkoutPrompt?.mode === "edit"
            ? "Edit overnight details"
            : "Overnight demo details"
        }
        subtitle={
          checkoutPrompt
            ? "Enter the tag number used, when the customer is taking the car out, and when it is due back."
            : undefined
        }
        initialOutDate={checkoutPrompt?.outDate}
        initialReturnDate={checkoutPrompt?.returnDate}
        initialTagNumber={checkoutPrompt?.tagNumber}
        onClose={() => setCheckoutPrompt(null)}
        onConfirm={(dates) => {
          if (!checkoutPrompt) return;
          moveCar(
            checkoutPrompt.carId,
            checkoutPrompt.targetContainerId,
            dates
          );
          setCheckoutPrompt(null);
        }}
      />

      <OvernightDueModal
        open={Boolean(overnightDueCar)}
        car={overnightDueCar}
        onClose={() => setOvernightDueCarId(null)}
        onExtend={extendOvernightDemo}
        onMarkReturned={markOvernightReturned}
      />

      <HalfDealModal
        open={Boolean(halfDealCarId)}
        initialPrimaryId={halfDealFound?.car.salespersonId}
        initialPartnerId={halfDealFound?.car.coSalespersonId}
        onClose={() => setHalfDealCarId(null)}
        onConfirm={(primaryId, partnerId) => {
          if (!halfDealCarId) return;
          assignHalfDeal(halfDealCarId, primaryId, partnerId);
        }}
      />

      <ConfirmClearBoardModal
        open={clearConfirmOpen}
        vehicleCount={totalCount}
        busy={clearingBoard}
        onClose={() => {
          if (!clearingBoard) setClearConfirmOpen(false);
        }}
        onConfirm={() => {
          void handleClearAllCars();
        }}
      />
    </div>
  );
}

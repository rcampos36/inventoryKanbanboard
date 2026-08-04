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
  INTAKE_COLUMNS,
  getColumns,
  getModelColumns,
  getNewModelColumns,
  getUsedColumns,
} from "@/lib/data";
import { BoardConfigProvider } from "./BoardConfigContext";
import {
  applyContainerLocation,
  applyHalfDeal,
  carContainerId,
  carInvolvesSalesperson,
  currentMonthKey,
  formatMonthLabel,
  formatSaleCount,
  formatShortDate,
  isCheckoutAssignment,
  managerContainerId,
  monthKeyFromDate,
  needsCheckoutDates,
  overnightContainerId,
  saleCreditFor,
  salespersonContainerId,
  workingDealContainerId,
  addDaysIsoDate,
  todayIsoDate,
  clampSaleDate,
  msUntilNextLocalMidnight,
  tomorrowIsoDate,
  type Car,
  type CheckoutDates,
  type Salesperson,
  type Manager,
} from "@/lib/types";
import {
  overnightDueStatus,
  resolveOvernightHomeColumnId,
} from "@/lib/suggest-column";
import {
  clearAllCarsAction,
  createCarAction,
  importInventoryAction,
  updateCarAction,
  updateCarsAction,
} from "@/app/actions/cars";
import { DEFAULT_BOARD_TITLE } from "@/lib/board";
import {
  setBoardTitleAction,
  setOpenSalesDayAction,
} from "@/app/actions/settings";
import {
  createSalespersonAction,
  deleteSalespersonAction,
} from "@/app/actions/salespeople";
import {
  createManagerAction,
  deleteManagerAction,
} from "@/app/actions/managers";
import { KanbanColumn } from "./KanbanColumn";
import { SalespersonColumn } from "./SalespersonColumn";
import { TodaySalesColumn } from "./TodaySalesColumn";
import { WorkingDealColumn } from "./WorkingDealColumn";
import { ManagerColumn } from "./ManagerColumn";
import { OvernightColumn } from "./OvernightColumn";
import { CarCard } from "./CarCard";
import { AddCarModal } from "./AddCarModal";
import { CheckoutDatesModal } from "./CheckoutDatesModal";
import { ExteriorColorModal } from "./ExteriorColorModal";
import { OvernightDueModal } from "./OvernightDueModal";
import { HalfDealModal } from "./HalfDealModal";
import { ConfirmClearBoardModal } from "./ConfirmClearBoardModal";
import { ImportInventoryModal } from "./ImportInventoryModal";
import { SalespeopleProvider } from "./SalespeopleContext";
import { ManagersProvider } from "./ManagersContext";
import { TeamLaneItem, TeamLaneScroll } from "./TeamLaneScroll";
import {
  DEFAULT_SECTION_VISIBILITY,
  loadSectionVisibility,
  saveSectionVisibility,
  SectionVisibilityMenu,
  type SectionVisibility,
} from "./SectionVisibilityMenu";

type Board = Record<string, Car[]>;
type ConditionFilter = "all" | "new" | "used";
type MobilePane = "inventory" | "floor";

function containerIdsFor(
  salespeople: Salesperson[],
  managers: Manager[],
  brand: string
): string[] {
  return [
    ...getColumns(brand).map((c) => c.id),
    ...salespeople.map((s) => salespersonContainerId(s.id)),
    ...salespeople.map((s) => workingDealContainerId(s.id)),
    ...managers.map((m) => managerContainerId(m.id)),
    ...salespeople.map((s) => overnightContainerId(s.id)),
  ];
}

function groupCars(
  cars: Car[],
  salespeople: Salesperson[],
  managers: Manager[],
  brand: string
): Board {
  const board: Board = {};
  for (const id of containerIdsFor(salespeople, managers, brand)) board[id] = [];
  for (const car of cars) {
    (board[carContainerId(car)] ??= []).push(car);
  }
  return board;
}

function personContainerIds(personId: string): string[] {
  return [
    salespersonContainerId(personId),
    workingDealContainerId(personId),
    overnightContainerId(personId),
  ];
}

interface KanbanBoardProps {
  initialCars: Car[];
  initialSalesDay: string;
  initialBoardTitle?: string;
  initialSalespeople: Salesperson[];
  initialManagers: Manager[];
  organizationName?: string;
  organizationBrand?: string;
  isAdmin?: boolean;
  headerActions?: React.ReactNode;
  /**
   * Public sales-demo board: in-memory only, no DB writes.
   * End day advances the simulated calendar so sales move into Sold by.
   */
  sandbox?: boolean;
}

export function KanbanBoard({
  initialCars,
  initialSalesDay,
  initialBoardTitle = DEFAULT_BOARD_TITLE,
  initialSalespeople,
  initialManagers,
  organizationName,
  organizationBrand = "Mazda",
  isAdmin = false,
  headerActions,
  sandbox = false,
}: KanbanBoardProps) {
  const brand = organizationBrand;
  const modelColumns = useMemo(() => getModelColumns(brand), [brand]);
  const newModelColumns = useMemo(() => getNewModelColumns(brand), [brand]);
  const usedModelColumns = useMemo(() => getUsedColumns(brand), [brand]);
  const inventoryColumns = useMemo(() => getColumns(brand), [brand]);
  const [salespeople, setSalespeople] =
    useState<Salesperson[]>(initialSalespeople);
  const [managers, setManagers] = useState<Manager[]>(initialManagers);
  const [board, setBoard] = useState<Board>(() =>
    groupCars(initialCars, initialSalespeople, initialManagers, brand)
  );
  const [activeCar, setActiveCar] = useState<Car | null>(null);
  const [query, setQuery] = useState("");
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearingBoard, setClearingBoard] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [salesMonth, setSalesMonth] = useState(currentMonthKey);
  /** First sales day that is still open — sales before this belong in Sold by. */
  const [salesDay, setSalesDay] = useState(initialSalesDay);
  const salesDayRef = useRef(salesDay);
  salesDayRef.current = salesDay;
  /** Date shown in Daily Sales (picker). Does not reopen closed days. */
  const [viewSalesDay, setViewSalesDay] = useState(() =>
    clampSaleDate(initialSalesDay)
  );
  /** Local calendar day — drives when "today's" sales move to Sold by at midnight. */
  const [calendarDay, setCalendarDay] = useState(todayIsoDate);
  const [savingSalesDay, setSavingSalesDay] = useState(false);

  function persistCar(car: Car) {
    if (sandbox) return;
    void updateCarAction(car).catch((error) => {
      console.error("Failed to save vehicle", error);
    });
  }

  function persistCars(cars: Car[]) {
    if (sandbox) return;
    void updateCarsAction(cars).catch((error) => {
      console.error("Failed to save vehicle order", error);
    });
  }
  const [boardTitle, setBoardTitle] = useState(initialBoardTitle);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(initialBoardTitle);
  const [savingTitle, setSavingTitle] = useState(false);
  const [newSalespersonName, setNewSalespersonName] = useState("");
  const [savingSalesperson, setSavingSalesperson] = useState(false);
  const [salespersonError, setSalespersonError] = useState<string | null>(null);
  const [newManagerName, setNewManagerName] = useState("");
  const [savingManager, setSavingManager] = useState(false);
  const [managerError, setManagerError] = useState<string | null>(null);
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
  const [exteriorColorCarId, setExteriorColorCarId] = useState<string | null>(
    null
  );
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>(
    DEFAULT_SECTION_VISIBILITY
  );
  const [mobilePane, setMobilePane] = useState<MobilePane>("inventory");
  const dragSourceRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setSectionVisibility(loadSectionVisibility());
  }, []);

  function updateSectionVisibility(next: SectionVisibility) {
    setSectionVisibility(next);
    saveSectionVisibility(next);
  }

  /** Sandbox: jump the calendar forward so Daily Sales move into Sold by. */
  function advanceSandboxDay() {
    const next = addDaysIsoDate(calendarDay, 1);
    setCalendarDay(next);
    setViewSalesDay(next);
    setSalesDay(next);
    salesDayRef.current = next;
  }

  function resetSandboxBoard() {
    const today = todayIsoDate();
    setBoard(
      groupCars(initialCars, initialSalespeople, initialManagers, brand)
    );
    setSalespeople(initialSalespeople);
    setManagers(initialManagers);
    setCalendarDay(today);
    setViewSalesDay(today);
    setSalesDay(today);
    salesDayRef.current = today;
    setSalesMonth(currentMonthKey());
    setQuery("");
    setConditionFilter("all");
  }

  // Auto End day at local midnight (and whenever the open day is behind).
  useEffect(() => {
    if (sandbox) return;
    let midnightTimeoutId = 0;
    let rolling = false;

    async function rollOpenSalesDayIfPast() {
      const today = todayIsoDate();
      setCalendarDay((prev) => (prev !== today ? today : prev));
      if (salesDayRef.current >= today || rolling) return;
      rolling = true;
      try {
        await persistSalesDay(today);
      } finally {
        rolling = false;
      }
    }

    function onFocusOrVisible() {
      void rollOpenSalesDayIfPast();
    }

    function scheduleMidnightRoll() {
      window.clearTimeout(midnightTimeoutId);
      midnightTimeoutId = window.setTimeout(() => {
        void rollOpenSalesDayIfPast();
        scheduleMidnightRoll();
      }, msUntilNextLocalMidnight() + 500);
    }

    void rollOpenSalesDayIfPast();
    scheduleMidnightRoll();
    const intervalId = window.setInterval(() => {
      void rollOpenSalesDayIfPast();
    }, 60_000);
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.clearTimeout(midnightTimeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- uses salesDayRef for the open day
  }, [sandbox]);

  async function persistSalesDay(nextDay: string) {
    const today = todayIsoDate();
    // Open day may move to tomorrow after End day, but the picker/stamp
    // date must never sit in the future (except in the sales sandbox).
    const viewDay =
      sandbox || nextDay <= today ? nextDay : today;
    setSalesDay(nextDay);
    setViewSalesDay(viewDay);
    salesDayRef.current = nextDay;
    if (sandbox) return;
    setSavingSalesDay(true);
    try {
      const saved = await setOpenSalesDayAction(nextDay);
      setSalesDay(saved);
      setViewSalesDay(saved > today ? today : saved);
      salesDayRef.current = saved;
    } catch (error) {
      console.error("Failed to save sales day", error);
    } finally {
      setSavingSalesDay(false);
    }
  }

  /** Close the open sales day. Sandbox advances the simulated calendar too. */
  function endSalesDay() {
    if (sandbox) {
      advanceSandboxDay();
      return;
    }
    const today = todayIsoDate();
    const next = addDaysIsoDate(salesDayRef.current, 1);
    void persistSalesDay(next < today ? today : next);
  }

  function startEditingTitle() {
    setTitleDraft(boardTitle);
    setEditingTitle(true);
  }

  async function saveBoardTitle() {
    const next = titleDraft.trim() || DEFAULT_BOARD_TITLE;
    if (sandbox) {
      setBoardTitle(next);
      setEditingTitle(false);
      if (typeof document !== "undefined") document.title = next;
      return;
    }
    setSavingTitle(true);
    try {
      const saved = await setBoardTitleAction(next);
      setBoardTitle(saved);
      setEditingTitle(false);
      if (typeof document !== "undefined") {
        document.title = saved;
      }
    } catch (error) {
      console.error("Failed to save board title", error);
    } finally {
      setSavingTitle(false);
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

  const containerIds = useMemo(
    () => containerIdsFor(salespeople, managers, brand),
    [salespeople, managers, brand]
  );

  const filteredBoard = useMemo<Board>(() => {
    const q = query.trim().toLowerCase();
    const result: Board = {};
    for (const id of containerIds) {
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
  }, [board, query, conditionFilter, containerIds]);

  const totalCount = useMemo(
    () => Object.values(board).reduce((sum, list) => sum + list.length, 0),
    [board]
  );

  const isFiltering = conditionFilter !== "all" || query.trim() !== "";

  const visibleModelColumns = modelColumns.filter(
    (column) => !isFiltering || (filteredBoard[column.id]?.length ?? 0) > 0
  );
  const visibleNewModelColumns = newModelColumns.filter(
    (column) => !isFiltering || (filteredBoard[column.id]?.length ?? 0) > 0
  );
  const visibleUsedModelColumns = usedModelColumns.filter(
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
    return salespeople.flatMap(
      (person) => board[salespersonContainerId(person.id)] ?? []
    );
  }, [board, salespeople]);

  const rankedSalespeople = useMemo(() => {
    const scored = salespeople.map((person) => {
      const monthCarsAll = allSoldCars.filter(
        (car) =>
          car.soldAt &&
          monthKeyFromDate(car.soldAt) === salesMonth &&
          carInvolvesSalesperson(car, person.id)
      );
      // Sold by only shows days before the active calendar day. In the sandbox,
      // End day moves that calendar so presenters can show the rollover live.
      const monthCars = monthCarsAll.filter(
        (car) => car.soldAt && car.soldAt < calendarDay
      );
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
  }, [allSoldCars, salesMonth, calendarDay, salespeople]);

  const monthSalesTotal = useMemo(
    () => rankedSalespeople.reduce((sum, row) => sum + row.count, 0),
    [rankedSalespeople]
  );

  const dailySalesDay = viewSalesDay > calendarDay ? calendarDay : viewSalesDay;

  const todaySalesByPerson = useMemo(() => {
    return salespeople.map((person) => {
      const todayCars = allSoldCars.filter(
        (car) =>
          car.soldAt === dailySalesDay &&
          carInvolvesSalesperson(car, person.id)
      );
      const saleCount = todayCars.reduce(
        (sum, car) => sum + saleCreditFor(car, person.id),
        0
      );
      return { person, todayCars, saleCount };
    });
  }, [allSoldCars, dailySalesDay, salespeople]);

  const todaySalesTotal = useMemo(
    () => todaySalesByPerson.reduce((sum, row) => sum + row.saleCount, 0),
    [todaySalesByPerson]
  );

  const dueOvernightDemos = useMemo(() => {
    const today = todayIsoDate();
    const items: { car: Car; status: "due" | "overdue" }[] = [];
    for (const person of salespeople) {
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
  }, [board, salespeople]);

  const halfDealFound = halfDealCarId ? findCar(halfDealCarId) : null;

  function findContainer(id: string): string | undefined {
    if (id in board) return id;
    return containerIds.find((containerId) =>
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
        dailySalesDay,
        calendarDay
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
    const containerId = containerIds.find((id) =>
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
      dailySalesDay,
      calendarDay
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

    const moved = applyHalfDeal(
      found.car,
      primaryId,
      partnerId,
      dailySalesDay,
      calendarDay
    );
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

  function saveExteriorColor(carId: string, exteriorColor: string) {
    const found = findCar(carId);
    if (!found) return;
    const updated: Car = {
      ...found.car,
      exteriorColor: exteriorColor || undefined,
    };
    setBoard((prev) => ({
      ...prev,
      [found.containerId]: prev[found.containerId].map((c) =>
        c.id === carId ? updated : c
      ),
    }));
    persistCar(updated);
    setExteriorColorCarId(null);
  }


  async function handleAddSalesperson(e: React.FormEvent) {
    e.preventDefault();
    const name = newSalespersonName.trim();
    if (!name || savingSalesperson) return;
    setSavingSalesperson(true);
    setSalespersonError(null);
    try {
      if (sandbox) {
        const person = {
          id: `demo-sp-${crypto.randomUUID()}`,
          name,
        };
        setSalespeople((prev) => [...prev, person]);
        setBoard((prev) => {
          const next = { ...prev };
          for (const id of personContainerIds(person.id)) {
            next[id] ??= [];
          }
          return next;
        });
        setNewSalespersonName("");
        return;
      }
      const result = await createSalespersonAction(name);
      if (!result.ok) {
        setSalespersonError(result.error);
        return;
      }
      setSalespeople((prev) => [...prev, result.person]);
      setBoard((prev) => {
        const next = { ...prev };
        for (const id of personContainerIds(result.person.id)) {
          next[id] ??= [];
        }
        return next;
      });
      setNewSalespersonName("");
    } catch (error) {
      console.error("Failed to add salesperson", error);
      setSalespersonError("Could not add salesperson.");
    } finally {
      setSavingSalesperson(false);
    }
  }

  async function handleDeleteSalesperson(personId: string) {
    const person = salespeople.find((s) => s.id === personId);
    if (!person) return;
    if (!window.confirm(`Remove ${person.name} from the sales team?`)) return;
    setSalespersonError(null);
    try {
      if (!sandbox) {
        const result = await deleteSalespersonAction(personId);
        if (!result.ok) {
          setSalespersonError(result.error);
          return;
        }
      }
      setSalespeople((prev) => prev.filter((s) => s.id !== personId));
      setBoard((prev) => {
        const next = { ...prev };
        for (const id of personContainerIds(personId)) {
          delete next[id];
        }
        return next;
      });
    } catch (error) {
      console.error("Failed to delete salesperson", error);
      setSalespersonError("Could not remove salesperson.");
    }
  }

  async function handleAddManager(e: React.FormEvent) {
    e.preventDefault();
    const name = newManagerName.trim();
    if (!name || savingManager) return;
    setSavingManager(true);
    setManagerError(null);
    try {
      if (sandbox) {
        const manager = {
          id: `demo-mgr-${crypto.randomUUID()}`,
          name,
        };
        setManagers((prev) => [...prev, manager]);
        setBoard((prev) => ({
          ...prev,
          [managerContainerId(manager.id)]: [],
        }));
        setNewManagerName("");
        return;
      }
      const result = await createManagerAction(name);
      if (!result.ok) {
        setManagerError(result.error);
        return;
      }
      setManagers((prev) => [...prev, result.manager]);
      setBoard((prev) => ({
        ...prev,
        [managerContainerId(result.manager.id)]: [],
      }));
      setNewManagerName("");
    } catch (error) {
      console.error("Failed to add manager", error);
      setManagerError("Could not add manager.");
    } finally {
      setSavingManager(false);
    }
  }

  async function handleDeleteManager(managerId: string) {
    const manager = managers.find((m) => m.id === managerId);
    if (!manager) return;
    if (!window.confirm(`Remove ${manager.name} from managers?`)) return;
    setManagerError(null);
    try {
      if (!sandbox) {
        const result = await deleteManagerAction(managerId);
        if (!result.ok) {
          setManagerError(result.error);
          return;
        }
      }
      setManagers((prev) => prev.filter((m) => m.id !== managerId));
      setBoard((prev) => {
        const next = { ...prev };
        delete next[managerContainerId(managerId)];
        return next;
      });
    } catch (error) {
      console.error("Failed to delete manager", error);
      setManagerError("Could not remove manager.");
    }
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
    const homeColumnId = resolveOvernightHomeColumnId(found.car, brand);
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
      if (sandbox) {
        const created: Car = { ...car, id: `demo-car-${crypto.randomUUID()}` };
        const columnId = carContainerId(created);
        setBoard((prev) => ({
          ...prev,
          [columnId]: [...(prev[columnId] ?? []), created],
        }));
        return;
      }
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
      if (!sandbox) {
        await clearAllCarsAction();
      }
      setBoard(groupCars([], salespeople, managers, brand));
      setClearConfirmOpen(false);
    } catch (error) {
      console.error("Failed to clear board", error);
    } finally {
      setClearingBoard(false);
    }
  }

  async function handleImportInventory(file: File) {
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await importInventoryAction(formData);
      if (result.ok && result.cars.length > 0) {
        setBoard((prev) => {
          const next = { ...prev };
          for (const car of result.cars) {
            const columnId = carContainerId(car);
            next[columnId] = [...(next[columnId] ?? []), car];
          }
          return next;
        });
      }
      return result;
    } finally {
      setImporting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-sand/60">
        Loading board…
      </div>
    );
  }

  const showInventoryPane =
    sectionVisibility.inventory && visibleModelColumns.length > 0;
  const showFloorPane =
    sectionVisibility.sales ||
    sectionVisibility.dailySales ||
    sectionVisibility.workingDeals ||
    sectionVisibility.managers ||
    sectionVisibility.overnight ||
    sectionVisibility.intake;

  return (
    <BoardConfigProvider brand={brand}>
    <SalespeopleProvider salespeople={salespeople}>
    <ManagersProvider managers={managers}>
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-col gap-3 border-b border-peach/50 bg-[var(--salestower-surface)] px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex justify-center">
          <span className="font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">
            SalesTower
          </span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1 basis-full sm:basis-auto">
            {editingTitle ? (
              <form
                className="flex max-w-xl flex-wrap items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveBoardTitle();
                }}
              >
                <input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  disabled={savingTitle}
                  autoFocus
                  className="min-w-0 flex-1 rounded-lg border border-peach/70 px-3 py-1.5 text-lg font-bold text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60 sm:text-xl"
                  aria-label="Board title"
                />
                <button
                  type="submit"
                  disabled={savingTitle}
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-60"
                >
                  {savingTitle ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  disabled={savingTitle}
                  onClick={() => {
                    setEditingTitle(false);
                    setTitleDraft(boardTitle);
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand/70 hover:bg-peach/35 disabled:opacity-60"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-lg font-bold text-brand sm:text-xl">
                  {boardTitle}
                </h1>
                <button
                  type="button"
                  onClick={startEditingTitle}
                  className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-brand/60 hover:bg-peach/35 hover:text-brand"
                  title="Rename board"
                >
                  Edit
                </button>
              </div>
            )}
            <p className="mt-0.5 text-xs text-brand/60 sm:text-sm">
              {organizationName ? `${organizationName} · ` : ""}
              {totalCount} vehicles · {salespeople.length} salespeople
              <span className="hidden sm:inline">
                {" "}
                · {managers.length} managers
              </span>
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
            <div className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:flex-none">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand/45"
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
                className="w-full rounded-lg border border-peach/70 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 sm:w-64"
              />
            </div>

            <div className="flex overflow-hidden rounded-lg border border-peach/70">
              {(["all", "new", "used"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setConditionFilter(option)}
                  className={[
                    "px-2.5 py-2 text-xs font-semibold capitalize transition-colors sm:px-3",
                    conditionFilter === option
                      ? "bg-brand text-sand"
                      : "bg-[var(--salestower-surface)] text-brand/70 hover:bg-peach/40",
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

            {(isAdmin || sandbox) && (
              <button
                type="button"
                onClick={() =>
                  sandbox ? resetSandboxBoard() : setClearConfirmOpen(true)
                }
                disabled={!sandbox && totalCount === 0}
                className="rounded-lg border border-rose-300/80 bg-[var(--salestower-surface)] px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                title={
                  sandbox
                    ? "Reset the demo board to the starting inventory"
                    : "Remove every vehicle from the board"
                }
              >
                <span className="sm:hidden">Reset</span>
                <span className="hidden sm:inline">
                  {sandbox ? "Reset demo" : "Start from zero"}
                </span>
              </button>
            )}

            {!sandbox && (
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-3 py-2 text-sm font-semibold text-brand hover:bg-peach/40"
                title="Import vehicles from a spreadsheet"
              >
                <span className="sm:hidden">Import</span>
                <span className="hidden sm:inline">Import file</span>
              </button>
            )}

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-sand hover:bg-[#034a5c] sm:px-4"
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
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Add Vehicle</span>
            </button>

            {headerActions}
          </div>
        </div>

        {showInventoryPane && showFloorPane && (
          <div className="flex rounded-lg border border-peach/70 p-0.5 lg:hidden">
            <button
              type="button"
              onClick={() => setMobilePane("inventory")}
              className={[
                "flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
                mobilePane === "inventory"
                  ? "bg-brand text-sand"
                  : "text-brand/70 hover:bg-peach/35",
              ].join(" ")}
            >
              Inventory
            </button>
            <button
              type="button"
              onClick={() => setMobilePane("floor")}
              className={[
                "flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors",
                mobilePane === "floor"
                  ? "bg-brand text-sand"
                  : "text-brand/70 hover:bg-peach/35",
              ].join(" ")}
            >
              Sales floor
            </button>
          </div>
        )}
      </header>

      {sandbox && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-amber-300/80 bg-amber-100 px-3 py-2.5 text-amber-950 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800/80">
              Sales demo
            </p>
            <p className="text-sm font-semibold">
              Simulated date · {formatShortDate(calendarDay)}
            </p>
            <p className="mt-0.5 text-xs text-amber-900/70">
              Sample inventory only — nothing is saved. Move cars into Daily
              Sales, then press End day to show them moving into Sold by.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={advanceSandboxDay}
              className="rounded-lg bg-amber-900 px-3 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-950"
            >
              End day →
            </button>
            <button
              type="button"
              onClick={resetSandboxBoard}
              className="rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-white"
            >
              Reset demo
            </button>
          </div>
        </div>
      )}

      <DndContext
        id="inventory-kanban"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {showInventoryPane && (
            <aside
              className={[
                "min-h-0 w-full shrink-0 overflow-y-auto border-b border-peach/25 bg-brand p-3 sm:p-4 lg:border-b-0 lg:border-r lg:border-peach/25 lg:p-4",
                mobilePane === "inventory" || !showFloorPane
                  ? "flex flex-col"
                  : "hidden lg:flex lg:flex-col",
                showFloorPane
                  ? "flex-1 lg:w-[min(42rem,45%)] lg:flex-none"
                  : "flex-1",
              ].join(" ")}
            >
              <div className="flex flex-col gap-5">
                {visibleNewModelColumns.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-peach">
                      New · by Model
                    </h2>
                    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-2">
                      {visibleNewModelColumns.map((column) => (
                        <KanbanColumn
                          key={column.id}
                          column={column}
                          className="flex min-w-0 w-full flex-col rounded-2xl bg-[var(--salestower-surface)] ring-1 ring-peach/40"
                          cars={filteredBoard[column.id] ?? []}
                          onMove={requestMove}
                          onEditExteriorColor={setExteriorColorCarId}
                          onEditCheckoutDates={requestEditCheckoutDates}
                          onRequestHalfDeal={setHalfDealCarId}
                          onHalfDealWith={halfDealWith}
                          onClearHalfDeal={clearHalfDeal}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {visibleUsedModelColumns.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-peach">
                      Used
                    </h2>
                    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-2">
                      {visibleUsedModelColumns.map((column) => (
                        <KanbanColumn
                          key={column.id}
                          column={column}
                          className="flex min-w-0 w-full flex-col rounded-2xl bg-[var(--salestower-surface)] ring-1 ring-peach/40"
                          cars={filteredBoard[column.id] ?? []}
                          onMove={requestMove}
                          onEditExteriorColor={setExteriorColorCarId}
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
            </aside>
          )}

          {showFloorPane && (
          <div
            className={[
              "min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden bg-brand p-3 sm:p-4 lg:p-6",
              mobilePane === "floor" || !showInventoryPane
                ? "flex"
                : "hidden lg:flex",
            ].join(" ")}
          >
            {(sectionVisibility.sales || sectionVisibility.dailySales) && (
            <section>
              {sectionVisibility.sales && (
                <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-peach">
                  Sales Team · Sold by
                  <span className="ml-2 normal-case tracking-normal text-sand">
                    · {formatSaleCount(monthSalesTotal)}{" "}
                    {monthSalesTotal === 1 ? "sale" : "sales"}
                  </span>
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <form
                    onSubmit={(e) => void handleAddSalesperson(e)}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      value={newSalespersonName}
                      onChange={(e) => setNewSalespersonName(e.target.value)}
                      placeholder="New salesperson"
                      disabled={savingSalesperson}
                    className="w-full min-w-0 max-w-[11rem] rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-2.5 py-1.5 text-xs font-semibold text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60 sm:w-40 sm:max-w-none"
                    />
                    <button
                      type="submit"
                      disabled={savingSalesperson || !newSalespersonName.trim()}
                      className="rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-60"
                    >
                      {savingSalesperson ? "Adding…" : "Add"}
                    </button>
                  </form>
                  <label className="flex items-center gap-2 text-xs font-semibold text-brand/70">
                    Month
                    <select
                      value={salesMonth}
                      onChange={(e) => setSalesMonth(e.target.value)}
                      className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-2.5 py-1.5 text-xs font-semibold text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                    >
                      {salesMonthOptions.map((key) => (
                        <option key={key} value={key}>
                          {formatMonthLabel(key)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              {salespersonError && (
                <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {salespersonError}
                </p>
              )}
              <div>
                <TeamLaneScroll count={rankedSalespeople.length}>
                  {rankedSalespeople.map(
                    ({ person, monthCars, count, rank }) => (
                      <TeamLaneItem key={person.id}>
                        <SalespersonColumn
                          salesperson={person}
                          cars={monthCars}
                          rank={rank}
                          monthSoldCount={count}
                          onMove={requestMove}
                          onEditExteriorColor={setExteriorColorCarId}
                          onRequestHalfDeal={setHalfDealCarId}
                          onHalfDealWith={halfDealWith}
                          onClearHalfDeal={clearHalfDeal}
                          onDelete={() => void handleDeleteSalesperson(person.id)}
                        />
                      </TeamLaneItem>
                    )
                  )}
                </TeamLaneScroll>
              </div>
                </>
              )}

              {sectionVisibility.dailySales && (
              <div className={sectionVisibility.sales ? "mt-5" : undefined}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-peach">
                    Daily Sales · {formatShortDate(dailySalesDay)}
                    <span className="ml-2 normal-case tracking-normal text-sand">
                      · {formatSaleCount(todaySalesTotal)}{" "}
                      {todaySalesTotal === 1 ? "sale" : "sales"}
                    </span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-brand/70">
                      Date
                      <input
                        type="date"
                        value={dailySalesDay}
                        disabled={savingSalesDay}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          setViewSalesDay(
                            sandbox
                              ? e.target.value
                              : clampSaleDate(e.target.value)
                          );
                        }}
                        max={calendarDay}
                        className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-2.5 py-1.5 text-xs font-semibold text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={savingSalesDay}
                      onClick={() => setViewSalesDay(calendarDay)}
                      className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-2.5 py-1.5 text-xs font-semibold text-brand/80 hover:bg-peach/30 disabled:opacity-60"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      disabled={savingSalesDay}
                      onClick={endSalesDay}
                      className="rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-60"
                      title={
                        sandbox
                          ? "End the simulated day and move Daily Sales into Sold by"
                          : "Mark the open sales day complete. Today's dated sales stay in Daily Sales until midnight."
                      }
                    >
                      {savingSalesDay ? "Saving…" : "End day"}
                    </button>
                  </div>
                </div>
                <p className="mb-3 text-xs text-sand/70">
                  {sandbox
                    ? "Move cars here, then press End day anytime to send them into Sold by."
                    : dailySalesDay === calendarDay
                      ? "Today's sales stay here until midnight, then move into Sold by above."
                      : `Viewing ${formatShortDate(dailySalesDay)} — today's sales stay in Daily Sales until midnight.`}
                </p>
                <div>
                  <TeamLaneScroll count={todaySalesByPerson.length}>
                    {todaySalesByPerson.map(
                      ({ person, todayCars }) => (
                        <TeamLaneItem key={person.id}>
                          <TodaySalesColumn
                            salesperson={person}
                            cars={todayCars}
                            onMove={requestMove}
                            onEditExteriorColor={setExteriorColorCarId}
                            onRequestHalfDeal={setHalfDealCarId}
                            onHalfDealWith={halfDealWith}
                            onClearHalfDeal={clearHalfDeal}
                          />
                        </TeamLaneItem>
                      )
                    )}
                  </TeamLaneScroll>
                </div>
              </div>
              )}
            </section>
            )}

            {sectionVisibility.workingDeals && (
              <section>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-peach">
                  Working Deals
                </h2>
                <p className="mb-3 text-xs text-sand/70">
                  Deals in progress — not closed yet. Move to Daily Sales when
                  the deal is done.
                </p>
                <div>
                  <TeamLaneScroll count={salespeople.length}>
                    {salespeople.map((person) => (
                      <TeamLaneItem key={person.id}>
                        <WorkingDealColumn
                          salesperson={person}
                          cars={board[workingDealContainerId(person.id)] ?? []}
                          onMove={requestMove}
                          onEditExteriorColor={setExteriorColorCarId}
                        />
                      </TeamLaneItem>
                    ))}
                  </TeamLaneScroll>
                </div>
              </section>
            )}

            {sectionVisibility.managers && (
            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-peach">
                  Manager Demos
                </h2>
                <form
                  onSubmit={(e) => void handleAddManager(e)}
                  className="flex items-center gap-1.5"
                >
                  <input
                    value={newManagerName}
                    onChange={(e) => setNewManagerName(e.target.value)}
                    placeholder="New manager"
                    disabled={savingManager}
                    className="w-full min-w-0 max-w-[11rem] rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-2.5 py-1.5 text-xs font-semibold text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60 sm:w-40 sm:max-w-none"
                  />
                  <button
                    type="submit"
                    disabled={savingManager || !newManagerName.trim()}
                    className="rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-60"
                  >
                    {savingManager ? "Adding…" : "Add"}
                  </button>
                </form>
              </div>
              {managerError && (
                <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {managerError}
                </p>
              )}
              {managers.length === 0 ? (
                <p className="rounded-xl border border-dashed border-peach/50 bg-brand/20 px-3 py-6 text-center text-xs text-sand/70">
                  No managers yet. Add a manager to track demo vehicles.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
                  {managers.map((manager) => (
                    <ManagerColumn
                      key={manager.id}
                      manager={manager}
                      cars={board[managerContainerId(manager.id)] ?? []}
                      onMove={requestMove}
                      onEditExteriorColor={setExteriorColorCarId}
                      onDelete={() => void handleDeleteManager(manager.id)}
                    />
                  ))}
                </div>
              )}
            </section>
            )}

            {sectionVisibility.overnight && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-peach">
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
                          className="flex w-full items-center justify-between gap-2 rounded-lg bg-[var(--salestower-surface)]/90 px-2.5 py-1.5 text-left text-xs font-semibold text-brand ring-1 ring-amber-200/80 hover:bg-[var(--salestower-surface)]"
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
              <div>
                <TeamLaneScroll count={salespeople.length}>
                  {salespeople.map((person) => (
                    <TeamLaneItem key={person.id}>
                      <OvernightColumn
                        person={person}
                        cars={board[overnightContainerId(person.id)] ?? []}
                        onMove={requestMove}
                        onEditExteriorColor={setExteriorColorCarId}
                        onEditCheckoutDates={requestEditCheckoutDates}
                        onReviewOvernightDue={setOvernightDueCarId}
                      />
                    </TeamLaneItem>
                  ))}
                </TeamLaneScroll>
              </div>
            </section>
            )}

            {sectionVisibility.intake && visibleIntakeColumns.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-peach">
                  Incoming · DX · Loaners
                </h2>
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-4">
                  {visibleIntakeColumns.map((column) => (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      className="flex min-w-0 w-full flex-col rounded-2xl bg-[var(--salestower-surface)] ring-1 ring-peach/40"
                      cars={filteredBoard[column.id] ?? []}
                      onMove={requestMove}
                      onEditExteriorColor={setExteriorColorCarId}
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
        columns={inventoryColumns}
        brand={brand}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddCar}
      />

      <ImportInventoryModal
        open={importOpen}
        busy={importing}
        onClose={() => setImportOpen(false)}
        onImport={handleImportInventory}
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

      <ExteriorColorModal
        open={Boolean(exteriorColorCarId)}
        stockNumber={
          exteriorColorCarId
            ? findCar(exteriorColorCarId)?.car.stockNumber
            : undefined
        }
        initialColor={
          exteriorColorCarId
            ? findCar(exteriorColorCarId)?.car.exteriorColor
            : undefined
        }
        onClose={() => setExteriorColorCarId(null)}
        onConfirm={(exteriorColor) => {
          if (!exteriorColorCarId) return;
          saveExteriorColor(exteriorColorCarId, exteriorColor);
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
        salespeople={salespeople}
        initialPrimaryId={halfDealFound?.car.salespersonId}
        initialPartnerId={halfDealFound?.car.coSalespersonId}
        onClose={() => setHalfDealCarId(null)}
        onConfirm={(primaryId, partnerId) => {
          if (!halfDealCarId) return;
          assignHalfDeal(halfDealCarId, primaryId, partnerId);
        }}
      />

      {isAdmin && (
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
      )}
    </div>
    </ManagersProvider>
    </SalespeopleProvider>
    </BoardConfigProvider>
  );
}

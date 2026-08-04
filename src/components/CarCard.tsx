"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getCarColor, getModelColor } from "@/lib/colors";
import { formatNewCarLabel } from "@/lib/format";
import {
  carContainerId,
  formatShortDate,
  isCarSold,
  isCheckoutAssignment,
  isHalfDeal,
  isWorkingDeal,
  managerContainerId,
  overnightContainerId,
  salespersonContainerId,
  workingDealContainerId,
  type Car,
  type Column,
} from "@/lib/types";
import { overnightDueStatus } from "@/lib/suggest-column";
import { useBoardConfig } from "./BoardConfigContext";
import { useManagers } from "./ManagersContext";
import { useSalespeople } from "./SalespeopleContext";
import { SaleDetailsModal } from "./SaleDetailsModal";

interface CarCardProps {
  car: Car;
  /** When true, renders the static overlay version used while dragging. */
  overlay?: boolean;
  /** When false, chip is display-only (no drag). Use for mirrored views. */
  draggable?: boolean;
  onMove?: (carId: string, targetContainerId: string) => void;
  onEditCheckoutDates?: (carId: string) => void;
  onEditExteriorColor?: (carId: string) => void;
  onReviewOvernightDue?: (carId: string) => void;
  onRequestHalfDeal?: (carId: string) => void;
  onHalfDealWith?: (carId: string, partnerId: string) => void;
  onClearHalfDeal?: (carId: string) => void;
}

export function CarCard({
  car,
  overlay = false,
  draggable = true,
  onMove,
  onEditCheckoutDates,
  onEditExteriorColor,
  onReviewOvernightDue,
  onRequestHalfDeal,
  onHalfDealWith,
  onClearHalfDeal,
}: CarCardProps) {
  const salespeople = useSalespeople();
  const managers = useManagers();
  const { modelColumns, intakeColumns } = useBoardConfig();
  const color = getCarColor(car.model, car.condition);
  const isNew = car.condition === "new";
  const isSold = isCarSold(car);
  const working = isWorkingDeal(car);
  const halfDeal = isHalfDeal(car);
  const isCheckout = isCheckoutAssignment(car);
  const dueStatus = isCheckout ? overnightDueStatus(car.returnDate) : "ok";
  const currentContainer = carContainerId(car);
  const canDrag = draggable && !overlay;
  const partner = halfDeal
    ? salespeople.find((s) => s.id === car.coSalespersonId)
    : undefined;
  const primary = isSold
    ? salespeople.find((s) => s.id === car.salespersonId)
    : undefined;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saleDetailsOpen, setSaleDetailsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: canDrag ? car.id : `${car.id}__preview`,
    data: { type: "car", car },
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(260, window.innerWidth - 16);
    const left = Math.max(
      8,
      Math.min(rect.right - width, window.innerWidth - width - 8)
    );
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < 320 && spaceAbove > spaceBelow;
    const next: React.CSSProperties = {
      position: "fixed",
      left,
      width,
      // Keep the menu roomy so model options (incl. PHEV/Hybrid) stay reachable.
      maxHeight: Math.max(240, (openUp ? spaceAbove : spaceBelow) - 16),
    };
    if (openUp) {
      next.bottom = window.innerHeight - rect.top + 6;
    } else {
      next.top = rect.bottom + 6;
    }
    setMenuStyle(next);
    setMenuOpen(true);
  }

  function handleSelect(targetContainerId: string) {
    onMove?.(car.id, targetContainerId);
    setMenuOpen(false);
  }

  function renderColumnOption(column: Column) {
    const isCurrent = column.id === currentContainer;
    const cColor = getModelColor(column.title);
    return (
      <button
        key={column.id}
        type="button"
        disabled={isCurrent}
        onClick={() => {
          if (isCurrent) return;
          handleSelect(column.id);
        }}
        className={[
          menuItemClass,
          isCurrent ? "cursor-default opacity-50" : "",
        ].join(" ")}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${cColor.accent}`} />
        <span className="min-w-0 flex-1 text-left">
          {column.title}
          {isCurrent ? " · current" : ""}
        </span>
      </button>
    );
  }

  const menuItemClass =
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100";
  const menuLabelClass =
    "px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        "group relative flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-xl border p-2.5 shadow-sm",
        "select-none",
        canDrag ? "cursor-grab active:cursor-grabbing" : "",
        color.bg,
        color.border,
        color.text,
        overlay ? "shadow-lg ring-2 ring-slate-900/10 rotate-2" : "",
        isDragging ? "opacity-40" : "hover:shadow-md",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start justify-between gap-1.5">
        <span className="truncate font-mono text-[11px] font-bold tracking-wide text-black">
          #{car.stockNumber}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {isSold && !overlay ? (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setSaleDetailsOpen(true);
              }}
              className={[
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                "bg-white/80 text-black hover:bg-white",
              ].join(" ")}
              title={
                car.soldAt
                  ? `Sold ${formatShortDate(car.soldAt)} — click for details`
                  : "Sale details"
              }
            >
              {halfDeal ? "½ Deal" : "Sold"}
            </button>
          ) : (
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                isSold
                  ? "bg-white/80 text-black"
                  : working
                    ? "bg-white/80 text-black"
                    : "bg-white/70 text-black",
              ].join(" ")}
            >
              {isSold
                ? halfDeal
                  ? "½ Deal"
                  : "Sold"
                : working
                  ? "Working"
                  : isNew
                    ? "New"
                    : "Used"}
            </span>
          )}

          {!overlay && onMove && (
            <button
              ref={buttonRef}
              type="button"
              aria-label="Move vehicle"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (menuOpen) setMenuOpen(false);
                else openMenu();
              }}
              className="-mr-1 flex h-8 w-8 items-center justify-center rounded-md text-black/60 hover:bg-white/50 hover:text-black"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.6" />
                <circle cx="12" cy="12" r="1.6" />
                <circle cx="12" cy="19" r="1.6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {isNew ? (
        <div className="truncate text-xs font-bold leading-snug text-black">
          {formatNewCarLabel(car)}
        </div>
      ) : (
        <>
          <div className="min-w-0 flex flex-col">
            <span className="truncate text-xs font-bold text-black">
              {car.year} {car.make} {car.model}
            </span>
            <span className="truncate text-[11px] font-medium text-black/80">
              {car.trim}
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-2 pt-0.5">
            <span
              className={`inline-flex max-w-full items-center gap-1.5 truncate rounded-md px-2 py-0.5 text-[11px] font-bold ${color.badgeBg} ${color.badgeText}`}
            >
              <span className="truncate">{car.model}</span>
            </span>
          </div>
        </>
      )}

      {car.exteriorColor ? (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEditExteriorColor?.(car.id);
          }}
          className="truncate text-left text-[11px] font-semibold text-black/80 hover:text-black"
          title="Edit paint color"
        >
          {car.exteriorColor}
        </button>
      ) : onEditExteriorColor ? (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEditExteriorColor(car.id);
          }}
          className="text-left text-[11px] font-semibold text-black/60 hover:text-black"
        >
          Add paint color…
        </button>
      ) : null}

      {halfDeal && primary && partner && (
        <div className="truncate rounded-lg bg-white/70 px-2 py-1.5 text-[11px] font-bold text-black">
          {primary.name} · {partner.name}
        </div>
      )}

      {isSold && car.soldAt && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (!overlay) setSaleDetailsOpen(true);
          }}
          className="truncate text-left text-[11px] font-semibold text-black/75 hover:text-black"
          title="Sale date"
        >
          Sold {formatShortDate(car.soldAt)}
        </button>
      )}

      {isCheckout && car.outDate && car.returnDate && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (dueStatus !== "ok" && onReviewOvernightDue) {
              onReviewOvernightDue(car.id);
              return;
            }
            onEditCheckoutDates?.(car.id);
          }}
          className={[
            "mt-0.5 w-full rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold",
            dueStatus === "overdue"
              ? "bg-rose-100 text-rose-900 hover:bg-rose-200"
              : dueStatus === "due"
                ? "bg-amber-100 text-amber-950 ring-1 ring-amber-300 hover:bg-amber-200"
                : "bg-amber-50 text-amber-900 hover:bg-amber-100",
          ].join(" ")}
          title={
            dueStatus !== "ok"
              ? "Demo due — extend or mark returned"
              : "Edit overnight details"
          }
        >
          {dueStatus === "overdue"
            ? "Past due · "
            : dueStatus === "due"
              ? "Due today · "
              : ""}
          {car.tagNumber ? `Tag ${car.tagNumber} · ` : ""}
          Out {formatShortDate(car.outDate)} · Back{" "}
          {formatShortDate(car.returnDate)}
        </button>
      )}

      {menuOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="z-50 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
            onWheel={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <p className={menuLabelClass}>Move to inventory</p>
            {modelColumns.map((column) => renderColumnOption(column))}

            <p className={menuLabelClass}>Incoming · DX · Loaners</p>
            {intakeColumns.map((column) => renderColumnOption(column))}

            <p className={menuLabelClass}>Assign full deal</p>
            {salespeople.filter(
              (s) => salespersonContainerId(s.id) !== currentContainer || halfDeal
            ).map((s) => {
              const sColor = getModelColor(s.name);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(salespersonContainerId(s.id))}
                  className={menuItemClass}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-brand ${sColor.accent}`}
                  >
                    {s.name.charAt(0)}
                  </span>
                  {s.name}
                </button>
              );
            })}

            <p className={menuLabelClass}>Working deal</p>
            {salespeople.filter(
              (s) => workingDealContainerId(s.id) !== currentContainer
            ).map((s) => {
              const sColor = getModelColor(s.name);
              return (
                <button
                  key={`wd-${s.id}`}
                  type="button"
                  onClick={() => handleSelect(workingDealContainerId(s.id))}
                  className={menuItemClass}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-brand ${sColor.accent}`}
                  >
                    {s.name.charAt(0)}
                  </span>
                  {s.name}
                </button>
              );
            })}

            {(onRequestHalfDeal || onHalfDealWith) && (
              <>
                <p className={menuLabelClass}>Half deal</p>
                {onRequestHalfDeal && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onRequestHalfDeal(car.id);
                    }}
                    className={menuItemClass}
                  >
                    Split as half deal…
                  </button>
                )}
                {isSold &&
                  onHalfDealWith &&
                  salespeople.filter((s) => s.id !== car.salespersonId).map(
                    (s) => {
                      const sColor = getModelColor(s.name);
                      const selected = car.coSalespersonId === s.id;
                      return (
                        <button
                          key={`half-${s.id}`}
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onHalfDealWith(car.id, s.id);
                          }}
                          className={menuItemClass}
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-brand ${sColor.accent}`}
                          >
                            {s.name.charAt(0)}
                          </span>
                          {selected ? `✓ With ${s.name}` : `With ${s.name}`}
                        </button>
                      );
                    }
                  )}
                {halfDeal && onClearHalfDeal && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onClearHalfDeal(car.id);
                    }}
                    className={menuItemClass}
                  >
                    Convert to full deal
                  </button>
                )}
              </>
            )}

            <p className={menuLabelClass}>Assign to manager demo</p>
            {managers.filter(
              (m) => managerContainerId(m.id) !== currentContainer
            ).map((m) => {
              const mColor = getModelColor(m.name);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelect(managerContainerId(m.id))}
                  className={menuItemClass}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-brand ${mColor.accent}`}
                  >
                    {m.name.charAt(0)}
                  </span>
                  {m.name}
                </button>
              );
            })}

            <p className={menuLabelClass}>Assign to overnight demo</p>
            {salespeople.filter(
              (s) => overnightContainerId(s.id) !== currentContainer
            ).map((s) => {
              const sColor = getModelColor(s.name);
              return (
                <button
                  key={`ond-${s.id}`}
                  type="button"
                  onClick={() => handleSelect(overnightContainerId(s.id))}
                  className={menuItemClass}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-brand ${sColor.accent}`}
                  >
                    {s.name.charAt(0)}
                  </span>
                  {s.name}
                </button>
              );
            })}

            {onEditExteriorColor && (
              <>
                <p className={menuLabelClass}>Paint color</p>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEditExteriorColor(car.id);
                  }}
                  className={menuItemClass}
                >
                  {car.exteriorColor ? "Edit paint color…" : "Add paint color…"}
                </button>
              </>
            )}

            {isCheckout && onEditCheckoutDates && (
              <>
                <p className={menuLabelClass}>Checkout</p>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEditCheckoutDates(car.id);
                  }}
                  className={menuItemClass}
                >
                  Edit tag / out / back
                </button>
              </>
            )}
          </div>,
          document.body
        )}

      {!overlay && (
        <SaleDetailsModal
          open={saleDetailsOpen}
          stockNumber={car.stockNumber}
          soldAt={car.soldAt}
          salespersonName={primary?.name}
          partnerName={partner?.name}
          halfDeal={halfDeal}
          onClose={() => setSaleDetailsOpen(false)}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getModelColor } from "@/lib/colors";
import { COLUMNS, MANAGERS, SALESPEOPLE } from "@/lib/data";
import { formatNewCarLabel } from "@/lib/format";
import {
  carContainerId,
  isCarSold,
  managerContainerId,
  overnightContainerId,
  salespersonContainerId,
  type Car,
} from "@/lib/types";

interface CarCardProps {
  car: Car;
  /** When true, renders the static overlay version used while dragging. */
  overlay?: boolean;
  onMove?: (carId: string, targetContainerId: string) => void;
}

export function CarCard({ car, overlay = false, onMove }: CarCardProps) {
  const color = getModelColor(car.model);
  const isNew = car.condition === "new";
  const isSold = isCarSold(car);
  const currentContainer = carContainerId(car);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: car.id,
    data: { type: "car", car },
    disabled: overlay,
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
    const width = 240;
    const left = Math.max(
      8,
      Math.min(rect.right - width, window.innerWidth - width - 8)
    );
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 280;
    const next: React.CSSProperties = { position: "fixed", left, width };
    if (openUp) {
      next.bottom = window.innerHeight - rect.top + 6;
      next.maxHeight = rect.top - 16;
    } else {
      next.top = rect.bottom + 6;
      next.maxHeight = spaceBelow - 16;
    }
    setMenuStyle(next);
    setMenuOpen(true);
  }

  function handleSelect(targetContainerId: string) {
    onMove?.(car.id, targetContainerId);
    setMenuOpen(false);
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
        "group relative flex flex-col gap-2 overflow-hidden rounded-xl border bg-white p-3 pl-4 shadow-sm",
        "cursor-grab active:cursor-grabbing select-none",
        color.border,
        overlay ? "shadow-lg ring-2 ring-slate-900/10 rotate-2" : "",
        isDragging ? "opacity-40" : "hover:shadow-md",
      ].join(" ")}
    >
      {/* Color accent bar (color-coded by model) */}
      <span
        className={`absolute inset-y-0 left-0 w-1.5 ${color.accent}`}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs font-semibold tracking-wide text-slate-500">
          #{car.stockNumber}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              isSold
                ? "bg-rose-100 text-rose-700"
                : isNew
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600",
            ].join(" ")}
          >
            {isSold ? "Sold" : isNew ? "New" : "Used"}
          </span>

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
              className="-mr-1 flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
        <div className="text-sm font-semibold leading-snug text-slate-900">
          {formatNewCarLabel(car)}
        </div>
      ) : (
        <>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">
              {car.year} {car.make} {car.model}
            </span>
            <span className="text-xs text-slate-500">{car.trim}</span>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${color.badgeBg} ${color.badgeText}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${color.accent}`} />
              {car.model}
            </span>
          </div>
        </>
      )}

      {menuOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="z-50 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
          >
            <p className={menuLabelClass}>Move to column</p>
            {COLUMNS.filter((c) => c.id !== currentContainer).map((c) => {
              const cColor = getModelColor(c.title);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className={menuItemClass}
                >
                  <span className={`h-2 w-2 rounded-full ${cColor.accent}`} />
                  {c.title}
                </button>
              );
            })}

            <p className={menuLabelClass}>Assign to salesperson</p>
            {SALESPEOPLE.filter(
              (s) => salespersonContainerId(s.id) !== currentContainer
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
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ${sColor.accent}`}
                  >
                    {s.name.charAt(0)}
                  </span>
                  {s.name}
                </button>
              );
            })}

            <p className={menuLabelClass}>Assign to manager demo</p>
            {MANAGERS.filter(
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
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ${mColor.accent}`}
                  >
                    {m.name.charAt(0)}
                  </span>
                  {m.name}
                </button>
              );
            })}

            <p className={menuLabelClass}>Assign to overnight demo</p>
            {SALESPEOPLE.filter(
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
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ${sColor.accent}`}
                  >
                    {s.name.charAt(0)}
                  </span>
                  {s.name}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

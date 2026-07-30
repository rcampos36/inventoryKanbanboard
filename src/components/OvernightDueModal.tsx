"use client";

import { useEffect, useState } from "react";
import {
  addDaysIsoDate,
  formatShortDate,
  todayIsoDate,
  type Car,
} from "@/lib/types";
import {
  columnTitle,
  overnightDueStatus,
  resolveOvernightHomeColumnId,
} from "@/lib/suggest-column";
import { formatNewCarLabel } from "@/lib/format";

interface OvernightDueModalProps {
  open: boolean;
  car: Car | null;
  onClose: () => void;
  onExtend: (carId: string, returnDate: string) => void;
  onMarkReturned: (carId: string) => void;
}

export function OvernightDueModal({
  open,
  car,
  onClose,
  onExtend,
  onMarkReturned,
}: OvernightDueModalProps) {
  const [returnDate, setReturnDate] = useState(todayIsoDate());

  useEffect(() => {
    if (open && car) {
      const minDate = todayIsoDate();
      const current = car.returnDate ?? minDate;
      setReturnDate(current > minDate ? addDaysIsoDate(current, 1) : addDaysIsoDate(minDate, 1));
    }
  }, [open, car]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !car) return null;

  const status = overnightDueStatus(car.returnDate);
  const homeId = resolveOvernightHomeColumnId(car);
  const homeLabel = columnTitle(homeId);
  const label =
    car.condition === "new"
      ? formatNewCarLabel(car)
      : `${car.year} ${car.make} ${car.model}`;

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[min(90dvh,40rem)] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <p
            className={[
              "mb-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
              status === "overdue"
                ? "bg-rose-100 text-rose-800"
                : "bg-amber-100 text-amber-900",
            ].join(" ")}
          >
            {status === "overdue" ? "Past due" : "Due today"}
          </p>
          <h2 className="text-lg font-bold text-slate-900">
            Overnight demo reminder
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            #{car.stockNumber} · {label}
            {car.tagNumber ? ` · Tag ${car.tagNumber}` : ""}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Scheduled back {car.returnDate ? formatShortDate(car.returnDate) : "—"}.
            Return restores it to <span className="font-semibold text-slate-700">{homeLabel}</span>.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Extend coming-back date
            </label>
            <input
              type="date"
              className={inputClass}
              value={returnDate}
              min={todayIsoDate()}
              onChange={(e) => setReturnDate(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 7].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() =>
                    setReturnDate(addDaysIsoDate(todayIsoDate(), days))
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  +{days}d
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!returnDate}
              onClick={() => {
                if (!returnDate) return;
                onExtend(car.id, returnDate);
              }}
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              Extend demo
            </button>
          </div>

          <button
            type="button"
            onClick={() => onMarkReturned(car.id)}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Mark returned · back to {homeLabel}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

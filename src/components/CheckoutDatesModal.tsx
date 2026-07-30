"use client";

import { useEffect, useState } from "react";
import type { CheckoutDates } from "@/lib/types";
import { todayIsoDate, tomorrowIsoDate } from "@/lib/types";

interface CheckoutDatesModalProps {
  open: boolean;
  title?: string;
  subtitle?: string;
  initialOutDate?: string;
  initialReturnDate?: string;
  initialTagNumber?: string;
  onClose: () => void;
  onConfirm: (dates: CheckoutDates) => void;
}

export function CheckoutDatesModal({
  open,
  title = "Checkout dates",
  subtitle,
  initialOutDate,
  initialReturnDate,
  initialTagNumber,
  onClose,
  onConfirm,
}: CheckoutDatesModalProps) {
  const [outDate, setOutDate] = useState(initialOutDate ?? todayIsoDate());
  const [returnDate, setReturnDate] = useState(
    initialReturnDate ?? tomorrowIsoDate()
  );
  const [tagNumber, setTagNumber] = useState(initialTagNumber ?? "");

  useEffect(() => {
    if (open) {
      setOutDate(initialOutDate ?? todayIsoDate());
      setReturnDate(initialReturnDate ?? tomorrowIsoDate());
      setTagNumber(initialTagNumber ?? "");
    }
  }, [open, initialOutDate, initialReturnDate, initialTagNumber]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTag = tagNumber.trim();
    if (!outDate || !returnDate || !trimmedTag) return;
    onConfirm({ outDate, returnDate, tagNumber: trimmedTag });
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";
  const labelClass = "text-xs font-semibold text-slate-600";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[min(90dvh,40rem)] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Tag number</label>
            <input
              type="text"
              className={inputClass}
              value={tagNumber}
              onChange={(e) => setTagNumber(e.target.value)}
              placeholder="e.g. 42"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Going out</label>
            <input
              type="date"
              className={inputClass}
              value={outDate}
              onChange={(e) => setOutDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Coming back</label>
            <input
              type="date"
              className={inputClass}
              value={returnDate}
              min={outDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

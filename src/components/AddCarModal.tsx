"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getModelsForMake,
  getTrimsForMake,
  MAKE_SUGGESTIONS,
} from "@/lib/data";
import { suggestInventoryColumnId } from "@/lib/suggest-column";
import { EXTERIOR_COLOR_SUGGESTIONS } from "@/lib/colors";
import type { Car, CarCondition, Column } from "@/lib/types";

interface AddCarModalProps {
  open: boolean;
  columns: Column[];
  onClose: () => void;
  onAdd: (car: Omit<Car, "id">) => void;
}

const EMPTY_FORM = {
  stockNumber: "",
  year: String(new Date().getFullYear()),
  make: "",
  model: "",
  trim: "",
  condition: "new" as CarCondition,
  columnId: "",
  exteriorColor: "",
};

export function AddCarModal({ open, columns, onClose, onAdd }: AddCarModalProps) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    columnId: columns[0]?.id ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY_FORM,
        columnId: suggestInventoryColumnId("", "", "new"),
      });
    }
  }, [open, columns]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const modelSuggestions = useMemo(
    () => getModelsForMake(form.make),
    [form.make]
  );
  const trimSuggestions = useMemo(
    () => getTrimsForMake(form.make, form.model),
    [form.make, form.model]
  );

  if (!open) return null;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "make" || key === "model" || key === "condition") {
        next.columnId = suggestInventoryColumnId(
          key === "make" ? String(value) : next.make,
          key === "model" ? String(value) : next.model,
          key === "condition" ? (value as CarCondition) : next.condition
        );
      }

      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const columnId = form.columnId || columns[0]?.id || "";
    if (!form.stockNumber.trim() || !form.make.trim() || !form.model.trim()) {
      return;
    }
    onAdd({
      stockNumber: form.stockNumber.trim(),
      year: Number(form.year) || new Date().getFullYear(),
      make: form.make.trim(),
      model: form.model.trim(),
      trim: form.trim.trim(),
      condition: form.condition,
      columnId,
      exteriorColor: form.exteriorColor.trim() || undefined,
    });
    onClose();
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";
  const labelClass = "text-xs font-semibold text-slate-600";
  const hintClass = "text-[11px] text-slate-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[min(90dvh,40rem)] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add Vehicle</h2>
            <p className={hintClass}>
              Type any make, model, or trim — Mazda suggestions match 2026
              mazdausa.com trim packages.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Stock #</label>
              <input
                className={inputClass}
                value={form.stockNumber}
                onChange={(e) => update("stockNumber", e.target.value)}
                placeholder="T24801"
                autoFocus
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Year</label>
              <input
                className={inputClass}
                type="number"
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
                placeholder="2024"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Make</label>
              <input
                className={inputClass}
                list="make-suggestions"
                value={form.make}
                onChange={(e) => update("make", e.target.value)}
                placeholder="Toyota, Honda, Ford…"
                required
              />
              <datalist id="make-suggestions">
                {MAKE_SUGGESTIONS.map((make) => (
                  <option key={make} value={make} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Model</label>
              <input
                className={inputClass}
                list="model-suggestions"
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
                placeholder="RAV4, Civic, F-150…"
                required
              />
              <datalist id="model-suggestions">
                {modelSuggestions.map((model) => (
                  <option key={model} value={model} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Trim</label>
            <input
              className={inputClass}
              list="trim-suggestions"
              value={form.trim}
              onChange={(e) => update("trim", e.target.value)}
              placeholder="XLE, Sport Touring, Lariat…"
            />
            <datalist id="trim-suggestions">
              {trimSuggestions.map((trim) => (
                <option key={trim} value={trim} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Color</label>
            <input
              className={inputClass}
              list="exterior-color-suggestions"
              value={form.exteriorColor}
              onChange={(e) => update("exteriorColor", e.target.value)}
              placeholder="Soul Red Crystal Metallic, Machine Gray…"
            />
            <datalist id="exterior-color-suggestions">
              {EXTERIOR_COLOR_SUGGESTIONS.map((color) => (
                <option key={color} value={color} />
              ))}
            </datalist>
            <p className={hintClass}>
              Exterior paint color of the vehicle — shown on the chip.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Condition</label>
            <select
              className={inputClass}
              value={form.condition}
              onChange={(e) =>
                update("condition", e.target.value as CarCondition)
              }
            >
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Column</label>
            <select
              className={inputClass}
              value={form.columnId}
              onChange={(e) => update("columnId", e.target.value)}
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
            <p className={hintClass}>
              Auto-picks Used Mazda / Used – Other Brands when make &amp;
              condition change — you can override anytime.
            </p>
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
              Add Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { EXTERIOR_COLOR_SUGGESTIONS } from "@/lib/colors";

interface ExteriorColorModalProps {
  open: boolean;
  stockNumber?: string;
  initialColor?: string;
  onClose: () => void;
  onConfirm: (exteriorColor: string) => void;
}

export function ExteriorColorModal({
  open,
  stockNumber,
  initialColor,
  onClose,
  onConfirm,
}: ExteriorColorModalProps) {
  const [exteriorColor, setExteriorColor] = useState(initialColor ?? "");

  useEffect(() => {
    if (open) setExteriorColor(initialColor ?? "");
  }, [open, initialColor]);

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
    onConfirm(exteriorColor.trim());
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

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
          <h2 className="text-lg font-bold text-slate-900">Paint color</h2>
          <p className="mt-1 text-sm text-slate-500">
            {stockNumber
              ? `Set or correct the exterior color for #${stockNumber}.`
              : "Set or correct the exterior color."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Color</label>
            <input
              className={inputClass}
              list="edit-exterior-color-suggestions"
              value={exteriorColor}
              onChange={(e) => setExteriorColor(e.target.value)}
              placeholder="Soul Red Crystal Metallic, Machine Gray…"
              autoFocus
            />
            <datalist id="edit-exterior-color-suggestions">
              {EXTERIOR_COLOR_SUGGESTIONS.map((color) => (
                <option key={color} value={color} />
              ))}
            </datalist>
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
              Save color
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmClearBoardModalProps {
  open: boolean;
  vehicleCount: number;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmClearBoardModal({
  open,
  vehicleCount,
  busy = false,
  onClose,
  onConfirm,
}: ConfirmClearBoardModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-board-title"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="max-h-[min(90dvh,40rem)] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5">
          <h2
            id="clear-board-title"
            className="text-lg font-bold text-slate-900"
          >
            Start from zero?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            This permanently removes{" "}
            <span className="font-semibold text-slate-900">
              {vehicleCount} {vehicleCount === 1 ? "vehicle" : "vehicles"}
            </span>{" "}
            from every section (inventory, sales, demos, overnight, and
            loaners). This cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-40"
          >
            {busy ? "Clearing…" : "Yes, clear all vehicles"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

"use client";

import { useEffect, useState } from "react";

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
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const confirmed = typed.trim().toUpperCase() === "CLEAR";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed || busy) return;
    onConfirm();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">
              Type <span className="font-mono text-slate-900">CLEAR</span> to
              confirm
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={busy}
              autoFocus
              autoComplete="off"
              placeholder="CLEAR"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!confirmed || busy}
              className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-40"
            >
              {busy ? "Clearing…" : "Clear all vehicles"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

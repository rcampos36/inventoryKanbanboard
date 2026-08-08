"use client";

import { useEffect, useState } from "react";

interface WorkingDealNoteModalProps {
  open: boolean;
  stockNumber?: string;
  initialNote?: string;
  /** assign = moving into a working deal; edit = update note in place */
  mode?: "assign" | "edit";
  onClose: () => void;
  onConfirm: (note: string) => void;
  onSkip?: () => void;
}

export function WorkingDealNoteModal({
  open,
  stockNumber,
  initialNote,
  mode = "assign",
  onClose,
  onConfirm,
  onSkip,
}: WorkingDealNoteModalProps) {
  const [note, setNote] = useState(initialNote ?? "");

  useEffect(() => {
    if (open) setNote(initialNote ?? "");
  }, [open, initialNote]);

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
    onConfirm(note.trim());
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
          <h2 className="text-lg font-bold text-slate-900">
            {mode === "edit" ? "Edit deal note" : "Working deal note"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {stockNumber
              ? mode === "edit"
                ? `Update the note on #${stockNumber}.`
                : `Optionally add a note for #${stockNumber}. It will show on the chip.`
              : mode === "edit"
                ? "Update the note on this working deal."
                : "Optionally add a note. It will show on the chip."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600" htmlFor="deal-note">
              Note
            </label>
            <textarea
              id="deal-note"
              className={`${inputClass} min-h-24 resize-y`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Customer name, deposit, trade…"
              autoFocus
              maxLength={280}
            />
          </div>

          <div className="mt-2 flex flex-wrap justify-end gap-2">
            {mode === "assign" && onSkip ? (
              <button
                type="button"
                onClick={onSkip}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Skip
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              {mode === "edit" ? "Save note" : "Save note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

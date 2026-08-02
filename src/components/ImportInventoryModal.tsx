"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ImportInventoryResult } from "@/app/actions/cars";

interface ImportInventoryModalProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<ImportInventoryResult>;
}

export function ImportInventoryModal({
  open,
  busy = false,
  onClose,
  onImport,
}: ImportInventoryModalProps) {
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<
    ImportInventoryResult,
    { ok: true }
  > | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!mounted || !open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || busy) return;
    setError(null);
    setResult(null);
    try {
      const response = await onImport(file);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setResult(response);
    } catch (err) {
      console.error(err);
      setError("Import failed. Please try again.");
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-inventory-title"
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
            id="import-inventory-title"
            className="text-lg font-bold text-slate-900"
          >
            Import inventory
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Upload a .xls, .xlsx, or .csv export. New franchise cars go into
            model columns; used franchise and other brands go into the used
            sections. Existing stock numbers are skipped.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              File
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={busy}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setError(null);
                setResult(null);
              }}
              className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-peach/50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand hover:file:bg-peach disabled:opacity-60"
            />
          </label>

          {file ? (
            <p className="text-xs text-slate-500">
              Selected: <span className="font-medium text-slate-700">{file.name}</span>
            </p>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          {result ? (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <p className="font-semibold">
                Added {result.added}{" "}
                {result.added === 1 ? "vehicle" : "vehicles"}
              </p>
              {(result.skippedDuplicates > 0 || result.skippedInvalid > 0) && (
                <p className="mt-1 text-emerald-800/90">
                  Skipped {result.skippedDuplicates} duplicate
                  {result.skippedDuplicates === 1 ? "" : "s"}
                  {result.skippedInvalid > 0
                    ? `, ${result.skippedInvalid} invalid`
                    : ""}
                  .
                </p>
              )}
              {result.warnings.length > 0 ? (
                <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-emerald-900/80">
                  {result.warnings.slice(0, 5).map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
            >
              {result ? "Done" : "Cancel"}
            </button>
            {!result ? (
              <button
                type="submit"
                disabled={!file || busy}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-sand hover:bg-[#034a5c] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Importing…" : "Import vehicles"}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

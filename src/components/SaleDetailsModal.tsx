"use client";

import { useEffect } from "react";

interface SaleDetailsModalProps {
  open: boolean;
  stockNumber?: string;
  soldAt?: string;
  salespersonName?: string;
  partnerName?: string;
  halfDeal?: boolean;
  onClose: () => void;
}

export function SaleDetailsModal({
  open,
  stockNumber,
  soldAt,
  salespersonName,
  partnerName,
  halfDeal = false,
  onClose,
}: SaleDetailsModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const soldLabel = soldAt
    ? (() => {
        const [year, month, day] = soldAt.split("-").map(Number);
        return new Date(year, month - 1, day).toLocaleDateString("en-US", {
          weekday: "short",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      })()
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {halfDeal ? "Half deal" : "Sale"}
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            {stockNumber ? `#${stockNumber}` : "Sold vehicle"}
          </h2>
        </div>

        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-xs font-semibold text-slate-500">Sale date</dt>
            <dd className="mt-0.5 font-semibold text-slate-900">
              {soldLabel ?? "Date not recorded"}
            </dd>
          </div>
          {salespersonName && (
            <div>
              <dt className="text-xs font-semibold text-slate-500">
                {halfDeal && partnerName ? "Sold by" : "Salesperson"}
              </dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {halfDeal && partnerName
                  ? `${salespersonName} · ${partnerName}`
                  : salespersonName}
              </dd>
            </div>
          )}
        </dl>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Close
        </button>
      </div>
    </div>
  );
}

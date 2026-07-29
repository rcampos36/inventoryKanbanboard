"use client";

import { useEffect, useState } from "react";
import type { Salesperson } from "@/lib/types";

interface HalfDealModalProps {
  open: boolean;
  salespeople: Salesperson[];
  initialPrimaryId?: string;
  initialPartnerId?: string;
  onClose: () => void;
  onConfirm: (primaryId: string, partnerId: string) => void;
}

export function HalfDealModal({
  open,
  salespeople,
  initialPrimaryId,
  initialPartnerId,
  onClose,
  onConfirm,
}: HalfDealModalProps) {
  const [primaryId, setPrimaryId] = useState(
    initialPrimaryId ?? salespeople[0]?.id ?? ""
  );
  const [partnerId, setPartnerId] = useState(
    initialPartnerId ?? salespeople[1]?.id ?? ""
  );

  useEffect(() => {
    if (!open) return;
    setPrimaryId(initialPrimaryId ?? salespeople[0]?.id ?? "");
    setPartnerId(
      initialPartnerId ??
        salespeople.find(
          (s) => s.id !== (initialPrimaryId ?? salespeople[0]?.id)
        )?.id ??
        ""
    );
  }, [open, initialPrimaryId, initialPartnerId, salespeople]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const partners = salespeople.filter((s) => s.id !== primaryId);
  const canSave = Boolean(primaryId && partnerId && primaryId !== partnerId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    onConfirm(primaryId, partnerId);
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";
  const labelClass = "text-xs font-semibold text-slate-600";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Half deal</h2>
          <p className="mt-1 text-sm text-slate-500">
            Split this sale 50/50 between two team members.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Primary salesperson</label>
            <select
              className={inputClass}
              value={primaryId}
              onChange={(e) => {
                const next = e.target.value;
                setPrimaryId(next);
                if (partnerId === next) {
                  setPartnerId(
                    salespeople.find((s) => s.id !== next)?.id ?? ""
                  );
                }
              }}
              autoFocus
            >
              {salespeople.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Half with</label>
            <select
              className={inputClass}
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
            >
              {partners.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
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
              disabled={!canSave}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
            >
              Save half deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

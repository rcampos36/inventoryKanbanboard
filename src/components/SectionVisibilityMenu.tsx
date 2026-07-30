"use client";

import { useEffect, useRef, useState } from "react";

export const BOARD_SECTIONS = [
  "inventory",
  "sales",
  "dailySales",
  "workingDeals",
  "managers",
  "overnight",
  "intake",
] as const;

export type BoardSection = (typeof BOARD_SECTIONS)[number];

export type SectionVisibility = Record<BoardSection, boolean>;

export const SECTION_LABELS: Record<BoardSection, string> = {
  inventory: "Inventory by Model",
  sales: "Sales Team",
  dailySales: "Daily Sales",
  workingDeals: "Working Deals",
  managers: "Manager Demos",
  overnight: "Overnight Demos",
  intake: "Incoming · DX · Loaners",
};

export const DEFAULT_SECTION_VISIBILITY: SectionVisibility = {
  inventory: true,
  sales: true,
  dailySales: true,
  workingDeals: true,
  managers: true,
  overnight: true,
  intake: true,
};

const STORAGE_KEY = "inventory-kanban-section-visibility";

export function loadSectionVisibility(): SectionVisibility {
  if (typeof window === "undefined") return DEFAULT_SECTION_VISIBILITY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SECTION_VISIBILITY;
    const parsed = JSON.parse(raw) as Partial<SectionVisibility>;
    return {
      ...DEFAULT_SECTION_VISIBILITY,
      ...parsed,
    };
  } catch {
    return DEFAULT_SECTION_VISIBILITY;
  }
}

export function saveSectionVisibility(visibility: SectionVisibility) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
}

export function SectionVisibilityMenu({
  visibility,
  onChange,
}: {
  visibility: SectionVisibility;
  onChange: (next: SectionVisibility) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hiddenCount = BOARD_SECTIONS.filter((id) => !visibility[id]).length;

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(section: BoardSection) {
    const next = { ...visibility, [section]: !visibility[section] };
    // Keep at least one section visible.
    if (BOARD_SECTIONS.every((id) => !next[id])) return;
    onChange(next);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Sections
        {hiddenCount > 0 ? (
          <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
            {hiddenCount} hidden
          </span>
        ) : null}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-[min(16rem,calc(100vw-1.5rem))] rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
        >
          <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Show on board
          </p>
          <ul className="flex flex-col gap-0.5">
            {BOARD_SECTIONS.map((section) => (
              <li key={section}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-slate-800 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={visibility[section]}
                    onChange={() => toggle(section)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
                  />
                  <span className="font-medium">{SECTION_LABELS[section]}</span>
                </label>
              </li>
            ))}
          </ul>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => onChange({ ...DEFAULT_SECTION_VISIBILITY })}
              className="mt-1 w-full rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Show all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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
  inventory: "Inventory (New & Used)",
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

/** Force plan-gated sections off; keep at least one allowed section on. */
export function applyPlanSectionAccess(
  visibility: SectionVisibility,
  allowedSections: readonly BoardSection[]
): SectionVisibility {
  const allowed = new Set(allowedSections);
  const next: SectionVisibility = { ...visibility };
  for (const section of BOARD_SECTIONS) {
    if (!allowed.has(section)) next[section] = false;
  }
  if (allowedSections.length > 0 && allowedSections.every((id) => !next[id])) {
    next[allowedSections[0]!] = true;
  }
  return next;
}

export function SectionVisibilityMenu({
  visibility,
  onChange,
  allowedSections = BOARD_SECTIONS,
}: {
  visibility: SectionVisibility;
  onChange: (next: SectionVisibility) => void;
  allowedSections?: readonly BoardSection[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuSections = BOARD_SECTIONS.filter((id) =>
    allowedSections.includes(id)
  );
  const hiddenCount = menuSections.filter((id) => !visibility[id]).length;

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
    if (!allowedSections.includes(section)) return;
    const next = applyPlanSectionAccess(
      { ...visibility, [section]: !visibility[section] },
      allowedSections
    );
    // Keep at least one allowed section visible.
    if (menuSections.every((id) => !next[id])) return;
    onChange(next);
  }

  function showAllAllowed() {
    const next = { ...DEFAULT_SECTION_VISIBILITY };
    for (const section of BOARD_SECTIONS) {
      next[section] = allowedSections.includes(section);
    }
    onChange(next);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-3 py-2 text-sm font-semibold text-brand hover:bg-peach/35"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Sections
        {hiddenCount > 0 ? (
          <span className="ml-1.5 rounded-full bg-peach/70 px-1.5 py-0.5 text-[10px] font-bold text-brand/70">
            {hiddenCount} hidden
          </span>
        ) : null}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-[min(16rem,calc(100vw-1.5rem))] rounded-xl border border-peach/60 bg-[var(--salestower-surface)] p-2 shadow-xl"
        >
          <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-brand/45">
            Show on board
          </p>
          <ul className="flex flex-col gap-0.5">
            {menuSections.map((section) => (
              <li key={section}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-brand hover:bg-peach/30">
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
              onClick={showAllAllowed}
              className="mt-1 w-full rounded-lg px-2 py-1.5 text-xs font-semibold text-brand/70 hover:bg-slate-50"
            >
              Show all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

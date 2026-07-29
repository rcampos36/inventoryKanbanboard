"use client";

import {
  CHIP_COLOR_OPTIONS,
  type ChipColorId,
} from "@/lib/colors";

export function ChipColorPicker({
  value,
  onChange,
  size = "md",
}: {
  value: ChipColorId;
  onChange: (id: ChipColorId) => void;
  size?: "sm" | "md";
}) {
  const swatch =
    size === "sm" ? "h-5 w-5" : "h-7 w-7";

  return (
    <div className="flex flex-wrap gap-1.5">
      {CHIP_COLOR_OPTIONS.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            title={option.label}
            aria-label={option.label}
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={[
              swatch,
              "rounded-full border-2 transition",
              option.accent,
              selected
                ? "border-slate-900 ring-2 ring-slate-900/20"
                : "border-white hover:scale-105",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}

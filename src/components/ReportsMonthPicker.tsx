"use client";

import { useRouter } from "next/navigation";

export function ReportsMonthPicker({
  months,
  selected,
}: {
  months: { key: string; label: string }[];
  selected: string;
}) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-brand/70">
      Month
      <select
        value={selected}
        onChange={(e) => {
          const month = e.target.value;
          const url = new URL(window.location.href);
          url.searchParams.set("month", month);
          router.push(`${url.pathname}?${url.searchParams.toString()}`);
        }}
        className="rounded-lg border border-peach/70 bg-[var(--autosync-surface)] px-2.5 py-2 text-xs font-semibold text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
      >
        {months.map((month) => (
          <option key={month.key} value={month.key}>
            {month.label}
          </option>
        ))}
      </select>
    </label>
  );
}

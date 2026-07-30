import type { ReactNode } from "react";

/** Equal-width row on desktop; horizontal snap-scroll on smaller screens. */
export function TeamLaneScroll({
  count,
  children,
}: {
  count: number;
  children: ReactNode;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] lg:grid lg:overflow-visible"
      style={{
        gridTemplateColumns: `repeat(${Math.max(count, 1)}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

export function TeamLaneItem({ children }: { children: ReactNode }) {
  return (
    <div className="w-[min(72vw,11.5rem)] shrink-0 snap-start sm:w-[12.5rem] lg:w-auto lg:min-w-0 lg:shrink">
      {children}
    </div>
  );
}

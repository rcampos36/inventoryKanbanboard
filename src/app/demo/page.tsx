import Link from "next/link";
import { KanbanBoard } from "@/components/KanbanBoard";
import {
  DEFAULT_MANAGERS,
  DEFAULT_SALESPEOPLE,
  INITIAL_CARS,
} from "@/lib/data";
import { todayIsoDate } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Public in-memory board for sales demos.
 * Does not require login and does not write to the production database.
 */
export default function DemoBoardPage() {
  return (
    <main className="h-dvh bg-brand">
      <KanbanBoard
        sandbox
        initialCars={INITIAL_CARS}
        initialSalespeople={DEFAULT_SALESPEOPLE}
        initialManagers={DEFAULT_MANAGERS}
        initialSalesDay={todayIsoDate()}
        initialBoardTitle="SalesTower Live Demo"
        organizationName="Demo Dealership"
        organizationBrand="Mazda"
        headerActions={
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-2.5 py-2 text-sm font-semibold text-brand hover:bg-peach/35 sm:px-3"
            >
              SalesTower
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-brand px-2.5 py-2 text-sm font-semibold text-sand hover:bg-[#034a5c] sm:px-3"
            >
              Book a call
            </Link>
          </div>
        }
      />
    </main>
  );
}

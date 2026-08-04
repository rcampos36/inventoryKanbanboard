import Link from "next/link";
import { KanbanBoard } from "@/components/KanbanBoard";
import { DemoAccessForm } from "@/components/DemoAccessForm";
import {
  DEFAULT_MANAGERS,
  DEFAULT_SALESPEOPLE,
  INITIAL_CARS,
} from "@/lib/data";
import { getDemoBoardPassword, hasDemoAccess } from "@/lib/demo-access";
import { todayIsoDate } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Password-gated in-memory board for sales demos.
 * Does not require a dealership login and does not write to the production database.
 */
export default async function DemoBoardPage() {
  const configured = Boolean(getDemoBoardPassword());
  const unlocked = configured && (await hasDemoAccess());

  if (!unlocked) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-sand px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-6 shadow-sm sm:p-8">
          {!configured ? (
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl font-bold text-brand">Demo board</h1>
                <p className="mt-1 text-sm text-brand/60">
                  Demo access is not configured yet. Set{" "}
                  <code className="rounded bg-peach/40 px-1.5 py-0.5 text-xs font-semibold">
                    DEMO_BOARD_PASSWORD
                  </code>{" "}
                  in the environment to enable it.
                </p>
              </div>
              <Link
                href="/"
                className="text-center text-sm font-semibold text-brand hover:underline"
              >
                Back to SalesTower
              </Link>
            </div>
          ) : (
            <DemoAccessForm />
          )}
        </div>
      </main>
    );
  }

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

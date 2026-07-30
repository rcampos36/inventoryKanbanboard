import Link from "next/link";
import { redirect } from "next/navigation";
import { getMonthlyReportAction } from "@/app/actions/reports";
import { requireUser } from "@/lib/auth";
import { boardPath } from "@/lib/paths";
import { formatSaleCount } from "@/lib/types";
import { ReportsMonthPicker } from "@/components/ReportsMonthPicker";

export const dynamic = "force-dynamic";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

interface ReportsPageProps {
  params: Promise<{ dealerSlug: string }>;
  searchParams: Promise<{ month?: string }>;
}

export default async function ReportsPage({
  params,
  searchParams,
}: ReportsPageProps) {
  const { dealerSlug } = await params;
  const { month } = await searchParams;
  const user = await requireUser();

  if (user.organizationSlug !== dealerSlug) {
    redirect(`${boardPath(user.organizationSlug)}/reports`);
  }

  const report = await getMonthlyReportAction(month);
  const boardHref = boardPath(user.organizationSlug);

  return (
    <main className="min-h-screen bg-sand text-brand">
      <header className="border-b border-peach/50 bg-[var(--autosync-surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand/50">
              {user.organizationName}
            </p>
            <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-brand sm:text-2xl">
              Reports
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ReportsMonthPicker
              months={report.months}
              selected={report.monthKey}
            />
            <Link
              href={boardHref}
              className="rounded-lg border border-peach/70 bg-[var(--autosync-surface)] px-3 py-2 text-sm font-semibold text-brand hover:bg-peach/35"
            >
              Back to board
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand/55">
            Sales · {report.monthLabel}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Units sold" value={String(report.sales.units)} />
            <StatCard label="Revenue" value={money(report.sales.revenue)} />
            <StatCard label="New" value={String(report.sales.newUnits)} />
            <StatCard label="Used" value={String(report.sales.usedUnits)} />
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand/55">
              Best-selling models
            </h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-peach/55 bg-[var(--autosync-surface)]">
              {report.topModels.length === 0 ? (
                <EmptyRow text="No sales recorded this month." />
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-peach/40 text-xs uppercase tracking-wider text-brand/55">
                    <tr>
                      <th className="px-4 py-3 font-bold">Model</th>
                      <th className="px-4 py-3 font-bold">Units</th>
                      <th className="px-4 py-3 font-bold">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topModels.map((row) => (
                      <tr
                        key={`${row.make}-${row.model}`}
                        className="border-b border-peach/25 last:border-0"
                      >
                        <td className="px-4 py-3 font-semibold text-brand">
                          {row.make ? `${row.make} ` : ""}
                          {row.model}
                        </td>
                        <td className="px-4 py-3 text-brand/80">{row.units}</td>
                        <td className="px-4 py-3 text-brand/80">
                          {money(row.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand/55">
              Sales by team member
            </h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-peach/55 bg-[var(--autosync-surface)]">
              {report.teamSales.every((row) => row.units === 0) ? (
                <EmptyRow text="No team sales this month." />
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-peach/40 text-xs uppercase tracking-wider text-brand/55">
                    <tr>
                      <th className="px-4 py-3 font-bold">Salesperson</th>
                      <th className="px-4 py-3 font-bold">Units</th>
                      <th className="px-4 py-3 font-bold">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.teamSales.map((row) => (
                      <tr
                        key={row.salespersonId}
                        className="border-b border-peach/25 last:border-0"
                      >
                        <td className="px-4 py-3 font-semibold text-brand">
                          {row.name}
                        </td>
                        <td className="px-4 py-3 text-brand/80">
                          {formatSaleCount(row.units)}
                        </td>
                        <td className="px-4 py-3 text-brand/80">
                          {money(row.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand/55">
            Inventory movement · {report.monthLabel}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Added" value={String(report.inventory.added)} />
            <StatCard label="Moved" value={String(report.inventory.moved)} />
            <StatCard label="Sold" value={String(report.inventory.sold)} />
            <StatCard
              label="Sales reversed"
              value={String(report.inventory.reversed)}
            />
          </div>
          <p className="mt-3 text-xs text-brand/55">
            History covers the last 12 months. Sales stay in reports even if a
            vehicle is later moved off a sold lane. Movement tracking starts when
            vehicles are added or moved on the board.
          </p>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-peach/55 bg-[var(--autosync-surface)] px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-brand/55">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight text-brand">
        {value}
      </p>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <p className="px-4 py-8 text-center text-sm text-brand/55">{text}</p>
  );
}

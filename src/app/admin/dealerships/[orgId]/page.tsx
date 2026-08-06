import Link from "next/link";
import { notFound } from "next/navigation";
import { getDealershipAction } from "@/app/actions/dealerships";
import { DealershipInvoicePanel } from "@/components/DealershipInvoicePanel";
import { DealershipRemovePanel } from "@/components/DealershipRemovePanel";
import { DealershipSubscriptionForm } from "@/components/DealershipSubscriptionForm";
import { PlatformAdminNav } from "@/components/PlatformAdminNav";
import { PlatformUsersPanel } from "@/components/PlatformUsersPanel";
import { requirePlatformAdmin } from "@/lib/auth";
import { boardPath } from "@/lib/paths";
import {
  formatUsdFromCents,
  planLabel,
  planMaxUsers,
  planMonthlyPriceCents,
  planStatusLabel,
} from "@/lib/plans";

export const dynamic = "force-dynamic";

interface DealershipDetailPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function AdminDealershipDetailPage({
  params,
}: DealershipDetailPageProps) {
  const { orgId } = await params;
  const admin = await requirePlatformAdmin();
  const dealership = await getDealershipAction(orgId);
  if (!dealership) notFound();

  const billAmount =
    dealership.plan === "enterprise"
      ? dealership.customMonthlyPriceCents
      : planMonthlyPriceCents(dealership.plan);

  return (
    <main className="min-h-screen bg-sand">
      <header className="flex flex-col gap-3 border-b border-peach/50 bg-[var(--salestower-surface)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand/50">
            Platform · Dealership
          </p>
          <h1 className="text-lg font-bold text-brand">{dealership.name}</h1>
          <p className="mt-1 text-sm text-brand/65">
            {dealership.brand} · /{dealership.slug} ·{" "}
            {planLabel(dealership.plan)} · {dealership.dealerCount}{" "}
            {dealership.dealerCount === 1 ? "dealer" : "dealers"}
            {billAmount != null
              ? ` · ${formatUsdFromCents(billAmount)}/mo`
              : " · set custom price"}{" "}
            · {planStatusLabel(dealership.planStatus)}
          </p>
        </div>
        <PlatformAdminNav
          organizationSlug={admin.organizationSlug}
          active="dealerships"
        />
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/dealerships"
            className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-3 py-2 text-sm font-semibold text-brand hover:bg-peach/35"
          >
            ← All dealerships
          </Link>
          <Link
            href={boardPath(dealership.slug)}
            className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-3 py-2 text-sm font-semibold text-brand hover:bg-peach/35"
          >
            Open board
          </Link>
        </div>

        <DealershipSubscriptionForm dealership={dealership} />

        <DealershipInvoicePanel dealership={dealership} />

        <PlatformUsersPanel
          organizationId={dealership.id}
          currentUserId={admin.id}
          planName={planLabel(dealership.plan)}
          maxUsers={planMaxUsers(dealership.plan)}
          users={dealership.users}
        />

        <DealershipRemovePanel dealership={dealership} />
      </div>
    </main>
  );
}

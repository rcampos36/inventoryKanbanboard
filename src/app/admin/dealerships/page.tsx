import Link from "next/link";
import { listDealershipsAction } from "@/app/actions/dealerships";
import { PlatformAdminNav } from "@/components/PlatformAdminNav";
import { requirePlatformAdmin } from "@/lib/auth";
import { boardPath } from "@/lib/paths";
import { planLabel, planMaxUsers, planStatusLabel } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function AdminDealershipsPage() {
  const admin = await requirePlatformAdmin();
  const dealerships = await listDealershipsAction();

  return (
    <main className="min-h-screen bg-sand">
      <header className="flex flex-col gap-3 border-b border-peach/50 bg-[var(--salestower-surface)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand/50">
            Platform
          </p>
          <h1 className="text-lg font-bold text-brand">Dealership accounts</h1>
          <p className="mt-1 max-w-xl text-sm text-brand/65">
            All registered stores, their subscription plan, and access to manage
            users.
          </p>
        </div>
        <PlatformAdminNav
          organizationSlug={admin.organizationSlug}
          active="dealerships"
        />
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {dealerships.length === 0 ? (
          <p className="rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-6 text-sm text-brand/70">
            No dealerships yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-peach/50 bg-sand/50 text-xs font-bold uppercase tracking-wider text-brand/55">
                <tr>
                  <th className="px-4 py-3">Dealership</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Users</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-peach/35">
                {dealerships.map((org) => {
                  const maxUsers = planMaxUsers(org.plan);
                  return (
                    <tr key={org.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-brand">{org.name}</p>
                        <p className="text-xs text-brand/55">
                          {org.brand} · /{org.slug}
                        </p>
                        {org.dealerNumber ? (
                          <p className="mt-1 text-xs text-brand/55">
                            Dealer # {org.dealerNumber}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-medium text-brand">
                        {planLabel(org.plan)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-peach/45 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand/80">
                          {planStatusLabel(org.planStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-brand/80">
                        {org.userCount} / {maxUsers}
                      </td>
                      <td className="px-4 py-3 text-brand/70">
                        {org.phone ? <p>{org.phone}</p> : null}
                        {org.city || org.state ? (
                          <p className="text-xs">
                            {[org.city, org.state].filter(Boolean).join(", ")}
                          </p>
                        ) : (
                          <p className="text-xs text-brand/45">—</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <Link
                            href={`/admin/dealerships/${org.id}`}
                            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-sand hover:bg-[#034a5c]"
                          >
                            Manage
                          </Link>
                          <Link
                            href={boardPath(org.slug)}
                            className="text-xs font-semibold text-brand/60 underline-offset-2 hover:underline"
                          >
                            Open board
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

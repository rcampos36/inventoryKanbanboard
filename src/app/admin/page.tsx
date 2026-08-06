import Link from "next/link";
import { logoutAction, listUsersAction } from "@/app/actions/auth";
import { requireAdmin } from "@/lib/auth";
import { PEARSON_ORG_ID } from "@/lib/org-ids";
import { boardPath } from "@/lib/paths";
import { planLabel, planMaxUsers } from "@/lib/plans";
import { AdminUsersPanel } from "@/components/AdminUsersPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const users = await listUsersAction();
  const isPlatformAdmin = admin.organizationId === PEARSON_ORG_ID;

  return (
    <main className="min-h-screen bg-sand">
      <header className="flex flex-col gap-3 border-b border-peach/50 bg-[var(--salestower-surface)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand/50">
            Administrator
          </p>
          <h1 className="text-lg font-bold text-brand">User access</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isPlatformAdmin && (
            <Link
              href="/admin/dealerships"
              className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-3 py-2 text-sm font-semibold text-brand hover:bg-peach/35"
            >
              Dealerships
            </Link>
          )}
          <Link
            href={boardPath(admin.organizationSlug)}
            className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-3 py-2 text-sm font-semibold text-brand hover:bg-peach/35"
          >
            Back to board
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-3 py-2 text-sm font-semibold text-brand hover:bg-peach/35"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <AdminUsersPanel
        currentUserId={admin.id}
        planName={planLabel(admin.organizationPlan)}
        maxUsers={planMaxUsers(admin.organizationPlan)}
        users={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}

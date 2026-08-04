import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { boardPath } from "@/lib/paths";
import { planHasFeature } from "@/lib/plans";
import type { SessionUser } from "@/lib/session-types";

export function AppHeaderActions({ user }: { user: SessionUser }) {
  const canReports = planHasFeature(user.organizationPlan, "reports");

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {canReports && (
        <Link
          href={`${boardPath(user.organizationSlug)}/reports`}
          className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-2.5 py-2 text-sm font-semibold text-brand hover:bg-peach/35 sm:px-3"
        >
          Reports
        </Link>
      )}
      {user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-2.5 py-2 text-sm font-semibold text-brand hover:bg-peach/35 sm:px-3"
        >
          <span className="sm:hidden">Users</span>
          <span className="hidden sm:inline">Manage users</span>
        </Link>
      )}
      <span className="hidden max-w-36 truncate text-sm font-medium text-brand/70 md:inline">
        {user.name}
      </span>
      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-2.5 py-2 text-sm font-semibold text-brand hover:bg-peach/35 sm:px-3"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

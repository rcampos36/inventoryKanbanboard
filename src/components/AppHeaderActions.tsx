import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/session-types";

export function AppHeaderActions({ user }: { user: SessionUser }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="rounded-lg border border-peach/70 bg-[var(--autosync-surface)] px-2.5 py-2 text-sm font-semibold text-brand hover:bg-peach/35 sm:px-3"
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
          className="rounded-lg border border-peach/70 bg-[var(--autosync-surface)] px-2.5 py-2 text-sm font-semibold text-brand hover:bg-peach/35 sm:px-3"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

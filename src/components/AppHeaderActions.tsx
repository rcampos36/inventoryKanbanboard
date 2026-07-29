import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/session-types";

export function AppHeaderActions({ user }: { user: SessionUser }) {
  return (
    <div className="flex items-center gap-2">
      {user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Manage users
        </Link>
      )}
      <span className="hidden max-w-36 truncate text-sm font-medium text-slate-600 sm:inline">
        {user.name}
      </span>
      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

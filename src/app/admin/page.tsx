import Link from "next/link";
import { logoutAction, listUsersAction } from "@/app/actions/auth";
import { requireAdmin } from "@/lib/auth";
import { AdminUsersPanel } from "@/components/AdminUsersPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const users = await listUsersAction();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Administrator
          </p>
          <h1 className="text-lg font-bold text-slate-900">User access</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to board
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <AdminUsersPanel
        currentUserId={admin.id}
        users={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}

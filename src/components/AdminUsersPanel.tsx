"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserAction,
  deleteUserAction,
  type AuthFormState,
} from "@/app/actions/auth";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
};

const initialState: AuthFormState = {};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";
const labelClass = "text-xs font-semibold text-slate-600";

export function AdminUsersPanel({
  users,
  currentUserId,
}: {
  users: ManagedUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [createState, createAction, creating] = useActionState(
    createUserAction,
    initialState
  );
  const [deleteState, deleteFormAction, deleting] = useActionState(
    deleteUserAction,
    initialState
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (createState.success || deleteState.success) {
      setPendingDeleteId(null);
      router.refresh();
    }
  }, [createState.success, deleteState.success, router]);

  useEffect(() => {
    if (deleteState.error) {
      setPendingDeleteId(null);
    }
  }, [deleteState.error]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage access</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add people who can sign in to the inventory board.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
          Grant access
        </h2>
        <form action={createAction} className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="name">
              Name
            </label>
            <input id="name" name="name" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="password">
              Temporary password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="role">
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue="USER"
              className={inputClass}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            {createState.error && (
              <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {createState.error}
              </p>
            )}
            {createState.success && (
              <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                {createState.success}
              </p>
            )}
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {creating ? "Adding…" : "Add user"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
          People with access ({users.length})
        </h2>
        {deleteState.error && (
          <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {deleteState.error}
          </p>
        )}
        {deleteState.success && (
          <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {deleteState.success}
          </p>
        )}
        <ul className="divide-y divide-slate-100">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {user.name}{" "}
                  <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    {user.role}
                  </span>
                </p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              {user.id !== currentUserId ? (
                <form
                  action={deleteFormAction}
                  onSubmit={() => setPendingDeleteId(user.id)}
                >
                  <input type="hidden" name="userId" value={user.id} />
                  <button
                    type="submit"
                    disabled={deleting}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                  >
                    {deleting && pendingDeleteId === user.id
                      ? "Removing…"
                      : "Remove"}
                  </button>
                </form>
              ) : (
                <span className="text-xs font-medium text-slate-400">You</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

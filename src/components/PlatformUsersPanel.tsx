"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createDealershipUserAction,
  deleteDealershipUserAction,
  updateDealershipUserAction,
  type DealershipFormState,
} from "@/app/actions/dealerships";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
};

const initialState: DealershipFormState = {};

const inputClass =
  "w-full rounded-lg border border-peach/70 px-3 py-2 text-sm text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";
const labelClass = "text-xs font-semibold text-brand/70";

export function PlatformUsersPanel({
  organizationId,
  users,
  currentUserId,
  planName,
  maxUsers,
}: {
  organizationId: string;
  users: ManagedUser[];
  currentUserId: string;
  planName: string;
  maxUsers: number;
}) {
  const router = useRouter();
  const atSeatLimit = users.length >= maxUsers;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [createState, createAction, creating] = useActionState(
    createDealershipUserAction,
    initialState
  );
  const [updateState, updateAction, updating] = useActionState(
    updateDealershipUserAction,
    initialState
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteDealershipUserAction,
    initialState
  );

  useEffect(() => {
    if (createState.success || updateState.success || deleteState.success) {
      setEditingId(null);
      setPendingDeleteId(null);
      router.refresh();
    }
  }, [
    createState.success,
    updateState.success,
    deleteState.success,
    router,
  ]);

  useEffect(() => {
    if (deleteState.error) setPendingDeleteId(null);
  }, [deleteState.error]);

  const editingUser = users.find((user) => user.id === editingId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-400">
          User accounts
        </h2>
        <p className="mb-4 text-sm text-brand/60">
          {planName} plan · {users.length} of {maxUsers} user logins used
        </p>

        {atSeatLimit && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            Seat limit reached. Upgrade the dealership plan to add more logins.
          </p>
        )}

        <form action={createAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="organizationId" value={organizationId} />
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="create-name">
              Name
            </label>
            <input
              id="create-name"
              name="name"
              required
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="create-email">
              Email
            </label>
            <input
              id="create-email"
              name="email"
              type="email"
              required
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="create-password">
              Temporary password
            </label>
            <input
              id="create-password"
              name="password"
              type="password"
              required
              minLength={8}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="create-role">
              Role
            </label>
            <select
              id="create-role"
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
              disabled={creating || atSeatLimit}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-60"
            >
              {creating ? "Adding…" : "Add user"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
          People with access ({users.length})
        </h2>

        {(updateState.error || deleteState.error) && (
          <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {updateState.error || deleteState.error}
          </p>
        )}
        {(updateState.success || deleteState.success) && (
          <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {updateState.success || deleteState.success}
          </p>
        )}

        {editingUser && (
          <form
            action={updateAction}
            className="mb-5 grid gap-3 rounded-xl border border-peach/50 bg-sand/40 p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="organizationId" value={organizationId} />
            <input type="hidden" name="userId" value={editingUser.id} />
            <p className="sm:col-span-2 text-sm font-semibold text-brand">
              Edit {editingUser.name}
            </p>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="edit-name">
                Name
              </label>
              <input
                id="edit-name"
                name="name"
                required
                defaultValue={editingUser.name}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="edit-email">
                Email
              </label>
              <input
                id="edit-email"
                name="email"
                type="email"
                required
                defaultValue={editingUser.email}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="edit-password">
                New password{" "}
                <span className="font-medium text-brand/50">(optional)</span>
              </label>
              <input
                id="edit-password"
                name="password"
                type="password"
                minLength={8}
                className={inputClass}
                placeholder="Leave blank to keep current"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="edit-role">
                Role
              </label>
              <select
                id="edit-role"
                name="role"
                defaultValue={editingUser.role}
                className={inputClass}
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={updating}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-60"
              >
                {updating ? "Saving…" : "Save user"}
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <ul className="divide-y divide-slate-100">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-brand">
                  {user.name}{" "}
                  <span className="ml-1 rounded-full bg-peach/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand/70">
                    {user.role}
                  </span>
                </p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {user.id === currentUserId ? (
                  <span className="text-xs font-medium text-slate-400">You</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setEditingId(user.id)}
                  className="rounded-lg border border-peach/70 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-peach/35"
                >
                  Edit
                </button>
                {user.id !== currentUserId ? (
                  <form
                    action={deleteAction}
                    onSubmit={() => setPendingDeleteId(user.id)}
                  >
                    <input
                      type="hidden"
                      name="organizationId"
                      value={organizationId}
                    />
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
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

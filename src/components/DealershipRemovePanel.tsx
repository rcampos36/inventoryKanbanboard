"use client";

import { useActionState, useState } from "react";
import {
  deleteDealershipAction,
  type DealershipDetail,
  type DealershipFormState,
} from "@/app/actions/dealerships";
import { PEARSON_ORG_ID, SUNRISE_ORG_ID } from "@/lib/org-ids";

const initialState: DealershipFormState = {};

const inputClass =
  "w-full rounded-lg border border-rose-200 px-3 py-2 text-sm text-brand outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200";

export function DealershipRemovePanel({
  dealership,
}: {
  dealership: DealershipDetail;
}) {
  const protectedOrg =
    dealership.id === PEARSON_ORG_ID || dealership.id === SUNRISE_ORG_ID;
  const [confirmName, setConfirmName] = useState("");
  const [state, formAction, pending] = useActionState(
    deleteDealershipAction,
    initialState
  );

  const nameMatches =
    confirmName.trim().toLowerCase() === dealership.name.toLowerCase();

  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-rose-700/80">
        Remove dealership
      </h2>
      <p className="mb-4 text-sm text-rose-900/75">
        Permanently delete this subscription account, including users,
        inventory, invoices, and board data. This cannot be undone.
      </p>

      {protectedOrg ? (
        <p className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-rose-800">
          Built-in platform and demo dealerships cannot be removed.
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="organizationId" value={dealership.id} />
          <div className="flex flex-col gap-1">
            <label
              htmlFor="confirmName"
              className="text-xs font-semibold text-rose-800/80"
            >
              Type <span className="font-bold">{dealership.name}</span> to
              confirm
            </label>
            <input
              id="confirmName"
              name="confirmName"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              autoComplete="off"
              className={inputClass}
              placeholder={dealership.name}
            />
          </div>

          {state.error ? (
            <p className="text-sm font-medium text-rose-700" role="alert">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || !nameMatches}
            className="self-start rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
          >
            {pending ? "Removing…" : "Remove dealership account"}
          </button>
        </form>
      )}
    </section>
  );
}

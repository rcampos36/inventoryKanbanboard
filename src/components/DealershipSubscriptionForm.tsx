"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateDealershipSubscriptionAction,
  type DealershipDetail,
  type DealershipFormState,
} from "@/app/actions/dealerships";
import { PLAN_IDS, PLAN_STATUSES, planLabel, planStatusLabel } from "@/lib/plans";

const initialState: DealershipFormState = {};

const inputClass =
  "w-full rounded-lg border border-peach/70 px-3 py-2 text-sm text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";
const labelClass = "text-xs font-semibold text-brand/70";

export function DealershipSubscriptionForm({
  dealership,
}: {
  dealership: DealershipDetail;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateDealershipSubscriptionAction,
    initialState
  );

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <section className="rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-400">
        Subscription & contact
      </h2>
      <p className="mb-4 text-sm text-brand/60">
        Change the plan that gates features for this dealership, and update
        contact details collected at registration.
      </p>

      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="organizationId" value={dealership.id} />

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="plan">
            Plan
          </label>
          <select
            id="plan"
            name="plan"
            required
            defaultValue={dealership.plan}
            className={inputClass}
          >
            {PLAN_IDS.map((id) => (
              <option key={id} value={id}>
                {planLabel(id)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="planStatus">
            Status
          </label>
          <select
            id="planStatus"
            name="planStatus"
            required
            defaultValue={dealership.planStatus}
            className={inputClass}
          >
            {PLAN_STATUSES.map((status) => (
              <option key={status} value={status}>
                {planStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="dealerNumber">
            Dealer number
          </label>
          <input
            id="dealerNumber"
            name="dealerNumber"
            defaultValue={dealership.dealerNumber ?? ""}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={dealership.phone ?? ""}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className={labelClass} htmlFor="addressLine1">
            Street address
          </label>
          <input
            id="addressLine1"
            name="addressLine1"
            defaultValue={dealership.addressLine1 ?? ""}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className={labelClass} htmlFor="addressLine2">
            Address line 2
          </label>
          <input
            id="addressLine2"
            name="addressLine2"
            defaultValue={dealership.addressLine2 ?? ""}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="city">
            City
          </label>
          <input
            id="city"
            name="city"
            defaultValue={dealership.city ?? ""}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="state">
              State
            </label>
            <input
              id="state"
              name="state"
              defaultValue={dealership.state ?? ""}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="postalCode">
              ZIP
            </label>
            <input
              id="postalCode"
              name="postalCode"
              defaultValue={dealership.postalCode ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          {state.error && (
            <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {state.success}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save subscription"}
          </button>
        </div>
      </form>
    </section>
  );
}

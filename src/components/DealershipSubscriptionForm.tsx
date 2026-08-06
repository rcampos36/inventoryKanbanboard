"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateDealershipSubscriptionAction,
  type DealershipDetail,
  type DealershipFormState,
} from "@/app/actions/dealerships";
import {
  PLAN_IDS,
  PLAN_STATUSES,
  clampDealerCount,
  formatUsdFromCents,
  planDealerCountOptions,
  planLabel,
  planMaxDealers,
  planMonthlyPriceCents,
  planStatusLabel,
  type PlanId,
  type PlanStatus,
} from "@/lib/plans";

const initialState: DealershipFormState = {};

const inputClass =
  "w-full rounded-lg border border-peach/70 px-3 py-2 text-sm text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";
const labelClass = "text-xs font-semibold text-brand/70";

function planOptionLabel(id: PlanId): string {
  const cents = planMonthlyPriceCents(id);
  return cents != null
    ? `${planLabel(id)} — ${formatUsdFromCents(cents)}/mo`
    : `${planLabel(id)} — Custom`;
}

export function DealershipSubscriptionForm({
  dealership,
}: {
  dealership: DealershipDetail;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanId>(dealership.plan);
  const [planStatus, setPlanStatus] = useState<PlanStatus>(
    dealership.planStatus
  );
  const [dealerCount, setDealerCount] = useState(dealership.dealerCount);
  const [customPrice, setCustomPrice] = useState(
    dealership.customMonthlyPriceCents != null
      ? String(dealership.customMonthlyPriceCents / 100)
      : ""
  );
  const [state, formAction, pending] = useActionState(
    updateDealershipSubscriptionAction,
    initialState
  );
  const dealerCountOptions = planDealerCountOptions(plan);

  useEffect(() => {
    setPlan(dealership.plan);
    setPlanStatus(dealership.planStatus);
    setDealerCount(clampDealerCount(dealership.dealerCount, dealership.plan));
    setCustomPrice(
      dealership.plan === "enterprise" &&
        dealership.customMonthlyPriceCents != null
        ? String(dealership.customMonthlyPriceCents / 100)
        : ""
    );
  }, [
    dealership.plan,
    dealership.planStatus,
    dealership.dealerCount,
    dealership.customMonthlyPriceCents,
    dealership.updatedAt,
  ]);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  const listPrice = planMonthlyPriceCents(plan);
  const needsCustomPrice = plan === "enterprise";
  const effectivePrice = needsCustomPrice
    ? customPrice.trim() !== ""
      ? Number(customPrice)
      : null
    : listPrice != null
      ? listPrice / 100
      : null;

  return (
    <section className="rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-400">
        Subscription & contact
      </h2>
      <p className="mb-4 text-sm text-brand/60">
        Update this account&apos;s plan anytime. Saving applies feature access
        and invoice pricing for the store.
      </p>

      <form
        key={`${dealership.id}-${dealership.updatedAt}`}
        action={formAction}
        className="grid gap-3 sm:grid-cols-2"
      >
        <input type="hidden" name="organizationId" value={dealership.id} />

        <div className="rounded-xl border border-peach/50 bg-sand/40 p-4 sm:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wider text-brand/55">
            Plan
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="plan">
                Subscription plan
              </label>
              <select
                id="plan"
                name="plan"
                required
                value={plan}
                onChange={(e) => {
                  const nextPlan = e.target.value as PlanId;
                  setPlan(nextPlan);
                  setDealerCount((current) =>
                    clampDealerCount(current, nextPlan)
                  );
                  if (nextPlan !== "enterprise") {
                    setCustomPrice("");
                  } else if (
                    dealership.customMonthlyPriceCents != null &&
                    dealership.plan === "enterprise"
                  ) {
                    setCustomPrice(
                      String(dealership.customMonthlyPriceCents / 100)
                    );
                  }
                }}
                className={inputClass}
              >
                {PLAN_IDS.map((id) => (
                  <option key={id} value={id}>
                    {planOptionLabel(id)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="dealerCount">
                Number of dealers / rooftops
              </label>
              {planMaxDealers(plan) <= 1 ? (
                <>
                  <input type="hidden" name="dealerCount" value={1} />
                  <p className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-3 py-2 text-sm text-brand">
                    Starter includes <span className="font-semibold">1</span>{" "}
                    rooftop.
                  </p>
                </>
              ) : (
                <select
                  id="dealerCount"
                  name="dealerCount"
                  required
                  value={dealerCount}
                  onChange={(e) => setDealerCount(Number(e.target.value))}
                  className={inputClass}
                >
                  {dealerCountOptions.map((count) => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? "dealer" : "dealers"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="planStatus">
                Status
              </label>
              <select
                id="planStatus"
                name="planStatus"
                required
                value={planStatus}
                onChange={(e) => setPlanStatus(e.target.value as PlanStatus)}
                className={inputClass}
              >
                {PLAN_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {planStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            {needsCustomPrice ? (
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className={labelClass} htmlFor="customMonthlyPrice">
                  Agreed monthly price (USD)
                  <span className="ml-1 font-semibold text-brand">
                    — required for Enterprise
                  </span>
                </label>
                <input
                  id="customMonthlyPrice"
                  name="customMonthlyPrice"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Enter the agreed Enterprise price"
                  className={inputClass}
                />
                <p className="text-[11px] text-brand/55">
                  Saved on the account and used as the default invoice amount.
                </p>
              </div>
            ) : (
              <div className="sm:col-span-2">
                <p className="rounded-lg border border-peach/50 bg-[var(--salestower-surface)] px-3 py-2 text-sm text-brand/70">
                  {planLabel(plan)} uses the fixed list price
                  {listPrice != null
                    ? ` of ${formatUsdFromCents(listPrice)}/mo`
                    : ""}
                  . Agreed custom pricing applies to Enterprise only.
                </p>
              </div>
            )}
          </div>
          <p className="mt-3 text-sm font-medium text-brand">
            Selected: {planLabel(plan)} · {dealerCount}{" "}
            {dealerCount === 1 ? "dealer" : "dealers"}
            {Number.isFinite(effectivePrice) && effectivePrice != null
              ? ` · ${formatUsdFromCents(Math.round(effectivePrice * 100))}/mo`
              : " · set an agreed price"}
          </p>
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
            {pending ? "Saving…" : "Save plan changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

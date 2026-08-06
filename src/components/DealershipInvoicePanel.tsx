"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  sendDealershipInvoiceAction,
  type DealershipDetail,
  type DealershipFormState,
} from "@/app/actions/dealerships";
import { currentBillingPeriodLabel } from "@/lib/invoices";
import {
  formatUsdFromCents,
  planLabel,
  planMonthlyPriceCents,
} from "@/lib/plans";

const initialState: DealershipFormState = {};

const inputClass =
  "w-full rounded-lg border border-peach/70 px-3 py-2 text-sm text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";
const labelClass = "text-xs font-semibold text-brand/70";

export function DealershipInvoicePanel({
  dealership,
}: {
  dealership: DealershipDetail;
}) {
  const router = useRouter();
  const planAmount = planMonthlyPriceCents(dealership.plan);
  const defaultRecipient =
    dealership.users.find((user) => user.role === "ADMIN")?.email ??
    dealership.users[0]?.email ??
    "";

  const [amountOverride, setAmountOverride] = useState(
    planAmount != null ? String(planAmount / 100) : ""
  );

  const previewAmount = useMemo(() => {
    const raw = amountOverride.trim().replace(/[$,]/g, "");
    if (!raw) return planAmount;
    const dollars = Number(raw);
    if (!Number.isFinite(dollars) || dollars <= 0) return null;
    return Math.round(dollars * 100);
  }, [amountOverride, planAmount]);

  const [state, formAction, pending] = useActionState(
    sendDealershipInvoiceAction,
    initialState
  );

  useEffect(() => {
    setAmountOverride(planAmount != null ? String(planAmount / 100) : "");
  }, [dealership.plan, planAmount]);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <section className="rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-400">
        Send invoice
      </h2>
      <p className="mb-4 text-sm text-brand/60">
        Email a monthly subscription invoice. Amount defaults from the{" "}
        {planLabel(dealership.plan)} plan
        {planAmount != null
          ? ` (${formatUsdFromCents(planAmount)}/mo)`
          : " (custom — enter an amount)"}.
      </p>

      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="organizationId" value={dealership.id} />

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className={labelClass} htmlFor="recipientEmail">
            Send to
          </label>
          <input
            id="recipientEmail"
            name="recipientEmail"
            type="email"
            required
            list="dealership-user-emails"
            defaultValue={defaultRecipient}
            className={inputClass}
          />
          <datalist id="dealership-user-emails">
            {dealership.users.map((user) => (
              <option key={user.id} value={user.email}>
                {user.name} ({user.role})
              </option>
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="periodLabel">
            Billing period
          </label>
          <input
            id="periodLabel"
            name="periodLabel"
            required
            defaultValue={currentBillingPeriodLabel()}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="amountOverride">
            Amount (USD)
          </label>
          <input
            id="amountOverride"
            name="amountOverride"
            type="number"
            min="1"
            step="1"
            required={planAmount == null}
            value={amountOverride}
            onChange={(e) => setAmountOverride(e.target.value)}
            placeholder={planAmount == null ? "Enter custom amount" : undefined}
            className={inputClass}
          />
          <p className="text-[11px] text-brand/55">
            Preview:{" "}
            {previewAmount != null
              ? formatUsdFromCents(previewAmount)
              : "Enter a valid amount"}
          </p>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className={labelClass} htmlFor="invoice-note">
            Note{" "}
            <span className="font-medium text-brand/50">(optional)</span>
          </label>
          <textarea
            id="invoice-note"
            name="note"
            rows={3}
            className={inputClass}
            placeholder="ACH instructions, PO number, due date, etc."
          />
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
            disabled={pending || previewAmount == null}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send invoice email"}
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-peach/45 pt-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          Recent invoices
        </h3>
        {dealership.invoices.length === 0 ? (
          <p className="text-sm text-brand/55">No invoices sent yet.</p>
        ) : (
          <ul className="divide-y divide-peach/35">
            {dealership.invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-brand">
                    {invoice.invoiceNumber} ·{" "}
                    {formatUsdFromCents(invoice.amountCents)}
                  </p>
                  <p className="text-xs text-brand/60">
                    {invoice.periodLabel} · {planLabel(invoice.plan)} ·{" "}
                    {invoice.recipientEmail}
                  </p>
                  {invoice.emailError ? (
                    <p className="mt-1 text-xs text-amber-800">
                      {invoice.emailError}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p
                    className={[
                      "text-xs font-bold uppercase tracking-wide",
                      invoice.status === "sent"
                        ? "text-emerald-700"
                        : "text-amber-800",
                    ].join(" ")}
                  >
                    {invoice.status}
                  </p>
                  <p className="text-xs text-brand/45">
                    {new Date(invoice.sentAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

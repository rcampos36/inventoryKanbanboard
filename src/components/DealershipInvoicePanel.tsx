"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  sendDealershipInvoiceAction,
  updateDealershipInvoicePaidAction,
  type DealershipDetail,
  type DealershipFormState,
} from "@/app/actions/dealerships";
import {
  buildDealershipAddressLines,
  buildInvoiceEmailText,
  buildInvoiceNumber,
  currentBillingPeriodLabel,
  defaultInvoiceAmountCents,
  parseDollarsToCents,
} from "@/lib/invoices";
import { formatUsdFromCents, planLabel } from "@/lib/plans";

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
  const defaultAmount = defaultInvoiceAmountCents({
    planId: dealership.plan,
    customMonthlyPriceCents: dealership.customMonthlyPriceCents,
  });
  const defaultRecipient =
    dealership.users.find((user) => user.role === "ADMIN")?.email ??
    dealership.users[0]?.email ??
    "";

  const [recipientEmail, setRecipientEmail] = useState(defaultRecipient);
  const [periodLabel, setPeriodLabel] = useState(currentBillingPeriodLabel());
  const [amountOverride, setAmountOverride] = useState(
    defaultAmount != null ? String(defaultAmount / 100) : ""
  );
  const [note, setNote] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const previewAmount = useMemo(() => {
    const overrideCents = parseDollarsToCents(amountOverride);
    if (amountOverride.trim()) return overrideCents;
    return defaultAmount;
  }, [amountOverride, defaultAmount]);

  const previewText = useMemo(() => {
    if (previewAmount == null) return "";
    return buildInvoiceEmailText({
      dealershipName: dealership.name,
      invoiceNumber: `${buildInvoiceNumber(dealership.slug)} (preview)`,
      planId: dealership.plan,
      amountCents: previewAmount,
      periodLabel: periodLabel.trim() || currentBillingPeriodLabel(),
      note,
      addressLines: buildDealershipAddressLines(dealership),
    });
  }, [
    dealership,
    note,
    periodLabel,
    previewAmount,
  ]);

  const [state, formAction, pending] = useActionState(
    sendDealershipInvoiceAction,
    initialState
  );
  const [paidState, paidAction, paidPending] = useActionState(
    updateDealershipInvoicePaidAction,
    initialState
  );
  const [pendingPaidId, setPendingPaidId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setRecipientEmail(defaultRecipient);
    setAmountOverride(defaultAmount != null ? String(defaultAmount / 100) : "");
  }, [defaultAmount, defaultRecipient, dealership.id, dealership.plan]);

  useEffect(() => {
    if (state.success) {
      setPreviewOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  useEffect(() => {
    if (paidState.success || paidState.error) {
      setPendingPaidId(null);
      if (paidState.success) router.refresh();
    }
  }, [paidState.success, paidState.error, router]);

  useEffect(() => {
    if (!previewOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) setPreviewOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen, pending]);

  const canPreview =
    Boolean(recipientEmail.trim()) &&
    Boolean(periodLabel.trim()) &&
    previewAmount != null;

  return (
    <section className="rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-5 shadow-sm">
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-400">
        Send invoice
      </h2>
      <p className="mb-4 text-sm text-brand/60">
        Amount defaults from
        {dealership.plan === "enterprise"
          ? dealership.customMonthlyPriceCents != null
            ? ` the agreed Enterprise price (${formatUsdFromCents(dealership.customMonthlyPriceCents)}/mo)`
            : " the agreed Enterprise price — save it on the subscription first"
          : defaultAmount != null
            ? ` the ${planLabel(dealership.plan)} list price (${formatUsdFromCents(defaultAmount)}/mo)`
            : ` the ${planLabel(dealership.plan)} list price`}
        . Preview before sending.
      </p>

      <form
        id="dealership-invoice-form"
        action={formAction}
        className="grid gap-3 sm:grid-cols-2"
      >
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
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
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
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
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
            required={defaultAmount == null}
            value={amountOverride}
            onChange={(e) => setAmountOverride(e.target.value)}
            placeholder={
              defaultAmount == null ? "Enter invoice amount" : undefined
            }
            className={inputClass}
          />
          <p className="text-[11px] text-brand/55">
            {previewAmount != null
              ? `This invoice: ${formatUsdFromCents(previewAmount)}`
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
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canPreview}
              onClick={() => setPreviewOpen(true)}
              className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-4 py-2 text-sm font-semibold text-brand hover:bg-peach/35 disabled:opacity-60"
            >
              Preview invoice
            </button>
            <button
              type="submit"
              disabled={pending || !canPreview}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send invoice email"}
            </button>
          </div>
        </div>

        {mounted && previewOpen
          ? createPortal(
              <div
                className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="invoice-preview-title"
                onClick={() => {
                  if (!pending) setPreviewOpen(false);
                }}
              >
                <div
                  className="flex max-h-[min(90dvh,44rem)] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="border-b border-peach/40 px-5 py-4 sm:px-6">
                    <h3
                      id="invoice-preview-title"
                      className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand"
                    >
                      Invoice preview
                    </h3>
                    <p className="mt-1 text-sm text-brand/60">
                      Review before sending to {recipientEmail}
                      {previewAmount != null
                        ? ` · ${formatUsdFromCents(previewAmount)}`
                        : ""}
                      . A PDF invoice will be attached.
                    </p>
                  </div>
                  <pre className="flex-1 overflow-y-auto whitespace-pre-wrap px-5 py-4 font-sans text-sm leading-relaxed text-brand sm:px-6">
                    {previewText}
                  </pre>
                  <div className="flex flex-wrap justify-end gap-2 border-t border-peach/40 px-5 py-4 sm:px-6">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setPreviewOpen(false)}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                    >
                      Back to edit
                    </button>
                    <button
                      type="submit"
                      form="dealership-invoice-form"
                      disabled={pending || !canPreview}
                      className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-60"
                    >
                      {pending ? "Sending…" : "Send invoice"}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )
          : null}
      </form>

      <div className="mt-6 border-t border-peach/45 pt-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          Recent invoices
        </h3>
        {paidState.error ? (
          <p className="mb-3 text-sm text-rose-700" role="alert">
            {paidState.error}
          </p>
        ) : null}
        {paidState.success ? (
          <p className="mb-3 text-sm text-emerald-700" role="status">
            {paidState.success}
          </p>
        ) : null}
        {dealership.invoices.length === 0 ? (
          <p className="text-sm text-brand/55">No invoices sent yet.</p>
        ) : (
          <ul className="divide-y divide-peach/35">
            {dealership.invoices.map((invoice) => {
              const isPaid = invoice.status === "paid";
              const rowBusy = paidPending && pendingPaidId === invoice.id;
              return (
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
                  <div className="flex flex-col items-end gap-1.5">
                    <p
                      className={[
                        "text-xs font-bold uppercase tracking-wide",
                        isPaid
                          ? "text-emerald-700"
                          : invoice.status === "sent"
                            ? "text-brand/70"
                            : "text-amber-800",
                      ].join(" ")}
                    >
                      {invoice.status}
                    </p>
                    <p className="text-xs text-brand/45">
                      {isPaid && invoice.paidAt
                        ? `Paid ${new Date(invoice.paidAt).toLocaleString()}`
                        : new Date(invoice.sentAt).toLocaleString()}
                    </p>
                    <form
                      action={paidAction}
                      onSubmit={() => setPendingPaidId(invoice.id)}
                    >
                      <input
                        type="hidden"
                        name="organizationId"
                        value={dealership.id}
                      />
                      <input type="hidden" name="invoiceId" value={invoice.id} />
                      <input
                        type="hidden"
                        name="markPaid"
                        value={isPaid ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        disabled={paidPending}
                        className={[
                          "rounded-lg border px-2.5 py-1 text-xs font-semibold disabled:opacity-60",
                          isPaid
                            ? "border-peach/70 text-brand/70 hover:bg-peach/35"
                            : "border-emerald-200 text-emerald-800 hover:bg-emerald-50",
                        ].join(" ")}
                      >
                        {rowBusy
                          ? isPaid
                            ? "Updating…"
                            : "Marking…"
                          : isPaid
                            ? "Mark unpaid"
                            : "Mark paid"}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

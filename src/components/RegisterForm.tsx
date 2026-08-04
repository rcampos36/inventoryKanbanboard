"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  registerDealerAction,
} from "@/app/actions/register";
import type { AuthFormState } from "@/app/actions/auth";
import {
  DEFAULT_PLAN_ID,
  PLANS,
  type PlanId,
} from "@/lib/plans";

const initialState: AuthFormState = {};

const inputClass =
  "w-full rounded-lg border border-peach/70 px-3 py-2.5 text-sm text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";
const labelClass = "text-xs font-semibold text-brand/70";

export function RegisterForm({ brands }: { brands: string[] }) {
  const [state, formAction, pending] = useActionState(
    registerDealerAction,
    initialState
  );
  const [brand, setBrand] = useState("");
  const [plan, setPlan] = useState<PlanId>(DEFAULT_PLAN_ID);
  const [salespersonDraft, setSalespersonDraft] = useState("");
  const [salespeople, setSalespeople] = useState<string[]>([]);
  const [managerDraft, setManagerDraft] = useState("");
  const [managers, setManagers] = useState<string[]>([]);

  // Avoid password-manager autofill mismatching server HTML on first paint.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  function addName(
    draft: string,
    setDraft: (v: string) => void,
    list: string[],
    setList: (v: string[]) => void
  ) {
    const name = draft.trim();
    if (!name) return;
    if (list.some((entry) => entry.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }
    setList([...list, name]);
    setDraft("");
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-brand">Register your dealership</h1>
        <p className="mt-1 text-sm text-brand/60">
          Choose a plan, create your store admin account, and set up your board.
        </p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {state.error}
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-4" autoComplete="on">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-bold text-brand">Plan</legend>
          <input type="hidden" name="plan" value={plan} />
          <div className="grid gap-3 sm:grid-cols-3">
            {PLANS.map((option) => {
              const selected = plan === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPlan(option.id)}
                  className={[
                    "flex h-full flex-col rounded-xl border px-3 py-3 text-left transition",
                    selected
                      ? "border-brand bg-brand text-sand ring-2 ring-brand/20"
                      : "border-peach/70 bg-[var(--salestower-surface)] text-brand hover:border-brand/40 hover:bg-peach/20",
                    option.highlighted && !selected
                      ? "shadow-[0_0_0_1px_rgba(2,52,65,0.08)]"
                      : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold">{option.name}</span>
                    {option.highlighted && (
                      <span
                        className={[
                          "rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          selected
                            ? "bg-sand/20 text-sand"
                            : "bg-peach/70 text-brand",
                        ].join(" ")}
                      >
                        Popular
                      </span>
                    )}
                  </div>
                  <p
                    className={[
                      "mt-1 font-[family-name:var(--font-syne)] text-lg font-extrabold",
                      selected ? "text-sand" : "text-brand",
                    ].join(" ")}
                  >
                    {option.priceLabel}
                  </p>
                  <p
                    className={[
                      "mt-1 text-xs leading-snug",
                      selected ? "text-sand/80" : "text-brand/60",
                    ].join(" ")}
                  >
                    {option.blurb}
                  </p>
                  <ul
                    className={[
                      "mt-3 flex flex-col gap-1 text-[11px] leading-snug",
                      selected ? "text-sand/85" : "text-brand/70",
                    ].join(" ")}
                  >
                    {option.features.map((feature) => (
                      <li key={feature} className="flex gap-1.5">
                        <span aria-hidden className="mt-0.5 shrink-0">
                          ·
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-brand/55">
            Billing checkout can be connected later. Your selection is saved on
            the dealership now so we know which plan you want.
          </p>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-bold text-brand">Dealership</legend>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="dealershipName">
              Dealership name
            </label>
            <input
              id="dealershipName"
              name="dealershipName"
              required
              placeholder="Sunrise Honda"
              className={inputClass}
              suppressHydrationWarning
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="brand">
              Franchise brand
            </label>
            <select
              id="brand"
              name="brand"
              required
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className={inputClass}
              suppressHydrationWarning
            >
              <option value="" disabled>
                Select brand…
              </option>
              {brands.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-brand/55">
              New-car model sections on your board follow this brand. Used inventory
              keeps shared Used / Other lanes.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="dealerNumber">
              Dealer number
            </label>
            <input
              id="dealerNumber"
              name="dealerNumber"
              required
              placeholder="OEM / manufacturer dealer code"
              className={inputClass}
              suppressHydrationWarning
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="phone">
              Dealership phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="(555) 555-5555"
              className={inputClass}
              suppressHydrationWarning
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="addressLine1">
              Street address
            </label>
            <input
              id="addressLine1"
              name="addressLine1"
              required
              autoComplete="address-line1"
              placeholder="123 Main Street"
              className={inputClass}
              suppressHydrationWarning
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="addressLine2">
              Address line 2{" "}
              <span className="font-medium text-brand/50">(optional)</span>
            </label>
            <input
              id="addressLine2"
              name="addressLine2"
              autoComplete="address-line2"
              placeholder="Suite, unit, etc."
              className={inputClass}
              suppressHydrationWarning
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1 sm:col-span-1">
              <label className={labelClass} htmlFor="city">
                City
              </label>
              <input
                id="city"
                name="city"
                required
                autoComplete="address-level2"
                className={inputClass}
                suppressHydrationWarning
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="state">
                State
              </label>
              <input
                id="state"
                name="state"
                required
                autoComplete="address-level1"
                placeholder="FL"
                className={inputClass}
                suppressHydrationWarning
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="postalCode">
                ZIP
              </label>
              <input
                id="postalCode"
                name="postalCode"
                required
                autoComplete="postal-code"
                className={inputClass}
                suppressHydrationWarning
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-bold text-brand">Admin account</legend>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              name="name"
              required
              className={inputClass}
              suppressHydrationWarning
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass} htmlFor="email">
              Work email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
              suppressHydrationWarning
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="password">
                Password
              </label>
              {hydrated ? (
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                />
              ) : (
                <input
                  id="password"
                  type="password"
                  disabled
                  aria-hidden
                  className={inputClass}
                  suppressHydrationWarning
                />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor="confirmPassword">
                Confirm password
              </label>
              {hydrated ? (
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                />
              ) : (
                <input
                  id="confirmPassword"
                  type="password"
                  disabled
                  aria-hidden
                  className={inputClass}
                  suppressHydrationWarning
                />
              )}
            </div>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-bold text-brand">
            Sales team{" "}
            <span className="font-medium text-brand/50">(optional)</span>
          </legend>
          <div className="flex gap-2">
            <input
              value={salespersonDraft}
              onChange={(e) => setSalespersonDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addName(
                    salespersonDraft,
                    setSalespersonDraft,
                    salespeople,
                    setSalespeople
                  );
                }
              }}
              placeholder="Add salesperson name"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() =>
                addName(
                  salespersonDraft,
                  setSalespersonDraft,
                  salespeople,
                  setSalespeople
                )
              }
              className="shrink-0 rounded-lg border border-peach/70 px-3 text-sm font-semibold text-brand hover:bg-peach/30"
            >
              Add
            </button>
          </div>
          {salespeople.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {salespeople.map((personName) => (
                <li
                  key={personName}
                  className="flex items-center gap-1 rounded-full bg-peach/40 px-2.5 py-1 text-xs font-semibold text-brand"
                >
                  {personName}
                  <button
                    type="button"
                    aria-label={`Remove ${personName}`}
                    onClick={() =>
                      setSalespeople((prev) =>
                        prev.filter((n) => n !== personName)
                      )
                    }
                    className="ml-0.5 text-brand/60 hover:text-brand"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input type="hidden" name="salespeople" value={salespeople.join("\n")} />
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-bold text-brand">
            Managers{" "}
            <span className="font-medium text-brand/50">(optional)</span>
          </legend>
          <div className="flex gap-2">
            <input
              value={managerDraft}
              onChange={(e) => setManagerDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addName(managerDraft, setManagerDraft, managers, setManagers);
                }
              }}
              placeholder="Add manager name"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() =>
                addName(managerDraft, setManagerDraft, managers, setManagers)
              }
              className="shrink-0 rounded-lg border border-peach/70 px-3 text-sm font-semibold text-brand hover:bg-peach/30"
            >
              Add
            </button>
          </div>
          {managers.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {managers.map((managerName) => (
                <li
                  key={managerName}
                  className="flex items-center gap-1 rounded-full bg-peach/40 px-2.5 py-1 text-xs font-semibold text-brand"
                >
                  {managerName}
                  <button
                    type="button"
                    aria-label={`Remove ${managerName}`}
                    onClick={() =>
                      setManagers((prev) =>
                        prev.filter((n) => n !== managerName)
                      )
                    }
                    className="ml-0.5 text-brand/60 hover:text-brand"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input type="hidden" name="managers" value={managers.join("\n")} />
          <p className="text-[11px] text-brand/55">
            You can also add or remove salespeople and managers anytime from the
            board.
          </p>
        </fieldset>

        <button
          type="submit"
          disabled={pending || !hydrated}
          className="mt-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-60"
        >
          {pending ? "Creating dealership…" : "Create dealership"}
        </button>
      </form>

      <p className="text-center text-sm text-brand/65">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

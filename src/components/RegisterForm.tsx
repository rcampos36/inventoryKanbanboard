"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  registerDealerAction,
} from "@/app/actions/register";
import type { AuthFormState } from "@/app/actions/auth";

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
    <div className="flex w-full max-w-lg flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-brand">Register your dealership</h1>
        <p className="mt-1 text-sm text-brand/60">
          Create your store admin account, pick your franchise brand for inventory
          model lanes, and optionally add your sales team and managers.
        </p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {state.error}
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-4" autoComplete="on">
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

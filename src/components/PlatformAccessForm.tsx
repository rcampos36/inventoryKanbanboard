"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  unlockPlatformAction,
  type PlatformAccessFormState,
} from "@/app/actions/platform-access";

const initialState: PlatformAccessFormState = {};

const inputClass =
  "w-full rounded-lg border border-peach/70 px-3 py-2.5 text-sm text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";
const labelClass = "text-xs font-semibold text-brand/70";

export function PlatformAccessForm() {
  const [state, formAction, pending] = useActionState(
    unlockPlatformAction,
    initialState
  );

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-brand">Platform backend</h1>
        <p className="mt-1 text-sm text-brand/60">
          Enter the platform password to manage dealership accounts.
        </p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {state.error}
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-60"
        >
          {pending ? "Unlocking…" : "Continue"}
        </button>
      </form>

      <p className="text-center text-sm text-brand/65">
        <Link href="/" className="font-semibold text-brand hover:underline">
          Back to SalesTower
        </Link>
      </p>
    </div>
  );
}

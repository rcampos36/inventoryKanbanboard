"use client";

import { useActionState } from "react";
import {
  activateSubscriptionAction,
  type ActivateFormState,
} from "@/app/actions/activate";
import { logoutAction } from "@/app/actions/auth";

const initialState: ActivateFormState = {};

export function ActivateSubscriptionForm({
  dealershipName,
  adminHint,
  trialExpired,
}: {
  dealershipName: string;
  adminHint: string;
  trialExpired: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    activateSubscriptionAction,
    initialState
  );

  return (
    <div className="w-full max-w-md rounded-2xl border border-peach/70 bg-[var(--salestower-surface)] p-6 shadow-sm sm:p-8">
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight text-brand">
        Activate your account
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-brand/70">
        {trialExpired ? (
          <>
            The trial for{" "}
            <span className="font-semibold text-brand">{dealershipName}</span> has
            ended. Enter the subscription serial that was emailed to{" "}
            <span className="font-semibold text-brand">{adminHint}</span> when this
            account was created.
          </>
        ) : (
          <>
            Activate{" "}
            <span className="font-semibold text-brand">{dealershipName}</span>{" "}
            early with the subscription serial emailed to{" "}
            <span className="font-semibold text-brand">{adminHint}</span>.
          </>
        )}
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-3">
        <label
          htmlFor="serial"
          className="text-xs font-semibold text-brand/70"
        >
          Activation serial
        </label>
        <input
          id="serial"
          name="serial"
          type="text"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="ST-XXXX-XXXX-XXXX"
          className="w-full rounded-lg border border-peach/70 px-3 py-2.5 font-mono text-sm tracking-wide text-brand uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
        />

        {state.error ? (
          <p className="text-sm text-rose-700" role="alert">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-60"
        >
          {pending ? "Activating…" : "Activate account"}
        </button>
      </form>

      <form action={logoutAction} className="mt-4">
        <button
          type="submit"
          className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-brand/65 hover:bg-peach/35"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

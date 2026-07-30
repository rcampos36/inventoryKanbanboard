"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/app/actions/auth";

const initialState: AuthFormState = {};

const inputClass =
  "w-full rounded-lg border border-peach/70 px-3 py-2.5 text-sm text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";
const labelClass = "text-xs font-semibold text-brand/70";

export function LoginForm({ setupError }: { setupError?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex w-full max-w-md flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-brand">Sign in</h1>
        <p className="mt-1 text-sm text-brand/60">
          Restricted access for dealership managers. Each login opens that
          store&apos;s board only.
        </p>
      </div>

      {(setupError || state.error) && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {setupError || state.error}
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </div>
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
          disabled={pending || Boolean(setupError)}
          className="mt-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-brand/65">
        New dealership?{" "}
        <Link href="/register" className="font-semibold text-brand hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
}

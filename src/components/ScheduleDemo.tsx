"use client";

import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  scheduleDemoAction,
  type ScheduleDemoState,
} from "@/app/actions/demo";
import {
  DEMO_TIME_SLOTS,
  todayLocalIsoDate,
} from "@/lib/demo-schedule";

type DemoContextValue = {
  openDemo: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

const initialState: ScheduleDemoState = { ok: false };

export function ScheduleDemoProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  return (
    <DemoContext.Provider
      value={{
        openDemo: () => {
          setFormKey((key) => key + 1);
          setOpen(true);
        },
      }}
    >
      {children}
      {open ? (
        <ScheduleDemoModal
          key={formKey}
          open={open}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </DemoContext.Provider>
  );
}

export function ScheduleDemoButton({
  className,
  children = "Schedule a Demo",
}: {
  className?: string;
  children?: ReactNode;
}) {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error("ScheduleDemoButton must be used within ScheduleDemoProvider");
  }

  return (
    <button type="button" onClick={ctx.openDemo} className={className}>
      {children}
    </button>
  );
}

function ScheduleDemoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [state, formAction, pending] = useActionState(
    scheduleDemoAction,
    initialState
  );
  const minDate = todayLocalIsoDate();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onClose]);

  useEffect(() => {
    if (open && state.ok) {
      const timer = window.setTimeout(() => onClose(), 1800);
      return () => window.clearTimeout(timer);
    }
  }, [open, state.ok, onClose]);

  if (!mounted || !open) return null;

  const fieldClass =
    "mt-1.5 w-full rounded-lg border border-peach/70 bg-white px-3 py-2 text-sm text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-demo-title"
      onClick={() => {
        if (!pending) onClose();
      }}
    >
      <div
        className="max-h-[min(90dvh,40rem)] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5">
          <h2
            id="schedule-demo-title"
            className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand"
          >
            Schedule a demo
          </h2>
          <p className="mt-2 text-sm text-[var(--salestower-muted)]">
            Pick a preferred date and time, tell us about your dealership, and
            we&apos;ll confirm the walkthrough.
          </p>
        </div>

        {state.ok ? (
          <div className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
            <p className="font-semibold">Request received.</p>
            <p className="mt-1">
              Thanks — we&apos;ll follow up at your email to confirm the demo.
            </p>
          </div>
        ) : (
          <form action={formAction} className="space-y-3">
            {/* Honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand/55">
                Name
              </span>
              <input
                name="name"
                required
                autoComplete="name"
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand/55">
                Work email
              </span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand/55">
                Dealership
              </span>
              <input
                name="dealership"
                required
                autoComplete="organization"
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand/55">
                Phone <span className="normal-case text-brand/40">(optional)</span>
              </span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                className={fieldClass}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand/55">
                  Preferred date
                </span>
                <input
                  name="preferredDate"
                  type="date"
                  required
                  min={minDate}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className={fieldClass}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand/55">
                  Preferred time
                </span>
                <select
                  name="preferredTime"
                  required
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className={fieldClass}
                >
                  <option value="" disabled>
                    Select time…
                  </option>
                  {DEMO_TIME_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-[11px] text-brand/50">
              Demo slots are available from 9:00 AM to 5:00 PM.
            </p>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand/55">
                Message <span className="normal-case text-brand/40">(optional)</span>
              </span>
              <textarea
                name="message"
                rows={3}
                className={fieldClass}
                placeholder="Store count, CRM, anything we should know…"
              />
            </label>

            {state.error ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {state.error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={pending}
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-50"
              >
                {pending ? "Sending…" : "Request demo"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

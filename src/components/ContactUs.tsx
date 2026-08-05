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
  contactUsAction,
  type ContactFormState,
} from "@/app/actions/contact";

type ContactContextValue = {
  openContact: () => void;
};

const ContactContext = createContext<ContactContextValue | null>(null);

const initialState: ContactFormState = { ok: false };

export function ContactUsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  return (
    <ContactContext.Provider
      value={{
        openContact: () => {
          setFormKey((key) => key + 1);
          setOpen(true);
        },
      }}
    >
      {children}
      {open ? (
        <ContactUsModal
          key={formKey}
          open={open}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </ContactContext.Provider>
  );
}

export function ContactUsButton({
  className,
  children = "Contact Us",
}: {
  className?: string;
  children?: ReactNode;
}) {
  const ctx = useContext(ContactContext);
  if (!ctx) {
    throw new Error("ContactUsButton must be used within ContactUsProvider");
  }

  return (
    <button type="button" onClick={ctx.openContact} className={className}>
      {children}
    </button>
  );
}

function ContactUsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [state, formAction, pending] = useActionState(
    contactUsAction,
    initialState
  );

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
      aria-labelledby="contact-us-title"
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
            id="contact-us-title"
            className="font-[family-name:var(--font-syne)] text-lg font-bold text-brand"
          >
            Contact us
          </h2>
          <p className="mt-2 text-sm text-[var(--salestower-muted)]">
            Send a message to the SalesTower team. We&apos;ll reply at your
            email.
          </p>
        </div>

        {state.ok ? (
          <div className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
            <p className="font-semibold">Message sent.</p>
            <p className="mt-1">Thanks — we&apos;ll get back to you soon.</p>
          </div>
        ) : (
          <form action={formAction} className="space-y-3">
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
                Email
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
                Phone{" "}
                <span className="normal-case text-brand/40">(optional)</span>
              </span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand/55">
                Subject{" "}
                <span className="normal-case text-brand/40">(optional)</span>
              </span>
              <input
                name="subject"
                autoComplete="off"
                placeholder="Billing, support, partnership…"
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand/55">
                Message
              </span>
              <textarea
                name="message"
                required
                rows={4}
                className={fieldClass}
                placeholder="How can we help?"
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
                {pending ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

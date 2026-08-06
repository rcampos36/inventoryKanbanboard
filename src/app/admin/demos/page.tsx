import { listDemoRequestsAction } from "@/app/actions/demo";
import { PlatformAdminNav } from "@/components/PlatformAdminNav";
import { requirePlatformAdmin } from "@/lib/auth";
import {
  demoTimeLabel,
  formatPreferredDemoDate,
} from "@/lib/demo-schedule";

export const dynamic = "force-dynamic";

export default async function AdminDemosPage() {
  const admin = await requirePlatformAdmin();
  const requests = await listDemoRequestsAction();

  return (
    <main className="min-h-screen bg-sand">
      <header className="flex flex-col gap-3 border-b border-peach/50 bg-[var(--salestower-surface)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand/50">
            Platform
          </p>
          <h1 className="text-lg font-bold text-brand">Demo requests</h1>
          <p className="mt-1 max-w-xl text-sm text-brand/65">
            Leads from the Schedule a Demo form. Until{" "}
            <span className="font-semibold">salestower.io</span> is verified in
            Resend, set <span className="font-semibold">DEMO_TO_EMAIL</span> to
            your Resend account email so notifications can deliver.
          </p>
        </div>
        <PlatformAdminNav
          organizationSlug={admin.organizationSlug}
          active="demos"
        />
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {requests.length === 0 ? (
          <p className="rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-6 text-sm text-brand/70">
            No demo requests yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {requests.map((request) => (
              <li
                key={request.id}
                className="rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-brand">{request.name}</p>
                    <p className="text-sm text-brand/70">{request.dealership}</p>
                  </div>
                  <p className="text-xs text-brand/50">
                    {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="mt-3 space-y-1 text-sm text-brand/80">
                  <p>
                    <a
                      className="font-semibold text-brand underline-offset-2 hover:underline"
                      href={`mailto:${request.email}`}
                    >
                      {request.email}
                    </a>
                    {request.phone ? ` · ${request.phone}` : null}
                  </p>
                  {request.preferredDate && request.preferredTime ? (
                    <p className="font-semibold text-brand">
                      Preferred:{" "}
                      {formatPreferredDemoDate(request.preferredDate)} at{" "}
                      {demoTimeLabel(request.preferredTime)}
                    </p>
                  ) : null}
                  {request.message ? (
                    <p className="mt-2 whitespace-pre-wrap text-[var(--salestower-muted)]">
                      {request.message}
                    </p>
                  ) : null}
                </div>
                <p
                  className={[
                    "mt-3 text-xs font-semibold leading-relaxed",
                    request.emailSent ? "text-emerald-700" : "text-amber-800",
                  ].join(" ")}
                >
                  {request.emailSent
                    ? request.emailError || "Notification email sent"
                    : `Email not sent. ${request.emailError ?? "Check Resend domain / DEMO_TO_EMAIL settings."}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

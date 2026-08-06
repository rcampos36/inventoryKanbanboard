import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformAccessForm } from "@/components/PlatformAccessForm";
import {
  getPlatformBackendPassword,
  hasPlatformAccess,
} from "@/lib/platform-access";

export const dynamic = "force-dynamic";

/**
 * Password gate for the platform dealerships backend.
 * After unlock, /admin/dealerships still requires a Pearson admin login.
 */
export default async function PlatformAccessPage() {
  const configured = Boolean(getPlatformBackendPassword());
  const unlocked = configured && (await hasPlatformAccess());

  if (unlocked) {
    redirect("/admin/dealerships");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-sand px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-6 shadow-sm sm:p-8">
        {!configured ? (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold text-brand">Platform backend</h1>
              <p className="mt-1 text-sm text-brand/60">
                Platform access is not configured yet. Set{" "}
                <code className="rounded bg-peach/40 px-1.5 py-0.5 text-xs font-semibold">
                  PLATFORM_BACKEND_PASSWORD
                </code>{" "}
                in the environment to enable it.
              </p>
            </div>
            <Link
              href="/"
              className="text-center text-sm font-semibold text-brand hover:underline"
            >
              Back to SalesTower
            </Link>
          </div>
        ) : (
          <PlatformAccessForm />
        )}
      </div>
    </main>
  );
}

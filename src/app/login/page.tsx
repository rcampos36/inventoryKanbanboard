import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { ensureBootstrapAdmin } from "@/lib/auth";
import { PEARSON_ORG_ID } from "@/lib/org-ids";
import { boardPath } from "@/lib/paths";
import { readSessionUser } from "@/lib/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: nextRaw } = await searchParams;
  const next =
    typeof nextRaw === "string" &&
    nextRaw.startsWith("/admin/") &&
    !nextRaw.startsWith("//")
      ? nextRaw
      : undefined;

  let setupError: string | undefined;
  try {
    await ensureBootstrapAdmin();
  } catch (error) {
    setupError =
      error instanceof Error
        ? error.message
        : "Administrator account is not configured.";
  }

  const user = await readSessionUser();
  if (user) {
    if (
      next &&
      user.role === "ADMIN" &&
      user.organizationId === PEARSON_ORG_ID
    ) {
      redirect(next);
    }
    redirect(boardPath(user.organizationSlug));
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sand px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(239,187,146,0.55),_transparent_55%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-brand"
          >
            SalesTower
          </Link>
          <p className="mt-2 text-sm text-brand/65">
            Manager access to your dealership dashboard
          </p>
        </div>
        <div className="rounded-2xl border border-peach/70 bg-[var(--salestower-surface)] p-8 shadow-sm">
          <LoginForm setupError={setupError} next={next} />
        </div>
        <p className="mt-4 text-center text-sm text-brand/65">
          <Link href="/" className="font-semibold text-brand hover:underline">
            Back to SalesTower
          </Link>
        </p>
      </div>
    </main>
  );
}

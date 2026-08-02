import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/RegisterForm";
import { getFranchiseBrandOptions } from "@/lib/data";
import { boardPath } from "@/lib/paths";
import { readSessionUser } from "@/lib/session";

export default async function RegisterPage() {
  const user = await readSessionUser();
  if (user) {
    redirect(boardPath(user.organizationSlug));
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sand px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(239,187,146,0.55),_transparent_55%)]" />
      <div className="relative w-full max-w-lg">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-brand"
          >
            SalesTower
          </Link>
          <p className="mt-2 text-sm text-brand/65">
            Set up your dealership workspace in a few minutes
          </p>
        </div>
        <div className="rounded-2xl border border-peach/70 bg-[var(--salestower-surface)] p-8 shadow-sm">
          <RegisterForm brands={getFranchiseBrandOptions()} />
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

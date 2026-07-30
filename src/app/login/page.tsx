import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { ensureBootstrapAdmin } from "@/lib/auth";
import { readSessionUser } from "@/lib/session";

export default async function LoginPage() {
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
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef3f6] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,184,166,0.18),_transparent_55%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-[var(--autosync-ink,#0e1a24)]"
          >
            AutoSync
          </Link>
          <p className="mt-2 text-sm text-slate-500">
            Manager access to your dealership dashboard
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <LoginForm setupError={setupError} />
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/" className="font-semibold text-teal-700 hover:underline">
            Back to AutoSync
          </Link>
        </p>
      </div>
    </main>
  );
}

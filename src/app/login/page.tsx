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
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <LoginForm setupError={setupError} />
      </div>
    </main>
  );
}

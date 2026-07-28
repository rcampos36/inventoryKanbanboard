import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForms";
import { auth } from "@/auth";

function googleEnabled() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";
  const errorMessage =
    params.error === "OAuthAccountNotLinked"
      ? "This email is already used with another sign-in method."
      : params.error
        ? "Sign-in failed. Please try again."
        : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <LoginForm
          callbackUrl={callbackUrl}
          errorMessage={errorMessage}
          googleEnabled={googleEnabled()}
        />
      </div>
    </main>
  );
}

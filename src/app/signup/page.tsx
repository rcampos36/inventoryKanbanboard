import { redirect } from "next/navigation";
import { SignupForm } from "@/components/AuthForms";
import { auth } from "@/auth";

function googleEnabled() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <SignupForm googleEnabled={googleEnabled()} />
      </div>
    </main>
  );
}

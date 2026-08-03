import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { getLandingContent } from "@/app/actions/landing";
import { requireAdmin } from "@/lib/auth";
import { PEARSON_ORG_ID } from "@/lib/tenant";
import { boardPath } from "@/lib/paths";
import { LandingContentEditor } from "@/components/LandingContentEditor";

export const dynamic = "force-dynamic";

export default async function AdminLandingPage() {
  const admin = await requireAdmin();
  if (admin.organizationId !== PEARSON_ORG_ID) {
    redirect(boardPath(admin.organizationSlug));
  }

  const content = await getLandingContent();

  return (
    <main className="min-h-screen bg-sand">
      <header className="flex flex-col gap-3 border-b border-peach/50 bg-[var(--salestower-surface)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand/50">
            Administrator
          </p>
          <h1 className="text-lg font-bold text-brand">Landing page copy</h1>
          <p className="mt-1 text-sm text-brand/65">
            Edit marketing copy with a live preview. Save to publish on the public
            homepage.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin"
            className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-3 py-2 text-sm font-semibold text-brand hover:bg-peach/35"
          >
            Manage users
          </Link>
          <Link
            href={boardPath(admin.organizationSlug)}
            className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-3 py-2 text-sm font-semibold text-brand hover:bg-peach/35"
          >
            Back to board
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-3 py-2 text-sm font-semibold text-brand hover:bg-peach/35"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <LandingContentEditor initialContent={content} />
    </main>
  );
}

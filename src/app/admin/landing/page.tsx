import { getLandingContent } from "@/app/actions/landing";
import { LandingContentEditor } from "@/components/LandingContentEditor";
import { PlatformAdminNav } from "@/components/PlatformAdminNav";
import { requirePlatformAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLandingPage() {
  const admin = await requirePlatformAdmin();
  const content = await getLandingContent();

  return (
    <main className="min-h-screen bg-sand">
      <header className="flex flex-col gap-3 border-b border-peach/50 bg-[var(--salestower-surface)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand/50">
            Platform
          </p>
          <h1 className="text-lg font-bold text-brand">Landing page copy</h1>
          <p className="mt-1 text-sm text-brand/65">
            Edit marketing copy with a live preview. Save to publish on the public
            homepage.
          </p>
        </div>
        <PlatformAdminNav
          organizationSlug={admin.organizationSlug}
          active="landing"
        />
      </header>

      <LandingContentEditor initialContent={content} />
    </main>
  );
}

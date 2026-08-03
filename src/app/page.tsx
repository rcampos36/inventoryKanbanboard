import { SalesTowerLanding } from "@/components/SalesTowerLanding";
import { getLandingContent } from "@/app/actions/landing";
import { getOptionalUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, content] = await Promise.all([
    getOptionalUser(),
    getLandingContent(),
  ]);

  return (
    <SalesTowerLanding
      content={content}
      isSignedIn={Boolean(user)}
      organizationSlug={user?.organizationSlug}
    />
  );
}

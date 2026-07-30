import { AutoSyncLanding } from "@/components/AutoSyncLanding";
import { getOptionalUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getOptionalUser();

  return (
    <AutoSyncLanding
      isSignedIn={Boolean(user)}
      organizationSlug={user?.organizationSlug}
    />
  );
}

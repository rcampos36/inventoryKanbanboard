import { SalesTowerLanding } from "@/components/SalesTowerLanding";
import { getOptionalUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getOptionalUser();

  return (
    <SalesTowerLanding
      isSignedIn={Boolean(user)}
      organizationSlug={user?.organizationSlug}
    />
  );
}

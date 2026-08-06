import Link from "next/link";
import { redirect } from "next/navigation";
import { ActivateSubscriptionForm } from "@/components/ActivateSubscriptionForm";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { boardPath } from "@/lib/paths";
import {
  isTrialExpired,
  orgIsSubscriptionActive,
} from "@/lib/subscription-serial";

export const dynamic = "force-dynamic";

export default async function ActivatePage() {
  const user = await requireUser({ allowTrialExpired: true });

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      planStatus: true,
      trialEndsAt: true,
      serialActivatedAt: true,
      users: {
        where: { role: "ADMIN" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { email: true },
      },
    },
  });

  if (!org) {
    redirect("/login");
  }

  if (
    orgIsSubscriptionActive({
      id: org.id,
      planStatus: org.planStatus,
      trialEndsAt: org.trialEndsAt,
      serialActivatedAt: org.serialActivatedAt,
    })
  ) {
    redirect(boardPath(org.slug));
  }

  const adminEmail = org.users[0]?.email ?? "your dealership admin";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sand px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(239,187,146,0.55),_transparent_55%)]" />
      <div className="relative flex w-full flex-col items-center">
        <Link
          href="/"
          className="mb-6 font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-brand"
        >
          SalesTower
        </Link>
        <ActivateSubscriptionForm
          dealershipName={org.name}
          adminHint={adminEmail}
          trialExpired={isTrialExpired(org.trialEndsAt)}
        />
      </div>
    </main>
  );
}

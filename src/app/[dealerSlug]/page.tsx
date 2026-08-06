import { KanbanBoard } from "@/components/KanbanBoard";
import { AppHeaderActions } from "@/components/AppHeaderActions";
import { getCars } from "@/app/actions/cars";
import { listManagersAction } from "@/app/actions/managers";
import { listSalespeopleAction } from "@/app/actions/salespeople";
import { getBoardSettings } from "@/app/actions/settings";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { boardPath, isReservedPathSlug } from "@/lib/paths";
import { trialBannerDaysRemaining } from "@/lib/subscription-serial";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface DealerBoardPageProps {
  params: Promise<{ dealerSlug: string }>;
}

export default async function DealerBoardPage({ params }: DealerBoardPageProps) {
  const { dealerSlug } = await params;
  if (isReservedPathSlug(dealerSlug)) {
    notFound();
  }

  const user = await requireUser();
  if (user.organizationSlug !== dealerSlug) {
    redirect(boardPath(user.organizationSlug));
  }

  const [cars, settings, salespeople, managers, org] = await Promise.all([
    getCars(),
    getBoardSettings(),
    listSalespeopleAction(),
    listManagersAction(),
    prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        id: true,
        planStatus: true,
        trialEndsAt: true,
        serialActivatedAt: true,
      },
    }),
  ]);

  const trialDays =
    org != null
      ? trialBannerDaysRemaining({
          id: org.id,
          planStatus: org.planStatus,
          trialEndsAt: org.trialEndsAt,
          serialActivatedAt: org.serialActivatedAt,
        })
      : null;

  return (
    <main className="h-dvh bg-brand">
      <KanbanBoard
        initialCars={cars}
        initialSalespeople={salespeople}
        initialManagers={managers}
        initialSalesDay={settings.openSalesDay}
        initialBoardTitle={settings.boardTitle}
        organizationName={user.organizationName}
        organizationBrand={user.organizationBrand}
        organizationPlan={user.organizationPlan}
        isAdmin={user.role === "ADMIN"}
        trialDaysRemaining={trialDays}
        headerActions={<AppHeaderActions user={user} />}
      />
    </main>
  );
}

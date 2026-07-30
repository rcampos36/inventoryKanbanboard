import { KanbanBoard } from "@/components/KanbanBoard";
import { AppHeaderActions } from "@/components/AppHeaderActions";
import { getCars } from "@/app/actions/cars";
import { listManagersAction } from "@/app/actions/managers";
import { listSalespeopleAction } from "@/app/actions/salespeople";
import { getBoardSettings } from "@/app/actions/settings";
import { requireUser } from "@/lib/auth";
import { boardPath, isReservedPathSlug } from "@/lib/paths";
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

  const [cars, settings, salespeople, managers] = await Promise.all([
    getCars(),
    getBoardSettings(),
    listSalespeopleAction(),
    listManagersAction(),
  ]);

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
        headerActions={<AppHeaderActions user={user} />}
      />
    </main>
  );
}

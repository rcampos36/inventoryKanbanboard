import { KanbanBoard } from "@/components/KanbanBoard";
import { AppHeaderActions } from "@/components/AppHeaderActions";
import { getCars } from "@/app/actions/cars";
import { listManagersAction } from "@/app/actions/managers";
import { listSalespeopleAction } from "@/app/actions/salespeople";
import { getBoardSettings } from "@/app/actions/settings";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
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

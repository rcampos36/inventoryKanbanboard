import { KanbanBoard } from "@/components/KanbanBoard";
import { AppHeaderActions } from "@/components/AppHeaderActions";
import { getCars } from "@/app/actions/cars";
import { listSalespeopleAction } from "@/app/actions/salespeople";
import { getBoardSettings } from "@/app/actions/settings";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  const [cars, settings, salespeople] = await Promise.all([
    getCars(),
    getBoardSettings(),
    listSalespeopleAction(),
  ]);

  return (
    <main className="h-screen bg-slate-50">
      <KanbanBoard
        initialCars={cars}
        initialSalespeople={salespeople}
        initialSalesDay={settings.openSalesDay}
        initialBoardTitle={settings.boardTitle}
        headerActions={<AppHeaderActions user={user} />}
      />
    </main>
  );
}

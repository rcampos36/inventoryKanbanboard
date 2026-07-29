import { KanbanBoard } from "@/components/KanbanBoard";
import { AppHeaderActions } from "@/components/AppHeaderActions";
import { getCars } from "@/app/actions/cars";
import { getBoardSettings } from "@/app/actions/settings";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  const [cars, settings] = await Promise.all([getCars(), getBoardSettings()]);

  return (
    <main className="h-screen bg-slate-50">
      <KanbanBoard
        initialCars={cars}
        initialSalesDay={settings.openSalesDay}
        initialBoardTitle={settings.boardTitle}
        headerActions={<AppHeaderActions user={user} />}
      />
    </main>
  );
}

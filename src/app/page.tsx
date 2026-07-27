import { KanbanBoard } from "@/components/KanbanBoard";
import { getCars } from "@/app/actions/cars";
import { getOpenSalesDay } from "@/app/actions/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [cars, openSalesDay] = await Promise.all([
    getCars(),
    getOpenSalesDay(),
  ]);

  return (
    <main className="h-screen bg-slate-50">
      <KanbanBoard initialCars={cars} initialSalesDay={openSalesDay} />
    </main>
  );
}

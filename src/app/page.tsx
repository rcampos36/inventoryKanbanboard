import { KanbanBoard } from "@/components/KanbanBoard";
import { getCars } from "@/app/actions/cars";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cars = await getCars();

  return (
    <main className="h-screen bg-slate-50">
      <KanbanBoard initialCars={cars} />
    </main>
  );
}

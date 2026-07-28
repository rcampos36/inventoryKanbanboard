import { redirect } from "next/navigation";
import { KanbanBoard } from "@/components/KanbanBoard";
import { UserMenu } from "@/components/UserMenu";
import { getCars } from "@/app/actions/cars";
import { getOpenSalesDay } from "@/app/actions/settings";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [cars, openSalesDay] = await Promise.all([
    getCars(),
    getOpenSalesDay(),
  ]);

  return (
    <main className="h-screen bg-slate-50">
      <KanbanBoard
        initialCars={cars}
        initialSalesDay={openSalesDay}
        userMenu={
          <UserMenu name={session.user.name} email={session.user.email} />
        }
      />
    </main>
  );
}

import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { INITIAL_CARS } from "../src/lib/data";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  const count = await prisma.car.count();
  if (count > 0) {
    console.log(`Database already has ${count} cars — skipping seed.`);
    return;
  }

  for (const [index, car] of INITIAL_CARS.entries()) {
    await prisma.car.create({
      data: {
        id: car.id,
        stockNumber: car.stockNumber,
        year: car.year,
        make: car.make,
        model: car.model,
        trim: car.trim,
        condition: car.condition,
        columnId: car.columnId,
        salespersonId: car.salespersonId ?? null,
        coSalespersonId: car.coSalespersonId ?? null,
        soldAt: car.soldAt ?? null,
        managerId: car.managerId ?? null,
        overnightId: car.overnightId ?? null,
        outDate: car.outDate ?? null,
        returnDate: car.returnDate ?? null,
        tagNumber: car.tagNumber ?? null,
        price: car.price ?? null,
        position: index,
      },
    });
  }

  console.log(`Seeded ${INITIAL_CARS.length} cars.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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
  const existing = await prisma.car.findMany({
    select: { stockNumber: true },
  });
  const usedStocks = new Set(existing.map((row) => row.stockNumber));

  let created = 0;
  for (const [index, car] of INITIAL_CARS.entries()) {
    if (usedStocks.has(car.stockNumber)) continue;

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
        exteriorColor: car.exteriorColor ?? null,
        price: car.price ?? null,
        position: index,
      },
    });
    created += 1;
  }

  if (created === 0) {
    console.log(
      `No new inventory samples added (${existing.length} cars already present).`
    );
    return;
  }

  console.log(`Seeded ${created} inventory sample cars.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

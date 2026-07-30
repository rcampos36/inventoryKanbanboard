import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { INITIAL_CARS, DEFAULT_SALESPEOPLE } from "../src/lib/data";
import { todayIsoDate } from "../src/lib/types";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const PEARSON_ID = "org_pearson_mazda";
const SUNRISE_ID = "org_sunrise_honda";

const SUNRISE_CARS = [
  {
    stockNumber: "SH26101",
    year: 2026,
    make: "Honda",
    model: "Civic Sedan",
    trim: "Sport",
    condition: "new",
    columnId: "civic-sedan",
    exteriorColor: "Rallye Red",
    price: 24900,
  },
  {
    stockNumber: "SH26102",
    year: 2026,
    make: "Honda",
    model: "CR-V",
    trim: "EX-L",
    condition: "new",
    columnId: "cr-v",
    exteriorColor: "Crystal Black Pearl",
    price: 35600,
  },
  {
    stockNumber: "SH26103",
    year: 2026,
    make: "Honda",
    model: "Pilot",
    trim: "TrailSport",
    condition: "new",
    columnId: "pilot",
    exteriorColor: "Sonic Gray Pearl",
    price: 44900,
  },
  {
    stockNumber: "SH22015",
    year: 2022,
    make: "Honda",
    model: "Accord",
    trim: "Sport",
    condition: "used",
    columnId: "used-honda",
    exteriorColor: "Modern Steel Metallic",
    price: 26800,
  },
  {
    stockNumber: "SH21016",
    year: 2021,
    make: "Toyota",
    model: "RAV4",
    trim: "XLE",
    condition: "used",
    columnId: "used-other",
    exteriorColor: "Magnetic Gray Metallic",
    price: 27800,
  },
] as const;

async function ensureOrgs() {
  await prisma.organization.upsert({
    where: { id: PEARSON_ID },
    create: {
      id: PEARSON_ID,
      name: "Pearson Mazda",
      slug: "pearson-mazda",
      brand: "Mazda",
    },
    update: { brand: "Mazda" },
  });
  await prisma.organization.upsert({
    where: { id: SUNRISE_ID },
    create: {
      id: SUNRISE_ID,
      name: "Sunrise Honda",
      slug: "sunrise-honda",
      brand: "Honda",
    },
    update: { brand: "Honda" },
  });

  await prisma.appSettings.upsert({
    where: { organizationId: PEARSON_ID },
    create: {
      organizationId: PEARSON_ID,
      openSalesDay: todayIsoDate(),
      boardTitle: "Pearson Mazda Inventory and Sales Board",
    },
    update: {},
  });
  await prisma.appSettings.upsert({
    where: { organizationId: SUNRISE_ID },
    create: {
      organizationId: SUNRISE_ID,
      openSalesDay: todayIsoDate(),
      boardTitle: "Sunrise Honda Inventory and Sales Board",
    },
    update: {},
  });
}

async function seedPearsonInventory() {
  const existing = await prisma.car.findMany({
    where: { organizationId: PEARSON_ID },
    select: { stockNumber: true },
  });
  const used = new Set(existing.map((row) => row.stockNumber));
  let created = 0;

  for (const [index, car] of INITIAL_CARS.entries()) {
    if (used.has(car.stockNumber)) continue;
    await prisma.car.create({
      data: {
        organizationId: PEARSON_ID,
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

  const spCount = await prisma.salesperson.count({
    where: { organizationId: PEARSON_ID },
  });
  if (spCount === 0) {
    await prisma.salesperson.createMany({
      data: DEFAULT_SALESPEOPLE.map((person, index) => ({
        organizationId: PEARSON_ID,
        id: person.id,
        name: person.name,
        position: index,
      })),
    });
  }

  return created;
}

async function seedSunrise() {
  const spCount = await prisma.salesperson.count({
    where: { organizationId: SUNRISE_ID },
  });
  if (spCount === 0) {
    await prisma.salesperson.createMany({
      data: [
        { organizationId: SUNRISE_ID, id: "alex", name: "Alex Rivera", position: 0 },
        { organizationId: SUNRISE_ID, id: "jordan", name: "Jordan Kim", position: 1 },
        { organizationId: SUNRISE_ID, id: "casey", name: "Casey Brooks", position: 2 },
        { organizationId: SUNRISE_ID, id: "riley", name: "Riley Nguyen", position: 3 },
      ],
    });
  }

  const existing = await prisma.car.findMany({
    where: { organizationId: SUNRISE_ID },
    select: { stockNumber: true },
  });
  const used = new Set(existing.map((row) => row.stockNumber));
  let created = 0;
  for (const [index, car] of SUNRISE_CARS.entries()) {
    if (used.has(car.stockNumber)) {
      await prisma.car.updateMany({
        where: {
          organizationId: SUNRISE_ID,
          stockNumber: car.stockNumber,
        },
        data: {
          model: car.model,
          columnId: car.columnId,
          condition: car.condition,
        },
      });
      continue;
    }
    await prisma.car.create({
      data: {
        organizationId: SUNRISE_ID,
        ...car,
        position: index,
      },
    });
    created += 1;
  }

  const email = "admin@sunrise.local";
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (!existingUser) {
    await prisma.user.create({
      data: {
        email,
        name: "Sunrise Admin",
        passwordHash: await bcrypt.hash("sunrise123", 12),
        role: "ADMIN",
        organizationId: SUNRISE_ID,
      },
    });
  }

  return created;
}

async function main() {
  await ensureOrgs();
  const pearsonCars = await seedPearsonInventory();
  const sunriseCars = await seedSunrise();
  console.log(
    `Seed complete. Pearson +${pearsonCars} cars. Sunrise +${sunriseCars} cars.`
  );
  console.log("Sunrise login: admin@sunrise.local / sunrise123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

-- CreateTable
CREATE TABLE "Salesperson" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Salesperson_pkey" PRIMARY KEY ("id")
);

-- Seed the original team so existing car assignments keep working.
INSERT INTO "Salesperson" ("id", "name", "position", "createdAt", "updatedAt") VALUES
  ('avery', 'Avery Johnson', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('marcus', 'Marcus Lee', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sofia', 'Sofia Ramirez', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dan', 'Dan O''Neill', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

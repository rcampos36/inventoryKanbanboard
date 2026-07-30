-- CreateTable
CREATE TABLE "BoardEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "carId" TEXT,
    "stockNumber" TEXT,
    "make" TEXT,
    "model" TEXT,
    "trim" TEXT,
    "condition" TEXT,
    "fromColumnId" TEXT,
    "toColumnId" TEXT,
    "salespersonId" TEXT,
    "coSalespersonId" TEXT,
    "price" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BoardEvent" ADD CONSTRAINT "BoardEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "BoardEvent_organizationId_monthKey_idx" ON "BoardEvent"("organizationId", "monthKey");

-- CreateIndex
CREATE INDEX "BoardEvent_organizationId_type_monthKey_idx" ON "BoardEvent"("organizationId", "type", "monthKey");

-- CreateIndex
CREATE INDEX "BoardEvent_organizationId_carId_idx" ON "BoardEvent"("organizationId", "carId");

-- Backfill sale events from cars that are currently marked sold.
INSERT INTO "BoardEvent" (
  "id",
  "organizationId",
  "type",
  "occurredAt",
  "monthKey",
  "carId",
  "stockNumber",
  "make",
  "model",
  "trim",
  "condition",
  "toColumnId",
  "salespersonId",
  "coSalespersonId",
  "price",
  "createdAt"
)
SELECT
  'evt_' || c."id",
  c."organizationId",
  'sale',
  c."soldAt",
  substring(c."soldAt" from 1 for 7),
  c."id",
  c."stockNumber",
  c."make",
  c."model",
  c."trim",
  c."condition",
  'sold',
  c."salespersonId",
  c."coSalespersonId",
  c."price",
  CURRENT_TIMESTAMP
FROM "Car" c
WHERE c."soldAt" IS NOT NULL
  AND c."salespersonId" IS NOT NULL;

-- Backfill inventory_added from car creation dates (approx history).
INSERT INTO "BoardEvent" (
  "id",
  "organizationId",
  "type",
  "occurredAt",
  "monthKey",
  "carId",
  "stockNumber",
  "make",
  "model",
  "trim",
  "condition",
  "toColumnId",
  "price",
  "createdAt"
)
SELECT
  'add_' || c."id",
  c."organizationId",
  'inventory_added',
  to_char(c."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
  to_char(c."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM'),
  c."id",
  c."stockNumber",
  c."make",
  c."model",
  c."trim",
  c."condition",
  c."columnId",
  c."price",
  CURRENT_TIMESTAMP
FROM "Car" c;

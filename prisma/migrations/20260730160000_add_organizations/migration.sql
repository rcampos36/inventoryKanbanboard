-- Multi-tenant organizations: shared DB, scoped rows per dealership.

CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- Default (existing) dealership + a second demo dealership.
INSERT INTO "Organization" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES
  ('org_pearson_mazda', 'Pearson Mazda', 'pearson-mazda', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('org_sunrise_honda', 'Sunrise Honda', 'sunrise-honda', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Cars
ALTER TABLE "Car" ADD COLUMN "organizationId" TEXT;
UPDATE "Car" SET "organizationId" = 'org_pearson_mazda' WHERE "organizationId" IS NULL;
ALTER TABLE "Car" ALTER COLUMN "organizationId" SET NOT NULL;

CREATE INDEX "Car_organizationId_idx" ON "Car"("organizationId");
CREATE UNIQUE INDEX "Car_organizationId_stockNumber_key" ON "Car"("organizationId", "stockNumber");

ALTER TABLE "Car"
  ADD CONSTRAINT "Car_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Users
ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;
UPDATE "User" SET "organizationId" = 'org_pearson_mazda' WHERE "organizationId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;

CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

ALTER TABLE "User"
  ADD CONSTRAINT "User_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Salespeople
ALTER TABLE "Salesperson" ADD COLUMN "organizationId" TEXT;
UPDATE "Salesperson" SET "organizationId" = 'org_pearson_mazda' WHERE "organizationId" IS NULL;
ALTER TABLE "Salesperson" ALTER COLUMN "organizationId" SET NOT NULL;

CREATE INDEX "Salesperson_organizationId_idx" ON "Salesperson"("organizationId");

ALTER TABLE "Salesperson" DROP CONSTRAINT "Salesperson_pkey";
ALTER TABLE "Salesperson" ADD CONSTRAINT "Salesperson_pkey" PRIMARY KEY ("organizationId", "id");

ALTER TABLE "Salesperson"
  ADD CONSTRAINT "Salesperson_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AppSettings: attach singleton row to Pearson (keep existing id if present).
ALTER TABLE "AppSettings" ADD COLUMN "organizationId" TEXT;

UPDATE "AppSettings"
SET "organizationId" = 'org_pearson_mazda'
WHERE "organizationId" IS NULL;

ALTER TABLE "AppSettings" ALTER COLUMN "organizationId" SET NOT NULL;

CREATE UNIQUE INDEX "AppSettings_organizationId_key" ON "AppSettings"("organizationId");

ALTER TABLE "AppSettings"
  ADD CONSTRAINT "AppSettings_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Sunrise Honda starter settings (empty board until seed / first login).
INSERT INTO "AppSettings" ("id", "organizationId", "openSalesDay", "boardTitle", "updatedAt")
VALUES (
  'settings_sunrise_honda',
  'org_sunrise_honda',
  to_char(CURRENT_DATE, 'YYYY-MM-DD'),
  'Sunrise Honda Inventory and Sales Board',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

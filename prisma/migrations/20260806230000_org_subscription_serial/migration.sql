-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "subscriptionSerial" TEXT;
ALTER TABLE "Organization" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "serialActivatedAt" TIMESTAMP(3);

-- Backfill unique serials + 3-day trial from createdAt
UPDATE "Organization"
SET
  "subscriptionSerial" = 'ST-'
    || upper(substr(md5(id || 'a' || random()::text), 1, 4))
    || '-'
    || upper(substr(md5(id || 'b' || random()::text), 1, 4))
    || '-'
    || upper(substr(md5(id || 'c' || random()::text), 1, 4)),
  "trialEndsAt" = "createdAt" + INTERVAL '3 days'
WHERE "subscriptionSerial" IS NULL;

-- Built-in platform / demo orgs stay unlocked
UPDATE "Organization"
SET
  "planStatus" = 'active',
  "serialActivatedAt" = CURRENT_TIMESTAMP
WHERE id IN ('org_pearson_mazda', 'org_sunrise_honda');

ALTER TABLE "Organization" ALTER COLUMN "subscriptionSerial" SET NOT NULL;
ALTER TABLE "Organization" ALTER COLUMN "trialEndsAt" SET NOT NULL;

CREATE UNIQUE INDEX "Organization_subscriptionSerial_key" ON "Organization"("subscriptionSerial");

-- Franchise brand drives which new-car model lanes appear on the board.
ALTER TABLE "Organization" ADD COLUMN "brand" TEXT NOT NULL DEFAULT 'Mazda';

UPDATE "Organization" SET "brand" = 'Mazda' WHERE "slug" = 'pearson-mazda';
UPDATE "Organization" SET "brand" = 'Honda' WHERE "slug" = 'sunrise-honda';

-- AlterTable
ALTER TABLE "Car" ADD COLUMN "workingDealId" TEXT;

-- CreateIndex
CREATE INDEX "Car_workingDealId_idx" ON "Car"("workingDealId");

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "stockNumber" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "salespersonId" TEXT,
    "coSalespersonId" TEXT,
    "soldAt" TEXT,
    "managerId" TEXT,
    "overnightId" TEXT,
    "outDate" TEXT,
    "returnDate" TEXT,
    "tagNumber" TEXT,
    "price" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Car_columnId_idx" ON "Car"("columnId");

-- CreateIndex
CREATE INDEX "Car_salespersonId_idx" ON "Car"("salespersonId");

-- CreateIndex
CREATE INDEX "Car_coSalespersonId_idx" ON "Car"("coSalespersonId");

-- CreateIndex
CREATE INDEX "Car_managerId_idx" ON "Car"("managerId");

-- CreateIndex
CREATE INDEX "Car_overnightId_idx" ON "Car"("overnightId");

-- CreateIndex
CREATE INDEX "Car_soldAt_idx" ON "Car"("soldAt");

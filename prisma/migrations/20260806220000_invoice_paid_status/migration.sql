-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'paid';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "paidAt" TIMESTAMP(3);

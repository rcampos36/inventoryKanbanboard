-- CreateEnum
CREATE TYPE "PlanId" AS ENUM ('starter', 'professional', 'enterprise');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('trialing', 'active', 'past_due', 'canceled');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "plan" "PlanId" NOT NULL DEFAULT 'professional';
ALTER TABLE "Organization" ADD COLUMN "planStatus" "PlanStatus" NOT NULL DEFAULT 'trialing';

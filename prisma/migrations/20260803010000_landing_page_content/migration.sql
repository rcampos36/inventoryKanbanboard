-- CreateTable
CREATE TABLE "LandingPageContent" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "heroHeadline" TEXT NOT NULL,
    "heroSubcopy" TEXT NOT NULL,
    "aboutEyebrow" TEXT NOT NULL,
    "aboutTitle" TEXT NOT NULL,
    "aboutBody" TEXT NOT NULL,
    "featuresEyebrow" TEXT NOT NULL,
    "featuresTitle" TEXT NOT NULL,
    "featuresJson" JSONB NOT NULL,
    "bottomEyebrow" TEXT NOT NULL,
    "bottomTitle" TEXT NOT NULL,
    "bottomBody" TEXT NOT NULL,
    "pitchEyebrow" TEXT NOT NULL,
    "pitchParagraphsJson" JSONB NOT NULL,
    "footerTagline" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingPageContent_pkey" PRIMARY KEY ("id")
);

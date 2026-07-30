-- CreateTable
CREATE TABLE "Manager" (
    "organizationId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manager_pkey" PRIMARY KEY ("organizationId","id")
);

-- AddForeignKey
ALTER TABLE "Manager" ADD CONSTRAINT "Manager_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Manager_organizationId_idx" ON "Manager"("organizationId");

-- Preserve existing manager-demo car assignments for current dealerships.
INSERT INTO "Manager" ("organizationId", "id", "name", "position", "createdAt", "updatedAt")
SELECT o."id", v."id", v."name", v."position", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Organization" o
CROSS JOIN (
  VALUES
    ('elena', 'Elena Vargas', 0),
    ('chris', 'Chris Patel', 1),
    ('jordan', 'Jordan Blake', 2),
    ('mia', 'Mia Chen', 3),
    ('noah', 'Noah Brooks', 4)
) AS v("id", "name", "position");

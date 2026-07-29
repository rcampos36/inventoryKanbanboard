-- Prefer renaming chipColor -> exteriorColor when the old column exists.
-- Otherwise add exteriorColor for fresh DBs that somehow skipped the prior name.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Car'
      AND column_name = 'chipColor'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Car'
      AND column_name = 'exteriorColor'
  ) THEN
    ALTER TABLE "Car" RENAME COLUMN "chipColor" TO "exteriorColor";
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Car'
      AND column_name = 'exteriorColor'
  ) THEN
    ALTER TABLE "Car" ADD COLUMN "exteriorColor" TEXT;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Car'
      AND column_name = 'chipColor'
  ) THEN
    ALTER TABLE "Car" DROP COLUMN "chipColor";
  END IF;
END $$;

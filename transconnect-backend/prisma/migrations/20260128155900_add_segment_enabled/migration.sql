-- Add segmentEnabled and autoCalculated columns to routes table if they don't exist
ALTER TABLE "routes" ADD COLUMN IF NOT EXISTS "segmentEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "routes" ADD COLUMN IF NOT EXISTS "autoCalculated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "routes" ADD COLUMN IF NOT EXISTS "calculationData" JSONB;

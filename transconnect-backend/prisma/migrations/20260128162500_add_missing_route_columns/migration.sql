-- Add missing columns to routes table
ALTER TABLE "routes" ADD COLUMN IF NOT EXISTS "autoCalculated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "routes" ADD COLUMN IF NOT EXISTS "calculationData" JSONB;
ALTER TABLE "routes" ADD COLUMN IF NOT EXISTS "segmentEnabled" BOOLEAN NOT NULL DEFAULT true;

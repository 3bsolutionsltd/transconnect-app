-- Add segmentEnabled column to routes table if it doesn't exist
ALTER TABLE "routes" ADD COLUMN IF NOT EXISTS "segmentEnabled" BOOLEAN NOT NULL DEFAULT true;

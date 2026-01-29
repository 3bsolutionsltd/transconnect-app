/*
  Warnings:

  - You are about to drop the column `base_price` on the `route_segments` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `route_segments` table. All the data in the column will be lost.
  - You are about to drop the column `distance_km` on the `route_segments` table. All the data in the column will be lost.
  - You are about to drop the column `duration_minutes` on the `route_segments` table. All the data in the column will be lost.
  - You are about to drop the column `from_location` on the `route_segments` table. All the data in the column will be lost.
  - You are about to drop the column `route_id` on the `route_segments` table. All the data in the column will be lost.
  - You are about to drop the column `segment_order` on the `route_segments` table. All the data in the column will be lost.
  - You are about to drop the column `to_location` on the `route_segments` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `route_segments` table. All the data in the column will be lost.
  - You are about to drop the column `auto_calculated` on the `routes` table. All the data in the column will be lost.
  - You are about to drop the column `calculation_data` on the `routes` table. All the data in the column will be lost.
  - You are about to drop the column `segment_enabled` on the `routes` table. All the data in the column will be lost.
  - You are about to drop the column `adjustment_type` on the `segment_price_variations` table. All the data in the column will be lost.
  - You are about to drop the column `applies_to_dates` on the `segment_price_variations` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `segment_price_variations` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `segment_price_variations` table. All the data in the column will be lost.
  - You are about to drop the column `price_adjustment` on the `segment_price_variations` table. All the data in the column will be lost.
  - You are about to drop the column `segment_id` on the `segment_price_variations` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `segment_price_variations` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `segment_price_variations` table. All the data in the column will be lost.
  - You are about to drop the column `variation_type` on the `segment_price_variations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[routeId,segmentOrder]` on the table `route_segments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `basePrice` to the `route_segments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromLocation` to the `route_segments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `routeId` to the `route_segments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `segmentOrder` to the `route_segments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toLocation` to the `route_segments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `route_segments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceAdjustment` to the `segment_price_variations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `segmentId` to the `segment_price_variations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `segment_price_variations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variationType` to the `segment_price_variations` table without a default value. This is not possible if the table is not empty.
  - Made the column `active` on table `segment_price_variations` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "route_segments" DROP CONSTRAINT "fk_route_segments_route";

-- DropForeignKey
ALTER TABLE "segment_price_variations" DROP CONSTRAINT "fk_segment_variations_segment";

-- DropIndex
DROP INDEX "idx_route_segments_from";

-- DropIndex
DROP INDEX "idx_route_segments_locations";

-- DropIndex
DROP INDEX "idx_route_segments_route_id";

-- DropIndex
DROP INDEX "idx_route_segments_to";

-- DropIndex
DROP INDEX "unique_route_segment_order";

-- AlterTable
ALTER TABLE "route_segments" DROP COLUMN "base_price",
DROP COLUMN "created_at",
DROP COLUMN "distance_km",
DROP COLUMN "duration_minutes",
DROP COLUMN "from_location",
DROP COLUMN "route_id",
DROP COLUMN "segment_order",
DROP COLUMN "to_location",
DROP COLUMN "updated_at",
ADD COLUMN     "basePrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "distanceKm" DECIMAL(10,2),
ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "fromLocation" TEXT NOT NULL,
ADD COLUMN     "routeId" TEXT NOT NULL,
ADD COLUMN     "segmentOrder" INTEGER NOT NULL,
ADD COLUMN     "toLocation" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "routes" DROP COLUMN "auto_calculated",
DROP COLUMN "calculation_data",
DROP COLUMN "segment_enabled",
ADD COLUMN     "autoCalculated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "calculationData" JSONB,
ADD COLUMN     "segmentEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "segment_price_variations" DROP COLUMN "adjustment_type",
DROP COLUMN "applies_to_dates",
DROP COLUMN "created_at",
DROP COLUMN "end_date",
DROP COLUMN "price_adjustment",
DROP COLUMN "segment_id",
DROP COLUMN "start_date",
DROP COLUMN "updated_at",
DROP COLUMN "variation_type",
ADD COLUMN     "adjustmentType" TEXT NOT NULL DEFAULT 'percentage',
ADD COLUMN     "appliesToDates" JSONB,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "priceAdjustment" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "segmentId" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "variationType" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "active" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "route_segments_routeId_segmentOrder_key" ON "route_segments"("routeId", "segmentOrder");

-- AddForeignKey
ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_price_variations" ADD CONSTRAINT "segment_price_variations_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "route_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

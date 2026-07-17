/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `operators` will be added. If there are existing duplicate values, this will fail.
  - Made the column `segment_enabled` on table `routes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `auto_calculated` on table `routes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `adjustment_type` on table `segment_price_variations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `active` on table `segment_price_variations` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferReason" AS ENUM ('SCHEDULE_CONFLICT', 'EMERGENCY', 'MISSED_BUS', 'PERSONAL_REASONS', 'OTHER');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'MANAGER';

-- DropForeignKey
ALTER TABLE "route_segments" DROP CONSTRAINT "fk_route_segments_route";

-- DropForeignKey
ALTER TABLE "segment_price_variations" DROP CONSTRAINT "fk_segment_variations_segment";

-- DropIndex
DROP INDEX "idx_route_segments_route_id";

-- AlterTable
ALTER TABLE "operators" ADD COLUMN     "brandColor" TEXT,
ADD COLUMN     "brandLogoUrl" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "portalEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "tagline" TEXT;

-- AlterTable
ALTER TABLE "route_segments" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "from_location" SET DATA TYPE TEXT,
ALTER COLUMN "to_location" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "routes" ALTER COLUMN "segment_enabled" SET NOT NULL,
ALTER COLUMN "auto_calculated" SET NOT NULL;

-- AlterTable
ALTER TABLE "segment_price_variations" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "variation_type" SET DATA TYPE TEXT,
ALTER COLUMN "adjustment_type" SET NOT NULL,
ALTER COLUMN "adjustment_type" SET DATA TYPE TEXT,
ALTER COLUMN "start_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "end_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "booking_transfers" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromRouteId" TEXT NOT NULL,
    "toRouteId" TEXT NOT NULL,
    "fromTravelDate" TIMESTAMP(3) NOT NULL,
    "toTravelDate" TIMESTAMP(3) NOT NULL,
    "fromSeatNumber" TEXT NOT NULL,
    "toSeatNumber" TEXT,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "newAmount" DOUBLE PRECISION NOT NULL,
    "priceDifference" DOUBLE PRECISION NOT NULL,
    "reason" "TransferReason" NOT NULL DEFAULT 'OTHER',
    "reasonText" TEXT,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewerNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_seat_history" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "transferId" TEXT,
    "oldSeatNumber" TEXT NOT NULL,
    "newSeatNumber" TEXT NOT NULL,
    "oldRouteId" TEXT NOT NULL,
    "newRouteId" TEXT NOT NULL,
    "oldTravelDate" TIMESTAMP(3) NOT NULL,
    "newTravelDate" TIMESTAMP(3) NOT NULL,
    "changeReason" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_seat_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_transfers_bookingId_idx" ON "booking_transfers"("bookingId");

-- CreateIndex
CREATE INDEX "booking_transfers_userId_idx" ON "booking_transfers"("userId");

-- CreateIndex
CREATE INDEX "booking_transfers_status_idx" ON "booking_transfers"("status");

-- CreateIndex
CREATE INDEX "booking_transfers_toTravelDate_idx" ON "booking_transfers"("toTravelDate");

-- CreateIndex
CREATE INDEX "booking_seat_history_bookingId_idx" ON "booking_seat_history"("bookingId");

-- CreateIndex
CREATE INDEX "booking_seat_history_transferId_idx" ON "booking_seat_history"("transferId");

-- CreateIndex
CREATE UNIQUE INDEX "operators_slug_key" ON "operators"("slug");

-- CreateIndex
CREATE INDEX "segment_price_variations_segment_id_start_date_end_date_idx" ON "segment_price_variations"("segment_id", "start_date", "end_date");

-- AddForeignKey
ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_price_variations" ADD CONSTRAINT "segment_price_variations_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "route_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_transfers" ADD CONSTRAINT "booking_transfers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_transfers" ADD CONSTRAINT "booking_transfers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_transfers" ADD CONSTRAINT "booking_transfers_fromRouteId_fkey" FOREIGN KEY ("fromRouteId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_transfers" ADD CONSTRAINT "booking_transfers_toRouteId_fkey" FOREIGN KEY ("toRouteId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_transfers" ADD CONSTRAINT "booking_transfers_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_seat_history" ADD CONSTRAINT "booking_seat_history_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_seat_history" ADD CONSTRAINT "booking_seat_history_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "booking_transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_seat_history" ADD CONSTRAINT "booking_seat_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_seat_history" ADD CONSTRAINT "booking_seat_history_oldRouteId_fkey" FOREIGN KEY ("oldRouteId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_seat_history" ADD CONSTRAINT "booking_seat_history_newRouteId_fkey" FOREIGN KEY ("newRouteId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_route_segments_from" RENAME TO "route_segments_from_location_idx";

-- RenameIndex
ALTER INDEX "idx_route_segments_locations" RENAME TO "route_segments_from_location_to_location_idx";

-- RenameIndex
ALTER INDEX "idx_route_segments_to" RENAME TO "route_segments_to_location_idx";

-- RenameIndex
ALTER INDEX "unique_route_segment_order" RENAME TO "route_segments_route_id_segment_order_key";

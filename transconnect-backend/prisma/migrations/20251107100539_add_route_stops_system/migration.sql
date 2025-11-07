-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "actualPrice" DOUBLE PRECISION,
ADD COLUMN     "alightingStop" TEXT,
ADD COLUMN     "boardingStop" TEXT;

-- CreateTable
CREATE TABLE "route_stops" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopName" TEXT NOT NULL,
    "distanceFromOrigin" DOUBLE PRECISION NOT NULL,
    "priceFromOrigin" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,
    "estimatedTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "route_stops_routeId_order_key" ON "route_stops"("routeId", "order");

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

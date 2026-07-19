-- Extend user roles for TransConnect field operations
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MASTER_FIELD_OPERATOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'OPERATOR_FIELD_OPERATOR';

-- Create booking assignment status enum
CREATE TYPE "BookingAssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Create field operator scopes
CREATE TABLE "field_operator_scopes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_operator_scopes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "field_operator_scopes_userId_operatorId_key" ON "field_operator_scopes"("userId", "operatorId");
CREATE INDEX "field_operator_scopes_operatorId_active_idx" ON "field_operator_scopes"("operatorId", "active");

ALTER TABLE "field_operator_scopes"
    ADD CONSTRAINT "field_operator_scopes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "field_operator_scopes"
    ADD CONSTRAINT "field_operator_scopes_operatorId_fkey"
    FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create booking assignments
CREATE TABLE "booking_assignments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "assignedByUserId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "status" "BookingAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "booking_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "booking_assignments_bookingId_createdAt_idx" ON "booking_assignments"("bookingId", "createdAt");
CREATE INDEX "booking_assignments_agentId_status_idx" ON "booking_assignments"("agentId", "status");
CREATE INDEX "booking_assignments_operatorId_status_idx" ON "booking_assignments"("operatorId", "status");

ALTER TABLE "booking_assignments"
    ADD CONSTRAINT "booking_assignments_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_assignments"
    ADD CONSTRAINT "booking_assignments_agentId_fkey"
    FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_assignments"
    ADD CONSTRAINT "booking_assignments_assignedByUserId_fkey"
    FOREIGN KEY ("assignedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_assignments"
    ADD CONSTRAINT "booking_assignments_operatorId_fkey"
    FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create booking ledger entries
CREATE TABLE "booking_ledger_entries" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "operatorId" TEXT,
    "action" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "booking_ledger_entries_bookingId_createdAt_idx" ON "booking_ledger_entries"("bookingId", "createdAt");
CREATE INDEX "booking_ledger_entries_operatorId_createdAt_idx" ON "booking_ledger_entries"("operatorId", "createdAt");

ALTER TABLE "booking_ledger_entries"
    ADD CONSTRAINT "booking_ledger_entries_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "booking_ledger_entries"
    ADD CONSTRAINT "booking_ledger_entries_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "booking_ledger_entries"
    ADD CONSTRAINT "booking_ledger_entries_operatorId_fkey"
    FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

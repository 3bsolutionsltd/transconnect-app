-- CreateEnum
CREATE TYPE "OperatorUserRole" AS ENUM ('MANAGER', 'DRIVER', 'CONDUCTOR', 'TICKETER', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "operator_users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "role" "OperatorUserRole" NOT NULL,
    "permissions" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operator_users_userId_key" ON "operator_users"("userId");

-- AddForeignKey
ALTER TABLE "operator_users" ADD CONSTRAINT "operator_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operator_users" ADD CONSTRAINT "operator_users_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

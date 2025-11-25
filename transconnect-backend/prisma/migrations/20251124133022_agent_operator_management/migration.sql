-- AlterTable
ALTER TABLE "operators" ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "managedByAgent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "agent_operators" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MANAGER',
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_operators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_operators_agentId_operatorId_key" ON "agent_operators"("agentId", "operatorId");

-- AddForeignKey
ALTER TABLE "operators" ADD CONSTRAINT "operators_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_operators" ADD CONSTRAINT "agent_operators_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_operators" ADD CONSTRAINT "agent_operators_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "templateId" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_templateId_fkey";

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "ownerUserId" INTEGER;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

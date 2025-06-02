-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_photoSetId_fkey";

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "filename" TEXT,
ADD COLUMN     "size" INTEGER;

-- CreateIndex
CREATE INDEX "Photo_photoSetId_idx" ON "Photo"("photoSetId");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_photoSetId_fkey" FOREIGN KEY ("photoSetId") REFERENCES "PhotoSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_senderId_fkey";

-- DropIndex
DROP INDEX "ChatMessage_senderId_idx";

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "attachmentFilename" TEXT,
ADD COLUMN     "attachmentSize" INTEGER,
ADD COLUMN     "attachmentType" TEXT,
ADD COLUMN     "attachmentUrl" TEXT,
ALTER COLUMN "content" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

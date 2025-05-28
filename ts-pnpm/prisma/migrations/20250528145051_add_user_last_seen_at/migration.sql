-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hashedPassword" TEXT,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3);

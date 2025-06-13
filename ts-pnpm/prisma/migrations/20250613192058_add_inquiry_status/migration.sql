/*
  Warnings:

  - You are about to drop the column `isArchived` on the `Inquiry` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Inquiry" DROP COLUMN "isArchived",
ADD COLUMN     "status" "InquiryStatus" NOT NULL DEFAULT 'NEW';

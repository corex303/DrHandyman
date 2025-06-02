/*
  Warnings:

  - You are about to drop the column `inquiryId` on the `PhotoSet` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PhotoSet" DROP CONSTRAINT "PhotoSet_inquiryId_fkey";

-- AlterTable
ALTER TABLE "PhotoSet" DROP COLUMN "inquiryId";

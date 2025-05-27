/*
  Warnings:

  - You are about to drop the column `afterImageUrl` on the `PhotoSet` table. All the data in the column will be lost.
  - You are about to drop the column `approvalStatus` on the `PhotoSet` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `PhotoSet` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `PhotoSet` table. All the data in the column will be lost.
  - You are about to drop the column `beforeImageUrl` on the `PhotoSet` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `PhotoSet` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedAt` on the `PhotoSet` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `PhotoSet` table without a default value. This is not possible if the table is not empty.
  - Made the column `maintenanceWorkerId` on table `PhotoSet` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('BEFORE', 'AFTER');

-- DropForeignKey
ALTER TABLE "PhotoSet" DROP CONSTRAINT "PhotoSet_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "PhotoSet" DROP CONSTRAINT "PhotoSet_maintenanceWorkerId_fkey";

-- DropIndex
DROP INDEX "PhotoSet_maintenanceWorkerId_idx";

-- AlterTable
ALTER TABLE "PhotoSet" DROP COLUMN "afterImageUrl",
DROP COLUMN "approvalStatus",
DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "beforeImageUrl",
DROP COLUMN "rejectedAt",
DROP COLUMN "uploadedAt",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "maintenanceWorkerId" SET NOT NULL;

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "PhotoType" NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photoSetId" TEXT NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PhotoSet" ADD CONSTRAINT "PhotoSet_maintenanceWorkerId_fkey" FOREIGN KEY ("maintenanceWorkerId") REFERENCES "MaintenanceWorker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_photoSetId_fkey" FOREIGN KEY ("photoSetId") REFERENCES "PhotoSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
